const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TranscriptRequest {
  transcript: string;
}

export interface DigestResponse {
  id: number;
  public_id: string;
  summary_overview: string;
  key_decisions: string[];
  action_items: string[];
  created_at: string;
  is_public: boolean;
}

export interface DigestListResponse {
  id: number;
  public_id: string;
  summary_overview: string;
  created_at: string;
  is_public: boolean;
}

export interface DigestDetailResponse {
  id: number;
  public_id: string;
  original_transcript: string;
  summary_overview: string;
  key_decisions: string[];
  action_items: string[];
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Create a new digest
  async createDigest(transcript: string): Promise<DigestResponse> {
    return this.request<DigestResponse>('/api/v1/digests/', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    });
  }

  // Create digest with streaming
  async createDigestStream(transcript: string): Promise<ReadableStream> {
    const response = await fetch(`${this.baseURL}/api/v1/digests/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  }

  // Get all digests
  async getAllDigests(skip = 0, limit = 100): Promise<DigestListResponse[]> {
    return this.request<DigestListResponse[]>(`/api/v1/digests/?skip=${skip}&limit=${limit}`);
  }

  // Get specific digest by ID
  async getDigest(id: number): Promise<DigestDetailResponse> {
    return this.request<DigestDetailResponse>(`/api/v1/digests/${id}`);
  }

  // Get shared digest by public ID
  async getSharedDigest(publicId: string): Promise<DigestDetailResponse> {
    return this.request<DigestDetailResponse>(`/api/v1/digests/share/${publicId}`);
  }

  // Delete digest
  async deleteDigest(id: number): Promise<void> {
    await this.request(`/api/v1/digests/${id}`, {
      method: 'DELETE',
    });
  }

  // Update digest visibility
  async updateDigestVisibility(id: number, isPublic: boolean): Promise<DigestDetailResponse> {
    return this.request<DigestDetailResponse>(`/api/v1/digests/${id}/visibility?is_public=${isPublic}`, {
      method: 'PATCH',
    });
  }
}

export const apiClient = new APIClient();
