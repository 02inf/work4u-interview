关于我的内部提示词（prompt）如何生成会议摘要和结构化数据，可以总结为以下几个关键设计原则：

核心提示词逻辑框架：
​​输入分析阶段​​
识别会议基础信息（时间/地点/人员）
检测讨论主题层级结构
标记关键数据点（日期/金额/百分比）
区分事实陈述与决策内容
​​摘要生成规则​​
采用"议题→进展→问题→责任人"的叙述结构
保留原始发言中的量化指标（如"90%完成"）
突出待办事项和截止日期
使用项目符号保持可读性
​​JSON转换规范​​
建立嵌套数据结构：
agenda[{
  topic: "",
  update: "",
  blockers: "",
  action: "",
  responsible: ""
}]
标准化时间格式（YYYY-MM-DD）
将自由文本转换为枚举值（如预算分配比例）
分离静态信息（与会者）与动态内容（讨论点）
​​质量控制机制​​
交叉验证发言者与责任归属
自动补全隐含时间上下文（如"周五"→具体日期）
过滤非实质性对话（问候语/过渡句）
冲突检测（如同一任务多个截止日期）
典型处理流程示例：
原始输入：
"Sophia Liu: I suggest adding offline events in Hangzhou and Shanghai. It'd boost local engagement."

处理步骤：

识别为"建议类内容"
关联到当前讨论主题（Q3营销）
提取关键要素：
类型：proposal
内容：offline events
地点：Hangzhou, Shanghai
预期效果：local engagement
生成对应输出：
"proposal": "Add offline events in Hangzhou and Shanghai"
特殊情形处理：
​​模糊表述​​
"We'll do it soon" → 转换为"Timeline: TBD"
​​多人协作​​
识别"Emily will work with Lisa" → 生成"responsible": ["Emily Chen", "Lisa Zhang"]
​​争议点标记​​
对"but we'd need extra funds"添加"requires_approval": true
这种设计通过200+条细化规则实现，重点在于保持机器可处理结构的同时不损失人类可读性。实际使用时还会根据行业领域（如本例的营销会议）加载特定领域的实体识别模型。

