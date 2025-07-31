# Meeting Digest - 使用指南

## 🎯 功能概览

Meeting Digest 是一个全功能的会议摘要应用，具有以下特性：

### ✅ 核心功能
- **智能摘要**：使用 Gemini AI 生成结构化的会议摘要
- **实时流式响应**：观看摘要实时生成
- **历史管理**：保存和浏览所有摘要
- **可分享链接**：为每个摘要生成唯一的公开链接
- **搜索功能**：在历史摘要中搜索关键词

### ✅ 技术特性
- **离线模式**：网络不可用时自动使用模拟响应
- **错误处理**：智能重试和用户友好的错误消息
- **实时通知**：Toast 通知系统
- **响应式设计**：支持桌面和移动设备
- **连接状态监控**：实时显示网络和API状态

## 🚀 快速开始

### 0. 初始化
参考 STEPUP.md 文档

### 1. 启动应用
```bash
cd /Users/phinome/Documents/code/meeting_digest
pnpm dev
```
应用将在 `http://localhost:3002` 运行

### 2. 使用流程

#### 创建新摘要
1. 在主页输入会议转录文本
2. 点击"生成摘要"按钮
3. 观看实时流式响应
4. 摘要自动保存到历史记录

#### 浏览历史
1. 点击"历史"标签
2. 使用搜索框查找特定摘要
3. 点击任何摘要查看详情

#### 分享摘要
1. 在摘要详情页面
2. 点击"分享链接"按钮
3. 复制生成的公开链接

## 🔧 配置说明

### 环境变量
```bash
# .env.local
GOOGLE_API_KEY=your_google_api_key_here
DATABASE_URL="file:./dev.db"
USE_MOCK_RESPONSES=true  # 离线模式开关
```

### API 端点
- `POST /api/digests/stream` - 流式摘要生成
- `GET /api/digests` - 获取所有摘要
- `GET /api/digests/[publicId]` - 获取特定摘要
- `GET /api/test-gemini` - 测试 Gemini API 连接
- `GET /api/diagnostics` - 网络诊断

## 🎨 UI 组件

### 主要组件
- **DigestInput**: 转录输入和流式显示
- **DigestHistory**: 历史摘要浏览和搜索
- **DigestDisplay**: 摘要详情和分享
- **ConnectionStatus**: 网络状态指示器

### 状态管理
- 使用 React Hooks 进行本地状态管理
- Server-Sent Events 处理实时流式数据
- Toast 系统提供即时反馈

## 🛠️ 开发功能

### 调试工具
```bash
# 测试流式 API
curl -X POST http://localhost:3002/api/digests/stream \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Test meeting content"}' \
  --no-buffer

# 运行网络诊断
curl -X GET http://localhost:3002/api/diagnostics

# 检查 Gemini API
curl -X GET http://localhost:3002/api/test-gemini
```

### 离线测试
设置 `USE_MOCK_RESPONSES=true` 即可在没有网络连接时测试所有功能。

## 📊 技术栈

- **前端**: Next.js 15, React, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: SQLite
- **AI服务**: Google Gemini (@google/genai)
- **UI库**: Radix UI, Lucide Icons
- **工具**: pnpm, Turbopack

## 🚀 生产部署

### 准备步骤
1. 设置有效的 `GOOGLE_API_KEY`
2. 将 `USE_MOCK_RESPONSES` 设为 `false`
3. 配置生产数据库（PostgreSQL等）
4. 设置适当的环境变量

### 构建命令
```bash
pnpm build
pnpm start
```

## 🔍 故障排除

### 常见问题

**网络连接问题**：
- 检查 `/api/diagnostics` 端点
- 启用 `USE_MOCK_RESPONSES=true` 进行离线测试

**API 密钥问题**：
- 访问 `/api/test-gemini` 验证配置
- 确保 API 密钥有正确的权限

**数据库问题**：
- 运行 `npx prisma db push` 重新同步
- 检查 `DATABASE_URL` 配置

## 📝 示例用法

### 典型会议转录
```
今天的团队会议讨论了以下几个主要议题：

1. Q4项目进展回顾
2. 新功能开发计划
3. 资源分配调整

主要决定：
- 批准增加2名开发人员
- 将项目截止日期延后2周
- 下周进行客户演示

行动项：
- 张三：准备技术方案文档（周五前）
- 李四：联系客户确认演示时间
- 王五：更新项目时间线
```

### 生成的摘要示例
应用会生成包含以下部分的结构化摘要：
- 关键议题讨论
- 行动项分配
- 重要决定记录
- 后续步骤规划

## 🎉 结论

Meeting Digest 是一个功能完整、技术先进的会议摘要应用。它具有强大的离线支持、智能错误处理和优秀的用户体验。无论网络条件如何，都能提供可靠的服务。
