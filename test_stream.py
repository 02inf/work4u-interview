import requests
import json

def test_stream_api():
    url = "http://localhost:8000/api/generate-summary-stream"
    headers = {"Content-Type": "application/json"}
    data = {
        "transcript": "今天的会议讨论了项目进展。参与者包括张三、李四、王五。主要决定是下周开始新功能开发。"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, stream=True)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print("\nStreaming Response:")
        print("-" * 50)
        
        for line in response.iter_lines(decode_unicode=True):
            if line:
                print(line)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_stream_api()