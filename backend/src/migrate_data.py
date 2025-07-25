#!/usr/bin/env python3
"""
数据库迁移脚本
用于将现有数据迁移到SQLite数据库
"""

import sys
import os
from datetime import datetime

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(__file__))

from database import db_manager

def create_sample_data():
    """创建示例数据用于测试"""
    sample_meetings = [
        {
            'id': f'meeting_sample_1_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'title': '项目启动会议',
            'date': '2024-01-15 10:00:00',
            'duration': '约60分钟',
            'transcript': '''项目经理: 大家好，今天我们召开项目启动会议。
技术负责人: 我来介绍一下技术架构方案。
产品经理: 我们需要确认产品需求和时间节点。
项目经理: 好的，我们先讨论技术方案，然后确认时间安排。
技术负责人: 我们计划使用React和FastAPI技术栈。
产品经理: 这个方案可以满足我们的需求。
项目经理: 那我们确定下来，下周开始开发工作。''',
            'participants': ['项目经理', '技术负责人', '产品经理'],
            'key_points': [
                '确定了项目的技术架构方案',
                '明确了各团队成员的职责分工',
                '制定了项目开发时间计划'
            ],
            'decisions': [
                '采用React + FastAPI技术栈',
                '下周正式开始开发工作',
                '每周举行一次进度同步会议'
            ],
            'action_items': [
                '技术负责人准备详细的技术文档',
                '产品经理整理完整的需求文档',
                '项目经理制定详细的项目计划'
            ],
            'next_steps': [
                '下周一提交技术方案文档',
                '下周三完成需求确认',
                '下周五开始第一阶段开发'
            ]
        },
        {
            'id': f'meeting_sample_2_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'title': '技术评审会议',
            'date': '2024-01-20 14:00:00',
            'duration': '约45分钟',
            'transcript': '''架构师: 今天我们评审前端和后端的技术方案。
前端开发: 我们选择了React + TypeScript的组合。
后端开发: 后端使用FastAPI + SQLite数据库。
架构师: 这个技术选型很合理，符合项目需求。
前端开发: 我们还集成了Vite作为构建工具。
后端开发: 数据库设计已经完成，支持会议记录的存储。
架构师: 很好，我们可以开始实施了。''',
            'participants': ['架构师', '前端开发', '后端开发'],
            'key_points': [
                '确认了前端技术栈：React + TypeScript + Vite',
                '确认了后端技术栈：FastAPI + SQLite',
                '完成了数据库设计方案评审'
            ],
            'decisions': [
                '技术方案通过评审',
                '开始进入开发实施阶段',
                '建立代码审查流程'
            ],
            'action_items': [
                '前端开发搭建项目脚手架',
                '后端开发实现API接口',
                '架构师制定代码规范文档'
            ],
            'next_steps': [
                '本周完成项目初始化',
                '下周开始核心功能开发',
                '建立持续集成流程'
            ]
        }
    ]
    
    return sample_meetings

def migrate_sample_data():
    """迁移示例数据到数据库"""
    print("🚀 开始数据库迁移...")
    
    # 获取示例数据
    sample_meetings = create_sample_data()
    
    success_count = 0
    for meeting in sample_meetings:
        if db_manager.save_meeting(meeting):
            print(f"✅ 成功保存会议: {meeting['title']}")
            success_count += 1
        else:
            print(f"❌ 保存失败: {meeting['title']}")
    
    print(f"\n📊 迁移完成: {success_count}/{len(sample_meetings)} 条记录成功保存")
    
    # 显示数据库统计
    stats = db_manager.get_database_stats()
    print(f"\n📈 数据库统计:")
    print(f"   - 会议记录: {stats.get('meetings', 0)} 条")
    print(f"   - 转录记录: {stats.get('transcripts', 0)} 条")
    print(f"   - 摘要记录: {stats.get('summaries', 0)} 条")
    print(f"   - 数据库路径: {stats.get('database_path', 'N/A')}")

def main():
    """主函数"""
    print("=" * 50)
    print("📋 会议摘要系统 - 数据库迁移工具")
    print("=" * 50)
    
    try:
        # 检查数据库状态
        stats = db_manager.get_database_stats()
        print(f"\n📊 当前数据库状态:")
        print(f"   - 会议记录: {stats.get('meetings', 0)} 条")
        print(f"   - 数据库路径: {stats.get('database_path', 'N/A')}")
        
        # 询问是否要添加示例数据
        if stats.get('meetings', 0) == 0:
            print("\n💡 检测到数据库为空，是否要添加示例数据？")
            choice = input("输入 'y' 添加示例数据，其他键跳过: ").lower().strip()
            
            if choice == 'y':
                migrate_sample_data()
            else:
                print("⏭️  跳过示例数据添加")
        else:
            print("\n✅ 数据库已包含数据，无需迁移")
            
    except Exception as e:
        print(f"❌ 迁移过程中发生错误: {e}")
        return 1
    
    print("\n🎉 迁移工具执行完成！")
    return 0

if __name__ == "__main__":
    exit(main())