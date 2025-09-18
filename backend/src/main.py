from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from database import init_db
from routers import digest

# 加载环境变量
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化数据库
    await init_db()
    yield
    # 关闭时清理资源（如果需要）
    pass

# 创建 FastAPI 应用
app = FastAPI(
    title="AI Meeting Digest",
    description="智能会议摘要生成服务 - work4u 面试项目",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(digest.router, prefix="/api", tags=["digest"])

# 根路径健康检查
@app.get("/")
async def root():
    return {
        "message": "AI Meeting Digest API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "127.0.0.1"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )