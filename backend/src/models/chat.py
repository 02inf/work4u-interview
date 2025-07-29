from pydantic import BaseModel, Field, field_validator
from typing import List
from datetime import datetime



class SessionResponse(BaseModel):
    session_id: str
    created_at: datetime
    updated_at: datetime


class ChatResponse(BaseModel):
    id: str
    chat_id: str
    session_id: str
    overview: str
    key_decisions: List[str]
    action_items: List[str]
    created_at: datetime


class ChatCreateRequest(BaseModel):
    session_id: str = Field(
        min_length=1,
        description="Session ID for the chat",
        examples=["session-123"]
    )
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


class ChatUpdateRequest(BaseModel):
    session_id: str = Field(
        min_length=1,
        description="Session ID for the chat",
        examples=["session-123"]
    )
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