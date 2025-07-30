from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List
from google import genai
from datetime import datetime
import json
import asyncio
import os
from sqlalchemy.orm import Session
from google.genai import types
from ...constants import SYSTEM_INSTRUCTION

from ...models import ChatCreateRequest, ChatResponse, APIResponse, Template, DigestStructure
from ...schemas import Session as SessionModel, Chat
from ...constants import DEFAULT_GEMINI_MODEL
from ...prompts.digest import get_digest_prompt
from ..deps import get_database

router = APIRouter()


def get_client():
    """Get Gemini client with API key"""
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def get_structured_digest(transcript: str, client):
    """
    Get structured digest data using Gemini JSON mode
    """
    try:
        prompt = get_digest_prompt(transcript)
        
        response = client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": DigestStructure,
            },
        )
        
        if response.parsed:
            digest: DigestStructure = response.parsed
            return digest.overview, digest.key_decisions, digest.action_items
        else:
            # Fallback to text parsing if JSON parsing fails
            return response.text.strip(), [], []
            
    except Exception as e:
        # Fallback to simple parsing
        return f"Error parsing structured response: {str(e)}", [], []


@router.post("/chat")
async def create_chat(
    request: ChatCreateRequest, db: Session = Depends(get_database)
):
    """
    Create a chat with streaming response
    """
    # Validate session exists
    session = db.query(SessionModel).filter(SessionModel.session_id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=500, detail="Session not found")

    async def generate_chat_stream():
        try:
            # Get prompt and generate content
            if request.template == Template.digest:
                prompt = get_digest_prompt(request.input)    
            else:
                prompt = request.input
            
            client = get_client()
            
            # For digest template, run both streaming and structured calls concurrently
            if request.template == Template.digest:
                # Start structured call in background
                structured_task = asyncio.create_task(
                    asyncio.to_thread(get_structured_digest, request.input, client)
                )
            
            # Start streaming call
            chat = client.chats.create(model=DEFAULT_GEMINI_MODEL, config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION)
            )

            response = chat.send_message_stream(prompt)

            # Collect full content while streaming
            full_content = ""
            for chunk in response:
                if chunk.text:
                    full_content += chunk.text
                    # Stream each chunk to client with render field
                    yield f"data: {json.dumps({'type': 'content', 'text': chunk.text, 'render': 'streaming'})}\n\n"
                    await asyncio.sleep(0)  # Allow other tasks to run

            if not full_content.strip():
                raise HTTPException(
                    status_code=500, detail="AI service returned empty response"
                )

            # Get structured data from concurrent task or fallback
            if request.template == Template.digest:
                try:
                    overview, key_decisions, action_items = await structured_task
                except Exception as e:
                    # Fallback to simple parsing if structured call fails
                    overview, key_decisions, action_items = full_content.strip(), [], []
            else:
                overview, key_decisions, action_items = full_content.strip(), [], []

            # Save to database
            db_chat = Chat(
                session_id=request.session_id,
                original_transcript=request.input,
                summary=full_content,
                overview=overview,
                key_decisions=key_decisions,
                action_items=action_items,
                created_at=datetime.utcnow(),
            )

            db.add(db_chat)
            db.commit()
            db.refresh(db_chat)
            
            # Update session timestamp
            session.updated_at = datetime.utcnow()
            db.commit()

            # Send completion event with structured data
            chat_data = {
                "id": db_chat.id,
                "chat_id": db_chat.chat_id,
                "session_id": db_chat.session_id,
                "overview": db_chat.overview,
                "key_decisions": db_chat.key_decisions,
                "action_items": db_chat.action_items,
                "created_at": db_chat.created_at.isoformat(),
                "render": "json"
            }
            yield f"data: {json.dumps({'type': 'complete', 'chat': chat_data})}\n\n"

        except ValueError as e:
            db.rollback()
            yield f"data: {json.dumps({'type': 'error', 'message': f'Invalid input: {str(e)}'})}\n\n"
        except Exception as e:
            db.rollback()
            error_msg = str(e)
            if "quota" in error_msg.lower():
                yield f"data: {json.dumps({'type': 'error', 'message': 'AI service quota exceeded. Please try again later.'})}\n\n"
            elif "timeout" in error_msg.lower():
                yield f"data: {json.dumps({'type': 'error', 'message': 'Request timeout. Please try again.'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Error processing transcript: {error_msg}'})}\n\n"

    return StreamingResponse(
        generate_chat_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("/chats", response_model=APIResponse[List[ChatResponse]])
async def get_chats(session_id: str = None, db: Session = Depends(get_database)):
    """
    Get all chats, optionally filtered by session_id
    """
    query = db.query(Chat)
    if session_id:
        # Validate session exists
        session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        query = query.filter(Chat.session_id == session_id)
    
    chats = query.order_by(Chat.created_at.desc()).all()
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
        message="Chats retrieved successfully",
        data=chats_data
    )


@router.delete("/chats/clear", response_model=APIResponse[dict])
async def clear_all_chats(session_id: str = None, db: Session = Depends(get_database)):
    """
    Clear all chats, optionally filtered by session_id
    """
    query = db.query(Chat)
    if session_id:
        # Validate session exists
        session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        query = query.filter(Chat.session_id == session_id)
    
    count = query.count()
    query.delete()
    db.commit()
    
    return APIResponse(
        message=f"Cleared {count} chats from database",
        data={"cleared_count": count}
    )


@router.delete("/chats/{chat_id}", response_model=APIResponse[dict])
async def delete_chat(chat_id: str, session_id: str, db: Session = Depends(get_database)):
    """
    Delete a chat (requires session_id for validation)
    """
    chat = db.query(Chat).filter(Chat.chat_id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Validate session exists and matches
    session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if chat.session_id != session_id:
        raise HTTPException(status_code=400, detail="Session ID mismatch")

    db.delete(chat)
    
    # Update session timestamp
    session.updated_at = datetime.utcnow()
    db.commit()
    
    return APIResponse(
        message="Chat deleted successfully",
        data={"chat_id": chat_id}
    )