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
from ..deps import get_database

router = APIRouter()

def get_client():
    """Get Gemini client with API key"""
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/digest", response_model=DigestResponse)
async def create_digest(request: TranscriptRequest, db: Session = Depends(get_database)):
    # Validate input
    if not request.transcript or not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")
    
    if len(request.transcript) > 50000:  # Limit transcript length
        raise HTTPException(status_code=400, detail="Transcript too long (max 50,000 characters)")
    
    try:
        # Craft the prompt for structured summary
        prompt = f"""
        Please analyze the following meeting transcript and provide a structured summary with exactly three sections:

        1. OVERVIEW: A brief, one-paragraph overview of the meeting (2-3 sentences)
        2. KEY DECISIONS: A bulleted list of the key decisions made during the meeting
        3. ACTION ITEMS: A bulleted list of action items assigned, including who they were assigned to

        Format your response as follows:
        OVERVIEW:
        [Your overview paragraph here]

        KEY DECISIONS:
        • [Decision 1]
        • [Decision 2]
        [etc.]

        ACTION ITEMS:
        • [Action item 1 - Assigned to: Person]
        • [Action item 2 - Assigned to: Person]
        [etc.]

        Meeting transcript:
        {request.transcript}
        """
        
        # Generate content using new library
        client = get_client()
        client = get_client()
        response = client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt
        )
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="AI service returned empty response")
        
        # Parse the response
        content = response.text
        
        # Parse the response with better error handling
        overview = ""
        key_decisions = []
        action_items = []
        
        current_section = ""
        for line in content.split('\n'):
            line = line.strip()
            if line.startswith('OVERVIEW:'):
                current_section = "overview"
                continue
            elif line.startswith('KEY DECISIONS:'):
                current_section = "decisions"
                continue
            elif line.startswith('ACTION ITEMS:'):
                current_section = "actions"
                continue
            
            if line and current_section == "overview":
                overview += line + " "
            elif line.startswith('•') or line.startswith('-'):
                item = line.lstrip('•-').strip()
                if current_section == "decisions":
                    key_decisions.append(item)
                elif current_section == "actions":
                    action_items.append(item)
        
        # Ensure we have at least some content
        if not overview.strip():
            overview = "Unable to generate overview from the provided transcript."
        if not key_decisions:
            key_decisions = ["No key decisions identified in the transcript."]
        if not action_items:
            action_items = ["No action items identified in the transcript."]
        
        # Create digest entry
        digest_id = str(uuid.uuid4())
        public_id = str(uuid.uuid4())
        
        # Save to database
        db_digest = Digest(
            id=digest_id,
            public_id=public_id,
            original_transcript=request.transcript,
            overview=overview.strip(),
            key_decisions=key_decisions,
            action_items=action_items,
            created_at=datetime.utcnow()
        )
        
        db.add(db_digest)
        db.commit()
        db.refresh(db_digest)
        
        return DigestResponse(
            id=db_digest.id,
            overview=db_digest.overview,
            key_decisions=db_digest.key_decisions,
            action_items=db_digest.action_items,
            created_at=db_digest.created_at,
            public_id=db_digest.public_id
        )
        
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        db.rollback()
        if "quota" in str(e).lower():
            raise HTTPException(status_code=429, detail="AI service quota exceeded. Please try again later.")
        elif "timeout" in str(e).lower():
            raise HTTPException(status_code=408, detail="Request timeout. Please try again.")
        else:
            raise HTTPException(status_code=500, detail=f"Error processing transcript: {str(e)}")

@router.get("/digests", response_model=List[DigestResponse])
async def get_digests(db: Session = Depends(get_database)):
    digests = db.query(Digest).order_by(Digest.created_at.desc()).all()
    return [DigestResponse(
        id=digest.id,
        overview=digest.overview,
        key_decisions=digest.key_decisions,
        action_items=digest.action_items,
        created_at=digest.created_at,
        public_id=digest.public_id
    ) for digest in digests]

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
        public_id=digest.public_id
    )

@router.put("/digest/{public_id}", response_model=DigestResponse)
async def update_digest(public_id: str, request: TranscriptRequest, db: Session = Depends(get_database)):
    digest = db.query(Digest).filter(Digest.public_id == public_id).first()
    if not digest:
        raise HTTPException(status_code=404, detail="Digest not found")
    
    # Update the original transcript
    digest.original_transcript = request.transcript
    
    try:
        # Re-generate digest with new transcript
        prompt = f"""
        Please analyze the following meeting transcript and provide a structured summary with exactly three sections:

        1. OVERVIEW: A brief, one-paragraph overview of the meeting (2-3 sentences)
        2. KEY DECISIONS: A bulleted list of the key decisions made during the meeting
        3. ACTION ITEMS: A bulleted list of action items assigned, including who they were assigned to

        Format your response as follows:
        OVERVIEW:
        [Your overview paragraph here]

        KEY DECISIONS:
        • [Decision 1]
        • [Decision 2]
        [etc.]

        ACTION ITEMS:
        • [Action item 1 - Assigned to: Person]
        • [Action item 2 - Assigned to: Person]
        [etc.]

        Meeting transcript:
        {request.transcript}
        """
        
        client = get_client()
        response = client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL,
            contents=prompt
        )
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="AI service returned empty response")
        
        # Parse the response
        content = response.text
        overview = ""
        key_decisions = []
        action_items = []
        
        current_section = ""
        for line in content.split('\n'):
            line = line.strip()
            if line.startswith('OVERVIEW:'):
                current_section = "overview"
                continue
            elif line.startswith('KEY DECISIONS:'):
                current_section = "decisions"
                continue
            elif line.startswith('ACTION ITEMS:'):
                current_section = "actions"
                continue
            
            if line and current_section == "overview":
                overview += line + " "
            elif line.startswith('•') or line.startswith('-'):
                item = line.lstrip('•-').strip()
                if current_section == "decisions":
                    key_decisions.append(item)
                elif current_section == "actions":
                    action_items.append(item)
        
        # Update digest fields
        digest.overview = overview.strip() or "Unable to generate overview from the provided transcript."
        digest.key_decisions = key_decisions or ["No key decisions identified in the transcript."]
        digest.action_items = action_items or ["No action items identified in the transcript."]
        
        db.commit()
        db.refresh(digest)
        
        return DigestResponse(
            id=digest.id,
            overview=digest.overview,
            key_decisions=digest.key_decisions,
            action_items=digest.action_items,
            created_at=digest.created_at,
            public_id=digest.public_id
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

@router.post("/digest/stream")
async def stream_digest(request: TranscriptRequest, db: Session = Depends(get_database)):
    async def generate_stream():
        try:
            # Craft the prompt for structured summary
            prompt = f"""
            Please analyze the following meeting transcript and provide a structured summary with exactly three sections:

            1. OVERVIEW: A brief, one-paragraph overview of the meeting (2-3 sentences)
            2. KEY DECISIONS: A bulleted list of the key decisions made during the meeting
            3. ACTION ITEMS: A bulleted list of action items assigned, including who they were assigned to

            Format your response as follows:
            OVERVIEW:
            [Your overview paragraph here]

            KEY DECISIONS:
            • [Decision 1]
            • [Decision 2]
            [etc.]

            ACTION ITEMS:
            • [Action item 1 - Assigned to: Person]
            • [Action item 2 - Assigned to: Person]
            [etc.]

            Meeting transcript:
            {request.transcript}
            """
            
            # Generate content using new library (non-streaming for now)
            response = client.models.generate_content(
                model=DEFAULT_GEMINI_MODEL,
                contents=prompt
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
                    chunk = full_content[i:i+chunk_size]
                    yield f"data: {json.dumps({'type': 'content', 'text': chunk})}\n\n"
                    await asyncio.sleep(0.1)  # Small delay for better UX
            else:
                full_content = "No response from Gemini"
            
            # Parse the complete response
            overview = ""
            key_decisions = []
            action_items = []
            
            current_section = ""
            for line in full_content.split('\n'):
                line = line.strip()
                if line.startswith('OVERVIEW:'):
                    current_section = "overview"
                    continue
                elif line.startswith('KEY DECISIONS:'):
                    current_section = "decisions"
                    continue
                elif line.startswith('ACTION ITEMS:'):
                    current_section = "actions"
                    continue
                
                if line and current_section == "overview":
                    overview += line + " "
                elif line.startswith('•') or line.startswith('-'):
                    item = line.lstrip('•-').strip()
                    if current_section == "decisions":
                        key_decisions.append(item)
                    elif current_section == "actions":
                        action_items.append(item)
            
            # Save to database
            db_digest = Digest(
                id=digest_id,
                public_id=public_id,
                original_transcript=request.transcript,
                overview=overview.strip(),
                key_decisions=key_decisions,
                action_items=action_items,
                created_at=datetime.utcnow()
            )
            
            db.add(db_digest)
            db.commit()
            
            # Send completion event with parsed data
            yield f"data: {json.dumps({'type': 'complete', 'digest': {'id': digest_id, 'overview': overview.strip(), 'key_decisions': key_decisions, 'action_items': action_items, 'public_id': public_id, 'created_at': datetime.utcnow().isoformat()}})}\n\n"
            
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
        }
    )