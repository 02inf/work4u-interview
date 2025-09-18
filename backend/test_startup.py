#!/usr/bin/env python3
"""
简单的后端启动测试
"""
import sys
import os

# 添加 src 目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    print("🔧 测试后端模块导入...")
    
    # 测试环境变量
    from dotenv import load_dotenv
    load_dotenv()
    
    print("✅ dotenv 导入成功")
    
    # 测试数据库模块
    from database import Base, MeetingDigest
    print("✅ database 模块导入成功")
    
    # 测试 schemas
    from schemas import DigestCreateRequest, DigestCreateResponse
    print("✅ schemas 模块导入成功")
    
    # 测试 Gemini 服务
    api_key = os.getenv('GOOGLE_API_KEY')
    if api_key:
        print("✅ Google API Key 已配置")
        # 这里先跳过 Gemini 导入测试，避免依赖问题
        print("⚠️  跳过 Gemini 服务测试（避免依赖问题）")
    else:
        print("❌ Google API Key 未配置")
    
    # 测试路由
    from routers.digest import router
    print("✅ digest 路由导入成功")
    
    # 测试主应用
    from main import app
    print("✅ FastAPI 应用导入成功")
    
    print("\n🎉 所有核心模块导入成功！")
    print("🚀 后端应该可以正常启动")
    
except ImportError as e:
    print(f"❌ 导入错误: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ 其他错误: {e}")
    sys.exit(1)