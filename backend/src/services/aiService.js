const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initializeAI();
  }

  initializeAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-002"
      });
      console.log('Gemini AI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  async generateSummary(transcript) {
    if (!this.model) {
      throw new Error('AI model not initialized');
    }

    try {
      const prompt = `
Please analyze this meeting transcript and provide a structured summary:

${transcript}

Format your response as follows:
- Start with an overview paragraph (2-3 sentences)
- List key decisions made (start each with "• Decision:")
- List action items (start each with "• Action:")
- Include any important next steps

Keep it concise and professional.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();
      
      console.log('AI summary generated:', summary.substring(0, 200) + '...');
      return summary;
      
    } catch (error) {
      console.error('AI generation failed, using fallback:', error);
      return this.getFallbackSummary(transcript);
    }
  }

  getFallbackSummary(transcript) {
    const wordCount = transcript.split(' ').length;
    const overview = `Meeting discussion covered ${wordCount} words of transcript content. Key topics and decisions were discussed among participants.`;
    
    return `Overview: ${overview}

• Decision: Meeting summary generated from transcript
• Action: Review and follow up on discussed items
• Action: Schedule next meeting if needed

Next Steps:
- Distribute meeting summary to all participants
- Track progress on action items`;
  }
}

module.exports = AIService;