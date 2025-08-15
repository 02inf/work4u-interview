const AIService = require('../services/aiService');

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Mock AI summary with decisions and action items')
        }
      })
    })
  }))
}));

describe('AIService', () => {
  let aiService;

  beforeEach(() => {
    // Set mock environment variable
    process.env.GEMINI_API_KEY = 'mock-api-key';
    aiService = new AIService();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('generateSummary', () => {
    test('should generate a summary from transcript', async () => {
      const mockTranscript = 'John: We need to discuss the budget. Sarah: I agree, we should finalize by Friday.';
      
      const result = await aiService.generateSummary(mockTranscript);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Mock AI summary');
    });

    test('should return fallback summary when AI fails', async () => {
      // Mock AI failure
      aiService.model.generateContent.mockRejectedValue(new Error('API Error'));
      
      const mockTranscript = 'Meeting transcript content';
      const result = await aiService.generateSummary(mockTranscript);
      
      expect(result).toContain('Overview:');
      expect(result).toContain('Decision:');
      expect(result).toContain('Action:');
    });

    test('should throw error when model is not initialized', async () => {
      aiService.model = null;
      
      await expect(aiService.generateSummary('test')).rejects.toThrow('AI model not initialized');
    });
  });

  describe('getFallbackSummary', () => {
    test('should generate fallback summary with correct format', () => {
      const mockTranscript = 'This is a test transcript with multiple words';
      
      const result = aiService.getFallbackSummary(mockTranscript);
      
      expect(result).toContain('Overview:');
      expect(result).toContain('• Decision:');
      expect(result).toContain('• Action:');
      expect(result).toContain('Next Steps:');
    });
  });
});