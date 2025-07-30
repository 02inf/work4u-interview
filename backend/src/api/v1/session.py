from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session

from ...models import SessionResponse, APIResponse, ChatResponse
from ...schemas import Session as SessionModel, Chat
from ..deps import get_database

router = APIRouter()


@router.post("/session", response_model=APIResponse[SessionResponse])
async def create_session(db: Session = Depends(get_database)):
    """
    Create a new chat session
    """
    db_session = SessionModel(
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    session_data = SessionResponse(
        session_id=db_session.session_id,
        created_at=db_session.created_at,
        updated_at=db_session.updated_at
    )
    
    return APIResponse(
        message="Session created successfully",
        data=session_data
    )


@router.get("/sessions", response_model=APIResponse[List[SessionResponse]])
async def get_sessions(db: Session = Depends(get_database)):
    """
    Get all sessions
    """
    sessions = db.query(SessionModel).order_by(SessionModel.updated_at.desc()).all()
    sessions_data = [
        SessionResponse(
            session_id=session.session_id,
            created_at=session.created_at,
            updated_at=session.updated_at,
        )
        for session in sessions
    ]
    
    return APIResponse(
        message="Sessions retrieved successfully",
        data=sessions_data
    )


@router.get("/sessions/{session_id}", response_model=APIResponse[SessionResponse])
async def get_session(session_id: str, db: Session = Depends(get_database)):
    """
    Get a specific session
    """
    session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = SessionResponse(
        session_id=session.session_id,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )
    
    return APIResponse(
        message="Session retrieved successfully",
        data=session_data
    )


@router.get("/sessions/{session_id}/chats", response_model=APIResponse[List[ChatResponse]])
async def get_session_chats(session_id: str, db: Session = Depends(get_database)):
    """
    Get all chats for a specific session
    """
    # Validate session exists
    session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all chats for this session
    chats = db.query(Chat).filter(Chat.session_id == session_id).order_by(Chat.created_at.desc()).all()
    
    chats_data = [
        ChatResponse(
            id=chat.id,
            chat_id=chat.chat_id,
            session_id=chat.session_id,
            summary=chat.summary,
            original_transcript=chat.original_transcript,
            overview=chat.overview,
            key_decisions=chat.key_decisions,
            action_items=chat.action_items,
            created_at=chat.created_at,
        )
        for chat in chats
    ]
    
    return APIResponse(
        message=f"Retrieved {len(chats_data)} chats for session",
        data=chats_data
    )


@router.delete("/sessions/{session_id}", response_model=APIResponse[dict])
async def delete_session(session_id: str, db: Session = Depends(get_database)):
    
    

    """
    Delete a session and all its chats
    """
    session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Delete all chats in the session
    chat_count = db.query(Chat).filter(Chat.session_id == session_id).count()
    db.query(Chat).filter(Chat.session_id == session_id).delete()
    
    # Delete the session
    db.delete(session)
    db.commit()
    
    return APIResponse(
        message=f"Session and {chat_count} chats deleted successfully",
        data={"session_id": session_id, "deleted_chats": chat_count}
    )