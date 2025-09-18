// 类型定义文件

export interface DigestCreateRequest {
  transcript: string;
}

export interface DigestResponse {
  id: number;
  public_id: string;
  summary_overview: string;
  key_decisions: string[];
  action_items: string[];
  created_at: string;
}

export interface DigestListItem {
  id: number;
  public_id: string;
  summary_overview: string;
  created_at: string;
  transcript_preview: string;
}

export interface DigestDetail extends DigestResponse {
  original_transcript: string;
}

export interface ApiError {
  detail: string;
}

// 流式响应的状态
export interface StreamStatus {
  status: 'started' | 'generating' | 'completed' | 'error';
  digest_id?: number;
  chunk?: string;
  accumulated?: string;
  result?: DigestResponse;
  message?: string;
}