from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List
from google import genai
from datetime import datetime
import uuid
import json
import asyncio
import os
from sqlalchemy.orm import Session

from ...models import TranscriptRequest, DigestResponse
from ...schemas import Digest
from ...constants import DEFAULT_GEMINI_MODEL
from ...prompts.digest import get_digest_prompt
from ..deps import get_database

router = APIRouter()


def get_client():
    """Get Gemini client with API key"""
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


@router.post("/digest")
async def create_digest(
    request: TranscriptRequest, db: Session = Depends(get_database)
):
    """
    Create a digest from transcript with streaming response
    """

    async def generate_digest_stream():
        try:
            digest_id = str(uuid.uuid4())
            public_id = str(uuid.uuid4())

            # Get prompt and generate streaming content
            prompt = get_digest_prompt(request.transcript)
            client = get_client()

            response = client.models.generate_content_stream(
                model=DEFAULT_GEMINI_MODEL, contents=prompt
            )

            # Collect full content while streaming
            full_content = ""
            for chunk in response:
                if chunk.text:
                    full_content += chunk.text
                    # Stream each chunk to client
                    yield f"data: {json.dumps({'type': 'content', 'text': chunk.text})}\n\n"
                    await asyncio.sleep(0)  # Allow other tasks to run

            if not full_content.strip():
                raise HTTPException(
                    status_code=500, detail="AI service returned empty response"
                )

            # Save to database
            db_digest = Digest(
                id=digest_id,
                public_id=public_id,
                original_transcript=request.transcript,
                summary=full_content,
                created_at=datetime.utcnow(),
            )

            db.add(db_digest)
            db.commit()
            db.refresh(db_digest)

            # Send completion event with parsed data
            digest_data = {
                "id": db_digest.id,
                "overview": db_digest.overview,
                "key_decisions": db_digest.key_decisions,
                "action_items": db_digest.action_items,
                "public_id": db_digest.public_id,
                "created_at": db_digest.created_at.isoformat(),
            }
            yield f"data: {json.dumps({'type': 'complete', 'digest': digest_data})}\n\n"

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
        generate_digest_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("/digests", response_model=List[DigestResponse])
async def get_digests(db: Session = Depends(get_database)):
    digests = db.query(Digest).order_by(Digest.created_at.desc()).all()
    return [
        DigestResponse(
            id=digest.id,
            overview=digest.overview,
            key_decisions=digest.key_decisions,
            action_items=digest.action_items,
            created_at=digest.created_at,
            public_id=digest.public_id,
        )
        for digest in digests
    ]


@router.get("/digest/{public_id}", response_model=DigestResponse)
async def get_digest_by_public_id(public_id: str, db: Session = Depends(get_database)):
    digest = db.query(Digest).filter(Digest.public_id == public_id).first()
    if not digest:
        raise HTTPException(status_code=404, detail="Digest not found")

    return DigestResponse(
        id=digest.id,
        overview=digest.overview,
        key_decisions=digest.key_decisions,
        action_items=digest.action_items,
        created_at=digest.created_at,
        public_id=digest.public_id,
    )


@router.put("/digest/{public_id}", response_model=DigestResponse)
async def update_digest(
    public_id: str, request: TranscriptRequest, db: Session = Depends(get_database)
):
    digest = db.query(Digest).filter(Digest.public_id == public_id).first()
    if not digest:
        raise HTTPException(status_code=404, detail="Digest not found")

    # Update the original transcript
    digest.original_transcript = request.transcript

    try:
        # Re-generate digest with new transcript
        prompt = get_digest_prompt(request.transcript)

        client = get_client()
        response = client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL, contents=prompt
        )

        if not response or not response.text:
            raise HTTPException(
                status_code=500, detail="AI service returned empty response"
            )

        # Parse the response using helper function
        overview, key_decisions, action_items = parse_digest_response(response.text)

        # Update digest fields
        digest.overview = overview
        digest.key_decisions = key_decisions
        digest.action_items = action_items

        db.commit()
        db.refresh(digest)

        return DigestResponse(
            id=digest.id,
            overview=digest.overview,
            key_decisions=digest.key_decisions,
            action_items=digest.action_items,
            created_at=digest.created_at,
            public_id=digest.public_id,
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating digest: {str(e)}")


@router.delete("/digest/{public_id}")
async def delete_digest(public_id: str, db: Session = Depends(get_database)):
    digest = db.query(Digest).filter(Digest.public_id == public_id).first()
    if not digest:
        raise HTTPException(status_code=404, detail="Digest not found")

    db.delete(digest)
    db.commit()
    return {"message": "Digest deleted successfully", "public_id": public_id}


@router.get("/digests/count")
async def get_digests_count(db: Session = Depends(get_database)):
    count = db.query(Digest).count()
    return {"count": count}


@router.delete("/digests/clear")
async def clear_all_digests(db: Session = Depends(get_database)):
    count = db.query(Digest).count()
    db.query(Digest).delete()
    db.commit()
    return {"message": f"Cleared {count} digests from database"}

    async def generate_stream():
        try:
            # Get prompt for structured summary
            prompt = get_digest_prompt(request.transcript)

            # Generate content using new library (non-streaming for now)
            client = get_client()
            response = client.models.generate_content(
                model=DEFAULT_GEMINI_MODEL, contents=prompt
            )

            digest_id = str(uuid.uuid4())
            public_id = str(uuid.uuid4())

            # Send initial event with IDs
            yield f"data: {json.dumps({'type': 'start', 'digest_id': digest_id, 'public_id': public_id})}\n\n"

            # Simulate streaming by sending the full content
            if response and response.text:
                full_content = response.text
                # Send content in chunks to simulate streaming
                chunk_size = 50
                for i in range(0, len(full_content), chunk_size):
                    chunk = full_content[i : i + chunk_size]
                    yield f"data: {json.dumps({'type': 'content', 'text': chunk})}\n\n"
                    await asyncio.sleep(0.1)  # Small delay for better UX
            else:
                full_content = "No response from Gemini"

            # Parse the complete response using helper function
            overview, key_decisions, action_items = parse_digest_response(full_content)

            # Save to database
            db_digest = Digest(
                id=digest_id,
                public_id=public_id,
                original_transcript=request.transcript,
                overview=overview,
                key_decisions=key_decisions,
                action_items=action_items,
                created_at=datetime.utcnow(),
            )

            db.add(db_digest)
            db.commit()

            # Send completion event with parsed data
            yield f"data: {json.dumps({'type': 'complete', 'digest': {'id': digest_id, 'overview': overview, 'key_decisions': key_decisions, 'action_items': action_items, 'public_id': public_id, 'created_at': datetime.utcnow().isoformat()}})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )
