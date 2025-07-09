
// Import required packages
const express = require('express'); // Web framework
const multer = require('multer'); // File upload handler
const fs = require('fs'); // File system module for reading/writing files
const path = require('path'); // Utility for handling file paths
const cors = require('cors'); // Enable Cross-Origin Resource Sharing
const mysql = require('mysql2'); // MySQL driver
const bcrypt = require('bcrypt'); // Password hashing
const jwt = require('jsonwebtoken'); // JSON Web Token for authentication
const dotenv = require('dotenv'); // Load .env file for environment variables

dotenv.config(); // Load environment variables from .env file

// Google Gemini AI SDK import
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express(); // Initialize Express app
const PORT = process.env.PORT || 3000; // Server port

// Secret key used for signing JWT tokens — store securely in production
const JWT_SECRET = process.env.JWT_SECRET;

// Initialize Gemini AI using API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware setup
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' })); // Allow frontend access from Vite dev server
app.use(express.json()); // Parse incoming JSON request bodies

// Setup MySQL database connection with local credentials
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Connect to MySQL and log result
db.connect(err => {
  if (err) console.error('MySQL connection error:', err);
  else console.log('Connected to MySQL database');
});

// Middleware to authenticate JWT and attach user info to request
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']; // Get "Authorization" header
  const token = authHeader?.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) return res.sendStatus(401); // No token provided

  // Verify token using secret
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Token invalid or expired
    req.user = user; // Attach decoded user data to request
    next(); // Proceed to next middleware or route handler
  });
}

// Configure multer storage for uploaded car images
const storage = multer.diskStorage({
  // Determine destination path dynamically using user ID
  destination: (req, file, cb) => {
    const userFolder = path.join(__dirname, 'cars', String(req.user.id)); // e.g., /cars/2/
    if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true }); // Create folder if missing
    cb(null, userFolder); // Set destination path
  },
  // Rename uploaded file to avoid conflicts (timestamp-based)
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // e.g., 172345323-car.jpg
  }
});
const upload = multer({ storage }); // Initialize multer with custom storage engine

// Route: User signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const hashedPassword = await bcrypt.hash(password, 10); // Secure password hashing

  // Insert new user into DB
  const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
  db.query(sql, [email, hashedPassword], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: "Email already exists" });
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ message: "User created" }); // Success
  });
});

// Route: Get a random featured car from any user
app.get('/featured-car', async (req, res) => {
  try {
    // Select one random car row from the cars table
    const [rows] = await db.promise().query(
      'SELECT * FROM cars ORDER BY RAND() LIMIT 1'
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No cars found' });
    }
    res.json(rows[0]); // Send featured car to frontend
  } catch (err) {
    console.error('Error fetching featured car:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route: User login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).send("Email and password required");

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).send("Database error");

    if (results.length === 0) return res.status(400).send("Invalid credentials");

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).send("Invalid credentials");

    // Create JWT token with 1 hour expiration
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token }); // Send token to client
  });
});

// Route: Upload car image and analyze using Gemini AI
app.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  const filepath = req.file?.path; // Get file path from multer

  if (!filepath) return res.status(400).send('No file uploaded');

  const imageData = fs.readFileSync(filepath, { encoding: 'base64' }); // Convert image to base64 string

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Send prompt and image to Gemini
    const result = await model.generateContent({
      contents: [
        {
          parts: [
            {
              text: `You will be given an image of a car...Respond ONLY with the JSON object...Here is the image to analyze:`
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageData
              }
            }
          ]
        }
      ]
    });

    const response = await result.response;
    const carInfoTextRaw = await response.text();

    // Clean up markdown formatting (if any)
    const carInfoText = carInfoTextRaw.replace(/```json\s*([\s\S]*?)\s*```/, '$1').trim();

    let carInfoJson;
    try {
      carInfoJson = JSON.stringify(JSON.parse(carInfoText)); // Try to parse valid JSON
    } catch (e) {
      console.error('Failed to parse Gemini JSON response:', e, carInfoText);
      carInfoJson = JSON.stringify({ description: carInfoTextRaw }); // Fallback to raw string
    }

    const filename = path.basename(filepath);
    const url = `/cars/${req.user.id}/${filename}`; // Construct public URL for image

    // Store image and AI response in database
    await db.promise().query(
      'INSERT INTO cars (filename, url, user_id, car_info) VALUES (?, ?, ?, ?)',
      [filename, url, req.user.id, carInfoJson]
    );

    res.json({ message: 'Uploaded & analyzed', url, carInfo: carInfoJson });
  } catch (err) {
    console.error('Gemini error:', err?.message || err);
    res.status(500).send('Gemini image analysis failed');
  }
});

// Route: Delete car image by ID
app.delete('/images/:id', authenticateToken, async (req, res) => {
  const imageId = req.params.id;
  const userId = req.user.id;

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM cars WHERE id = ? AND user_id = ?',
      [imageId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).send('Image not found or not owned by user');
    }

    const filePath = path.join(__dirname, 'cars', String(userId), rows[0].filename);

    fs.unlink(filePath, err => {
      if (err) console.warn('Failed to delete image file:', err);
    });

    await db.promise().query(
      'DELETE FROM cars WHERE id = ? AND user_id = ?',
      [imageId, userId]
    );

    res.send('Image deleted successfully');
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).send('Server error while deleting image');
  }
});

// Serve static image files under /cars route
app.use('/cars', express.static(path.join(__dirname, 'cars')));

// Route: Fetch all images uploaded by authenticated user
app.get('/images', authenticateToken, (req, res) => {
  db.query(
    'SELECT * FROM cars WHERE user_id = ? ORDER BY uploaded_at DESC',
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error('Fetch error:', err);
        return res.status(500).send('DB error');
      }
      res.json(results); // Send array of image metadata
    }
  );
});

// Start Express server on port 3000
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
