"""
Pydantic 模型定义（请求/响应数据结构）
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
import json

class DigestCreateRequest(BaseModel):
    """创建摘要请求模型"""
    transcript: str = Field(..., min_length=10, description="会议转录文本")

class DigestCreateResponse(BaseModel):
    """创建摘要响应模型"""
    id: int
    public_id: str
    summary_overview: str
    key_decisions: List[str]
    action_items: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_db_model(cls, db_model):
        """从数据库模型转换为响应模型"""
        return cls(
            id=db_model.id,
            public_id=db_model.public_id,
            summary_overview=db_model.summary_overview or "",
            key_decisions=json.loads(db_model.key_decisions or "[]"),
            action_items=json.loads(db_model.action_items or "[]"),
            created_at=db_model.created_at
        )

class DigestListResponse(BaseModel):
    """摘要列表响应模型"""
    id: int
    public_id: str
    summary_overview: str
    created_at: datetime
    transcript_preview: str = Field(..., description="转录文本预览（前100字符）")

    class Config:
        from_attributes = True

    @classmethod
    def from_db_model(cls, db_model):
        """从数据库模型转换为列表响应模型"""
        return cls(
            id=db_model.id,
            public_id=db_model.public_id,
            summary_overview=db_model.summary_overview or "",
            created_at=db_model.created_at,
            transcript_preview=db_model.original_transcript[:100] + "..." if len(db_model.original_transcript) > 100 else db_model.original_transcript
        )

class DigestDetailResponse(DigestCreateResponse):
    """摘要详情响应模型（包含原始转录）"""
    original_transcript: str

    @classmethod
    def from_db_model(cls, db_model):
        """从数据库模型转换为详情响应模型"""
        return cls(
            id=db_model.id,
            public_id=db_model.public_id,
            summary_overview=db_model.summary_overview or "",
            key_decisions=json.loads(db_model.key_decisions or "[]"),
            action_items=json.loads(db_model.action_items or "[]"),
            created_at=db_model.created_at,
            original_transcript=db_model.original_transcript
        )