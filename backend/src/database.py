import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Optional
from contextlib import contextmanager
import os

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'meetings.db')

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.init_database()
    
    @contextmanager
    def get_connection(self):
        """获取数据库连接的上下文管理器"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 使结果可以通过列名访问
        try:
            yield conn
        finally:
            conn.close()
    
    def init_database(self):
        """初始化数据库表结构"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 创建会议表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS meetings (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    date TEXT NOT NULL,
                    duration TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 创建转录表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transcripts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    meeting_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
                )
            ''')
            
            # 创建摘要表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS summaries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    meeting_id TEXT NOT NULL,
                    public_id TEXT UNIQUE,
                    participants TEXT,
                    key_points TEXT,
                    decisions TEXT,
                    action_items TEXT,
                    next_steps TEXT,
                    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
                )
            ''')
            
            conn.commit()
            print(f"✅ 数据库初始化完成: {self.db_path}")
    
    def save_meeting(self, meeting_data: dict) -> bool:
        """保存完整的会议数据（包括转录和摘要）"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # 保存会议基本信息
                cursor.execute('''
                    INSERT OR REPLACE INTO meetings (id, title, date, duration)
                    VALUES (?, ?, ?, ?)
                ''', (
                    meeting_data['id'],
                    meeting_data['title'],
                    meeting_data['date'],
                    meeting_data.get('duration')
                ))
                
                # 保存转录内容
                cursor.execute('''
                    INSERT OR REPLACE INTO transcripts (meeting_id, content)
                    VALUES (?, ?)
                ''', (
                    meeting_data['id'],
                    meeting_data['transcript']
                ))
                
                # 生成公开分享ID
                public_id = str(uuid.uuid4())
                
                # 保存摘要信息
                cursor.execute('''
                    INSERT OR REPLACE INTO summaries 
                    (meeting_id, public_id, participants, key_points, decisions, action_items, next_steps)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    meeting_data['id'],
                    public_id,
                    json.dumps(meeting_data.get('participants', []), ensure_ascii=False),
                    json.dumps(meeting_data.get('key_points', []), ensure_ascii=False),
                    json.dumps(meeting_data.get('decisions', []), ensure_ascii=False),
                    json.dumps(meeting_data.get('action_items', []), ensure_ascii=False),
                    json.dumps(meeting_data.get('next_steps', []), ensure_ascii=False)
                ))
                
                conn.commit()
                return True
                
        except Exception as e:
            print(f"❌ 保存会议数据失败: {e}")
            return False
    
    def get_meeting(self, meeting_id: str) -> Optional[dict]:
        """获取单个会议的完整信息"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # 获取会议基本信息
                cursor.execute('SELECT * FROM meetings WHERE id = ?', (meeting_id,))
                meeting_row = cursor.fetchone()
                
                if not meeting_row:
                    return None
                
                # 获取转录内容
                cursor.execute('SELECT content FROM transcripts WHERE meeting_id = ?', (meeting_id,))
                transcript_row = cursor.fetchone()
                
                # 获取摘要信息
                cursor.execute('SELECT * FROM summaries WHERE meeting_id = ?', (meeting_id,))
                summary_row = cursor.fetchone()
                
                # 组装完整的会议数据
                meeting_data = {
                    'id': meeting_row['id'],
                    'title': meeting_row['title'],
                    'date': meeting_row['date'],
                    'duration': meeting_row['duration'],
                    'transcript': transcript_row['content'] if transcript_row else '',
                    'public_id': summary_row['public_id'] if summary_row else None,
                    'participants': json.loads(summary_row['participants']) if summary_row and summary_row['participants'] else [],
                    'key_points': json.loads(summary_row['key_points']) if summary_row and summary_row['key_points'] else [],
                    'decisions': json.loads(summary_row['decisions']) if summary_row and summary_row['decisions'] else [],
                    'action_items': json.loads(summary_row['action_items']) if summary_row and summary_row['action_items'] else [],
                    'next_steps': json.loads(summary_row['next_steps']) if summary_row and summary_row['next_steps'] else []
                }
                
                return meeting_data
                
        except Exception as e:
            print(f"❌ 获取会议数据失败: {e}")
            return None
    
    def get_all_meetings(self) -> List[dict]:
        """获取所有会议的列表（不包含转录内容，减少数据传输）"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT m.id, m.title, m.date, m.duration,
                           s.public_id, s.participants, s.key_points, s.decisions, s.action_items, s.next_steps
                    FROM meetings m
                    LEFT JOIN summaries s ON m.id = s.meeting_id
                    ORDER BY m.created_at DESC
                ''')
                
                meetings = []
                for row in cursor.fetchall():
                    meeting_data = {
                        'id': row['id'],
                        'title': row['title'],
                        'date': row['date'],
                        'duration': row['duration'],
                        'transcript': '',  # 列表中不包含转录内容
                        'public_id': row['public_id'],
                        'participants': json.loads(row['participants']) if row['participants'] else [],
                        'key_points': json.loads(row['key_points']) if row['key_points'] else [],
                        'decisions': json.loads(row['decisions']) if row['decisions'] else [],
                        'action_items': json.loads(row['action_items']) if row['action_items'] else [],
                        'next_steps': json.loads(row['next_steps']) if row['next_steps'] else []
                    }
                    meetings.append(meeting_data)
                
                return meetings
                
        except Exception as e:
            print(f"❌ 获取会议列表失败: {e}")
            return []
    
    def get_meeting_by_public_id(self, public_id: str) -> Optional[dict]:
        """通过公开ID获取会议摘要（用于分享链接）"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # 通过public_id获取摘要信息
                cursor.execute('SELECT * FROM summaries WHERE public_id = ?', (public_id,))
                summary_row = cursor.fetchone()
                
                if not summary_row:
                    return None
                
                # 获取会议基本信息
                cursor.execute('SELECT * FROM meetings WHERE id = ?', (summary_row['meeting_id'],))
                meeting_row = cursor.fetchone()
                
                if not meeting_row:
                    return None
                
                # 获取转录内容
                cursor.execute('SELECT content FROM transcripts WHERE meeting_id = ?', (summary_row['meeting_id'],))
                transcript_row = cursor.fetchone()
                
                # 组装会议数据（不包含敏感信息）
                meeting_data = {
                    'id': meeting_row['id'],
                    'title': meeting_row['title'],
                    'date': meeting_row['date'],
                    'duration': meeting_row['duration'],
                    'transcript': transcript_row['content'] if transcript_row else '',
                    'public_id': summary_row['public_id'],
                    'participants': json.loads(summary_row['participants']) if summary_row['participants'] else [],
                    'key_points': json.loads(summary_row['key_points']) if summary_row['key_points'] else [],
                    'decisions': json.loads(summary_row['decisions']) if summary_row['decisions'] else [],
                    'action_items': json.loads(summary_row['action_items']) if summary_row['action_items'] else [],
                    'next_steps': json.loads(summary_row['next_steps']) if summary_row['next_steps'] else []
                }
                
                return meeting_data
                
        except Exception as e:
            print(f"❌ 通过公开ID获取会议数据失败: {e}")
            return None
    
    def delete_meeting(self, meeting_id: str) -> bool:
        """删除会议及其相关数据"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # 删除摘要
                cursor.execute('DELETE FROM summaries WHERE meeting_id = ?', (meeting_id,))
                
                # 删除转录
                cursor.execute('DELETE FROM transcripts WHERE meeting_id = ?', (meeting_id,))
                
                # 删除会议
                cursor.execute('DELETE FROM meetings WHERE id = ?', (meeting_id,))
                
                conn.commit()
                return cursor.rowcount > 0
                
        except Exception as e:
            print(f"❌ 删除会议失败: {e}")
            return False
    
    def get_database_stats(self) -> dict:
        """获取数据库统计信息"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('SELECT COUNT(*) as count FROM meetings')
                meeting_count = cursor.fetchone()['count']
                
                cursor.execute('SELECT COUNT(*) as count FROM transcripts')
                transcript_count = cursor.fetchone()['count']
                
                cursor.execute('SELECT COUNT(*) as count FROM summaries')
                summary_count = cursor.fetchone()['count']
                
                return {
                    'meetings': meeting_count,
                    'transcripts': transcript_count,
                    'summaries': summary_count,
                    'database_path': self.db_path
                }
                
        except Exception as e:
            print(f"❌ 获取数据库统计失败: {e}")
            return {}

# 全局数据库管理器实例
db_manager = DatabaseManager()