import axios from 'axios';
import { Digest, DigestDetail } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const digestService = {
  // Create a new digest
  async createDigest(transcript: string): Promise<Digest> {
    const response = await api.post('/digests', { transcript });
    return response.data;
  },

  // Get all digests
  async getDigests(): Promise<Digest[]> {
    const response = await api.get('/digests');
    return response.data;
  },

  // Get a single digest by public ID
  async getDigest(publicId: string): Promise<DigestDetail> {
    const response = await api.get(`/digests/${publicId}`);
    return response.data;
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health');
    return response.data;
  },
}; 