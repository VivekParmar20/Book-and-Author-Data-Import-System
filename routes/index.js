// routes/index.js
const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const upload = require('../multerConfig'); // Import the upload middleware

// Import validation functions and models
const { isValidEmail, isValidDate } = require('../utils/validation');
const Author = require('../models/Author');
const Book = require('../models/Books');

// Render the home page
router.get('/', (req, res) => {
    res.render('index', { title: 'Home - Book and Author Data Import', error: null });
});

// Handle the data upload
router.post('/upload', upload.single('file'), async (req, res) => {
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

module.exports = router;
