require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Import routes
const indexRoutes = require('./routes/index');
const uploadRoutes = require('./routes/upload');

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup static files
app.use(express.static(path.join(__dirname, 'public')));

// Setup body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    // Removed deprecated options
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Use routes
app.use('/', indexRoutes); // Default route
app.use('/upload', uploadRoutes); // Specific route for upload

// Handle 404 errors
app.use((req, res) => {
    res.status(404).send("Path not Found!");
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
