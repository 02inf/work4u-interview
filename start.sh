#!/bin/bash

echo "🚀 启动 AI Meeting Digest 项目"
echo "=================================="

# 检查依赖
echo "📋 检查环境..."

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

echo "✅ 环境检查通过"

# 启动后端
echo ""
echo "🔧 启动后端服务..."
cd backend
if [ ! -d "venv" ]; then
    echo "⚡ 创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo "🌟 启动 FastAPI 服务器 (端口 8000)..."
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 启动前端
echo ""
echo "🎨 启动前端服务..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动完成!"
echo "📱 前端地址: http://localhost:3000"
echo "🔌 后端地址: http://localhost:8000"
echo "📖 API 文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 停止所有服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait