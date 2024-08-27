const express = require('express');
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import validation functions
const { isValidEmail, isValidDate } = require('./utils/validation');

// Import models
const Author = require('./models/Author');
const Book = require('./models/Books');

const app = express();
const port = 3000;

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup static files
app.use(express.static(path.join(__dirname, 'public')));

// Setup body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Update multer configuration to check file type
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB', err);
    });

// Function to parse dates from raw Excel values
function parseDate(date) {
    // Check if the date is a number (Excel serial date)
    if (typeof date === 'number') {
        const dateObj = xlsx.SSF.parse_date_code(date);
        return `${dateObj.y}-${dateObj.m}-${dateObj.d}`;
    }

    // Check if the date is a string
    if (typeof date === 'string') {
        // Log raw date for debugging
        console.log('Raw Date String:', date);

        // Try parsing different formats
        const formats = [
            /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
            /^\d{2}\/\d{2}\/\d{2}$/, // MM/DD/YY
            /^\d{4}-\d{2}-\d{2}$/ // YYYY-MM-DD
        ];

        if (formats[0].test(date)) { // DD-MM-YYYY
            const [day, month, year] = date.split('-');
            return `${year}-${month}-${day}`;
        } else if (formats[1].test(date)) { // MM/DD/YY
            const [month, day, year] = date.split('/');
            return `20${year}-${month}-${day}`;
        } else if (formats[2].test(date)) { // YYYY-MM-DD
            return date;
        }
    }

    // Return 'NA' if date format is unrecognized
    return 'NA';
}

// Routes
app.get('/', (req, res) => {
    // Check for success query parameter
    const successMessage = req.query.success || null;

    res.render('index', { 
        title: 'Home - Book and Author Data Import', 
        error: null,
        success: successMessage // Pass success message to EJS
    });
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (req.fileValidationError) {
        return res.render('index', { title: 'Home - Book and Author Data Import', error: req.fileValidationError });
    }

    const filePath = req.file.path;
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]], { raw: true }); // raw: true to get raw values

        // Process and validate data
        const processedData = data.map(row => {
            // Format date to match input if present
            row.Date_of_Birth = row.Date_of_Birth ? parseDate(row.Date_of_Birth) : 'NA';

            return row;
        });

        // Data validation
        const validData = processedData.filter(row => row.Name && row.ISBN_Code && row.Author_Name);
        const invalidData = processedData.filter(row => !row.Name || !row.ISBN_Code || !row.Author_Name);

        if (invalidData.length > 0) {
            return res.render('index', { title: 'Home - Book and Author Data Import', error: 'Some rows are invalid. Please check the format and try again.' });
        }

        res.render('review', { title: 'Review Data - Book and Author Data Import', data: validData });
    } catch (error) {
        console.error(error);
        res.render('index', { title: 'Home - Book and Author Data Import', error: 'Error reading the Excel file. Please try again.' });
    }
});

app.post('/confirm', async (req, res) => {
    try {
        const data = JSON.parse(req.body.data);

        for (const row of data) {
            const { Name, ISBN_Code, Author_Name, Email, Date_of_Birth } = row;

            if (!isValidEmail(Email)) {
                return res.send('Invalid email format.');
            }

            // Store raw date format from file
            const dateOfBirth = Date_of_Birth === 'NA' ? null : new Date(Date_of_Birth).toISOString();

            let author = await Author.findOne({ name: Author_Name });
            if (!author) {
                author = new Author({
                    name: Author_Name,
                    email: Email,
                    dateOfBirth: dateOfBirth
                });
                await author.save();
            }

            const book = new Book({
                name: Name,
                isbnCode: ISBN_Code,
                author: author._id
            });
            await book.save();
        }

        // Redirect with success message
        
        res.redirect('/?success=Data%20successfully%20uploaded!');
    } catch (error) {
        console.error(error);
        res.send('An error occurred while uploading data.');
    }
});

// Add this route to fetch and display data
app.get('/show-data', async (req, res) => {
    try {
        // Fetch data from the database
        const authors = await Author.find({});
        const books = await Book.find({}).populate('author'); // Populate to get author details

        res.render('showData', { title: 'Submitted Data - Book and Author Data Import', authors, books });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.send('An error occurred while fetching data.');
    }
});


app.get("*", (req, res) => {
    res.send("Path not Found!");
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
