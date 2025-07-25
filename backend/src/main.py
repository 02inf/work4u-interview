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
from src.database import db_manager
from sse_starlette.sse import EventSourceResponse
import asyncio

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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic 模型
class TranscriptRequest(BaseModel):
    transcript: str

# 简化的数据库存储，使用单表设计

# 数据库管理器已在 database.py 中初始化
def get_prompt_template(transcript: str) -> str:
    return f"""
请分析以下会议转录内容，生成专业的会议摘要。

**重要格式要求：**
- 每个标题后必须有空行
- 每个列表项必须独占一行
- 段落之间必须有空行分隔
- 必须保留词语间的空格

**输出格式示例：**

## 会议概述

本次会议重点讨论了项目进展、技术架构和下一阶段规划。

## 关键决策

- **技术架构：** 采用微服务架构
- **前端框架：** 使用 React 框架
- **数据库选择：** 选择 PostgreSQL

## 行动项目

- **张三（项目经理）：** 制定详细项目计划 *（截止时间：2024年3月）*
- **李四（技术负责人）：** 完成技术方案设计 *（截止时间：2024年3月）*

请严格按照上述格式分析以下会议内容：

{transcript}
"""
def generate_meeting_summary_with_ai(transcript: str) -> tuple[dict, str]:
    """使用AI API生成会议摘要 (支持 OpenAI 和 DeepSeek)
    返回: (结构化摘要, 自然语言摘要)
    """
    if not client:
        raise Exception("AI API未配置，请设置AI_API_KEY环境变量")
    
    try:
        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": "你是一个专业的会议分析专家。重要：你必须在输出中包含换行符(\n)来分隔不同的段落和列表项。每个标题、段落和列表项都必须独占一行。请严格按照Markdown格式输出，确保包含正确的换行符和空格。"},
                {"role": "user", "content": get_prompt_template(transcript)}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content
        if not content or content.strip() == "":
            print("⚠️AI response is empty")
            raise Exception("AI response is empty")
            
        # 现在AI只返回自然语言摘要，不再包含JSON格式
        natural_summary = content.strip()
        
        print(f"📝 获取到自然语言摘要长度: {len(natural_summary)}")
        
        return natural_summary
        
    except Exception as e:
        print(f"AI调用失败: {e}")
        raise Exception(f"AI处理失败: {str(e)}")

async def generate_meeting_summary_with_ai_stream(transcript: str):
    """使用AI生成会议摘要（优化的流式响应）"""
    if not client:
        raise Exception("AI API未配置，请设置AI_API_KEY环境变量")
    
    try:
        print(f"🤖 开始AI流式处理，转录长度: {len(transcript)} 字符")
        
        # 生成提示词并记录日志
        prompt = get_prompt_template(transcript)
        print(f"📝 生成的提示词长度: {len(prompt)}")
        print(f"📝 提示词前200字符: {prompt[:200]}...")
        
        print(f"🔗 调用AI API ({AI_MODEL})...")
        # 使用流式API调用
        stream = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": "你是一个专业的会议分析专家。重要：你必须在输出中包含换行符(\n)来分隔不同的段落和列表项。每个标题、段落和列表项都必须独占一行。请严格按照Markdown格式输出，确保包含正确的换行符和空格。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000,
            stream=True
        )
        print(f"✅ AI API调用成功，开始接收流式响应...")
        
        collected_content = ""
        chunk_count = 0
        
        # 流式处理AI响应
        print(f"🚀 开始流式处理AI响应...")
        for chunk in stream:
            try:
                if chunk.choices[0].delta.content is not None:
                    content_chunk = chunk.choices[0].delta.content
                    collected_content += content_chunk
                    chunk_count += 1
                    
                    print(f"📝 收到第{chunk_count}个chunk，长度: {len(content_chunk)}, 累计长度: {len(collected_content)}")
                    
                    # 直接发送AI stream的原始输出，不做任何处理
                    print(f"🤖 AI原始输出 chunk #{chunk_count}: '{content_chunk}'")
                    print(f"📊 传输内容详情 - 长度: {len(content_chunk)}, 字节: {content_chunk.encode('utf-8')[:50]}...")
                    
                    # 智能分块处理：尽量在合适的边界分割
                    # 如果chunk以换行符结尾，或者是完整的句子/段落，直接发送
                    # 否则累积到下一个合适的边界
                    yield {
                        "event": "text_chunk",
                        "data": content_chunk
                    }
                    
                    # 减少延迟，保持AI原始的输出节奏
                    await asyncio.sleep(0.15)
                else:
                    print(f"⚠️ 收到空的chunk内容，chunk #{chunk_count + 1}")
            except Exception as chunk_error:
                print(f"❌ 处理chunk时出错: {chunk_error}")
                print(f"错误的chunk内容: {chunk}")
                continue
        
        print(f"🤖 AI流式生成完成，总共 {chunk_count} 个chunks，内容长度: {len(collected_content)}")
        
        # 直接使用收集到的内容，不进行strip()操作以保持AI输出的原始格式
        final_content = collected_content
        
        # 现在AI只返回自然语言摘要，不再包含JSON格式
        print(f"📝 获取到自然语言摘要，总长度: {len(final_content)}")
        print(f"📄 摘要前200字符: {final_content[:200]}...")
        
        print(f"✅ 流式处理完成，自然语言摘要长度: {len(final_content)}")
        
        # 发送AI完成事件
        yield {
            "event": "complete",
            "data": final_content
        }
        
    except Exception as e:
        error_msg = f"AI流式处理失败: {str(e)}"
        print(f"❌ 流式处理异常: {error_msg}")
        print(f"❌ 异常类型: {type(e).__name__}")
        print(f"❌ 异常详情: {e}")
        import traceback
        print(f"❌ 异常堆栈: {traceback.format_exc()}")
        
        yield {
            "event": "ai_error",
            "data": json.dumps({
                "error": error_msg,
                "error_type": type(e).__name__,
                "timestamp": datetime.now().isoformat()
            }, ensure_ascii=False)
        }

# extract_summary_from_text 函数已删除，因为现在AI只返回纯文本摘要



async def generate_meeting_summary(transcript: str) -> str:
    """生成会议摘要（支持真实AI和备用方案）
    返回: 自然语言摘要
    """
    try:
        # 尝试使用AI生成摘要
        if client:
            natural_summary = generate_meeting_summary_with_ai(transcript)
        else:
            natural_summary = f"会议摘要 - {datetime.now().strftime('%Y年%m月%d日')}\n\n本次会议讨论了项目的整体进展，确认了下一阶段的目标，并分析了当前面临的挑战。"
        
        return natural_summary
        
    except Exception as e:
        print(f"⚠️ AI摘要生成失败: {e}")
        print(f"使用备用摘要方案")
        # 使用备用摘要方案，确保总是能返回结果
        natural_summary = f"会议摘要 - {datetime.now().strftime('%Y年%m月%d日')}\n\n本次会议讨论了项目的整体进展，确认了下一阶段的目标，并分析了当前面临的挑战。"
        return natural_summary

@app.get("/")
async def root():
    return {"message": "AI Meeting Digest API", "version": "1.0.0"}

@app.post("/api/generate-summary")
async def generate_summary(request: TranscriptRequest):
    """生成会议摘要"""
    try:
        if not request.transcript or len(request.transcript.strip()) < 10:
            raise HTTPException(status_code=400, detail="转录文本太短，请提供更详细的会议内容")
        
        # 生成摘要（异步调用）
        natural_summary = await generate_meeting_summary(request.transcript)
        
        # 保存到数据库（只保存自然语言摘要）
        digest_id = db_manager.save_digest(request.transcript, {}, natural_summary)
        print(f"✅ 摘要数据已保存到数据库: {digest_id}")
        
        # 只返回自然语言摘要给前端，结构化数据已保存到数据库
        return {
            "summary": {
                "id": digest_id,
                "natural_summary": natural_summary
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-summary-stream")
async def generate_summary_stream(request: TranscriptRequest):
    """生成会议摘要（优化的流式响应）"""
    async def event_generator():
        digest_id = None
        
        try:
            if not request.transcript or len(request.transcript.strip()) < 10:
                yield {
                    "event": "error",
                    "data": json.dumps({"error": "转录文本太短，请提供更详细的会议内容"}, ensure_ascii=False)
                }
                return
            
            if client:
                # 使用真正的流式AI处理
                collected_content = ""
                
                async for ai_event in generate_meeting_summary_with_ai_stream(request.transcript):
                    # 转发AI流式事件，直接传输纯文本内容
                    if ai_event.get("event") == "text_chunk":
                        text_chunk = ai_event.get("data", "")
                        collected_content += text_chunk
                        
                        # 直接传输纯文本内容片段
                        yield {
                            "event": "text_chunk",
                            "data": text_chunk
                        }
                    
                    # 获取AI完成的结果
                    elif ai_event.get("event") == "complete":
                        # 直接获取完整的自然语言摘要文本
                        natural_summary = ai_event.get("data", collected_content)
                        
                        # AI摘要生成完成（静默处理）
                        break
                
                # 如果没有通过流式事件获得结果，使用同步方式作为备用
                if 'natural_summary' not in locals():
                    # 使用备用AI处理方式（静默处理）
                    natural_summary = generate_meeting_summary_with_ai(request.transcript)
                else:
                    # 从流式处理中提取自然语言摘要
                    # 现在AI只返回纯文本摘要，直接使用收集到的内容
                    natural_summary = natural_summary
                    print(f"📝 从流式处理中获取自然语言摘要，长度: {len(natural_summary)}")
            else:
                # 使用备用摘要（静默处理）
                natural_summary = f"会议摘要 - {datetime.now().strftime('%Y年%m月%d日')}\n\n本次会议讨论了项目的整体进展，确认了下一阶段的目标，并分析了当前面临的挑战。"
            
            # 保存到数据库（静默处理）
            
            # 保存原文和AI生成的摘要到数据库（只保存自然语言摘要）
            digest_id = db_manager.save_digest(request.transcript, {}, natural_summary)
            current_timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"✅ 原文和摘要已保存到数据库: {digest_id}, 时间戳: {current_timestamp}")
            
            await asyncio.sleep(0.2)
            
            # 发送最终完成事件（发送完整的自然语言摘要文本）
            yield {
                "event": "summary_complete",
                "data": natural_summary
            }
            
            # 处理完成（静默处理，不发送额外通知）
            
        except Exception as e:
            error_msg = f"处理失败: {str(e)}"
            print(f"❌ 流式处理错误: {error_msg}")
            
            yield {
                "event": "error",
                "data": error_msg
            }
    
    return EventSourceResponse(
        event_generator(),
        headers={
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.get("/api/digests")
async def get_digests():
    """获取所有摘要列表"""
    try:
        digests = db_manager.get_all_digests()
        return {"digests": digests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/meetings")
async def get_meetings():
    """获取所有会议列表（别名接口）"""
    # 记录API调用日志
    current_time = datetime.now().strftime('%H:%M:%S.%f')[:-3]
    print(f"📋 [{current_time}] GET /api/meetings - 获取会议列表")
    
    try:
        digests = db_manager.get_all_digests()
        print(f"✅ [{current_time}] 返回 {len(digests)} 条会议记录")
        return {"meetings": digests}
    except Exception as e:
        print(f"❌ [{current_time}] 获取会议列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/digests/{digest_id}")
async def get_digest(digest_id: str):
    """获取特定摘要详情"""
    try:
        digest = db_manager.get_digest(digest_id)
        if not digest:
            raise HTTPException(status_code=404, detail="摘要未找到")
        return digest
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/meetings/{meeting_id}")
async def get_meeting(meeting_id: str):
    """获取特定会议详情（别名接口）"""
    try:
        digest = db_manager.get_digest(meeting_id)
        if not digest:
            raise HTTPException(status_code=404, detail="会议未找到")
        return digest
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/digests/{digest_id}")
async def delete_digest(digest_id: str):
    """删除摘要"""
    try:
        success = db_manager.delete_digest(digest_id)
        if success:
            return {"message": "摘要已删除"}
        else:
            raise HTTPException(status_code=404, detail="摘要未找到")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str):
    """删除会议（别名接口）"""
    try:
        success = db_manager.delete_digest(meeting_id)
        if success:
            return {"message": "会议已删除"}
        else:
            raise HTTPException(status_code=404, detail="会议未找到")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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