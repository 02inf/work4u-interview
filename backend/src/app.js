const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import and initialize database
const Database = require('./models/database');
const database = new Database();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Database middleware
app.use((req, res, next) => {
  req.db = database;
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Meeting Digest API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
const digestsRouter = require('./routes/digests');
const streamRouter = require('./routes/stream');
app.use('/api/digests', digestsRouter);
app.use('/api/stream', streamRouter);

// Start server
const startServer = async () => {
  try {
    console.log('Starting server...');
    
    // Initialize database first
    await database.init();
    console.log('Database initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Meeting Digest API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();