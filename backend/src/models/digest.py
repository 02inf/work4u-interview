from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime


class TranscriptRequest(BaseModel):
    transcript: str = Field(
        min_length=1,
        description="Meeting transcript text",
        examples=["This is a sample meeting transcript..."]
    )
    
    @field_validator('transcript')
    @classmethod
    def validate_transcript(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Transcript cannot be empty or contain only whitespace")
        
        if len(v) > 50000:
            raise ValueError("Transcript is too long. Maximum allowed length is 50,000 characters")
        
        return v.strip()


class DigestResponse(BaseModel):
    id: str
    overview: str
    key_decisions: List[str]
    action_items: List[str]
    created_at: datetime
    public_id: Optional[str] = None