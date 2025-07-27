from sqlalchemy.orm import Session
from typing import List, Optional
import json
import uuid
from . import models, schemas
from .ai_service import gemini_service

class DigestService:
    def __init__(self, db: Session):
        self.db = db

    def create_digest(self, transcript: str) -> models.MeetingDigest:
        """Create a new meeting digest from transcript."""
        # Generate AI summary
        ai_response = gemini_service.generate_digest(transcript)
        
        # Create database record
        db_digest = models.MeetingDigest(
            original_transcript=transcript,
            summary_overview=ai_response["overview"],
            key_decisions=json.dumps(ai_response["key_decisions"]),
            action_items=json.dumps(ai_response["action_items"]),
            full_summary=json.dumps(ai_response),
            is_public=True  # Enable sharing by default
        )
        
        self.db.add(db_digest)
        self.db.commit()
        self.db.refresh(db_digest)
        
        return db_digest

    def create_digest_from_parsed_response(self, transcript: str, ai_response: dict) -> models.MeetingDigest:
        """Create a new meeting digest from already parsed AI response."""
        # Create database record
        db_digest = models.MeetingDigest(
            original_transcript=transcript,
            summary_overview=ai_response["overview"],
            key_decisions=json.dumps(ai_response["key_decisions"]),
            action_items=json.dumps(ai_response["action_items"]),
            full_summary=json.dumps(ai_response),
            is_public=True  # Enable sharing by default
        )
        
        self.db.add(db_digest)
        self.db.commit()
        self.db.refresh(db_digest)
        
        return db_digest

    def get_all_digests(self, skip: int = 0, limit: int = 100) -> List[models.MeetingDigest]:
        """Get all meeting digests with pagination."""
        return self.db.query(models.MeetingDigest)\
                      .order_by(models.MeetingDigest.created_at.desc())\
                      .offset(skip)\
                      .limit(limit)\
                      .all()

    def get_digest_by_id(self, digest_id: int) -> Optional[models.MeetingDigest]:
        """Get a specific digest by ID."""
        return self.db.query(models.MeetingDigest)\
                      .filter(models.MeetingDigest.id == digest_id)\
                      .first()

    def get_digest_by_public_id(self, public_id: uuid.UUID) -> Optional[models.MeetingDigest]:
        """Get a specific digest by public ID (for sharing)."""
        return self.db.query(models.MeetingDigest)\
                      .filter(models.MeetingDigest.public_id == public_id)\
                      .filter(models.MeetingDigest.is_public == True)\
                      .first()

    def delete_digest(self, digest_id: int) -> bool:
        """Delete a digest by ID."""
        digest = self.get_digest_by_id(digest_id)
        if digest:
            self.db.delete(digest)
            self.db.commit()
            return True
        return False

    def update_digest_visibility(self, digest_id: int, is_public: bool) -> Optional[models.MeetingDigest]:
        """Update the visibility of a digest."""
        digest = self.get_digest_by_id(digest_id)
        if digest:
            digest.is_public = is_public
            self.db.commit()
            self.db.refresh(digest)
            return digest
        return None

def convert_to_digest_response(digest: models.MeetingDigest) -> schemas.DigestResponse:
    """Convert database model to response schema."""
    return schemas.DigestResponse(
        id=digest.id,
        public_id=digest.public_id,
        summary_overview=digest.summary_overview,
        key_decisions=json.loads(digest.key_decisions) if digest.key_decisions else [],
        action_items=json.loads(digest.action_items) if digest.action_items else [],
        created_at=digest.created_at,
        is_public=digest.is_public
    )

def convert_to_digest_detail(digest: models.MeetingDigest) -> schemas.DigestDetailResponse:
    """Convert database model to detailed response schema."""
    return schemas.DigestDetailResponse(
        id=digest.id,
        public_id=digest.public_id,
        original_transcript=digest.original_transcript,
        summary_overview=digest.summary_overview,
        key_decisions=json.loads(digest.key_decisions) if digest.key_decisions else [],
        action_items=json.loads(digest.action_items) if digest.action_items else [],
        created_at=digest.created_at,
        updated_at=digest.updated_at,
        is_public=digest.is_public
    )

def convert_to_digest_list(digest: models.MeetingDigest) -> schemas.DigestListResponse:
    """Convert database model to list response schema."""
    return schemas.DigestListResponse(
        id=digest.id,
        public_id=digest.public_id,
        summary_overview=digest.summary_overview[:200] + "..." if len(digest.summary_overview) > 200 else digest.summary_overview,
        created_at=digest.created_at,
        is_public=digest.is_public
    )
