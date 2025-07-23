# 部署指南

## 部署前准备

1. **确保数据库已创建**
   - 在 Supabase 中运行 `supabase-schema.sql`

2. **测试构建**
   ```bash
   npm run build
   ```

3. **环境变量**
   所有平台都需要配置以下环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://obcvdsywxhobpyjhkihr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_key
   GOOGLE_GEMINI_API_KEY=你的_gemini_key
   ```

## Vercel 部署（最简单）

### 方法 1：通过 GitHub
1. 推送代码到 GitHub
2. 访问 vercel.com
3. Import GitHub 仓库
4. 配置环境变量
5. Deploy

### 方法 2：使用 CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel

# 设置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GOOGLE_GEMINI_API_KEY

# 重新部署
vercel --prod
```

## 部署后测试

1. 访问部署的 URL
2. 测试创建摘要功能
3. 测试分享链接功能
4. 检查错误日志

## 常见问题

### 1. 环境变量未生效
- Vercel：需要重新部署
- 检查变量名是否正确

### 2. 数据库连接失败
- 确认 Supabase 项目是否激活
- 检查 API key 是否正确

### 3. Gemini API 错误
- 检查 API 配额
- 确认 API key 有效

## 自定义域名

在 Vercel 中：
1. Settings → Domains
2. Add Domain
3. 按照 DNS 配置说明操作