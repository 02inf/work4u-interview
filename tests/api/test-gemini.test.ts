import { GET } from '../../src/app/api/test-gemini/route';

// Mock Google GenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
}));

// Mock network utils
jest.mock('@/lib/network-utils', () => ({
  validateApiConnection: jest.fn(),
  retryWithBackoff: jest.fn(),
}));

import { GoogleGenAI } from '@google/genai';
import { validateApiConnection, retryWithBackoff } from '@/lib/network-utils';

describe('/api/test-gemini', () => {
  const mockValidateApiConnection = validateApiConnection as jest.Mock;
  const mockRetryWithBackoff = retryWithBackoff as jest.Mock;
  const mockGoogleGenAI = GoogleGenAI as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when API key is missing', async () => {
    delete process.env.GOOGLE_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Google API key not configured or empty');
  });

  it('should return error when API key is empty', async () => {
    process.env.GOOGLE_API_KEY = '  ';

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Google API key not configured or empty');
  });

  it('should return error when API validation fails', async () => {
    process.env.GOOGLE_API_KEY = 'test-api-key';
    mockValidateApiConnection.mockResolvedValue({
      isValid: false,
      error: 'Invalid API key',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('API validation failed');
    expect(data.details).toBe('Invalid API key');
  });

  it('should succeed with valid API key and connection', async () => {
    process.env.GOOGLE_API_KEY = 'valid-api-key';

    mockValidateApiConnection.mockResolvedValue({
      isValid: true,
    });

    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: 'Hello from Gemini!',
    });

    mockGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    }));

    mockRetryWithBackoff.mockImplementation(async (fn) => {
      return await fn();
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('GenAI connection successful');
    expect(data.response).toBe('Hello from Gemini!');
    expect(data.timestamp).toBeDefined();
  });

  it('should handle network errors with proper status codes', async () => {
    process.env.GOOGLE_API_KEY = 'test-api-key';

    mockValidateApiConnection.mockResolvedValue({
      isValid: true,
    });

    mockGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: jest.fn(),
      },
    }));

    mockRetryWithBackoff.mockRejectedValue(new Error('fetch failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Network connection failed. Please check your internet connection.');
    expect(data.details).toBe('fetch failed');
  });

  it('should handle authentication errors with proper status codes', async () => {
    process.env.GOOGLE_API_KEY = 'invalid-key';

    mockValidateApiConnection.mockResolvedValue({
      isValid: true,
    });

    mockGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: jest.fn(),
      },
    }));

    mockRetryWithBackoff.mockRejectedValue(new Error('401 Unauthorized'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid API key. Please check your Google API configuration.');
  });

  it('should handle timeout errors', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';

    mockValidateApiConnection.mockResolvedValue({
      isValid: true,
    });

    mockGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: jest.fn(),
      },
    }));

    mockRetryWithBackoff.mockRejectedValue(new Error('timeout'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(408);
    expect(data.error).toBe('Request timed out. Please try again.');
  });

  it('should handle quota exceeded errors', async () => {
    process.env.GOOGLE_API_KEY = 'test-key';

    mockValidateApiConnection.mockResolvedValue({
      isValid: true,
    });

    mockGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: jest.fn(),
      },
    }));

    mockRetryWithBackoff.mockRejectedValue(new Error('429 quota exceeded'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('API quota exceeded. Please try again later.');
  });
});
