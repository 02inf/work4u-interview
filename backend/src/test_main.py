import pytest
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_root():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI Meeting Digest API"}

def test_create_digest_empty_transcript():
    """Test digest creation with empty transcript"""
    response = client.post("/api/digest", json={"transcript": ""})
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_create_digest_long_transcript():
    """Test digest creation with overly long transcript"""
    long_transcript = "A" * 60000  # Exceeds 50k limit
    response = client.post("/api/digest", json={"transcript": long_transcript})
    assert response.status_code == 400
    assert "too long" in response.json()["detail"].lower()

def test_get_digests_empty():
    """Test getting digests when none exist"""
    response = client.get("/api/digests")
    assert response.status_code == 200
    assert response.json() == []

def test_get_digest_not_found():
    """Test getting a digest that doesn't exist"""
    response = client.get("/api/digest/nonexistent-id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

@pytest.mark.skipif(True, reason="Requires Gemini API key")
def test_create_digest_success():
    """Test successful digest creation (requires API key)"""
    sample_transcript = """
    Meeting started at 9:00 AM with John, Sarah, and Mike present.
    We discussed the quarterly budget and decided to increase marketing spend by 20%.
    Sarah will prepare the budget proposal by Friday.
    Mike will coordinate with the design team for the new campaign.
    Meeting ended at 10:30 AM.
    """
    
    response = client.post("/api/digest", json={"transcript": sample_transcript})
    assert response.status_code == 200
    
    data = response.json()
    assert "id" in data
    assert "overview" in data
    assert "key_decisions" in data
    assert "action_items" in data
    assert "public_id" in data
    assert isinstance(data["key_decisions"], list)
    assert isinstance(data["action_items"], list)