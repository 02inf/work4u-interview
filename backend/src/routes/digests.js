const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');

const aiService = new AIService();

// POST /api/digests - Create new digest
router.post('/', async (req, res) => {
  console.log('Received digest creation request');
  
  try {
    const { transcript } = req.body;
    
    // Validate input
    if (!transcript || transcript.trim().length === 0) {
      console.log('Empty transcript received');
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    console.log('Transcript length:', transcript.length);
    console.log('Generating summary with AI...');
    
    // Generate summary using AI
    const summary = await aiService.generateSummary(transcript);
    console.log('AI summary generated successfully');
    console.log('Summary type:', typeof summary);
    console.log('Summary preview:', JSON.stringify(summary).substring(0, 200) + '...');
    
    // Ensure summary is a string for database storage
    const summaryString = typeof summary === 'string' 
      ? summary 
      : JSON.stringify(summary);
    
    // Save to database
    const digest = {
      transcript,
      summary: summaryString,
      created_at: new Date().toISOString()
    };

    console.log('Saving to database...');
    
    // Check if req.db exists
    if (!req.db) {
      console.error('Database not attached to request!');
      throw new Error('Database connection error');
    }
    
    const id = await req.db.createDigest(digest);
    console.log('Saved with ID:', id);

    res.status(201).json({
      success: true,
      data: { id, ...digest }
    });
  } catch (error) {
    console.error('Error creating digest:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create digest'
    });
  }
});

// GET /api/digests - Get all digests
router.get('/', async (req, res) => {
  console.log('Fetching all digests...');
  
  try {
    // Check if req.db exists
    if (!req.db) {
      console.error('Database not attached to request!');
      throw new Error('Database connection error');
    }
    
    const digests = await req.db.getAllDigests();
    console.log(`Found ${digests.length} digests`);
    
    res.json({
      success: true,
      data: digests
    });
  } catch (error) {
    console.error('Error fetching digests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch digests'
    });
  }
});

// GET /api/digests/shared/:publicId - Get shared digest
router.get('/shared/:publicId', async (req, res) => {
  console.log('Fetching shared digest:', req.params.publicId);
  
  try {
    const { publicId } = req.params;
    
    if (!req.db) {
      console.error('Database not attached to request!');
      throw new Error('Database connection error');
    }
    
    const digest = await req.db.getDigestByPublicId(publicId);
    
    if (!digest) {
      console.log('Shared digest not found');
      return res.status(404).json({
        success: false,
        error: 'Shared digest not found'
      });
    }

    console.log('Found shared digest');
    res.json({
      success: true,
      data: digest
    });
  } catch (error) {
    console.error('Error fetching shared digest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared digest'
    });
  }
});

// PUT /api/digests/:id/share - Create shareable link
router.put('/:id/share', async (req, res) => {
  console.log('Creating share link for digest:', req.params.id);
  
  try {
    const { id } = req.params;
    
    if (!req.db) {
      console.error('Database not attached to request!');
      throw new Error('Database connection error');
    }
    
    // Generate unique public ID
    const publicId = uuidv4();
    console.log('Generated public ID:', publicId);
    
    // Update digest with public ID
    const success = await req.db.makeDigestPublic(id, publicId);
    
    if (!success) {
      console.log('Digest not found');
      return res.status(404).json({
        success: false,
        error: 'Digest not found'
      });
    }

    console.log('Share link created successfully');
    res.json({
      success: true,
      data: {
        publicId,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared/${publicId}`
      }
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create share link'
    });
  }
});

// POST /api/digests/process-transcript - Process transcript and generate summary
router.post('/process-transcript', async (req, res) => {
  console.log('Received transcript processing request');
  
  try {
    const { transcript } = req.body;
    
    // Validate input
    if (!transcript || transcript.trim().length === 0) {
      console.log('Empty transcript received');
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    console.log('Transcript length:', transcript.length);
    console.log('Generating summary with AI...');
    
    // Generate summary using AI
    const summary = await aiService.generateSummary(transcript);
    console.log('AI summary generated successfully');
    console.log('Summary type:', typeof summary);
    console.log('Summary preview:', JSON.stringify(summary).substring(0, 200) + '...');
    
    // Ensure summary is a string for response
    const summaryString = typeof summary === 'string' 
      ? summary 
      : JSON.stringify(summary);
    
    res.json({
      success: true,
      summary: summaryString
    });
  } catch (error) {
    console.error('Error processing transcript:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process transcript'
    });
  }
});

module.exports = router;