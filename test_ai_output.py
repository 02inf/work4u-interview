import requests
import json

def test_ai_stream():
    url = "http://localhost:8000/api/generate-summary-stream"
    
    # 测试数据
    test_transcript = """
    会议开始时间：2024年1月15日 上午10:00
    参会人员：张三、李四、王五
    
    张三：大家好，今天我们讨论一下项目进展。
    李四：目前开发进度良好，预计下周完成第一阶段。
    王五：我这边测试工作也在同步进行。
    张三：很好，那我们确定下一步的计划。
    """
    
    payload = {
        "transcript": test_transcript
    }
    
    print("🚀 开始测试AI流式输出...")
    print(f"📝 测试文本长度: {len(test_transcript)}")
    
    try:
        response = requests.post(
            url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            stream=True
        )
        
        if response.status_code != 200:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            return
        
        print("✅ 开始接收流式响应...")
        
        chunk_count = 0
        collected_text = ""
        
        for line in response.iter_lines(decode_unicode=True):
            if line:
                chunk_count += 1
                print(f"\n📦 第{chunk_count}个chunk: {repr(line)}")
                
                if line.startswith('event:'):
                    event_type = line[6:].strip()
                    print(f"🎯 事件类型: {event_type}")
                elif line.startswith('data:'):
                    data_content = line[5:].strip()
                    print(f"📄 数据内容: {repr(data_content)}")
                    print(f"📊 数据长度: {len(data_content)}")
                    print(f"🔤 数据字节: {data_content.encode('utf-8')[:50]}")
                    
                    if data_content:
                        collected_text += data_content
                        print(f"📝 累计文本长度: {len(collected_text)}")
                        print(f"📋 累计文本最后50字符: {repr(collected_text[-50:])}")
        
        print(f"\n✅ 测试完成！")
        print(f"📊 总共收到 {chunk_count} 个chunks")
        print(f"📝 最终文本长度: {len(collected_text)}")
        print(f"📄 完整文本内容:")
        print("=" * 50)
        print(collected_text)
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ai_stream()