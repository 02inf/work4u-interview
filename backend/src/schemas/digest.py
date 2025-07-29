from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class Digest(Base):
    __tablename__ = "digests"
    
    id = Column(String, primary_key=True, index=True)
    public_id = Column(String, unique=True, index=True)
    original_transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)