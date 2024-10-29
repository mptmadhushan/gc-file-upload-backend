const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors'); // Import cors

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to enable CORS
app.use(cors()); // Use CORS middleware

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this folder exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Create a unique filename
    },
});

const upload = multer({ storage });

// Endpoint to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        // Send back the file URL
        const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
    } else {
        res.status(400).send('No file uploaded');
    }
});

// Handle the callback from OnlyOffice
app.post('/url-to-callback', (req, res) => {
    const { type, data } = req.body;

    // Log the received data (you can also handle it according to your needs)
    console.log('Received callback:', type, data);

    // Send a response back to OnlyOffice
    res.status(200).send('OK');
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
