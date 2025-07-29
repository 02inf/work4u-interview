from pydantic import BaseModel
from ..constants import DEFAULT_GEMINI_MODEL


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    model: str = DEFAULT_GEMINI_MODEL
