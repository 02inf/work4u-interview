# AI会议摘要应用 🚀

一个基于AI的全栈Web应用，能够自动分析会议记录并生成结构化的摘要，包括会议概述、关键决策和行动项目。

## ✨ 功能特性

- 🤖 **AI驱动摘要**: 使用Google Gemini AI自动分析会议记录
- 📋 **结构化输出**: 生成包含概述、决策和行动项目的清晰摘要
- 💾 **数据持久化**: SQLite数据库存储所有摘要记录
- 🔗 **分享功能**: 生成唯一链接，方便分享摘要
- 📱 **响应式设计**: 支持桌面端和移动端
- 🎨 **现代化UI**: 美观的用户界面和流畅的用户体验

## 🏗️ 技术架构

### 前端 (Vue3)
- **框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **样式**: CSS3 + 响应式设计

### 后端 (Node.js)
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: SQLite3
- **AI服务**: Google Gemini AI API
- **身份验证**: UUID生成

## 🚀 快速开始

### 环境要求

- Node.js 16.0+
- npm 或 yarn
- Google AI API密钥

### 一键启动

#### macOS/Linux
```bash
./start.sh
```

#### Windows
```cmd
start.bat
```

### 手动启动

#### 1. 配置环境变量

```bash
# 复制环境变量文件
cp backend/env.example backend/.env

# 编辑.env文件，添加Google AI API密钥
GOOGLE_AI_API_KEY=your_actual_api_key_here
```

#### 2. 安装依赖

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

#### 3. 启动服务

```bash
# 启动后端 (端口5000)
cd backend
npm run dev

# 启动前端 (端口3000)
cd ../frontend
npm run dev
```

### 获取Google AI API密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的API密钥
3. 将密钥添加到 `backend/.env` 文件中

## 📱 使用说明

### 创建摘要

1. 访问 http://localhost:3000
2. 在文本框中粘贴会议记录
3. 点击"生成摘要"按钮
4. 等待AI分析完成
5. 查看生成的摘要结果

### 管理摘要

- **查看所有摘要**: 点击"查看所有摘要"按钮
- **查看详情**: 点击摘要卡片查看完整内容
- **分享摘要**: 使用生成的唯一链接分享摘要

## 🔧 API接口

### 基础URL
```
http://localhost:5000/api
```

### 主要端点

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/digests` | 创建新的会议摘要 |
| GET | `/digests` | 获取所有摘要列表 |
| GET | `/digests/:id` | 获取单个摘要详情 |
| GET | `/health` | 健康检查 |

### 示例请求

```bash
# 创建摘要
curl -X POST http://localhost:5000/api/digests \
  -H "Content-Type: application/json" \
  -d '{"transcript": "会议记录内容..."}'

# 获取所有摘要
curl http://localhost:5000/api/digests

# 获取单个摘要
curl http://localhost:5000/api/digests/your-uuid-here
```

## 📁 项目结构

```
work4u-interview/
├── frontend/                 # Vue3前端应用
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   ├── stores/          # 状态管理
│   │   ├── router/          # 路由配置
│   │   └── style.css        # 全局样式
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Node.js后端API
│   ├── src/
│   │   ├── routes/          # API路由
│   │   ├── services/        # 业务服务
│   │   ├── database.js      # 数据库操作
│   │   └── server.js        # 服务器入口
│   ├── data/                # SQLite数据库文件
│   ├── package.json
│   └── env.example
├── start.sh                  # Linux/macOS启动脚本
├── start.bat                 # Windows启动脚本
└── README.md                 # 项目说明
```

## 🎯 核心功能实现

### AI摘要生成

系统使用精心设计的提示模板，确保AI输出符合预期的JSON格式：

```javascript
const MEETING_DIGEST_PROMPT = `
请分析以下会议记录，并生成一个结构化的摘要。请按照以下格式返回JSON：

{
  "overview": "一段简洁的会议概述，总结会议的主要内容和目的",
  "decisions": [
    "会议中做出的关键决策1",
    "会议中做出的关键决策2"
  ],
  "actionItems": [
    {
      "task": "需要完成的任务描述",
      "assignee": "负责人姓名"
    }
  ]
}

会议记录：
`;
```

### 数据库设计

```sql
CREATE TABLE digests (
  id TEXT PRIMARY KEY,           -- UUID主键
  transcript TEXT NOT NULL,      -- 原始会议记录
  summary TEXT NOT NULL,         -- JSON格式的摘要
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP  -- 创建时间
);
```

## 🛡️ 安全特性

- **输入验证**: 限制输入长度和格式
- **CORS配置**: 安全的跨域请求处理
- **错误处理**: 生产环境不暴露敏感信息
- **API密钥**: 通过环境变量安全存储

## 🚀 部署指南

### 开发环境

```bash
# 使用启动脚本
./start.sh  # Linux/macOS
start.bat   # Windows

# 或手动启动
cd backend && npm run dev
cd frontend && npm run dev
```

### 生产环境

```bash
# 构建前端
cd frontend
npm run build

# 启动后端
cd ../backend
npm start
```

### Docker部署 (可选)

```dockerfile
# 后端Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

## 📊 性能特性

- **异步处理**: 使用async/await处理AI调用
- **数据库优化**: 按需创建和关闭数据库连接
- **错误缓存**: 避免重复的错误处理
- **响应式设计**: 支持各种设备尺寸

## 🔍 故障排除

### 常见问题

1. **API密钥错误**
   - 检查 `.env` 文件中的 `GOOGLE_AI_API_KEY`
   - 确保API密钥有效且有足够配额

2. **端口冲突**
   - 检查端口3000和5000是否被占用
   - 修改配置文件中的端口设置

3. **数据库错误**
   - 确保 `backend/data/` 目录存在
   - 检查文件权限

4. **依赖安装失败**
   - 清除npm缓存: `npm cache clean --force`
   - 删除 `node_modules` 重新安装

### 日志查看

- **后端日志**: 查看后端控制台输出
- **前端日志**: 查看浏览器开发者工具
- **数据库日志**: 检查SQLite数据库文件

## 🤖 AI辅助开发日志

### 开发阶段记录

#### 1. 环境搭建与部署
- **Docker配置**: 协助搭建Docker容器化部署环境
  - 创建后端Dockerfile配置
  - 优化容器启动脚本
  - 解决环境依赖问题

#### 2. 后端开发
- **数据库集成**: 协助实现Node.js数据库连接
  - 配置SQLite数据库连接
  - 实现CRUD操作接口
  - 优化数据库查询性能
- **API接口开发**: 完成核心Node.js接口
  - 解决前端跨域请求问题
  - 实现数据验证和错误处理
  - 优化接口响应格式

#### 3. 文档整理
- **技术文档**: 协助整理项目文档
  - 优化README文档结构
  - 统一文档格式规范
  - 完善部署和配置说明

### AI工具使用总结

| 任务类型 | 完成情况 | 主要贡献 |
|---------|---------|---------|
| 环境配置 | ✅ 完成 | Docker部署、环境变量配置 |
| 后端开发 | ✅ 完成 | 数据库连接、API接口、错误处理 |
| 前端集成 | ✅ 完成 | 跨域配置、接口调试 |
| 文档整理 | ✅ 完成 | 格式统一、内容完善 |

### 开发效率提升

- **问题解决速度**: 通过AI辅助快速定位和解决技术难题
- **代码质量**: 获得最佳实践建议，提升代码可维护性
- **学习效果**: 在开发过程中学习新技术和最佳实践
