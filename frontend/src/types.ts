export interface Digest {
  id: number;
  publicId: string;
  summary: {
    overview: string;
    keyDecisions: string[];
    actionItems: {
      task: string;
      assignee: string;
    }[];
  };
  createdAt: string;
}

export interface DigestDetail extends Digest {
  transcript: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
} 