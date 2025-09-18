"""
会议摘要相关的 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json
import uuid

from database import get_db, MeetingDigest
from schemas import DigestCreateRequest, DigestCreateResponse, DigestListResponse, DigestDetailResponse
from services.gemini_service import GeminiService

router = APIRouter()
gemini_service = GeminiService()

@router.post("/digest/test", response_model=DigestCreateResponse)
async def create_digest_test(
    request: DigestCreateRequest,
    db: Session = Depends(get_db)
):
    """
    创建会议摘要（测试版本 - 模拟数据）
    """
    # 创建模拟数据库记录
    db_digest = MeetingDigest(
        public_id=str(uuid.uuid4()),
        original_transcript=request.transcript,
        summary_overview="这是一个测试会议摘要，用于验证普通生成功能。会议讨论了项目进展和后续计划。",
        key_decisions=json.dumps(["测试决策1：确定项目方向", "测试决策2：分配团队资源"], ensure_ascii=False),
        action_items=json.dumps(["测试行动项1：完成技术文档", "测试行动项2：准备下次会议"], ensure_ascii=False)
    )
    
    db.add(db_digest)
    db.commit()
    db.refresh(db_digest)
    
    return DigestCreateResponse.from_db_model(db_digest)

@router.post("/digest", response_model=DigestCreateResponse)
async def create_digest(
    request: DigestCreateRequest,
    db: Session = Depends(get_db)
):
    """
    创建会议摘要
    """
    try:
        # 调用 AI 服务生成摘要
        summary_overview, key_decisions, action_items = await gemini_service.generate_digest(
            request.transcript
        )
        
        # 创建数据库记录
        db_digest = MeetingDigest(
            public_id=str(uuid.uuid4()),
            original_transcript=request.transcript,
            summary_overview=summary_overview,
            key_decisions=json.dumps(key_decisions, ensure_ascii=False),
            action_items=json.dumps(action_items, ensure_ascii=False)
        )
        
        db.add(db_digest)
        db.commit()
        db.refresh(db_digest)
        
        return DigestCreateResponse.from_db_model(db_digest)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"摘要生成失败: {str(e)}")

@router.get("/digests", response_model=List[DigestListResponse])
async def get_digests(db: Session = Depends(get_db)):
    """
    获取所有摘要列表
    """
    digests = db.query(MeetingDigest).order_by(MeetingDigest.created_at.desc()).all()
    return [DigestListResponse.from_db_model(digest) for digest in digests]

@router.get("/digest/{digest_id}", response_model=DigestDetailResponse)
async def get_digest_detail(
    digest_id: int,
    db: Session = Depends(get_db)
):
    """
    获取摘要详情（通过内部 ID）
    """
    digest = db.query(MeetingDigest).filter(MeetingDigest.id == digest_id).first()
    if not digest:
        raise HTTPException(status_code=404, detail="摘要不存在")
    
    return DigestDetailResponse.from_db_model(digest)

@router.get("/public/{public_id}", response_model=DigestDetailResponse)
async def get_public_digest(
    public_id: str,
    db: Session = Depends(get_db)
):
    """
    通过公共 ID 获取摘要（用于分享功能）
    """
    digest = db.query(MeetingDigest).filter(MeetingDigest.public_id == public_id).first()
    if not digest:
        raise HTTPException(status_code=404, detail="分享链接无效")
    
    return DigestDetailResponse.from_db_model(digest)

@router.post("/digest/stream/test")
async def create_digest_stream_test(
    request: DigestCreateRequest,
    db: Session = Depends(get_db)
):
    """
    测试流式生成功能（模拟数据）
    """
    import asyncio
    
    async def generate_test_stream():
        # 模拟流式响应
        yield f'data: {{"status": "started", "digest_id": 999}}\n\n'
        await asyncio.sleep(0.5)
        
        yield f'data: {{"status": "generating", "chunk": "这是", "accumulated": "这是..."}}\n\n'
        await asyncio.sleep(0.3)
        
        yield f'data: {{"status": "generating", "chunk": "一个测试", "accumulated": "这是一个测试..."}}\n\n'
        await asyncio.sleep(0.3)
        
        yield f'data: {{"status": "generating", "chunk": "会议摘要", "accumulated": "这是一个测试会议摘要..."}}\n\n'
        await asyncio.sleep(0.3)
        
        # 最终结果
        final_result = {
            "id": 999,
            "public_id": "test-uuid-123",
            "summary_overview": "这是一个测试会议摘要，用于验证流式生成功能是否正常工作。",
            "key_decisions": ["测试决策1", "测试决策2"],
            "action_items": ["测试行动项1", "测试行动项2"],
            "created_at": "2025-09-18T02:10:00.000000"
        }
        
        yield f'data: {{"status": "completed", "result": {json.dumps(final_result, ensure_ascii=False)}}}\n\n'
    
    return StreamingResponse(
        generate_test_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }
    )

@router.post("/digest/stream")
async def create_digest_stream(
    request: DigestCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    流式生成会议摘要（加分功能）
    使用 Server-Sent Events (SSE) 实时返回生成过程
    """
    
    async def generate_stream():
        try:
            # 先创建数据库记录（占位）
            db_digest = MeetingDigest(
                public_id=str(uuid.uuid4()),
                original_transcript=request.transcript,
                summary_overview="生成中...",
                key_decisions=json.dumps([]),
                action_items=json.dumps([])
            )
            db.add(db_digest)
            db.commit()
            db.refresh(db_digest)
            
            # 发送初始状态
            yield f'data: {{"status": "started", "digest_id": {db_digest.id}}}\\n\\n'
            
            # 流式生成内容
            accumulated_text = ""
            try:
                async for chunk in gemini_service.generate_digest_stream(request.transcript):
                    accumulated_text += chunk
                    yield f'data: {{"status": "generating", "chunk": "{chunk.replace('"', '\\"')}", "accumulated": "{accumulated_text.replace('"', '\\"')[:500]}..."}}\\n\\n'
                
                # 解析累积的文本内容（避免重复调用API）
                try:
                    # 尝试从累积文本中提取JSON
                    if '```json' in accumulated_text:
                        json_start = accumulated_text.find('```json') + 7
                        json_end = accumulated_text.find('```', json_start)
                        json_text = accumulated_text[json_start:json_end].strip()
                    elif '{' in accumulated_text and '}' in accumulated_text:
                        json_start = accumulated_text.find('{')
                        json_end = accumulated_text.rfind('}') + 1
                        json_text = accumulated_text[json_start:json_end]
                    else:
                        raise ValueError("未找到有效的JSON格式")
                    
                    # 解析JSON
                    result = json.loads(json_text)
                    summary_overview = result.get('summary_overview', accumulated_text[:200] + '...')
                    key_decisions = result.get('key_decisions', [])
                    action_items = result.get('action_items', [])
                    
                except Exception as parse_error:
                    # 如果解析失败，使用备用方案
                    summary_overview = accumulated_text[:500] + '...' if len(accumulated_text) > 500 else accumulated_text
                    key_decisions = ["解析结果时遇到问题，请查看完整内容"]
                    action_items = ["请根据完整内容手动整理行动项"]
                
                # 更新数据库
                db_digest.summary_overview = summary_overview
                db_digest.key_decisions = json.dumps(key_decisions, ensure_ascii=False)
                db_digest.action_items = json.dumps(action_items, ensure_ascii=False)
                db.commit()
                
                # 发送完成状态
                final_result = DigestCreateResponse.from_db_model(db_digest)
                yield f'data: {{"status": "completed", "result": {json.dumps(final_result.dict(), ensure_ascii=False, default=str)}}}\\n\\n'
                
            except Exception as e:
                yield f'data: {{"status": "error", "message": "流式生成失败: {str(e)}"}}\\n\\n'
                
        except Exception as e:
            yield f'data: {{"status": "error", "message": "{str(e)}"}}\\n\\n'
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }
    )

@router.delete("/digest/{digest_id}")
async def delete_digest(
    digest_id: int,
    db: Session = Depends(get_db)
):
    """
    删除摘要（通过内部 ID）
    """
    digest = db.query(MeetingDigest).filter(MeetingDigest.id == digest_id).first()
    if not digest:
        raise HTTPException(status_code=404, detail="摘要不存在")
    
    db.delete(digest)
    db.commit()
    
    return {"message": "摘要已删除", "success": True}

@router.delete("/public/{public_id}")
async def delete_public_digest(
    public_id: str,
    db: Session = Depends(get_db)
):
    """
    通过公共 ID 删除摘要（用于分享链接的删除）
    """
    digest = db.query(MeetingDigest).filter(MeetingDigest.public_id == public_id).first()
    if not digest:
        raise HTTPException(status_code=404, detail="分享链接无效")
    
    db.delete(digest)
    db.commit()
    
    return {"message": "摘要已删除", "success": True}