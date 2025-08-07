/**
 * Network utility functions for connection validation and retry logic
 */

/**
 * Check if the API key is valid and accessible
 */
export async function validateApiConnection(apiKey: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Simple validation test using a basic API call
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models?key=' + apiKey, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      return { isValid: true };
    } else {
      const status = response.status;
      if (status === 401 || status === 403) {
        return { isValid: false, error: 'Invalid API key or insufficient permissions' };
      } else if (status === 429) {
        return { isValid: false, error: 'API quota exceeded' };
      } else {
        return { isValid: false, error: `API returned status ${status}` };
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return { isValid: false, error: 'Connection timeout - check internet connection' };
      } else if (error.message.includes('fetch failed') || error.message.includes('network')) {
        return { isValid: false, error: 'Network connection failed' };
      } else {
        return { isValid: false, error: error.message };
      }
    }
    return { isValid: false, error: 'Unknown connection error' };
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (
        lastError.message.includes('401') ||
        lastError.message.includes('403') ||
        lastError.message.includes('API key') ||
        lastError.message.includes('unauthorized')
      ) {
        throw lastError; // Don't retry auth errors
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Don't retry these errors
  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('api key') ||
    message.includes('unauthorized') ||
    message.includes('invalid key') ||
    message.includes('quota') ||
    message.includes('400')
  ) {
    return false;
  }

  // Retry these errors
  return (
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection refused') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('econnreset') ||
    message.includes('enotfound')
  );
}

/**
 * Check if an error should be retried (alias for isRetryableError)
 */
export function shouldRetryError(error: Error): boolean {
  return isRetryableError(error);
}

/**
 * Create a fetch with timeout
 */
export function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}
