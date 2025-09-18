import axios from 'axios';
import { DigestCreateRequest, DigestResponse, DigestListItem, DigestDetail } from '../types';

// API 基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API 服务类
class ApiService {
  // 创建摘要
  async createDigest(request: DigestCreateRequest): Promise<DigestResponse> {
    const response = await api.post<DigestResponse>('/digest', request);
    return response.data;
  }

  // 获取摘要列表
  async getDigests(): Promise<DigestListItem[]> {
    const response = await api.get<DigestListItem[]>('/digests');
    return response.data;
  }

  // 获取摘要详情
  async getDigestDetail(id: number): Promise<DigestDetail> {
    const response = await api.get<DigestDetail>(`/digest/${id}`);
    return response.data;
  }

  // 通过公共ID获取摘要（用于分享）
  async getSharedDigest(publicId: string): Promise<DigestDetail> {
    const response = await api.get<DigestDetail>(`/public/${publicId}`);
    return response.data;
  }

  // 流式创建摘要（加分功能）
  createDigestStream(request: DigestCreateRequest): Promise<ReadableStream> {
    return fetch(`${API_BASE_URL}/digest/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }).then(response => {
      if (!response.ok) {
        throw new Error('流式请求失败');
      }
      if (!response.body) {
        throw new Error('响应体为空');
      }
      return response.body;
    });
  }

  // 删除摘要
  async deleteDigest(id: number): Promise<{ message: string; success: boolean }> {
    const response = await api.delete(`/digest/${id}`);
    return response.data;
  }

  // 通过公共ID删除摘要
  async deleteSharedDigest(publicId: string): Promise<{ message: string; success: boolean }> {
    const response = await api.delete(`/public/${publicId}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;