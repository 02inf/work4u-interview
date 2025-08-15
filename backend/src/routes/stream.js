const express = require('express');
const router = express.Router();
const AIService = require('../services/aiService');

const aiService = new AIService();

// POST /api/stream/digest - Create digest with streaming response
router.post('/digest', async (req, res) => {
  console.log('Received streaming digest creation request');
  
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

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:5173',
      'Access-Control-Allow-Credentials': 'true'
    });

    console.log('Starting streaming summary generation...');
    
    // Send initial status
    res.write(`data: ${JSON.stringify({ 
      type: 'status', 
      message: 'Starting AI analysis...',
      progress: 10
    })}\n\n`);

    // Simulate streaming process
    const streamSteps = [
      { message: 'Analyzing transcript structure...', progress: 25 },
      { message: 'Identifying key topics...', progress: 40 },
      { message: 'Extracting decisions...', progress: 60 },
      { message: 'Finding action items...', progress: 80 },
      { message: 'Finalizing summary...', progress: 95 }
    ];

    // Send progress updates
    for (const step of streamSteps) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing time
      res.write(`data: ${JSON.stringify({ 
        type: 'progress', 
        ...step 
      })}\n\n`);
    }

    // Generate the actual summary
    const summary = await aiService.generateSummary(transcript);
    
    // Save to database
    const digest = {
      transcript,
      summary: typeof summary === 'string' ? summary : JSON.stringify(summary),
      created_at: new Date().toISOString()
    };

    const id = await req.db.createDigest(digest);
    
    // Send the complete digest
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      data: { id, ...digest },
      message: 'Summary generated successfully!',
      progress: 100
    })}\n\n`);

    console.log('Streaming digest creation completed');
    res.end();

  } catch (error) {
    console.error('Error in streaming digest creation:', error);
    
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message || 'Failed to create digest',
      progress: 0
    })}\n\n`);
    
    res.end();
  }
});

module.exports = router;