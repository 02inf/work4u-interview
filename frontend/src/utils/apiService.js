const API_BASE_URL = 'http://localhost:3001/api';

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`Making request to: ${url}`);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}:`, errorText);
      throw new APIError(
        errorText || `HTTP Error ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
    
  } catch (error) {
    console.error('Network error:', error);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      'Network error. Please check if the server is running on port 3001.',
      0
    );
  }
}

export async function createDigest(transcript) {
  if (!transcript || !transcript.trim()) {
    throw new APIError('Transcript cannot be empty', 400);
  }

  try {
    const response = await makeRequest('/digests', {
      method: 'POST',
      body: JSON.stringify({ transcript: transcript.trim() }),
    });

    if (!response) {
      console.error('Invalid response format:', response);
      throw new APIError('Invalid response from server', 500);
    }

    // Handle different response formats
    if (response.success && response.data) {
      return response.data;
    }
    
    return response;
  } catch (error) {
    console.error('Create digest error:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Failed to create digest', 500);
  }
}

export async function createDigestWithStreaming(transcript, onProgress, onComplete, onError) {
  if (!transcript || !transcript.trim()) {
    throw new APIError('Transcript cannot be empty', 400);
  }

  try {
    const eventSource = new EventSource(`${API_BASE_URL}/stream/digest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript: transcript.trim() })
    });

    // Note: EventSource doesn't support POST directly, so we'll use fetch with streaming
    const response = await fetch(`${API_BASE_URL}/stream/digest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript: transcript.trim() })
    });

    if (!response.ok) {
      throw new APIError(`HTTP Error ${response.status}`, response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'status':
              case 'progress':
                if (onProgress) onProgress(data);
                break;
              case 'complete':
                if (onComplete) onComplete(data.data);
                return data.data;
              case 'error':
                if (onError) onError(new APIError(data.error, 500));
                throw new APIError(data.error, 500);
            }
          } catch (parseError) {
            console.warn('Failed to parse streaming data:', line);
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming digest error:', error);
    if (onError) onError(error);
    throw error;
  }
}

export async function getAllDigests() {
  try {
    const response = await makeRequest('/digests');
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (!Array.isArray(response)) {
      console.error('Expected array, got:', response);
      return [];
    }
    return response;
  } catch (error) {
    console.error('Get all digests error:', error);
    return [];
  }
}

export async function getDigestByPublicId(publicId) {
  if (!publicId) {
    throw new APIError('Public ID is required', 400);
  }

  try {
    return await makeRequest(`/digests/${publicId}`);
  } catch (error) {
    console.error('Get digest by public ID error:', error);
    throw error;
  }
}

export async function testConnection() {
  try {
    const response = await makeRequest('/health');
    console.log('Health check successful:', response);
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}