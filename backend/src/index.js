const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Database setup
const db = new sqlite3.Database('./digests.db');

// Create table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS digests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL,
    transcript TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// AI prompt for generating digest
const generateDigestPrompt = (transcript) => `
Please analyze the following meeting transcript and provide a structured summary in the following JSON format:

{
  "overview": "A brief, one-paragraph overview of the meeting",
  "keyDecisions": ["Decision 1", "Decision 2", "Decision 3"],
  "actionItems": [
    {
      "task": "Action item description",
      "assignee": "Person responsible"
    }
  ]
}

Meeting Transcript:
${transcript}

Please ensure the response is valid JSON and includes all three sections: overview, keyDecisions (as an array), and actionItems (as an array of objects with task and assignee properties).
`;

// Routes
app.post('/api/digests', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    if (transcript.length > 50000) {
      return res.status(400).json({ error: 'Transcript too long (max 50,000 characters)' });
    }

    // Generate AI summary
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(generateDigestPrompt(transcript));
    const response = await result.response;
    const summaryText = response.text();
    
    // Parse JSON response
    let summary;
    try {
      summary = JSON.parse(summaryText);
    } catch (error) {
      // Fallback if AI doesn't return valid JSON
      summary = {
        overview: summaryText,
        keyDecisions: [],
        actionItems: []
      };
    }

    // Generate public ID
    const publicId = uuidv4();

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO digests (public_id, transcript, summary) 
      VALUES (?, ?, ?)
    `);
    
    stmt.run(publicId, transcript, JSON.stringify(summary), function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to save digest' });
      }
      
      res.json({
        id: this.lastID,
        publicId,
        summary,
        createdAt: new Date().toISOString()
      });
    });
    
    stmt.finalize();
  } catch (error) {
    console.error('Error generating digest:', error);
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

// Get all digests
app.get('/api/digests', (req, res) => {
  db.all(`
    SELECT id, public_id as publicId, summary, created_at as createdAt 
    FROM digests 
    ORDER BY created_at DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch digests' });
    }
    
    const digests = rows.map(row => ({
      ...row,
      summary: JSON.parse(row.summary)
    }));
    
    res.json(digests);
  });
});

// Get single digest by public ID
app.get('/api/digests/:publicId', (req, res) => {
  const { publicId } = req.params;
  
  db.get(`
    SELECT id, public_id as publicId, transcript, summary, created_at as createdAt 
    FROM digests 
    WHERE public_id = ?
  `, [publicId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch digest' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Digest not found' });
    }
    
    res.json({
      ...row,
      summary: JSON.parse(row.summary)
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
}); 