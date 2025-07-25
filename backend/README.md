# AI Meeting Digest - Backend API

基于 FastAPI 构建的 AI 会议摘要后端服务，提供会议转录文本分析和摘要生成功能。

## 功能特性

- 🤖 **AI 会议摘要生成** - 智能分析会议转录文本
- 📝 **结构化输出** - 提取关键要点、行动项、决策和后续步骤
- 👥 **参与者识别** - 自动识别会议参与者
- 📚 **历史记录管理** - 存储和检索历史会议摘要
- 🔄 **RESTful API** - 完整的 CRUD 操作
- 📖 **自动文档** - Swagger/OpenAPI 文档

## 技术栈

- **FastAPI** - 现代高性能 Web 框架
- **Pydantic** - 数据验证和序列化
- **Uvicorn** - ASGI 服务器
- **Python 3.8+** - 编程语言

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量（可选）

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的 AI API 密钥
# 默认配置为 DeepSeek V3 模型
# AI_API_KEY=sk-your-actual-deepseek-api-key-here
```

**支持的AI模型**: 
- **DeepSeek V3** (默认): `deepseek-chat`
- **OpenAI GPT-4**: `gpt-4`
- **OpenAI GPT-3.5**: `gpt-3.5-turbo`

**注意**: 
- 如果不配置 `AI_API_KEY`，系统将使用模拟数据
- 配置后可使用真实的 AI 模型生成会议摘要
- 系统兼容 OpenAI SDK，支持多种AI服务提供商

### 3. 启动服务器

```bash
# 方法1: 使用启动脚本
python run.py

# 方法2: 直接运行
python src/example.py

# 方法3: 使用 uvicorn
uvicorn src.example:app --reload --host 0.0.0.0 --port 8000
```

### 4. 访问服务

- **API 服务**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

## API 端点

### 核心功能

- `POST /api/generate-summary` - 生成会议摘要
- `GET /api/meetings` - 获取所有会议摘要
- `GET /api/meetings/{id}` - 获取特定会议摘要
- `DELETE /api/meetings/{id}` - 删除会议摘要

### 系统功能

- `GET /` - API 信息
- `GET /health` - 健康检查

## 数据模型

### 输入模型

```json
{
  "transcript": "会议转录文本内容..."
}
```

### 输出模型

```json
{
  "success": true,
  "summary": {
    "id": "meeting_1_20240101_120000",
    "title": "会议摘要 - 2024年01月01日",
    "date": "2024-01-01 12:00:00",
    "participants": ["张三", "李四"],
    "key_points": ["关键要点1", "关键要点2"],
    "action_items": ["行动项1", "行动项2"],
    "decisions": ["决策1", "决策2"],
    "next_steps": ["后续步骤1", "后续步骤2"],
    "duration": "约45分钟",
    "transcript": "原始转录文本"
  }
}
```

## 开发说明

### 项目结构

```
backend/
├── src/
│   └── example.py          # 主应用文件
├── requirements.txt        # Python 依赖
├── run.py                 # 启动脚本
├── .env.example           # 环境变量示例
└── README.md              # 项目说明
```

### 环境配置

复制 `.env.example` 为 `.env` 并根据需要修改配置：

```bash
cp .env.example .env
```

### 扩展功能

当前版本使用模拟数据，未来可以扩展：

1. **真实 AI 集成** - 集成 OpenAI GPT 或其他 LLM
2. **数据库存储** - 使用 SQLite/PostgreSQL 替代内存存储
3. **用户认证** - 添加用户管理和权限控制
4. **文件上传** - 支持音频文件转录
5. **实时处理** - WebSocket 支持流式处理

## CORS 配置

默认允许来自前端开发服务器的请求：
- http://localhost:5173
- http://127.0.0.1:5173

## 错误处理

API 使用标准 HTTP 状态码：
- `200` - 成功
- `400` - 请求错误
- `404` - 资源未找到
- `500` - 服务器错误

## 许可证

本项目仅用于演示目的。