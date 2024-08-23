const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
    name: String,
    email: String,
    dateOfBirth: Date
});

module.exports = mongoose.model('Author', authorSchema);
