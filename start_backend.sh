#!/bin/bash

echo "🔧 启动完整后端服务..."
cd "$(dirname "$0")"

# 进入后端目录
cd backend

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "⚡ 创建虚拟环境..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi

# 检查是否安装了 Google Generative AI
if ! ./venv/bin/python -c "import google.generativeai" 2>/dev/null; then
    echo "📦 安装 Google Generative AI..."
    ./venv/bin/pip install google-generativeai
fi

echo "🌟 启动 FastAPI 服务器..."
echo "📱 后端地址: http://localhost:8000"
echo "📖 API 文档: http://localhost:8000/docs"
echo "🛑 按 Ctrl+C 停止服务"
echo ""

# 进入 src 目录并启动
cd src
../venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000