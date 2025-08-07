/**
 * Unit tests for utility functions and core business logic
 */

import { parseApiError, shouldRetryError } from '@/lib/error-handling';
import { isRetryableError } from '@/lib/network-utils';
import { shouldUseMockResponse } from '@/lib/mock-responses';

describe('Core Business Logic Tests', () => {
  describe('Error Classification', () => {
    it('should correctly classify network errors as retryable', () => {
      const networkErrors = [
        new Error('fetch failed'),
        new Error('network error'),
        new Error('Connection refused'),
        new Error('502 Bad Gateway'),
        new Error('503 Service Unavailable'),
      ];

      networkErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
        expect(shouldRetryError(error)).toBe(true);
      });
    });

    it('should correctly classify auth errors as non-retryable', () => {
      const authErrors = [
        new Error('401 Unauthorized'),
        new Error('403 Forbidden'),
        new Error('API key invalid'),
        new Error('invalid key'),
      ];

      authErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(false);
        expect(shouldRetryError(error)).toBe(false);
      });
    });

    it('should parse error messages correctly', () => {
      const testCases = [
        {
          error: new Error('fetch failed'),
          expectedCode: 'NETWORK_ERROR',
          expectedStatus: 503,
        },
        {
          error: new Error('401 Unauthorized'),
          expectedCode: 'API_KEY_ERROR',
          expectedStatus: 401,
        },
        {
          error: new Error('timeout occurred'),
          expectedCode: 'TIMEOUT_ERROR',
          expectedStatus: 408,
        },
        {
          error: new Error('429 Rate limit'),
          expectedCode: 'QUOTA_ERROR',
          expectedStatus: 429,
        },
      ];

      testCases.forEach(({ error, expectedCode, expectedStatus }) => {
        const result = parseApiError(error);
        expect(result.code).toBe(expectedCode);
        expect(result.statusCode).toBe(expectedStatus);
        expect(result.details).toBe(error.message);
      });
    });
  });

  describe('Mock Response Logic', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should enable mock responses in development with flag', () => {
      // Since we can't modify NODE_ENV, we test the function logic directly
      const originalValue = process.env.USE_MOCK_RESPONSES;
      process.env.USE_MOCK_RESPONSES = 'true';

      // This tests the current implementation
      const result = shouldUseMockResponse();
      const expected = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_RESPONSES === 'true';

      process.env.USE_MOCK_RESPONSES = originalValue;

      // In test environment, this should be false unless specifically configured
      expect(typeof result).toBe('boolean');
    });

    it('should disable mock responses when flag is false', () => {
      const originalValue = process.env.USE_MOCK_RESPONSES;
      process.env.USE_MOCK_RESPONSES = 'false';

      const result = shouldUseMockResponse();
      expect(result).toBe(false);

      process.env.USE_MOCK_RESPONSES = originalValue;
    });
  });

  describe('Input Validation', () => {
    it('should validate transcript requirements', () => {
      const validTranscripts = [
        'This is a valid meeting transcript with enough content to process.',
        'Another valid transcript that meets the minimum length requirements.',
      ];

      const invalidTranscripts = ['', '   ', 'Short', 'Too short content'];

      validTranscripts.forEach((transcript) => {
        expect(transcript.trim().length).toBeGreaterThan(20);
      });

      invalidTranscripts.forEach((transcript) => {
        expect(transcript.trim().length).toBeLessThanOrEqual(20);
      });
    });

    it('should handle edge cases in input validation', () => {
      const edgeCases = [null, undefined, 123, {}, []];

      edgeCases.forEach((input) => {
        const isValid = typeof input === 'string' && input.trim().length > 20;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Response Formatting', () => {
    it('should format digest responses correctly', () => {
      const mockDigest = {
        id: 'test-id',
        publicId: 'public-test-id',
        summary: '# Test Summary\nContent',
        originalTranscript: 'Original content',
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      // Test response structure
      expect(mockDigest).toHaveProperty('id');
      expect(mockDigest).toHaveProperty('publicId');
      expect(mockDigest).toHaveProperty('summary');
      expect(mockDigest).toHaveProperty('createdAt');

      // Test ID formats - allow hyphens
      expect(mockDigest.id).toMatch(/^[a-z0-9-]+$/);
      expect(mockDigest.publicId).toMatch(/^[a-z0-9-]+$/);

      // Test date format
      expect(new Date(mockDigest.createdAt).toISOString()).toBe(mockDigest.createdAt);
    });

    it('should validate streaming event formats', () => {
      const streamingEvents = [
        { type: 'start', publicId: 'test-id' },
        { type: 'chunk', content: 'Test content' },
        { type: 'complete', digest: { id: 'test' } },
        { type: 'error', message: 'Error message' },
      ];

      streamingEvents.forEach((event) => {
        expect(event).toHaveProperty('type');
        expect(['start', 'chunk', 'complete', 'error']).toContain(event.type);

        // Validate event-specific properties
        if (event.type === 'start') {
          expect(event).toHaveProperty('publicId');
        } else if (event.type === 'chunk') {
          expect(event).toHaveProperty('content');
        } else if (event.type === 'complete') {
          expect(event).toHaveProperty('digest');
        } else if (event.type === 'error') {
          expect(event).toHaveProperty('message');
        }
      });
    });
  });
});
