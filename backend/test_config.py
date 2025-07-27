#!/usr/bin/env python3
"""
Test script to verify that environment variables are being loaded correctly.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / "src"))

def test_config():
    print("🔧 Testing Configuration Loading...")
    print("-" * 50)
    
    try:
        from src.config import settings
        
        print(f"✅ Database URL: {settings.database_url}")
        print(f"✅ Database Host: {settings.db_host}")
        print(f"✅ Database Port: {settings.db_port}")
        print(f"✅ Database Name: {settings.db_name}")
        print(f"✅ Debug Mode: {settings.debug}")
        print(f"✅ Server Host: {settings.host}")
        print(f"✅ Server Port: {settings.port}")
        print(f"✅ Allowed Origins: {settings.allowed_origins_list}")
        
        # Check if Gemini API key is set (but don't show the actual key)
        if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
            print("✅ Gemini API Key: ***CONFIGURED***")
        else:
            print("⚠️  Gemini API Key: NOT SET (using default)")
            
        print("-" * 50)
        print("✅ Configuration loaded successfully!")
        
        # Test if .env file is being read
        import os
        if os.path.exists(".env"):
            print("✅ .env file exists and is being read")
        else:
            print("⚠️  .env file not found - using defaults")
            
        return True
        
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False

if __name__ == "__main__":
    success = test_config()
    sys.exit(0 if success else 1)
