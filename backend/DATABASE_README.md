# 数据库功能说明

## 概述

本项目已成功集成SQLite数据库，用于持久化存储会议转录和结构化摘要数据。数据库功能完全替代了之前的内存存储方案。

## 数据库架构

### 表结构

#### 1. meetings 表（会议基本信息）
```sql
CREATE TABLE meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    duration TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. transcripts 表（转录内容）
```sql
CREATE TABLE transcripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
);
```

#### 3. summaries 表（摘要信息）
```sql
CREATE TABLE summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id TEXT NOT NULL,
    participants TEXT,    -- JSON格式存储
    key_points TEXT,      -- JSON格式存储
    decisions TEXT,       -- JSON格式存储
    action_items TEXT,    -- JSON格式存储
    next_steps TEXT,      -- JSON格式存储
    FOREIGN KEY (meeting_id) REFERENCES meetings(id)
);
```

## 核心功能

### 1. 数据库管理器 (`database.py`)

- **自动初始化**：首次运行时自动创建数据库表结构
- **连接管理**：使用上下文管理器确保连接正确关闭
- **数据操作**：提供完整的CRUD操作接口

### 2. 主要方法

#### 保存会议数据
```python
db_manager.save_meeting(meeting_data: dict) -> bool
```

#### 获取单个会议
```python
db_manager.get_meeting(meeting_id: str) -> Optional[dict]
```

#### 获取所有会议列表
```python
db_manager.get_all_meetings() -> List[dict]
```

#### 删除会议
```python
db_manager.delete_meeting(meeting_id: str) -> bool
```

#### 获取数据库统计
```python
db_manager.get_database_stats() -> dict
```

## API 端点

### 新增的数据库相关端点

#### 获取数据库统计信息
```
GET /api/database/stats
```

**响应示例：**
```json
{
    "meetings": 2,
    "transcripts": 2,
    "summaries": 2,
    "database_path": "C:\\path\\to\\meetings.db"
}
```

#### 健康检查（包含数据库状态）
```
GET /health
```

**响应示例：**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-24T14:10:00.000Z",
    "database": {
        "meetings": 2,
        "transcripts": 2,
        "summaries": 2,
        "database_path": "C:\\path\\to\\meetings.db"
    }
}
```

### 现有端点的数据库集成

所有现有的API端点已完全集成数据库功能：

- `POST /api/generate-summary` - 生成摘要并保存到数据库
- `GET /api/meetings` - 从数据库获取所有会议列表
- `GET /api/meetings/{meeting_id}` - 从数据库获取特定会议详情
- `DELETE /api/meetings/{meeting_id}` - 从数据库删除会议记录

## 数据迁移工具

### 使用方法

```bash
# 进入backend目录
cd backend

# 运行迁移脚本
python src/migrate_data.py
```

### 功能特性

- **自动检测**：检测数据库是否为空
- **示例数据**：提供2条示例会议记录用于测试
- **统计报告**：显示迁移前后的数据库统计信息
- **交互式操作**：用户可选择是否添加示例数据

## 数据库文件位置

```
backend/meetings.db
```

## 技术特性

### 1. 数据完整性
- 使用外键约束确保数据关联性
- JSON格式存储复杂数据结构
- 事务支持确保数据一致性

### 2. 性能优化
- 连接池管理
- 索引优化（主键自动索引）
- 分页查询支持（可扩展）

### 3. 错误处理
- 完善的异常捕获和日志记录
- 数据库操作失败时的优雅降级
- 详细的错误信息反馈

## 使用示例

### 1. 生成并保存会议摘要

```bash
curl -X POST http://localhost:8000/api/generate-summary \
  -H "Content-Type: application/json" \
  -d '{"transcript": "会议转录内容..."}'
```

### 2. 获取所有会议

```bash
curl http://localhost:8000/api/meetings
```

### 3. 获取数据库统计

```bash
curl http://localhost:8000/api/database/stats
```

## 部署注意事项

1. **数据库文件权限**：确保应用有读写权限
2. **备份策略**：定期备份 `meetings.db` 文件
3. **并发访问**：SQLite支持多读单写，适合中小型应用
4. **扩展性**：如需高并发，可考虑迁移到PostgreSQL或MySQL

## 故障排除

### 常见问题

1. **数据库文件不存在**
   - 解决方案：应用会自动创建，确保目录有写权限

2. **数据库锁定**
   - 解决方案：检查是否有其他进程占用数据库文件

3. **编码问题**
   - 解决方案：确保使用UTF-8编码，JSON存储时设置`ensure_ascii=False`

### 日志信息

应用启动时会显示：
```
✅ 数据库初始化完成: /path/to/meetings.db
```

数据保存时会显示：
```
✅ 会议数据已保存到数据库: meeting_id
```

## 总结

数据库功能的集成为会议摘要系统提供了：

- ✅ **持久化存储**：数据不会因服务重启而丢失
- ✅ **结构化管理**：清晰的数据模型和关系
- ✅ **高效查询**：支持复杂的数据检索需求
- ✅ **扩展性**：为未来功能扩展奠定基础
- ✅ **可靠性**：事务支持和错误处理机制

系统现已完全准备好用于生产环境的会议记录和摘要管理。