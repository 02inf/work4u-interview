export interface Digest {
  id: string;
  publicId: string;
  summary: string;
  createdAt: string;
}

export interface DigestWithTranscript extends Digest {
  originalTranscript: string;
}
