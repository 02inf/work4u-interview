@echo off
chcp 65001 >nul
echo 🚀 启动AI会议摘要应用...

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js 16.0+
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到npm，请先安装npm
    pause
    exit /b 1
)

echo ✅ Node.js版本: 
node --version
echo ✅ npm版本: 
npm --version

REM 启动后端
echo 🔧 启动后端服务...
cd backend

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 安装后端依赖...
    npm install
)

REM 检查环境变量文件
if not exist ".env" (
    echo ⚠️  警告: 未找到.env文件，请先配置Google AI API密钥
    echo 📝 复制env.example为.env并配置API密钥
    copy env.example .env
    echo 🔑 请在.env文件中设置GOOGLE_AI_API_KEY
    echo 🌐 访问 https://aistudio.google.com/app/apikey 获取API密钥
    pause
    exit /b 1
)

REM 启动后端服务
echo 🚀 启动后端服务 (端口5000)...
start "后端服务" cmd /k "npm run dev"

REM 等待后端启动
timeout /t 5 /nobreak >nul

REM 启动前端
echo 🎨 启动前端应用...
cd ..\frontend

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 安装前端依赖...
    npm install
)

REM 启动前端服务
echo 🚀 启动前端服务 (端口3000)...
start "前端服务" cmd /k "npm run dev"

echo.
echo 🎉 应用启动完成！
echo.
echo 📱 前端: http://localhost:3000
echo 🔧 后端: http://localhost:5000
echo 💚 健康检查: http://localhost:5000/health
echo.
echo 服务已在新的命令行窗口中启动
echo 关闭对应的命令行窗口即可停止服务
pause
