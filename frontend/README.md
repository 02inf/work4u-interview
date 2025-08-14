# AI会议摘要 - 前端

这是AI会议摘要应用的前端部分，使用Vue3 + Vite构建。

## 功能特性

- 🎯 会议记录输入和AI摘要生成
- 📋 结构化摘要显示（概述、决策、行动项目）
- 📚 摘要历史记录管理
- 🔗 可分享的摘要链接
- 📱 响应式设计，支持移动端
- 🎨 现代化UI设计

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 快速构建工具
- **Vue Router** - 官方路由管理器
- **Pinia** - 状态管理库
- **Axios** - HTTP客户端
- **CSS3** - 现代化样式

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 项目结构

```
frontend/
├── src/
│   ├── components/          # 可复用组件
│   ├── views/              # 页面组件
│   │   ├── Home.vue        # 主页（输入和生成）
│   │   ├── DigestList.vue  # 摘要列表页
│   │   └── DigestDetail.vue # 摘要详情页
│   ├── stores/             # 状态管理
│   │   └── digest.js       # 摘要相关状态
│   ├── router/             # 路由配置
│   │   └── index.js        # 路由定义
│   ├── App.vue             # 根组件
│   ├── main.js             # 应用入口
│   └── style.css           # 全局样式
├── public/                 # 静态资源
├── index.html              # HTML模板
├── vite.config.js          # Vite配置
└── package.json            # 项目依赖
```

## 开发说明

### 组件设计

- **Home.vue**: 主要的会议记录输入和摘要生成页面
- **DigestList.vue**: 显示所有已生成的摘要列表
- **DigestDetail.vue**: 单个摘要的详细视图

### 状态管理

使用Pinia进行状态管理，主要管理：
- 摘要数据
- 加载状态
- 错误处理

### 路由配置

- `/` - 主页（输入和生成）
- `/digests` - 摘要列表
- `/digest/:id` - 摘要详情

### API集成

前端通过Axios与后端API通信：
- `POST /api/digests` - 创建新摘要
- `GET /api/digests` - 获取所有摘要
- `GET /api/digests/:id` - 获取单个摘要

## 样式指南

- 使用CSS变量定义主题色彩
- 响应式设计，支持移动端和桌面端
- 现代化UI组件，包含悬停效果和过渡动画
- 使用Flexbox和Grid进行布局

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 开发工具

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Vite DevTools** - 开发调试工具

## 部署

项目可以部署到任何支持静态文件的托管服务：

- Vercel
- Netlify
- GitHub Pages
- 传统Web服务器

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License
