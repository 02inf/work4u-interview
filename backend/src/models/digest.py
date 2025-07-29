from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class TranscriptRequest(BaseModel):
    transcript: str


class DigestResponse(BaseModel):
    id: str
    overview: str
    key_decisions: List[str]
    action_items: List[str]
    created_at: datetime
    public_id: Optional[str] = None