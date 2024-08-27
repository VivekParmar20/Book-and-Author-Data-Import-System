// Load environment variables from .env file
require('dotenv').config();
const mongoose = require('mongoose');

// Destructure MONGO_URI from process.env
const { MONGO_URI } = process.env;

// Connect to MongoDB using MONGO_URI
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});

// Import models
const Book = require('./models/Books');  // Ensure correct path
const Author = require('./models/Author'); // Ensure correct path

// Export models
module.exports = {
    Author,
    Book
};
