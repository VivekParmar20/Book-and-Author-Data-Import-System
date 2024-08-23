const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    name: String,
    isbnCode: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' }
});

module.exports = mongoose.model('Books', bookSchema);
