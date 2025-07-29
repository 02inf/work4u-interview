from pydantic import BaseModel, Field, field_validator
from datetime import datetime

class SessionResponse(BaseModel):
    session_id: str
    created_at: datetime
    updated_at: datetime
