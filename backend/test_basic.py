"""
Basic tests for the AI Meeting Digest backend.
Run with: pytest test_basic.py
"""

import pytest
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / "src"))

def test_imports():
    """Test that all modules can be imported successfully."""
    try:
        from src.main import app
        from src.config import settings
        from src.database import Base, engine
        from src.models import MeetingDigest
        from src.ai_service import gemini_service
        print("✅ All imports successful!")
        assert True
    except Exception as e:
        print(f"❌ Import error: {e}")
        assert False, f"Import failed: {e}"

def test_config_loading():
    """Test configuration loading."""
    from src.config import settings
    
    # Check that essential settings are loaded
    assert settings.database_url is not None
    assert settings.gemini_api_key is not None
    assert settings.host is not None
    assert settings.port is not None
    print("✅ Configuration loaded successfully!")

def test_database_models():
    """Test database model creation."""
    from src.models import MeetingDigest
    
    # Test model instantiation
    digest = MeetingDigest(
        original_transcript="Test transcript",
        summary_overview="Test overview",
        key_decisions='["Decision 1"]',
        action_items='["Action 1"]'
    )
    
    assert digest.original_transcript == "Test transcript"
    assert digest.summary_overview == "Test overview"
    print("✅ Database models work correctly!")

def test_ai_service_structure():
    """Test AI service structure."""
    from src.ai_service import GeminiService, gemini_service
    
    # Test service instantiation
    assert gemini_service is not None
    assert hasattr(gemini_service, 'generate_digest')
    assert hasattr(gemini_service, 'generate_digest_stream')
    print("✅ AI service structure is correct!")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
