export interface Digest {
  id: string
  transcript: string
  summary: string
  overview: string
  key_decisions: string[]
  action_items: string[]
  created_at: string
  public_id?: string
}

export interface CreateDigestRequest {
  transcript: string
}

export interface CreateDigestResponse {
  digest: Digest
}

export interface ListDigestsResponse {
  digests: Digest[]
}