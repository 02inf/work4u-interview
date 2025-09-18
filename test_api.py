#!/usr/bin/env python3
"""
快速测试 Google Gemini API 连接
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def test_gemini_api():
    try:
        # 配置 API Key
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            print("❌ 错误：未找到 GOOGLE_API_KEY 环境变量")
            return False
        
        genai.configure(api_key=api_key)
        
        # 创建模型
        model = genai.GenerativeModel('gemini-pro')
        
        # 测试简单请求
        print("🔄 测试 Google Gemini API 连接...")
        response = model.generate_content("Hello! Please respond with 'API connection successful!'")
        
        print(f"✅ API 连接成功！")
        print(f"📝 响应: {response.text}")
        return True
        
    except Exception as e:
        print(f"❌ API 连接失败: {e}")
        return False

if __name__ == "__main__":
    success = test_gemini_api()
    if success:
        print("\n🎉 Google Gemini API 配置正确，可以开始开发！")
    else:
        print("\n💥 请检查 API Key 配置")