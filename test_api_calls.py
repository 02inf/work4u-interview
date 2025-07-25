#!/usr/bin/env python3
"""
测试/meetings API调用情况
"""

import requests
import time
import threading
from datetime import datetime

# 记录API调用
api_calls = []
api_call_lock = threading.Lock()

def log_api_call(url, method="GET"):
    """记录API调用"""
    with api_call_lock:
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        api_calls.append({
            "timestamp": timestamp,
            "method": method,
            "url": url
        })
        print(f"[{timestamp}] {method} {url}")

def test_meetings_api():
    """测试/meetings API"""
    base_url = "http://localhost:8000"
    meetings_url = f"{base_url}/api/meetings"
    
    print("=== 测试 /meetings API 调用情况 ===")
    print(f"目标URL: {meetings_url}")
    print("\n开始测试...")
    
    try:
        # 模拟前端页面加载时的API调用
        print("\n1. 模拟首次页面加载")
        log_api_call(meetings_url)
        response = requests.get(meetings_url)
        print(f"   响应状态: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            meetings_count = len(data.get('meetings', []))
            print(f"   会议数量: {meetings_count}")
        
        # 等待一段时间
        time.sleep(2)
        
        # 模拟页面刷新
        print("\n2. 模拟页面刷新")
        log_api_call(meetings_url)
        response = requests.get(meetings_url)
        print(f"   响应状态: {response.status_code}")
        
        # 等待一段时间
        time.sleep(2)
        
        # 模拟快速连续调用（可能的重复调用场景）
        print("\n3. 模拟快速连续调用")
        for i in range(3):
            log_api_call(meetings_url)
            response = requests.get(meetings_url)
            print(f"   调用 {i+1}: {response.status_code}")
            time.sleep(0.1)  # 100ms间隔
        
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到后端服务，请确保后端服务正在运行")
        return False
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        return False
    
    return True

def analyze_api_calls():
    """分析API调用情况"""
    print("\n=== API调用分析 ===")
    print(f"总调用次数: {len(api_calls)}")
    
    if len(api_calls) > 1:
        print("\n调用时间间隔分析:")
        for i in range(1, len(api_calls)):
            prev_time = datetime.strptime(api_calls[i-1]['timestamp'], "%H:%M:%S.%f")
            curr_time = datetime.strptime(api_calls[i]['timestamp'], "%H:%M:%S.%f")
            interval = (curr_time - prev_time).total_seconds()
            print(f"  调用 {i} 与调用 {i+1} 间隔: {interval:.3f}秒")
    
    print("\n详细调用记录:")
    for i, call in enumerate(api_calls, 1):
        print(f"  {i}. [{call['timestamp']}] {call['method']} {call['url']}")

def check_backend_logs():
    """检查后端日志中的请求记录"""
    print("\n=== 后端日志检查建议 ===")
    print("请检查后端终端输出，查看是否有重复的请求日志")
    print("正常情况下，每次API调用都应该在后端产生一条日志记录")
    print("如果看到短时间内多条相同的请求日志，则确认存在重复调用问题")

if __name__ == "__main__":
    print("🔍 开始检测 /meetings API 重复调用问题")
    print("="*50)
    
    success = test_meetings_api()
    
    if success:
        analyze_api_calls()
        check_backend_logs()
        
        print("\n=== 结论 ===")
        if len(api_calls) > 6:  # 预期应该是6次调用
            print("⚠️  检测到可能的重复调用问题")
        else:
            print("✅ 未检测到明显的重复调用问题")
            print("   如果用户报告重复调用，可能是前端组件重新渲染导致的")
    
    print("\n测试完成")