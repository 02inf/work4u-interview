/**
 * API error handling middleware and utilities
 */

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: string;
}

export class NetworkError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: string;

  constructor(message: string, code: string = 'NETWORK_ERROR', statusCode: number = 503, details?: string) {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ApiKeyError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string = 'Invalid or missing API key') {
    super(message);
    this.name = 'ApiKeyError';
    this.code = 'API_KEY_ERROR';
    this.statusCode = 401;
  }
}

export class TimeoutError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
    this.code = 'TIMEOUT_ERROR';
    this.statusCode = 408;
  }
}

export class QuotaError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string = 'API quota exceeded') {
    super(message);
    this.name = 'QuotaError';
    this.code = 'QUOTA_ERROR';
    this.statusCode = 429;
  }
}

/**
 * Parse and classify different types of errors
 */
export function parseApiError(error: Error): ApiError {
  const message = error.message.toLowerCase();

  // Network errors
  if (
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('connection refused')
  ) {
    return {
      message: 'Network connection failed. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
      statusCode: 503,
      details: error.message,
    };
  }

  // Authentication errors
  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('api key') ||
    message.includes('unauthorized') ||
    message.includes('invalid key')
  ) {
    return {
      message: 'Invalid API key. Please check your Google API configuration.',
      code: 'API_KEY_ERROR',
      statusCode: 401,
      details: error.message,
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('aborted') || message.includes('408')) {
    return {
      message: 'Request timed out. Please try again with a shorter transcript.',
      code: 'TIMEOUT_ERROR',
      statusCode: 408,
      details: error.message,
    };
  }

  // Quota errors
  if (message.includes('quota') || message.includes('429') || message.includes('rate limit')) {
    return {
      message: 'API quota exceeded. Please try again later.',
      code: 'QUOTA_ERROR',
      statusCode: 429,
      details: error.message,
    };
  }

  // Bad request errors
  if (message.includes('400') || message.includes('bad request') || message.includes('invalid request')) {
    return {
      message: 'Invalid request format. Please check your input.',
      code: 'BAD_REQUEST',
      statusCode: 400,
      details: error.message,
    };
  }

  // Server errors
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('internal server error')
  ) {
    return {
      message: 'Server error. Please try again later.',
      code: 'SERVER_ERROR',
      statusCode: 503,
      details: error.message,
    };
  }

  // Generic error
  return {
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    details: error.message,
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: Error | ApiError) {
  const apiError = 'code' in error ? error : parseApiError(error as Error);

  return {
    error: apiError.message,
    code: apiError.code,
    details: apiError.details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetryError(error: Error): boolean {
  const apiError = parseApiError(error);

  // Don't retry these error types
  const nonRetryableCodes = ['API_KEY_ERROR', 'BAD_REQUEST', 'QUOTA_ERROR'];

  return !nonRetryableCodes.includes(apiError.code);
}
