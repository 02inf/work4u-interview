import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os
import sys

# Add the src directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.main import app

client = TestClient(app)

@pytest.fixture
def mock_db_manager():
    with patch('src.main.db_manager') as mock:
        yield mock

@pytest.fixture
def mock_openai_client():
    with patch('src.main.client') as mock:
        yield mock

def test_get_all_meetings(mock_db_manager):
    mock_db_manager.get_all_digests.return_value = [{'id': '1', 'title': 'Test Meeting'}]
    response = client.get("/api/meetings")
    assert response.status_code == 200
    assert response.json() == {"meetings": [{'id': '1', 'title': 'Test Meeting'}]}

def test_get_meeting_by_id(mock_db_manager):
    mock_db_manager.get_digest.return_value = {'id': '1', 'title': 'Test Meeting'}
    response = client.get("/api/meetings/1")
    assert response.status_code == 200
    assert response.json() == {'id': '1', 'title': 'Test Meeting'}

def test_get_meeting_not_found(mock_db_manager):
    mock_db_manager.get_digest.return_value = None
    response = client.get("/api/meetings/nonexistent")
    assert response.status_code == 404
    assert response.json() == {"detail": "Meeting not found"}

def test_delete_meeting(mock_db_manager):
    mock_db_manager.delete_digest.return_value = True
    response = client.delete("/api/meetings/1")
    assert response.status_code == 200
    assert response.json() == {"message": "Meeting deleted successfully"}

def test_delete_meeting_not_found(mock_db_manager):
    mock_db_manager.delete_digest.return_value = False
    response = client.delete("/api/meetings/nonexistent")
    assert response.status_code == 404
    assert response.json() == {"detail": "Meeting not found"}