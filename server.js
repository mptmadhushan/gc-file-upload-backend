const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require("fs");
const syncRequest = require("sync-request");
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


// Set default save directory and port from environment variables or use default values
const saveDirectory = process.env.SAVE_DIRECTORY || "./savedDocuments";
const port = process.env.PORT || 3000;

// Ensure save directory exists
if (!fs.existsSync(saveDirectory)) {
    fs.mkdirSync(saveDirectory, { recursive: true });
}

app.post("/track", (req, res) => {
    const updateFile = (response, body, savePath) => {
        if (body.status === 2 && body.url) { // Ensure a document URL is provided
            try {
                const file = syncRequest("GET", body.url); // Fetch the document
                fs.writeFileSync(savePath, file.getBody()); // Save the file
                console.log(`Document saved successfully at ${savePath}`);
            } catch (error) {
                console.error("Error saving document:", error);
                return response.status(500).json({ error: "Document save failed" });
            }
        }

        // Respond with no errors if document is saved
        response.json({ error: 0 });
    };

    // Check if document name is provided for dynamic save paths
    const documentName = req.body.documentName || "updatedDocument.docx";
    const savePath = `${saveDirectory}/${documentName}`;

    if (req.body.hasOwnProperty("status")) {
        updateFile(res, req.body, savePath); // Process request directly
    } else {
        // Handle the case where the body needs to be read manually
        let content = "";
        req.on("data", (data) => {
            content += data;
        });
        req.on("end", () => {
            const body = JSON.parse(content);
            updateFile(res, body, savePath);
        });
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
