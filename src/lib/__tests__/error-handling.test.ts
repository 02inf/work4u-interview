import {
  parseApiError,
  createErrorResponse,
  shouldRetryError,
  NetworkError,
  ApiKeyError,
  TimeoutError,
  QuotaError,
  ApiError,
} from '../error-handling';

describe('Error Handling', () => {
  describe('parseApiError', () => {
    it('should parse network errors', () => {
      const error = new Error('fetch failed');
      const result = parseApiError(error);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.statusCode).toBe(503);
      expect(result.message).toContain('Network connection failed');
    });

    it('should parse authentication errors', () => {
      const error = new Error('401 Unauthorized');
      const result = parseApiError(error);

      expect(result.code).toBe('API_KEY_ERROR');
      expect(result.statusCode).toBe(401);
      expect(result.message).toContain('Invalid API key');
    });

    it('should parse timeout errors', () => {
      const error = new Error('Request timeout');
      const result = parseApiError(error);

      expect(result.code).toBe('TIMEOUT_ERROR');
      expect(result.statusCode).toBe(408);
      expect(result.message).toContain('Request timed out');
    });

    it('should parse quota errors', () => {
      const error = new Error('429 Rate limit exceeded');
      const result = parseApiError(error);

      expect(result.code).toBe('QUOTA_ERROR');
      expect(result.statusCode).toBe(429);
      expect(result.message).toContain('API quota exceeded');
    });

    it('should parse bad request errors', () => {
      const error = new Error('400 Bad Request');
      const result = parseApiError(error);

      expect(result.code).toBe('BAD_REQUEST');
      expect(result.statusCode).toBe(400);
      expect(result.message).toContain('Invalid request format');
    });

    it('should parse server errors', () => {
      const error = new Error('500 Internal Server Error');
      const result = parseApiError(error);

      expect(result.code).toBe('SERVER_ERROR');
      expect(result.statusCode).toBe(503);
      expect(result.message).toContain('Server error');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Some unknown error');
      const result = parseApiError(error);

      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Some unknown error');
    });
  });

  describe('createErrorResponse', () => {
    it('should create response from Error', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error);

      expect(response.error).toContain('Test error');
      expect(response.code).toBe('UNKNOWN_ERROR');
      expect(response.details).toBe('Test error');
      expect(response.timestamp).toBeDefined();
    });

    it('should create response from ApiError', () => {
      const apiError = {
        message: 'Network failed',
        code: 'NETWORK_ERROR',
        statusCode: 503,
        details: 'Connection refused',
      };
      const response = createErrorResponse(apiError as ApiError);

      expect(response.error).toBe('Network failed');
      expect(response.code).toBe('NETWORK_ERROR');
      expect(response.details).toBe('Connection refused');
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('shouldRetryError', () => {
    it('should retry network errors', () => {
      expect(shouldRetryError(new Error('fetch failed'))).toBe(true);
      expect(shouldRetryError(new Error('network error'))).toBe(true);
      expect(shouldRetryError(new Error('502 Bad Gateway'))).toBe(true);
    });

    it('should not retry auth errors', () => {
      expect(shouldRetryError(new Error('401 Unauthorized'))).toBe(false);
      expect(shouldRetryError(new Error('API key invalid'))).toBe(false);
      expect(shouldRetryError(new Error('400 Bad Request'))).toBe(false);
    });

    it('should not retry quota errors', () => {
      expect(shouldRetryError(new Error('429 Rate limit'))).toBe(false);
      expect(shouldRetryError(new Error('quota exceeded'))).toBe(false);
    });
  });

  describe('Custom Error Classes', () => {
    it('should create NetworkError with correct properties', () => {
      const error = new NetworkError('Connection failed', 'NET_ERR', 502, 'Gateway timeout');

      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('NET_ERR');
      expect(error.statusCode).toBe(502);
      expect(error.details).toBe('Gateway timeout');
    });

    it('should create ApiKeyError with defaults', () => {
      const error = new ApiKeyError();

      expect(error.name).toBe('ApiKeyError');
      expect(error.message).toBe('Invalid or missing API key');
      expect(error.code).toBe('API_KEY_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('should create TimeoutError with defaults', () => {
      const error = new TimeoutError();

      expect(error.name).toBe('TimeoutError');
      expect(error.message).toBe('Request timeout');
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.statusCode).toBe(408);
    });

    it('should create QuotaError with defaults', () => {
      const error = new QuotaError();

      expect(error.name).toBe('QuotaError');
      expect(error.message).toBe('API quota exceeded');
      expect(error.code).toBe('QUOTA_ERROR');
      expect(error.statusCode).toBe(429);
    });
  });
});
