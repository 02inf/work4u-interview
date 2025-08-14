# AI会议摘要 - 后端

这是AI会议摘要应用的后端API服务，使用Node.js + Express构建，集成Google Gemini AI服务。

## 功能特性

- 🤖 AI驱动的会议摘要生成
- 💾 SQLite数据库存储
- 🔄 RESTful API接口
- 🛡️ 输入验证和错误处理
- 📊 结构化摘要输出
- 🔑 唯一ID生成和分享链接支持

## 技术栈

- **Node.js** - JavaScript运行时
- **Express** - Web应用框架
- **SQLite3** - 轻量级数据库
- **Google Gemini AI** - AI摘要生成服务
- **UUID** - 唯一标识符生成
- **CORS** - 跨域资源共享

## 快速开始

### 环境要求

- Node.js 16.0+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量示例文件：
```bash
cp env.example .env
```

2. 编辑 `.env` 文件，配置Google AI API密钥：
```env
GOOGLE_AI_API_KEY=your_actual_api_key_here
PORT=5000
NODE_ENV=development
```

### 获取Google AI API密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的API密钥
3. 将密钥添加到 `.env` 文件中

### 开发模式

```bash
npm run dev
```

服务器将在 http://localhost:5000 启动

### 生产模式

```bash
npm start
```

## API接口

### 基础URL
```
http://localhost:5000/api
```

### 端点

#### 1. 创建会议摘要
- **POST** `/digests`
- **请求体**:
```json
{
  "transcript": "会议记录文本内容..."
}
```
- **响应**:
```json
{
  "id": "uuid-string",
  "transcript": "原始会议记录",
  "summary": {
    "overview": "会议概述",
    "decisions": ["决策1", "决策2"],
    "actionItems": [
      {
        "task": "任务描述",
        "assignee": "负责人"
      }
    ]
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. 获取所有摘要
- **GET** `/digests`
- **响应**: 摘要数组

#### 3. 获取单个摘要
- **GET** `/digests/:id`
- **参数**: `id` - 摘要的唯一标识符
- **响应**: 单个摘要对象

#### 4. 健康检查
- **GET** `/health`
- **响应**: 服务器状态信息

## 项目结构

```
backend/
├── src/
│   ├── routes/              # API路由
│   │   └── digest.js        # 摘要相关路由
│   ├── services/            # 业务逻辑服务
│   │   └── aiService.js     # AI服务集成
│   ├── database.js          # 数据库操作
│   └── server.js            # 服务器入口
├── data/                    # SQLite数据库文件
├── env.example              # 环境变量示例
├── package.json             # 项目依赖
└── README.md                # 项目文档
```

## 数据库设计

### 摘要表 (digests)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键，UUID格式 |
| transcript | TEXT | 原始会议记录 |
| summary | TEXT | JSON格式的摘要数据 |
| createdAt | DATETIME | 创建时间戳 |

## AI服务集成

### Google Gemini AI

- **模型**: gemini-pro
- **功能**: 会议记录分析和结构化摘要生成
- **输出格式**: JSON结构化的摘要数据
- **错误处理**: 完善的错误处理和降级方案

### 提示工程

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

## 错误处理

系统实现了完善的错误处理机制：

- **输入验证**: 检查会议记录的有效性和长度
- **AI服务错误**: 处理API调用失败和响应解析错误
- **数据库错误**: 处理数据库连接和操作错误
- **HTTP状态码**: 返回适当的HTTP状态码和错误信息

## 安全考虑

- **输入验证**: 限制输入长度和格式
- **CORS配置**: 允许跨域请求
- **错误信息**: 生产环境不暴露敏感错误信息
- **API密钥**: 通过环境变量安全存储

## 性能优化

- **数据库连接**: 按需创建和关闭数据库连接
- **异步处理**: 使用async/await处理异步操作
- **错误缓存**: 避免重复的错误处理
- **响应压缩**: 支持大文本输入

## 部署

### 环境变量

确保在生产环境中设置正确的环境变量：

```env
GOOGLE_AI_API_KEY=your_production_api_key
PORT=5000
NODE_ENV=production
```

### 进程管理

推荐使用PM2进行进程管理：

```bash
npm install -g pm2
pm2 start src/server.js --name "ai-meeting-digest"
```

### 反向代理

在生产环境中，建议使用Nginx作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 监控和日志

- **控制台日志**: 开发环境下的详细日志
- **错误追踪**: 完整的错误堆栈信息
- **性能监控**: API响应时间记录
- **健康检查**: 定期检查服务状态

## 测试

```bash
npm test
```

## 许可证

MIT License
