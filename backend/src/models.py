from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .database import Base

class MeetingDigest(Base):
    __tablename__ = "meeting_digests"
    
    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True)
    original_transcript = Column(Text, nullable=False)
    summary_overview = Column(Text)
    key_decisions = Column(Text)  # JSON string of decisions list
    action_items = Column(Text)   # JSON string of action items list
    full_summary = Column(Text)   # Complete AI response
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = Column(Boolean, default=False)  # For shareable links
    
    def __repr__(self):
        return f"<MeetingDigest(id={self.id}, created_at={self.created_at})>"
