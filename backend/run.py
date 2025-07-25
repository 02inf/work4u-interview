#!/usr/bin/env python3
"""
启动脚本 - AI Meeting Digest Backend
"""

import uvicorn
import sys
import os

# 添加src目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

if __name__ == "__main__":
    print("🚀 启动 AI Meeting Digest API 服务器...")
    print("📍 服务器地址: http://localhost:8000")
    print("📖 API 文档: http://localhost:8000/docs")
    print("🔄 自动重载已启用")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["src"]
    )