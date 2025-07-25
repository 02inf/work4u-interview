from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import json
import os
from datetime import datetime
import re
from dotenv import load_dotenv
from openai import OpenAI
from .database import db_manager

# 加载环境变量
load_dotenv()

app = FastAPI(title="AI Meeting Digest API", version="1.0.0")

# AI 配置 (支持 OpenAI 和 DeepSeek)
AI_API_KEY = os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY")  # 兼容旧配置
AI_MODEL = os.getenv("AI_MODEL") or os.getenv("OPENAI_MODEL", "deepseek-chat")
AI_BASE_URL = os.getenv("AI_BASE_URL") or os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")

# 初始化AI客户端 (兼容 OpenAI SDK)
client = None
if AI_API_KEY:
    client = OpenAI(
        api_key=AI_API_KEY,
        base_url=AI_BASE_URL
    )
    print(f"✅ AI模型已配置: {AI_MODEL} ({AI_BASE_URL})")
else:
    print("⚠️  警告: 未设置AI_API_KEY，将使用模拟数据")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class TranscriptRequest(BaseModel):
    transcript: str

class MeetingSummary(BaseModel):
    id: str
    title: str
    date: str
    participants: List[str]
    key_points: List[str]
    action_items: List[str]
    decisions: List[str]
    next_steps: List[str]
    duration: Optional[str] = None
    transcript: str
    public_id: Optional[str] = None

class SummaryResponse(BaseModel):
    success: bool
    summary: Optional[MeetingSummary] = None
    error: Optional[str] = None

# 数据库存储已通过 database.py 模块实现
# meetings_storage: List[MeetingSummary] = []  # 已替换为数据库存储

def extract_participants(transcript: str) -> List[str]:
    """从转录文本中提取参与者姓名"""
    # 简单的姓名提取逻辑，寻找常见的发言模式
    patterns = [
        r'([A-Z][a-z]+)\s*:',  # "John: "
        r'([A-Z][a-z]+)\s+说',  # "张三 说"
        r'([A-Z][a-z]+)\s+表示',  # "李四 表示"
    ]
    
    participants = set()
    for pattern in patterns:
        matches = re.findall(pattern, transcript)
        participants.update(matches)
    
    # 如果没有找到参与者，返回默认值
    if not participants:
        return ["参与者1", "参与者2"]
    
    return list(participants)[:5]  # 最多返回5个参与者

def generate_meeting_summary_with_ai(transcript: str) -> dict:
    """使用AI API生成会议摘要 (支持 OpenAI 和 DeepSeek)"""
    if not client:
        raise Exception("AI API未配置，请设置AI_API_KEY环境变量")
    
    prompt = f"""
请分析以下会议转录内容，并生成结构化的会议摘要。请以JSON格式返回，包含以下字段：

1. title: 会议标题（根据内容推断）
2. participants: 参与者列表（从转录中提取姓名）
3. key_points: 关键要点列表（3-5个要点）
4. decisions: 会议决策列表（如果有的话）
5. action_items: 行动项列表（具体的待办事项）
6. next_steps: 后续步骤列表
7. duration: 估算的会议时长（字符串格式，如"约30分钟"）

会议转录内容：
{transcript}

请确保返回的是有效的JSON格式，所有文本内容使用中文。
"""
    
    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": "你是一个专业的会议摘要助手，擅长从会议转录中提取关键信息并生成结构化摘要。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        # 添加调试信息
        print(f"API响应类型: {type(response)}")
        print(f"API响应: {response}")
        
        # 检查响应是否有效
        if not response or not hasattr(response, 'choices') or not response.choices:
            raise Exception("API返回了无效的响应")
        
        if not response.choices[0] or not hasattr(response.choices[0], 'message'):
            raise Exception("API响应中缺少消息内容")
            
        content = response.choices[0].message.content
        if not content:
            raise Exception("API返回了空的内容")
            
        print(f"AI返回内容: {content[:200]}...")  # 只打印前200个字符
        
        # 尝试解析JSON响应
        try:
            ai_summary = json.loads(content)
            # 处理action_items格式转换
            if 'action_items' in ai_summary and ai_summary['action_items']:
                action_items = ai_summary['action_items']
                if isinstance(action_items, list) and len(action_items) > 0:
                    # 检查是否有字典格式的元素
                    converted_items = []
                    for item in action_items:
                        if isinstance(item, dict):
                            # 处理各种可能的字典格式
                            if '负责人' in item and '任务' in item:
                                converted_items.append(f"{item['负责人']}：{item['任务']}")
                            elif 'assignee' in item and 'task' in item:
                                converted_items.append(f"{item['assignee']}：{item['task']}")
                            elif '负责人' in item:
                                # 处理只有负责人的情况，查找其他可能的任务字段
                                task_content = ""
                                for key, value in item.items():
                                    if key != '负责人' and isinstance(value, str):
                                        task_content = value
                                        break
                                if task_content:
                                    converted_items.append(f"{item['负责人']}：{task_content}")
                                else:
                                    # 如果找不到任务内容，将整个字典转为字符串
                                    converted_items.append(f"{item['负责人']}：{str(item)}")
                            else:
                                # 其他字典格式，尝试提取有意义的信息
                                dict_str = ", ".join([f"{k}: {v}" for k, v in item.items() if isinstance(v, (str, int, float))])
                                converted_items.append(dict_str if dict_str else str(item))
                        else:
                            # 非字典格式，直接转为字符串
                            converted_items.append(str(item))
                    ai_summary['action_items'] = converted_items
            return ai_summary
        except json.JSONDecodeError:
            # 如果AI返回的不是有效JSON，使用正则表达式提取信息
            return extract_summary_from_text(content)
            
    except Exception as e:
        print(f"AI调用失败: {e}")
        raise Exception(f"AI处理失败: {str(e)}")

def extract_summary_from_text(text: str) -> dict:
    """从AI文本响应中提取摘要信息（备用方案）"""
    import re
    
    # 尝试从文本中提取JSON部分
    json_match = re.search(r'```json\s*({.*?})\s*```', text, re.DOTALL)
    if json_match:
        try:
            import json
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # 如果无法提取JSON，则进行文本解析
    lines = text.split('\n')
    
    # 提取标题
    title = "AI生成的会议摘要"
    for line in lines:
        if "标题" in line or "title" in line.lower():
            title = line.split(':', 1)[-1].strip().strip('"')
            break
    
    # 提取参与者
    participants = []
    for line in lines:
        if "参与者" in line or "participants" in line.lower():
            # 尝试提取参与者信息
            participant_text = line.split(':', 1)[-1].strip()
            # 简单的姓名提取逻辑
            names = re.findall(r'["\']([^"\'\/]+)["\']', participant_text)
            if names:
                participants = names
            break
    
    if not participants:
        participants = ["参与者1", "参与者2"]
    
    # 提取关键要点
    key_points = []
    in_key_points = False
    for line in lines:
        if "关键要点" in line or "key_points" in line.lower():
            in_key_points = True
            continue
        if in_key_points and line.strip():
            if line.strip().startswith('-') or line.strip().startswith('*'):
                point = line.strip().lstrip('-*').strip().strip('"')
                if point:
                    key_points.append(point)
            elif any(keyword in line for keyword in ["决策", "行动", "后续"]):
                break
    
    if not key_points:
        key_points = ["从会议内容中提取的关键讨论要点"]
    
    # 提取决策
    decisions = []
    in_decisions = False
    for line in lines:
        if "决策" in line or "decisions" in line.lower():
            in_decisions = True
            continue
        if in_decisions and line.strip():
            if line.strip().startswith('-') or line.strip().startswith('*'):
                decision = line.strip().lstrip('-*').strip().strip('"')
                if decision:
                    decisions.append(decision)
            elif any(keyword in line for keyword in ["行动", "后续"]):
                break
    
    # 提取行动项
    action_items = []
    in_actions = False
    for line in lines:
        if "行动" in line or "action" in line.lower():
            in_actions = True
            continue
        if in_actions and line.strip():
            if line.strip().startswith('-') or line.strip().startswith('*'):
                action = line.strip().lstrip('-*').strip().strip('"')
                if action:
                    action_items.append(action)
            elif "后续" in line:
                break
    
    if not action_items:
        action_items = ["待确定具体行动项"]
    
    # 提取后续步骤
    next_steps = []
    in_next_steps = False
    for line in lines:
        if "后续" in line or "next" in line.lower():
            in_next_steps = True
            continue
        if in_next_steps and line.strip():
            if line.strip().startswith('-') or line.strip().startswith('*'):
                step = line.strip().lstrip('-*').strip().strip('"')
                if step:
                    next_steps.append(step)
    
    if not next_steps:
        next_steps = ["安排后续跟进"]
    
    # 提取时长
    duration = "约30分钟"
    for line in lines:
        if "时长" in line or "duration" in line.lower():
            duration_match = re.search(r'(\d+)', line)
            if duration_match:
                duration = f"约{duration_match.group(1)}分钟"
            break
    
    return {
        "title": title,
        "participants": participants,
        "key_points": key_points,
        "decisions": decisions,
        "action_items": action_items,
        "next_steps": next_steps,
        "duration": duration
    }

def generate_fallback_summary(transcript: str) -> dict:
    """生成备用摘要（当AI不可用时）"""
    participants = extract_participants(transcript)
    
    return {
        "title": f"会议摘要 - {datetime.now().strftime('%Y年%m月%d日')}",
        "participants": participants,
        "key_points": [
            "讨论了项目的整体进展和当前状态",
            "确认了下一阶段的主要目标和里程碑",
            "分析了当前面临的主要挑战和风险",
            "评估了团队资源分配和时间安排"
        ],
        "action_items": [
            "完成技术方案的详细设计文档",
            "安排下周的客户需求确认会议",
            "更新项目时间线和资源计划",
            "准备中期汇报材料"
        ],
        "decisions": [
            "采用敏捷开发方法进行项目管理",
            "确定使用React和FastAPI技术栈",
            "每周举行一次团队同步会议"
        ],
        "next_steps": [
            "下周一前提交初步设计方案",
            "安排技术评审会议",
            "开始第一阶段的开发工作"
        ],
        "duration": "约45分钟"
    }

async def generate_meeting_summary(transcript: str) -> MeetingSummary:
    """生成会议摘要（支持真实AI和备用方案）"""
    # 生成唯一ID
    db_stats = db_manager.get_database_stats()
    meeting_count = db_stats.get('meetings', 0)
    meeting_id = f"meeting_{meeting_count + 1}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    try:
        # 尝试使用AI生成摘要
        if client:
            ai_summary = generate_meeting_summary_with_ai(transcript)
        else:
            ai_summary = generate_fallback_summary(transcript)
        
        # 创建MeetingSummary对象
        summary = MeetingSummary(
            id=meeting_id,
            title=ai_summary.get("title", f"会议摘要 - {datetime.now().strftime('%Y年%m月%d日')}"),
            date=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            participants=ai_summary.get("participants", extract_participants(transcript)),
            key_points=ai_summary.get("key_points", []),
            action_items=ai_summary.get("action_items", []),
            decisions=ai_summary.get("decisions", []),
            next_steps=ai_summary.get("next_steps", []),
            duration=ai_summary.get("duration", "约30分钟"),
            transcript=transcript
        )
        
        return summary
        
    except Exception as e:
        print(f"AI摘要生成失败: {e}")
        # 直接抛出异常，不使用备用方案
        raise Exception(f"AI总结失败: {str(e)}")

@app.get("/")
async def root():
    return {"message": "AI Meeting Digest API", "version": "1.0.0"}

@app.post("/api/generate-summary", response_model=SummaryResponse)
async def generate_summary(request: TranscriptRequest):
    """生成会议摘要"""
    try:
        if not request.transcript or len(request.transcript.strip()) < 10:
            raise HTTPException(status_code=400, detail="转录文本太短，请提供更详细的会议内容")
        
        # 生成摘要（异步调用）
        summary = await generate_meeting_summary(request.transcript)
        
        # 保存到数据库
        meeting_dict = {
            'id': summary.id,
            'title': summary.title,
            'date': summary.date,
            'duration': summary.duration,
            'transcript': summary.transcript,
            'participants': summary.participants,
            'key_points': summary.key_points,
            'decisions': summary.decisions,
            'action_items': summary.action_items,
            'next_steps': summary.next_steps
        }
        
        if db_manager.save_meeting(meeting_dict):
            print(f"✅ 会议数据已保存到数据库: {summary.id}")
        else:
            print(f"⚠️  数据库保存失败，但摘要生成成功: {summary.id}")
        
        return SummaryResponse(success=True, summary=summary)
    
    except Exception as e:
        return SummaryResponse(success=False, error=str(e))

@app.get("/api/meetings", response_model=List[MeetingSummary])
async def get_meetings():
    """获取所有会议摘要"""
    meetings_data = db_manager.get_all_meetings()
    meetings = []
    
    for meeting_dict in meetings_data:
        meeting = MeetingSummary(
            id=meeting_dict['id'],
            title=meeting_dict['title'],
            date=meeting_dict['date'],
            participants=meeting_dict['participants'],
            key_points=meeting_dict['key_points'],
            action_items=meeting_dict['action_items'],
            decisions=meeting_dict['decisions'],
            next_steps=meeting_dict['next_steps'],
            duration=meeting_dict['duration'],
            transcript=meeting_dict['transcript'],  # 在列表中为空，节省传输
            public_id=meeting_dict.get('public_id')
        )
        meetings.append(meeting)
    
    return meetings

@app.get("/api/meetings/{meeting_id}", response_model=MeetingSummary)
async def get_meeting(meeting_id: str):
    """获取特定会议摘要"""
    meeting_dict = db_manager.get_meeting(meeting_id)
    
    if not meeting_dict:
        raise HTTPException(status_code=404, detail="会议摘要未找到")
    
    meeting = MeetingSummary(
        id=meeting_dict['id'],
        title=meeting_dict['title'],
        date=meeting_dict['date'],
        participants=meeting_dict['participants'],
        key_points=meeting_dict['key_points'],
        action_items=meeting_dict['action_items'],
        decisions=meeting_dict['decisions'],
        next_steps=meeting_dict['next_steps'],
        duration=meeting_dict['duration'],
        transcript=meeting_dict['transcript'],
        public_id=meeting_dict.get('public_id')
    )
    
    return meeting

@app.get("/api/digest/{public_id}", response_model=MeetingSummary)
async def get_shared_digest(public_id: str):
    """通过公开ID获取可分享的会议摘要"""
    meeting_dict = db_manager.get_meeting_by_public_id(public_id)
    
    if not meeting_dict:
        raise HTTPException(status_code=404, detail="分享链接无效或摘要不存在")
    
    meeting = MeetingSummary(
         id=meeting_dict['id'],
         title=meeting_dict['title'],
         date=meeting_dict['date'],
         participants=meeting_dict['participants'],
         key_points=meeting_dict['key_points'],
         action_items=meeting_dict['action_items'],
         decisions=meeting_dict['decisions'],
         next_steps=meeting_dict['next_steps'],
         duration=meeting_dict['duration'],
         transcript=meeting_dict['transcript'],
         public_id=meeting_dict.get('public_id')
     )
    
    return meeting

@app.delete("/api/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str):
    """删除会议摘要"""
    if db_manager.delete_meeting(meeting_id):
        return {"message": "会议摘要已删除"}
    
    raise HTTPException(status_code=404, detail="会议摘要未找到")

@app.get("/api/database/stats")
async def get_database_stats():
    """获取数据库统计信息"""
    stats = db_manager.get_database_stats()
    return stats

@app.get("/health")
async def health_check():
    """健康检查"""
    db_stats = db_manager.get_database_stats()
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "database": db_stats
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)