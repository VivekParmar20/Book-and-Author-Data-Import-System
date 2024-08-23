const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Import routes
const indexRoutes = require('./routes/index');
const uploadRoutes = require('./routes/upload');

const app = express();
const port = 3000;

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup static files
app.use(express.static(path.join(__dirname, 'public')));

// Setup body parser
app.use(bodyParser.urlencoded({ extended: true }));

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

// Use routes
app.use('/', indexRoutes);
app.use('/', uploadRoutes);

// Handle 404 errors
app.get("*", (req, res) => {
    res.send("Path not Found!");
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
