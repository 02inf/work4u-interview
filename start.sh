#!/bin/bash

echo "🚀 启动AI会议摘要应用..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js 16.0+"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"

# 启动后端
echo "🔧 启动后端服务..."
cd backend

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: 未找到.env文件，请先配置Google AI API密钥"
    echo "📝 复制env.example为.env并配置API密钥"
    cp env.example .env
    echo "🔑 请在.env文件中设置GOOGLE_AI_API_KEY"
    echo "🌐 访问 https://aistudio.google.com/app/apikey 获取API密钥"
    exit 1
fi

# 启动后端服务
echo "🚀 启动后端服务 (端口5000)..."
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 启动前端
echo "🎨 启动前端应用..."
cd ../frontend

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 启动前端服务
echo "🚀 启动前端服务 (端口3000)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 应用启动完成！"
echo ""
echo "📱 前端: http://localhost:3000"
echo "🔧 后端: http://localhost:5000"
echo "💚 健康检查: http://localhost:5000/health"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# 保持脚本运行
wait
