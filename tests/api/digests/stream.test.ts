import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { POST } from '../../../src/app/api/digests/stream/route';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    digest: {
      create: jest.fn(),
    },
  },
}));

// Mock Google GenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContentStream: jest.fn(),
    },
  })),
}));

// Mock mock responses
jest.mock('@/lib/mock-responses', () => ({
  shouldUseMockResponse: jest.fn(),
  createMockStreamingResponse: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { shouldUseMockResponse, createMockStreamingResponse } from '@/lib/mock-responses';

describe('/api/digests/stream', () => {
  const mockPrismaCreate = prisma.digest.create as jest.Mock;
  const mockShouldUseMockResponse = shouldUseMockResponse as jest.Mock;
  const mockCreateMockStreamingResponse = createMockStreamingResponse as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.USE_MOCK_RESPONSES = 'true';
  });

  it('should return 400 for empty transcript', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: JSON.stringify({ transcript: '' }),
    });

    const request = new NextRequest(req.url || 'http://localhost', {
      method: 'POST',
      body: JSON.stringify({ transcript: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Transcript is required');
  });

  it('should return 400 for missing transcript', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: JSON.stringify({}),
    });

    const request = new NextRequest(req.url || 'http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Transcript is required');
  });

  it('should use mock responses when enabled', async () => {
    mockShouldUseMockResponse.mockReturnValue(true);

    const mockChunks = [{ text: '# Meeting Summary\n' }, { text: 'Test content' }];

    async function* mockGenerator() {
      for (const chunk of mockChunks) {
        yield chunk;
      }
    }

    mockCreateMockStreamingResponse.mockImplementation(mockGenerator);

    const mockDigest = {
      id: 'test-id',
      publicId: 'public-test-id',
      summary: '# Meeting Summary\nTest content',
      createdAt: new Date(),
    };

    mockPrismaCreate.mockResolvedValue(mockDigest);

    const { req } = createMocks({
      method: 'POST',
      body: JSON.stringify({ transcript: 'Test meeting transcript' }),
    });

    const request = new NextRequest(req.url || 'http://localhost', {
      method: 'POST',
      body: JSON.stringify({ transcript: 'Test meeting transcript' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(mockShouldUseMockResponse).toHaveBeenCalled();
    expect(mockPrismaCreate).toHaveBeenCalledWith({
      data: {
        publicId: expect.any(String),
        originalTranscript: 'Test meeting transcript',
        summary: expect.any(String),
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    mockShouldUseMockResponse.mockReturnValue(true);

    async function* mockGenerator() {
      yield { text: 'Test content' };
    }

    mockCreateMockStreamingResponse.mockImplementation(mockGenerator);
    mockPrismaCreate.mockRejectedValue(new Error('Database connection failed'));

    const { req } = createMocks({
      method: 'POST',
      body: JSON.stringify({ transcript: 'Test meeting transcript' }),
    });

    const request = new NextRequest(req.url || 'http://localhost', {
      method: 'POST',
      body: JSON.stringify({ transcript: 'Test meeting transcript' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');

    // The response should still be a readable stream but will contain error events
    const reader = response.body?.getReader();
    if (reader) {
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      expect(text).toContain('error');
    }
  });

  it('should validate content-type for streaming response', async () => {
    mockShouldUseMockResponse.mockReturnValue(true);

    async function* mockGenerator() {
      yield { text: 'Test content' };
    }

    mockCreateMockStreamingResponse.mockImplementation(mockGenerator);
    mockPrismaCreate.mockResolvedValue({
      id: 'test-id',
      publicId: 'public-test-id',
      summary: 'Test content',
      createdAt: new Date(),
    });

    const { req } = createMocks({
      method: 'POST',
      body: JSON.stringify({ transcript: 'Valid test transcript' }),
    });

    const request = new NextRequest(req.url || 'http://localhost', {
      method: 'POST',
      body: JSON.stringify({ transcript: 'Valid test transcript' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(response.headers.get('connection')).toBe('keep-alive');
  });
});
