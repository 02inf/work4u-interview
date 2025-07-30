from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .base import Base


class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    chat_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.session_id"), nullable=False)
    original_transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    overview = Column(Text, nullable=False)
    key_decisions = Column(JSON, nullable=False)
    action_items = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("Session", back_populates="chats")