from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Summary(Base):
    __tablename__ = "summaries"
    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String, unique=True, index=True, default=lambda: str(uuid4()))
    transcript = Column(Text, nullable=False)
    summary = Column(Text)        # Will hold the generated summary text
    created_at = Column(DateTime, default=datetime.utcnow)
