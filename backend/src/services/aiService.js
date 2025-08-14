const { GoogleGenerativeAI } = require('@google/generative-ai');

// 初始化Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// 会议摘要提示模板
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

/**
 * 生成会议摘要
 * @param {string} transcript - 会议记录文本
 * @returns {Promise<Object>} 结构化的摘要对象
 */
async function generateMeetingDigest(transcript) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API密钥未配置');
    }

    // 获取模型
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 构建完整提示
    const fullPrompt = MEETING_DIGEST_PROMPT + transcript;

    // 生成内容
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // 尝试解析JSON响应
    try {
      // 清理响应文本，提取JSON部分
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const summary = JSON.parse(jsonMatch[0]);
        
        // 验证摘要结构
        if (summary.overview && Array.isArray(summary.decisions) && Array.isArray(summary.actionItems)) {
          return summary;
        }
      }
      
      // 如果无法解析JSON，抛出错误
      throw new Error('AI响应格式无效');
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      console.error('原始响应:', text);
      
      // 返回默认格式的摘要
      return {
        overview: "AI无法解析会议记录，请检查输入格式。",
        decisions: ["需要人工审核"],
        actionItems: [
          {
            task: "重新提交会议记录",
            assignee: "用户"
          }
        ]
      };
    }
  } catch (error) {
    console.error('AI服务调用失败:', error);
    throw new Error(`AI摘要生成失败: ${error.message}`);
  }
}

/**
 * 流式生成会议摘要（用于实时显示）
 * @param {string} transcript - 会议记录文本
 * @param {Function} onChunk - 接收文本块的回调函数
 * @returns {Promise<Object>} 完整的摘要对象
 */
async function generateMeetingDigestStream(transcript, onChunk) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API密钥未配置');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const fullPrompt = MEETING_DIGEST_PROMPT + transcript;

    // 使用流式生成
    const result = await model.generateContentStream(fullPrompt);
    
    let fullText = '';
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      
      if (onChunk) {
        onChunk(chunkText);
      }
    }

    // 解析完整响应
    try {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const summary = JSON.parse(jsonMatch[0]);
        
        if (summary.overview && Array.isArray(summary.decisions) && Array.isArray(summary.actionItems)) {
          return summary;
        }
      }
      
      throw new Error('AI响应格式无效');
    } catch (parseError) {
      console.error('解析流式AI响应失败:', parseError);
      return {
        overview: "AI无法解析会议记录，请检查输入格式。",
        decisions: ["需要人工审核"],
        actionItems: [
          {
            task: "重新提交会议记录",
            assignee: "用户"
          }
        ]
      };
    }
  } catch (error) {
    console.error('流式AI服务调用失败:', error);
    throw new Error(`AI摘要生成失败: ${error.message}`);
  }
}

module.exports = {
  generateMeetingDigest,
  generateMeetingDigestStream
};
