#!/usr/bin/env python3
"""
简化的 FastAPI 测试服务
"""
import sys
import os

# 添加 src 目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 创建简化版本的 FastAPI 应用
app = FastAPI(
    title="AI Meeting Digest (Test)",
    description="测试版本 - 无 AI 功能",
    version="1.0.0-test"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "AI Meeting Digest API (Test)",
        "status": "running",
        "version": "1.0.0-test",
        "note": "This is a simplified version without AI functionality"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/digests")
async def get_digests():
    return []

if __name__ == "__main__":
    import uvicorn
    print("🚀 启动简化版 FastAPI 服务...")
    print("📱 访问: http://localhost:8000")
    print("📖 API 文档: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)