"""
Google Gemini AI 服务
"""
import os
import json
import google.generativeai as genai
from typing import Dict, List, Tuple
from schemas import DigestCreateResponse

class GeminiService:
    def __init__(self):
        """初始化 Gemini AI 服务"""
        self.model = None
        self._initialized = False
    
    def _ensure_initialized(self):
        """确保服务已初始化"""
        if not self._initialized:
            api_key = os.getenv('GOOGLE_API_KEY')
            if not api_key:
                raise ValueError("GOOGLE_API_KEY 环境变量未设置")
            
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self._initialized = True
    
    def create_meeting_digest_prompt(self, transcript: str) -> str:
        """创建会议摘要的 prompt"""
        return f"""
请分析以下会议转录，并生成一个结构化的摘要。请严格按照以下 JSON 格式返回结果：

{{
    "summary_overview": "会议的简要概述（1-2段话）",
    "key_decisions": ["决策1", "决策2", "决策3"],
    "action_items": ["行动项目1 - 负责人：张三", "行动项目2 - 负责人：李四"]
}}

会议转录内容：
{transcript}

请确保：
1. summary_overview 是会议的高层次总结，突出主要议题和结论
2. key_decisions 是会议中做出的具体决策，每个决策简洁明了
3. action_items 包含具体的行动项目和负责人（如果转录中有提及）
4. 返回有效的 JSON 格式，不要包含任何其他文本
5. 如果某些信息在转录中不明确，可以合理推断或标注为"待确认"
"""

    async def generate_digest(self, transcript: str) -> Tuple[str, List[str], List[str]]:
        """
        生成会议摘要
        
        Args:
            transcript: 会议转录文本
            
        Returns:
            Tuple[str, List[str], List[str]]: (概述, 关键决策列表, 行动项目列表)
        """
        try:
            self._ensure_initialized()
            prompt = self.create_meeting_digest_prompt(transcript)
            response = self.model.generate_content(prompt)
            
            # 解析 AI 响应
            response_text = response.text.strip()
            
            # 尝试从响应中提取 JSON
            if '```json' in response_text:
                # 如果响应被包装在代码块中
                json_start = response_text.find('```json') + 7
                json_end = response_text.find('```', json_start)
                json_text = response_text[json_start:json_end].strip()
            elif '{' in response_text and '}' in response_text:
                # 查找 JSON 对象
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                json_text = response_text[json_start:json_end]
            else:
                raise ValueError("AI 响应中未找到有效的 JSON 格式")
            
            # 解析 JSON
            result = json.loads(json_text)
            
            summary_overview = result.get('summary_overview', '')
            key_decisions = result.get('key_decisions', [])
            action_items = result.get('action_items', [])
            
            return summary_overview, key_decisions, action_items
            
        except json.JSONDecodeError as e:
            # JSON 解析失败时的备用处理
            print(f"JSON 解析失败: {e}")
            return await self._fallback_parsing(response.text)
        except Exception as e:
            print(f"生成摘要时出错: {e}")
            raise Exception(f"AI 摘要生成失败: {str(e)}")
    
    async def _fallback_parsing(self, response_text: str) -> Tuple[str, List[str], List[str]]:
        """
        备用解析方法：当 JSON 解析失败时使用文本解析
        """
        # 简单的文本解析逻辑
        lines = response_text.split('\n')
        summary_overview = "会议摘要生成完成，但格式解析出现问题。"
        key_decisions = ["决策信息需要手动整理"]
        action_items = ["行动项目需要手动整理"]
        
        # 尝试简单的文本提取（这里可以根据需要改进）
        for i, line in enumerate(lines):
            if '概述' in line or 'summary' in line.lower():
                if i + 1 < len(lines):
                    summary_overview = lines[i + 1].strip()
                    
        return summary_overview, key_decisions, action_items

    async def generate_digest_stream(self, transcript: str):
        """
        流式生成会议摘要（用于实时显示）
        这是加分功能的实现
        """
        try:
            self._ensure_initialized()
            prompt = self.create_meeting_digest_prompt(transcript)
            
            # 使用流式生成
            response = self.model.generate_content(
                prompt,
                stream=True
            )
            
            accumulated_text = ""
            for chunk in response:
                if chunk.text:
                    accumulated_text += chunk.text
                    yield chunk.text
                    
        except Exception as e:
            yield f"流式生成错误: {str(e)}"