import axios from 'axios';
import apiService from '../api';
import { DigestCreateRequest } from '../../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock fetch for streaming API
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('ApiService', () => {
  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios);
    jest.clearAllMocks();
  });

  describe('createDigest', () => {
    test('creates digest successfully', async () => {
      const mockRequest: DigestCreateRequest = {
        transcript: 'Test meeting transcript'
      };

      const mockResponse = {
        data: {
          id: 1,
          public_id: 'test-id',
          summary_overview: 'Test summary',
          key_decisions: ['Decision 1'],
          action_items: ['Action 1'],
          created_at: '2023-01-01T10:00:00.000000'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await apiService.createDigest(mockRequest);

      expect(mockedAxios.post).toHaveBeenCalledWith('/digest', mockRequest);
      expect(result).toEqual(mockResponse.data);
    });

    test('handles API errors', async () => {
      const mockRequest: DigestCreateRequest = {
        transcript: 'Test meeting transcript'
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(apiService.createDigest(mockRequest)).rejects.toThrow('API Error');
    });
  });

  describe('getDigests', () => {
    test('fetches digests list successfully', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            public_id: 'test-id-1',
            summary_overview: 'Summary 1',
            created_at: '2023-01-01T10:00:00.000000',
            transcript_preview: 'Preview 1'
          },
          {
            id: 2,
            public_id: 'test-id-2',
            summary_overview: 'Summary 2',
            created_at: '2023-01-02T10:00:00.000000',
            transcript_preview: 'Preview 2'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await apiService.getDigests();

      expect(mockedAxios.get).toHaveBeenCalledWith('/digests');
      expect(result).toEqual(mockResponse.data);
      expect(result).toHaveLength(2);
    });
  });

  describe('getDigestDetail', () => {
    test('fetches digest detail successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          public_id: 'test-id',
          summary_overview: 'Test summary',
          key_decisions: ['Decision 1'],
          action_items: ['Action 1'],
          created_at: '2023-01-01T10:00:00.000000',
          original_transcript: 'Original transcript content'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await apiService.getDigestDetail(1);

      expect(mockedAxios.get).toHaveBeenCalledWith('/digest/1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getSharedDigest', () => {
    test('fetches shared digest successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          public_id: 'test-public-id',
          summary_overview: 'Test summary',
          key_decisions: ['Decision 1'],
          action_items: ['Action 1'],
          created_at: '2023-01-01T10:00:00.000000',
          original_transcript: 'Original transcript content'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await apiService.getSharedDigest('test-public-id');

      expect(mockedAxios.get).toHaveBeenCalledWith('/public/test-public-id');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteDigest', () => {
    test('deletes digest successfully', async () => {
      const mockResponse = {
        data: {
          message: '摘要已删除',
          success: true
        }
      };

      mockedAxios.delete.mockResolvedValueOnce(mockResponse);

      const result = await apiService.deleteDigest(1);

      expect(mockedAxios.delete).toHaveBeenCalledWith('/digest/1');
      expect(result).toEqual(mockResponse.data);
      expect(result.success).toBe(true);
    });
  });

  describe('createDigestStream', () => {
    test('creates streaming request successfully', async () => {
      const mockRequest: DigestCreateRequest = {
        transcript: 'Test streaming transcript'
      };

      const mockReadableStream = new ReadableStream();
      const mockResponse = {
        ok: true,
        body: mockReadableStream
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await apiService.createDigestStream(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/digest/stream',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockRequest),
        }
      );
      expect(result).toBe(mockReadableStream);
    });

    test('handles streaming errors', async () => {
      const mockRequest: DigestCreateRequest = {
        transcript: 'Test streaming transcript'
      };

      const mockResponse = {
        ok: false,
        status: 500
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await expect(apiService.createDigestStream(mockRequest)).rejects.toThrow('流式请求失败');
    });

    test('handles empty response body', async () => {
      const mockRequest: DigestCreateRequest = {
        transcript: 'Test streaming transcript'
      };

      const mockResponse = {
        ok: true,
        body: null
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await expect(apiService.createDigestStream(mockRequest)).rejects.toThrow('响应体为空');
    });
  });
});