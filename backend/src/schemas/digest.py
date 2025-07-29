from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class Digest(Base):
    __tablename__ = "digests"
    
    id = Column(String, primary_key=True, index=True)
    public_id = Column(String, unique=True, index=True)
    original_transcript = Column(Text, nullable=False)
    overview = Column(Text, nullable=False)
    key_decisions = Column(JSON, nullable=False)
    action_items = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)