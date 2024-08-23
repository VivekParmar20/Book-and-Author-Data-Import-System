const express = require('express');
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

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

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bookAuthorDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Home - Book and Author Data Import', error: null });
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (req.fileValidationError) {
        return res.render('index', { title: 'Home - Book and Author Data Import', error: req.fileValidationError });
    }

    const filePath = req.file.path;
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);

        // Data validation
        const validData = data.filter(row => row.Name && row.ISBN_Code && row.Author_Name);
        const invalidData = data.filter(row => !row.Name || !row.ISBN_Code || !row.Author_Name);

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

            if (!isValidDate(Date_of_Birth)) {
                return res.send('Invalid date format.');
            }

            let author = await Author.findOne({ name: Author_Name });
            if (!author) {
                author = new Author({
                    name: Author_Name,
                    email: Email,
                    dateOfBirth: new Date(Date_of_Birth)
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

        res.send('Data successfully uploaded!');
    } catch (error) {
        console.error(error);
        res.send('An error occurred while uploading data.');
    }
});

app.get("*",(req,res)=>{
    res.send("Path not Found!");
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
