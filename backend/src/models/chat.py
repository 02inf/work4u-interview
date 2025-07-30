from pydantic import BaseModel, Field, field_validator
from typing import List
from datetime import datetime
from enum import Enum

class Template(Enum):
    digest = "digest"
    chat = "chat"


class ChatResponse(BaseModel):
    id: str
    chat_id: str
    session_id: str
    overview: str
    original_transcript: str
    key_decisions: List[str]
    action_items: List[str]
    created_at: datetime


class ChatCreateRequest(BaseModel):
    session_id: str = Field(
        min_length=1,
        description="Session ID for the chat",
        examples=["session-123"]
    )
    template: Template = Field(
        description="Template for the chat",
        examples=[Template.digest, Template.chat]
    )
    input: str = Field(
        min_length=1,
        description="User input",
        examples=["This is a sample meeting transcript..."]
    )
    
    @field_validator('input')
    @classmethod
    def validate_input(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Input cannot be empty or contain only whitespace")
        
        if len(v) > 50000:
            raise ValueError("Input is too long. Maximum allowed length is 50,000 characters")
        
        return v.strip()