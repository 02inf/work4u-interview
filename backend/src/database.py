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
    """简化的数据库管理器 - 单表设计"""
    
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
        """初始化数据库表结构 - 简化为单表"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 删除旧的复杂表结构（如果存在）
            cursor.execute('DROP TABLE IF EXISTS summaries')
            cursor.execute('DROP TABLE IF EXISTS transcripts')
            cursor.execute('DROP TABLE IF EXISTS meetings')
            # 删除旧的meeting_digests表以应用新的时间字段结构
            cursor.execute('DROP TABLE IF EXISTS meeting_digests')
            
            # 创建简化的会议摘要表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS meeting_digests (
                    id TEXT PRIMARY KEY,
                    meeting_name TEXT,
                    transcript TEXT NOT NULL,
                    natural_summary TEXT,
                    summary TEXT NOT NULL,
                    created_at TIMESTAMP
                )
            ''')
            
            conn.commit()
            print(f"✅ 简化数据库初始化完成: {self.db_path}")
    
    def save_digest(self, transcript: str, summary: dict, natural_summary: str = None, meeting_name: str = None) -> str:
        """保存会议摘要数据"""
        try:
            digest_id = str(uuid.uuid4())
            # 使用本地时间
            local_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO meeting_digests (id, meeting_name, transcript, natural_summary, summary, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    digest_id,
                    meeting_name,
                    transcript,
                    natural_summary,
                    json.dumps(summary, ensure_ascii=False),
                    local_time
                ))
                
                conn.commit()
                return digest_id
                
        except Exception as e:
            print(f"❌ 保存摘要数据失败: {e}")
            raise e
    
    def get_digest(self, digest_id: str) -> Optional[dict]:
        """获取单个摘要的完整信息"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('SELECT * FROM meeting_digests WHERE id = ?', (digest_id,))
                row = cursor.fetchone()
                
                if not row:
                    return None
                
                # 格式化时间为ISO格式
                created_at = row['created_at']
                if created_at and len(created_at) == 19:  # 'YYYY-MM-DD HH:MM:SS' 格式
                    # 转换为ISO格式
                    try:
                        dt = datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
                        created_at = dt.isoformat()
                    except:
                        pass  # 保持原格式
                
                return {
                    'id': row['id'],
                    'title': row['meeting_name'] or (json.loads(row['summary']).get('title') if row['summary'] else (row['natural_summary'].split('\n')[0].replace('#', '').strip() if row['natural_summary'] else '会议摘要')),
                    'meeting_name': row['meeting_name'],
                    'date': json.loads(row['summary']).get('date', row['created_at'][:10] if row['created_at'] else ''),
                    'participants': json.loads(row['summary']).get('participants', []),
                    'agenda': json.loads(row['summary']).get('agenda', []),
                    'key_metrics': json.loads(row['summary']).get('key_metrics', []),
                    'next_meeting': json.loads(row['summary']).get('next_meeting', ''),
                    'duration': json.loads(row['summary']).get('duration', ''),
                    'transcript': row['transcript'],
                    'natural_summary': row['natural_summary'],
                    'created_at': created_at
                }
                
        except Exception as e:
            print(f"❌ 获取摘要数据失败: {e}")
            return None
    
    def get_all_digests(self, limit: int = 50) -> List[dict]:
        """获取所有摘要的列表（包含完整摘要信息，不包含转录内容）"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT id, meeting_name, summary, natural_summary, created_at
                    FROM meeting_digests
                    ORDER BY created_at DESC
                    LIMIT ?
                ''', (limit,))
                
                digests = []
                for row in cursor.fetchall():
                    summary_data = json.loads(row['summary'])
                    # 格式化时间为ISO格式
                    created_at = row['created_at']
                    if created_at and len(created_at) == 19:  # 'YYYY-MM-DD HH:MM:SS' 格式
                        # 转换为ISO格式
                        try:
                            dt = datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
                            created_at = dt.isoformat()
                        except:
                            pass  # 保持原格式
                    
                    digests.append({
                        'id': row['id'],
                        'title': row['meeting_name'] or (summary_data.get('title') if summary_data else (row['natural_summary'].split('\n')[0].replace('#', '').strip() if row['natural_summary'] else '会议摘要')),
                        'meeting_name': row['meeting_name'],
                        'date': summary_data.get('date', row['created_at'][:10] if row['created_at'] else ''),
                        'participants': summary_data.get('participants', []),
                        'agenda': summary_data.get('agenda', []),
                        'key_metrics': summary_data.get('key_metrics', []),
                        'next_meeting': summary_data.get('next_meeting', ''),
                        'duration': summary_data.get('duration', ''),
                        'natural_summary': row['natural_summary'],
                        'created_at': created_at
                    })
                
                return digests
                
        except Exception as e:
            print(f"❌ 获取摘要列表失败: {e}")
            return []
    
    def delete_digest(self, digest_id: str) -> bool:
        """删除摘要数据"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('DELETE FROM meeting_digests WHERE id = ?', (digest_id,))
                
                conn.commit()
                return cursor.rowcount > 0
                
        except Exception as e:
            print(f"❌ 删除摘要失败: {e}")
            return False
    
    def clear_database(self) -> bool:
        """清空数据库中的所有数据"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('DELETE FROM meeting_digests')
                
                conn.commit()
                print(f"✅ 数据库已清空: {self.db_path}")
                return True
                
        except Exception as e:
            print(f"❌ 清空数据库失败: {e}")
            return False
    
    def get_database_stats(self) -> dict:
        """获取数据库统计信息"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute('SELECT COUNT(*) as count FROM meeting_digests')
                digest_count = cursor.fetchone()['count']
                
                return {
                    'total_digests': digest_count,
                    'database_path': self.db_path
                }
                
        except Exception as e:
            print(f"❌ 获取数据库统计失败: {e}")
            return {}

# 全局数据库管理器实例
db_manager = DatabaseManager()