import requests
import json

def test_ai_stream():
    url = "http://localhost:8000/api/generate-summary-stream"
    headers = {"Content-Type": "application/json"}
    data = {
        "transcript": "今天的会议讨论了项目进展。参与者包括张三、李四、王五。主要决定是下周开始新功能开发。会议中还讨论了预算分配和时间安排。"
    }
    
    print("🚀 开始测试AI流式输出...")
    print("=" * 60)
    
    try:
        response = requests.post(url, headers=headers, json=data, stream=True)
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            chunk_count = 0
            accumulated_text = ""
            
            for line in response.iter_lines(decode_unicode=True):
                if line:
                    print(f"原始行: {repr(line)}")
                    
                    if line.startswith("data: "):
                        data_content = line[6:]  # 去掉 "data: " 前缀
                        chunk_count += 1
                        accumulated_text += data_content
                        
                        print(f"第{chunk_count}个chunk:")
                        print(f"  内容: {repr(data_content)}")
                        print(f"  长度: {len(data_content)}")
                        print(f"  包含空格: {'是' if ' ' in data_content else '否'}")
                        print(f"  累计文本: {repr(accumulated_text[:100])}...")
                        print("-" * 40)
            
            print(f"\n📊 测试完成统计:")
            print(f"总chunk数: {chunk_count}")
            print(f"累计文本长度: {len(accumulated_text)}")
            print(f"累计文本包含空格: {'是' if ' ' in accumulated_text else '否'}")
            print(f"累计文本前200字符: {repr(accumulated_text[:200])}")
            print(f"\n📋 完整累计文本:")
            print(repr(accumulated_text))  # 使用repr显示换行符
            print(f"\n📄 累计文本(原始格式):")
            print(accumulated_text)
            
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            
    except Exception as e:
        print(f"❌ 测试出错: {e}")

if __name__ == "__main__":
    test_ai_stream()