#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建测试数据脚本
用于生成示例会议摘要数据，测试分享功能
"""

import sys
import os
from datetime import datetime

# 添加src目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import DatabaseManager

def create_test_data():
    """创建测试数据"""
    print("🚀 开始创建测试数据...")
    
    # 初始化数据库管理器
    db_manager = DatabaseManager()
    
    # 测试数据1
    transcript1 = """
John: Good morning everyone, let's start our weekly team meeting.
Sarah: Hi John, I have an update on the marketing campaign.
Mike: The development team finished the user authentication feature.
Sarah: Great! The campaign is performing well, we've seen a 25% increase in engagement.
John: Excellent work. Mike, when can we expect the next feature?
Mike: I estimate we'll have the dashboard ready by Friday.
John: Perfect. Let's schedule a demo for next Monday.
Sarah: I'll prepare the presentation materials.
John: Thanks everyone, meeting adjourned.
"""
    
    natural_summary1 = """
# Weekly Team Meeting - Progress Update

## Meeting Overview
The team conducted their weekly progress meeting to discuss current project status and upcoming deliverables.

## Key Updates
- **Marketing Campaign**: Showing strong performance with 25% increase in engagement
- **Development Progress**: User authentication feature completed successfully
- **Next Milestone**: Dashboard feature targeted for Friday completion

## Action Items
- Mike: Complete dashboard feature by Friday
- Sarah: Prepare presentation materials for Monday demo
- Team: Attend demo session next Monday

## Decisions Made
- Schedule product demo for next Monday
- Continue current marketing campaign strategy
"""
    
    # 测试数据2
    transcript2 = """
Alice: Welcome to our quarterly planning meeting.
Bob: Thanks Alice. I'd like to discuss our Q4 budget allocation.
Carol: The sales team exceeded targets by 15% this quarter.
Bob: That's fantastic news. We should increase the marketing budget.
Alice: I agree. Let's allocate an additional $50,000 to marketing.
Carol: I'll work with the marketing team to plan the campaigns.
Bob: We also need to hire two more developers.
Alice: Approved. HR will start the recruitment process next week.
Carol: When should we review the progress?
Alice: Let's meet again in two weeks.
"""
    
    natural_summary2 = """
# Quarterly Planning Meeting - Q4 Strategy

## Meeting Overview
Quarterly planning session to review performance and set Q4 strategy and budget allocations.

## Key Achievements
- **Sales Performance**: Exceeded quarterly targets by 15%
- **Team Growth**: Approved hiring of 2 additional developers
- **Budget Increase**: Additional $50,000 allocated to marketing

## Action Items
- Carol: Collaborate with marketing team on campaign planning
- HR: Begin developer recruitment process next week
- Team: Prepare for progress review in 2 weeks

## Decisions Made
- Increase marketing budget by $50,000
- Hire 2 additional developers
- Schedule follow-up meeting in 2 weeks
"""
    
    try:
        # 保存测试数据1
        digest_id1 = db_manager.save_digest(
            transcript1, 
            {}, 
            natural_summary1, 
            "Weekly Team Meeting - Progress Update"
        )
        print(f"✅ 测试数据1已保存，ID: {digest_id1}")
        
        # 保存测试数据2
        digest_id2 = db_manager.save_digest(
            transcript2, 
            {}, 
            natural_summary2, 
            "Quarterly Planning Meeting - Q4 Strategy"
        )
        print(f"✅ 测试数据2已保存，ID: {digest_id2}")
        
        # 验证数据
        all_digests = db_manager.get_all_digests()
        print(f"📊 数据库中共有 {len(all_digests)} 条摘要记录")
        
        print("\n🎉 测试数据创建完成！")
        print("\n📋 可用的分享链接:")
        print(f"- http://localhost:5174/digest/{digest_id1}")
        print(f"- http://localhost:5174/digest/{digest_id2}")
        
        return True
        
    except Exception as e:
        print(f"❌ 创建测试数据失败: {e}")
        return False

if __name__ == "__main__":
    success = create_test_data()
    if success:
        print("\n✅ 测试数据创建成功，可以开始测试分享功能了！")
    else:
        print("\n❌ 测试数据创建失败")
        sys.exit(1)