const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Author = require('./models/Author');
const Book = require('./models/Books');

async function clearCollections() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Clear collections
        await Author.deleteMany({});
        await Book.deleteMany({});

        console.log('All data cleared from Authors and Books collections');

        // Close the connection
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error clearing collections:', error);
    }
}

clearCollections();
