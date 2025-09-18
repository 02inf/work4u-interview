"""
数据库配置和模型定义
"""
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import uuid

# 数据库URL配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./meeting_digest.db")

# 创建数据库引擎
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 基础模型类
Base = declarative_base()

class MeetingDigest(Base):
    """会议摘要数据模型"""
    __tablename__ = "meeting_digests"
    
    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    original_transcript = Column(Text, nullable=False)
    summary_overview = Column(Text)
    key_decisions = Column(Text)  # JSON string
    action_items = Column(Text)   # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# 依赖注入：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 初始化数据库
async def init_db():
    """创建所有数据表"""
    Base.metadata.create_all(bind=engine)