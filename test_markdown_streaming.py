#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试Markdown流式传输的格式识别
验证分块传输时是否能正确处理Markdown格式
"""

import requests
import json
import time

def test_markdown_streaming():
    """测试包含复杂Markdown格式的流式传输"""
    
    # 包含各种Markdown元素的测试文本
    test_transcript = """
    今天的会议讨论了以下几个重要议题：
    
    1. 项目进展回顾
    2. 技术架构优化
    3. 下一阶段规划
    
    会议参与者包括：张三（项目经理）、李四（技术负责人）、王五（产品经理）。
    
    主要决策：
    - 采用微服务架构
    - 使用React作为前端框架
    - 数据库选择PostgreSQL
    
    行动项：
    1. 张三负责制定详细的项目计划
    2. 李四负责技术方案设计
    3. 王五负责产品需求梳理
    
    预计完成时间：2024年3月底
    """
    
    print("🚀 开始测试Markdown流式传输...")
    print(f"📝 测试文本长度: {len(test_transcript)} 字符")
    print("="*60)
    
    try:
        # 发送流式请求
        response = requests.post(
            'http://localhost:8000/api/generate-summary-stream',
            json={'transcript': test_transcript},
            stream=True,
            headers={'Accept': 'text/event-stream'}
        )
        
        if response.status_code != 200:
            print(f"❌ 请求失败，状态码: {response.status_code}")
            return
        
        print("✅ 开始接收流式响应...")
        print("📊 实时Markdown内容累积测试:")
        print("-"*60)
        
        accumulated_content = ""
        chunk_count = 0
        
        # 处理流式响应
        for line in response.iter_lines(decode_unicode=True):
            if not line or line.strip() == "":
                continue
                
            if line.startswith('event:'):
                event_type = line[6:].strip()
                continue
                
            if line.startswith('data:'):
                data = line[5:].strip()
                if not data:
                    continue
                    
                if event_type == 'text_chunk':
                    chunk_count += 1
                    accumulated_content += data
                    
                    print(f"\n📦 Chunk #{chunk_count}:")
                    print(f"   长度: {len(data)}")
                    print(f"   内容: {repr(data[:50])}{'...' if len(data) > 50 else ''}")
                    print(f"   累积长度: {len(accumulated_content)}")
                    
                    # 检查是否包含Markdown结构
                    markdown_elements = []
                    if '\n' in data:
                        markdown_elements.append('换行符')
                    if data.strip().startswith('-') or data.strip().startswith('*'):
                        markdown_elements.append('列表项')
                    if data.strip().startswith('#'):
                        markdown_elements.append('标题')
                    if '**' in data:
                        markdown_elements.append('粗体')
                    if data.strip().endswith(':'):
                        markdown_elements.append('冒号结尾')
                    
                    if markdown_elements:
                        print(f"   🎯 Markdown元素: {', '.join(markdown_elements)}")
                    
                    # 显示当前累积内容的最后100字符
                    print(f"   📄 累积内容尾部: ...{accumulated_content[-100:]}")
                    
                elif event_type == 'summary_complete':
                    print(f"\n✅ 流式传输完成!")
                    print(f"📊 总计接收 {chunk_count} 个chunks")
                    print(f"📏 最终内容长度: {len(accumulated_content)}")
                    print("\n📋 完整累积内容:")
                    print("="*60)
                    print(accumulated_content)
                    print("="*60)
                    
                    # 分析Markdown结构完整性
                    print("\n🔍 Markdown结构分析:")
                    lines = accumulated_content.split('\n')
                    list_items = [line for line in lines if line.strip().startswith('-') or line.strip().startswith('*')]
                    numbered_items = [line for line in lines if line.strip() and line.strip()[0].isdigit() and '. ' in line]
                    
                    print(f"   📝 总行数: {len(lines)}")
                    print(f"   📋 列表项: {len(list_items)}")
                    print(f"   🔢 编号项: {len(numbered_items)}")
                    
                    if list_items:
                        print("   列表项示例:")
                        for item in list_items[:3]:
                            print(f"     • {item.strip()}")
                    
                    if numbered_items:
                        print("   编号项示例:")
                        for item in numbered_items[:3]:
                            print(f"     • {item.strip()}")
                    
                    break
                    
                elif event_type == 'error':
                    print(f"❌ 错误: {data}")
                    break
        
        print("\n🎉 测试完成!")
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_markdown_streaming()