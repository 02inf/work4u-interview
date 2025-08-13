#!/usr/bin/env python3
"""
Development server script for the AI Meeting Digest backend.
"""

import uvicorn
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / "src"))

from src.config import settings

if __name__ == "__main__":
    print("🚀 Starting AI Meeting Digest API Server...")
    print(f"📍 Host: {settings.host}:{settings.port}")
    print(f"📚 Docs: http://{settings.host}:{settings.port}/docs")
    print(f"🔧 Debug mode: {settings.debug}")
    print("-" * 50)
    
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning"
    )
