# Meeting Digest - Test Examples

## 📝 Sample Meeting Transcripts for Testing

### 1. 产品规划会议 (Product Planning Meeting)
```
会议时间：2024年12月15日 10:00-11:30
参会人员：产品经理张三、技术负责人李四、设计师王五、运营负责人赵六

张三：大家好，今天主要讨论下一季度的产品规划。首先看一下用户反馈数据，主要集中在三个方面：界面优化、功能增强和性能提升。

李四：从技术角度来看，性能提升确实是当务之急。目前APP启动时间平均在3.5秒，用户体验不够理想。我建议优先解决这个问题。

王五：界面优化方面，我们收到很多关于导航不够直观的反馈。我准备了一套新的设计方案，预计可以提升20%的用户操作效率。

赵六：从运营数据来看，用户留存率在界面改版后确实有所提升。建议将界面优化和性能提升并行进行。

张三：好的，那我们确定下一季度的三个重点：1）APP性能优化，目标是将启动时间缩短到2秒以内；2）界面重设计，提升用户体验；3）新增两个核心功能模块。时间节点设定为3月底完成。

李四：技术方面没问题，我会制定详细的开发计划。

会议结论：确定Q1产品规划，各部门按计划推进。
```

### 2. Team Standup Meeting (English)
```
Meeting Date: December 15, 2024, 9:00 AM - 9:30 AM
Attendees: Sarah (PM), John (Frontend), Mike (Backend), Lisa (QA)

Sarah: Good morning everyone. Let's start our daily standup. John, what did you work on yesterday?

John: Yesterday I completed the user authentication component and started working on the dashboard layout. Today I'll focus on integrating the API endpoints that Mike provided.

Mike: I finished the user management APIs and deployed them to the staging environment. I'm currently working on the notification service. Should be ready for testing by end of day.

Lisa: I completed testing the login flow and found two minor bugs - one related to password validation and another with error messages. I've logged them in Jira. Today I'll start testing the dashboard components once John's integration is ready.

Sarah: Great progress everyone. Any blockers or concerns?

John: I need clarification on the notification icon placement in the header.

Sarah: Let's discuss that after the standup. Mike, any issues with the notification service?

Mike: No major issues, just need to coordinate with the frontend team for the WebSocket integration.

Sarah: Perfect. Let's plan to have a quick sync at 2 PM to align on the notification feature. Meeting adjourned.
```

### 3. 客户需求讨论会议 (Client Requirements Meeting)
```
会议时间：2024年12月15日 14:00-15:30
参会人员：客户代表陈总、项目经理林经理、技术顾问周工程师

陈总：我们希望这个系统能够处理每天大约10万条订单数据，并且能够生成实时的销售报表。

林经理：了解了，10万条订单数据的处理量确实不小。周工程师，从技术角度来看有什么建议？

周工程师：建议采用分布式架构，使用消息队列来处理大量订单数据。实时报表可以通过数据仓库和BI工具来实现。

陈总：时间要求比较紧，希望能在两个月内上线核心功能。

林经理：两个月的时间确实比较紧张，我建议分阶段交付。第一阶段先实现基础的订单处理功能，第二阶段再完善报表系统。

周工程师：同意分阶段方案。第一阶段我们可以先搭建基础架构和核心业务逻辑，预计需要6周时间。

陈总：那就按这个方案执行，请林经理尽快提供详细的项目计划。

会议结论：确定分阶段交付方案，第一阶段6周完成核心功能。
```

### 4. Budget Review Meeting
```
Meeting: Q4 Budget Review
Date: December 15, 2024, 3:00 PM - 4:00 PM
Attendees: CFO David, Marketing Director Emma, Engineering Manager Tom, HR Director Janet

David: Let's review our Q4 budget performance. Overall, we're 5% under budget, which is good news.

Emma: Marketing spent 92% of allocated budget. Our digital campaigns performed well, with ROI exceeding targets by 15%. I'd like to request additional budget for Q1 to capitalize on this momentum.

Tom: Engineering came in 8% under budget due to delayed hiring. We have three open positions that should be filled by February. This might impact our Q1 development timeline.

Janet: HR is slightly over budget due to unexpected recruiting costs, but within acceptable variance. The delayed hiring Tom mentioned is partly due to a competitive job market.

David: Emma, what's your additional budget request for Q1?

Emma: I'm requesting a 20% increase to expand our successful digital campaigns and explore new channels.

David: Given our under-spend in engineering, we can accommodate a 15% increase for marketing. Tom, any concerns about the hiring timeline?

Tom: 15% marketing increase sounds reasonable. For hiring, I suggest partnering with specialized recruiters to speed up the process.

Janet: I can arrange meetings with preferred recruiting partners next week.

David: Excellent. Let's approve the 15% marketing budget increase and prioritize engineering hiring in Q1.
```

### 5. 技术架构设计会议 (Technical Architecture Meeting)
```
会议时间：2024年12月15日 16:00-17:30
参会人员：架构师吴老师、后端负责人孙工、前端负责人钱工、DevOps工程师郑工

吴老师：今天讨论新项目的技术架构选型。根据业务需求，我们需要支持高并发、微服务架构，并且要考虑后期的扩展性。

孙工：后端建议使用Spring Cloud微服务框架，配合Redis做缓存，MySQL作为主数据库。消息队列可以选择RabbitMQ或者Kafka。

钱工：前端建议使用React + TypeScript，状态管理用Redux Toolkit，UI库选择Ant Design。考虑到SEO需求，建议使用Next.js框架。

郑工：部署方面建议使用Docker容器化，Kubernetes做编排。CI/CD流水线用Jenkins，监控用Prometheus + Grafana。

吴老师：技术栈选择都比较合理。需要注意几个点：1）数据库设计要考虑分库分表；2）缓存策略要设计好；3）接口要做好版本管理。

孙工：数据库方面我会设计分片策略，按用户ID进行水平分割。

钱工：前端会做好组件封装和代码分割，确保首屏加载性能。

郑工：我会搭建完整的监控体系，包括应用监控、基础设施监控和业务监控。

吴老师：很好，请各位在下周提交详细的技术方案文档。

会议结论：确定技术栈和架构方案，下周提交详细设计文档。
```

## 🧪 Testing Scenarios

### 1. Basic Functionality Test
1. **输入测试**: 复制上面任意一个会议记录到文本框
2. **生成摘要**: 点击"生成摘要"按钮
3. **查看结果**: 检查生成的结构化摘要是否包含关键信息

### 2. Real-time Streaming Test
1. **启用流式响应**: 勾选"启用实时流式响应"选项
2. **输入长文本**: 使用较长的会议记录（如示例3或5）
3. **观察实时生成**: 查看AI摘要是否实时逐字生成

### 3. Search Functionality Test
1. **生成多个摘要**: 使用不同的示例文本生成3-5个摘要
2. **测试搜索**: 在历史记录中搜索关键词如"产品"、"技术"、"budget"
3. **验证过滤**: 确保搜索结果正确过滤显示

### 4. Toast Notifications Test
1. **成功通知**: 生成摘要成功时查看绿色成功通知
2. **错误通知**: 输入空内容或无效API密钥时查看错误通知
3. **复制通知**: 点击复制按钮时查看复制成功通知

### 5. Public Sharing Test
1. **生成分享链接**: 点击摘要卡片的"分享"按钮
2. **复制链接**: 复制生成的公开链接
3. **无痕浏览**: 在新的无痕窗口中打开链接，验证公开访问

### 6. Error Handling Test
1. **网络错误**: 断开网络连接后尝试生成摘要
2. **无效输入**: 输入空白内容或特殊字符
3. **API限制**: 使用无效的API密钥测试错误处理

## 📊 Expected Results

### 摘要结构应包含：
- **会议基本信息**: 时间、参与人员
- **关键讨论点**: 主要议题和讨论内容
- **决策事项**: 会议达成的决定
- **行动项**: 后续需要执行的任务
- **时间节点**: 重要的截止日期

### 功能验证清单：
- ✅ 文本输入和处理
- ✅ AI摘要生成（普通模式）
- ✅ 实时流式响应
- ✅ 历史记录保存
- ✅ 搜索和过滤
- ✅ 公开链接分享
- ✅ Toast通知反馈
- ✅ 错误处理和用户提示
- ✅ 响应式界面设计

## 🔧 Performance Test

### 建议测试数据量：
- **短文本**: 200-500字的简短会议记录
- **中等文本**: 800-1500字的标准会议记录
- **长文本**: 2000-4000字的详细会议记录

### 性能指标：
- **响应时间**: 普通模式应在10-30秒内完成
- **流式响应**: 应该在2-3秒内开始显示内容
- **搜索速度**: 搜索结果应实时显示
- **页面加载**: 首页应在3秒内完全加载
