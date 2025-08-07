import { validateApiConnection, retryWithBackoff, isRetryableError, fetchWithTimeout } from '../network-utils';

// Mock fetch globally for these tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Network Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('validateApiConnection', () => {
    it('should return valid connection for successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await validateApiConnection('test-api-key');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return invalid for 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await validateApiConnection('invalid-key');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    it('should return invalid for 429 quota exceeded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      const result = await validateApiConnection('test-key');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('API quota exceeded');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

      const result = await validateApiConnection('test-key');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Network connection failed');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('TimeoutError');
      timeoutError.name = 'TimeoutError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const result = await validateApiConnection('test-key');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Connection timeout');
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, 3, 100);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(mockFn, 3, 100);

      // Fast-forward timers for retries
      jest.advanceTimersByTime(100); // First retry delay
      await Promise.resolve(); // Let promise resolve
      jest.advanceTimersByTime(200); // Second retry delay
      await Promise.resolve(); // Let promise resolve

      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    }, 10000); // 10 second timeout

    it('should not retry authentication errors', async () => {
      const authError = new Error('401 Unauthorized');
      const mockFn = jest.fn().mockRejectedValue(authError);

      await expect(retryWithBackoff(mockFn, 3, 100)).rejects.toThrow('401 Unauthorized');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const networkError = new Error('network error');
      const mockFn = jest.fn().mockRejectedValue(networkError);

      const promise = retryWithBackoff(mockFn, 2, 100);

      // Fast-forward timers for all retries
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      jest.advanceTimersByTime(200);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('network error');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      expect(isRetryableError(new Error('fetch failed'))).toBe(true);
      expect(isRetryableError(new Error('network error'))).toBe(true);
      expect(isRetryableError(new Error('timeout'))).toBe(true);
      expect(isRetryableError(new Error('502 Bad Gateway'))).toBe(true);
      expect(isRetryableError(new Error('503 Service Unavailable'))).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(isRetryableError(new Error('401 Unauthorized'))).toBe(false);
      expect(isRetryableError(new Error('403 Forbidden'))).toBe(false);
      expect(isRetryableError(new Error('API key invalid'))).toBe(false);
      expect(isRetryableError(new Error('quota exceeded'))).toBe(false);
      expect(isRetryableError(new Error('400 Bad Request'))).toBe(false);
    });
  });

  describe('fetchWithTimeout', () => {
    it('should make successful request within timeout', async () => {
      const mockResponse = { ok: true, status: 200 };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchWithTimeout('https://example.com', {}, 5000);

      expect(result).toBe(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 10000)));

      const promise = fetchWithTimeout('https://example.com', {}, 1000);

      jest.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow();
    }, 10000); // 10 second timeout
  });
});
