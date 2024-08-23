// routes/upload.js
const express = require('express');
const router = express.Router();
const upload = require('../multerConfig'); // Import the upload middleware

// Import validation functions and models
const { isValidEmail, isValidDate } = require('../utils/validation');
const Author = require('../models/Author');
const Book = require('../models/Books');

// Confirm and process the uploaded data
router.post('/confirm', async (req, res) => {
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

module.exports = router;
