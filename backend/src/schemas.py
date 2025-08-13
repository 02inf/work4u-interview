from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class TranscriptRequest(BaseModel):
    transcript: str = Field(..., min_length=1, description="The meeting transcript to analyze")

class DigestResponse(BaseModel):
    id: int
    public_id: uuid.UUID
    summary_overview: str
    key_decisions: List[str]
    action_items: List[str]
    created_at: datetime
    is_public: bool = False
    
    class Config:
        from_attributes = True

class DigestListResponse(BaseModel):
    id: int
    public_id: uuid.UUID
    summary_overview: str
    created_at: datetime
    is_public: bool = False
    
    class Config:
        from_attributes = True

class DigestDetailResponse(BaseModel):
    id: int
    public_id: uuid.UUID
    original_transcript: str
    summary_overview: str
    key_decisions: List[str]
    action_items: List[str]
    created_at: datetime
    updated_at: datetime
    is_public: bool = False
    
    class Config:
        from_attributes = True

class StreamResponse(BaseModel):
    content: str
    is_complete: bool = False

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
