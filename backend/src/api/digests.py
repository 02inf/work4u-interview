from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import uuid
import json
from .. import schemas
from ..database import get_db
from ..services import DigestService, convert_to_digest_response, convert_to_digest_detail, convert_to_digest_list
from ..ai_service import gemini_service

router = APIRouter(prefix="/api/v1/digests", tags=["digests"])

@router.options("/stream")
async def options_stream():
    """Handle preflight OPTIONS request for streaming endpoint."""
    return {"message": "OK"}

@router.post("/", response_model=schemas.DigestResponse, status_code=status.HTTP_201_CREATED)
async def create_digest(
    request: schemas.TranscriptRequest,
    db: Session = Depends(get_db)
):
    """Create a new meeting digest from transcript."""
    try:
        service = DigestService(db)
        digest = service.create_digest(request.transcript)
        return convert_to_digest_response(digest)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process transcript: {str(e)}"
        )

@router.post("/stream")
async def create_digest_stream(
    request: schemas.TranscriptRequest,
    db: Session = Depends(get_db)
):
    """Create a digest with streaming response."""
    import asyncio
    
    async def generate():
        try:
            # First, get the complete response
            ai_response = gemini_service.generate_digest(request.transcript)
            
            # Format the response for streaming
            formatted_response = f"""{{
    "overview": "{ai_response['overview']}",
    "key_decisions": {json.dumps(ai_response['key_decisions'])},
    "action_items": {json.dumps(ai_response['action_items'])}
}}"""
            
            # Stream word by word
            words = formatted_response.split()
            for i, word in enumerate(words):
                yield f"data: {json.dumps({'content': word + ' ', 'is_complete': False})}\n\n"
                await asyncio.sleep(0.05)  # Small delay for word-by-word effect
            
            # Save to database
            service = DigestService(db)
            digest = service.create_digest_from_parsed_response(
                request.transcript, 
                ai_response
            )
            
            yield f"data: {json.dumps({'content': '', 'is_complete': True, 'digest_id': digest.id})}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(), 
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )

@router.get("/", response_model=List[schemas.DigestListResponse])
async def get_all_digests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all meeting digests."""
    service = DigestService(db)
    digests = service.get_all_digests(skip=skip, limit=limit)
    return [convert_to_digest_list(digest) for digest in digests]

@router.get("/{digest_id}", response_model=schemas.DigestDetailResponse)
async def get_digest(digest_id: int, db: Session = Depends(get_db)):
    """Get a specific digest by ID."""
    service = DigestService(db)
    digest = service.get_digest_by_id(digest_id)
    
    if not digest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digest not found"
        )
    
    return convert_to_digest_detail(digest)

@router.get("/share/{public_id}", response_model=schemas.DigestDetailResponse)
async def get_shared_digest(public_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a shared digest by public ID."""
    service = DigestService(db)
    digest = service.get_digest_by_public_id(public_id)
    
    if not digest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared digest not found or not public"
        )
    
    return convert_to_digest_detail(digest)

@router.delete("/{digest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_digest(digest_id: int, db: Session = Depends(get_db)):
    """Delete a digest."""
    service = DigestService(db)
    success = service.delete_digest(digest_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digest not found"
        )

@router.patch("/{digest_id}/visibility", response_model=schemas.DigestDetailResponse)
async def update_digest_visibility(
    digest_id: int,
    is_public: bool,
    db: Session = Depends(get_db)
):
    """Update digest visibility for sharing."""
    service = DigestService(db)
    digest = service.update_digest_visibility(digest_id, is_public)
    
    if not digest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digest not found"
        )
    
    return convert_to_digest_detail(digest)
