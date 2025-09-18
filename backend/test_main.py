"""
会议摘要应用的单元测试
"""
import pytest
import json
import sys
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 添加src目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import app
from database import Base, get_db, MeetingDigest

# 创建测试数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# 创建测试客户端
client = TestClient(app)

@pytest.fixture(scope="module")
def setup_database():
    # 创建测试表
    Base.metadata.create_all(bind=engine)
    yield
    # 清理测试表
    Base.metadata.drop_all(bind=engine)

class TestDigestAPI:
    """测试摘要相关API"""
    
    def test_create_test_digest(self, setup_database):
        """测试创建测试摘要"""
        response = client.post(
            "/api/digest/test",
            json={"transcript": "This is a test meeting transcript"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "public_id" in data
        assert data["summary_overview"] is not None
        
    def test_get_digests_empty(self, setup_database):
        """测试获取摘要列表（空）"""
        response = client.get("/api/digests")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_create_and_get_digest(self, setup_database):
        """测试创建摘要后获取"""
        # 创建摘要
        create_response = client.post(
            "/api/digest/test",
            json={"transcript": "Test transcript for retrieval"}
        )
        assert create_response.status_code == 200
        created_digest = create_response.json()
        
        # 获取摘要列表
        list_response = client.get("/api/digests")
        assert list_response.status_code == 200
        digests = list_response.json()
        assert len(digests) >= 1
        
        # 检查创建的摘要是否在列表中
        digest_ids = [d["id"] for d in digests]
        assert created_digest["id"] in digest_ids
        
    def test_get_digest_detail(self, setup_database):
        """测试获取摘要详情"""
        # 先创建一个摘要
        create_response = client.post(
            "/api/digest/test",
            json={"transcript": "Test transcript for detail view"}
        )
        assert create_response.status_code == 200
        created_digest = create_response.json()
        
        # 通过ID获取详情
        detail_response = client.get(f"/api/digest/{created_digest['id']}")
        assert detail_response.status_code == 200
        detail_data = detail_response.json()
        assert detail_data["id"] == created_digest["id"]
        assert detail_data["public_id"] == created_digest["public_id"]
        
    def test_get_public_digest(self, setup_database):
        """测试通过公共ID获取摘要"""
        # 先创建一个摘要
        create_response = client.post(
            "/api/digest/test",
            json={"transcript": "Test transcript for public access"}
        )
        assert create_response.status_code == 200
        created_digest = create_response.json()
        
        # 通过公共ID获取
        public_response = client.get(f"/api/public/{created_digest['public_id']}")
        assert public_response.status_code == 200
        public_data = public_response.json()
        assert public_data["id"] == created_digest["id"]
        assert public_data["public_id"] == created_digest["public_id"]
        
    def test_delete_digest(self, setup_database):
        """测试删除摘要"""
        # 先创建一个摘要
        create_response = client.post(
            "/api/digest/test",
            json={"transcript": "Test transcript for deletion"}
        )
        assert create_response.status_code == 200
        created_digest = create_response.json()
        
        # 删除摘要
        delete_response = client.delete(f"/api/digest/{created_digest['id']}")
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert delete_data["success"] is True
        
        # 验证摘要已被删除
        detail_response = client.get(f"/api/digest/{created_digest['id']}")
        assert detail_response.status_code == 404
        
    def test_delete_nonexistent_digest(self, setup_database):
        """测试删除不存在的摘要"""
        response = client.delete("/api/digest/99999")
        assert response.status_code == 404
        data = response.json()
        assert "摘要不存在" in data["detail"]
        
    def test_delete_public_digest(self, setup_database):
        """测试通过公共ID删除摘要"""
        # 先创建一个摘要
        create_response = client.post(
            "/api/digest/test",
            json={"transcript": "Test transcript for public deletion"}
        )
        assert create_response.status_code == 200
        created_digest = create_response.json()
        
        # 通过公共ID删除摘要
        delete_response = client.delete(f"/api/public/{created_digest['public_id']}")
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert delete_data["success"] is True
        
        # 验证摘要已被删除
        public_response = client.get(f"/api/public/{created_digest['public_id']}")
        assert public_response.status_code == 404

class TestStreamingAPI:
    """测试流式API"""
    
    def test_streaming_test_endpoint(self, setup_database):
        """测试流式测试端点"""
        response = client.post(
            "/api/digest/stream/test",
            json={"transcript": "Test transcript for streaming"}
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
        
        # 检查响应内容是否包含SSE格式的数据
        content = response.text
        assert "data:" in content
        assert "status" in content

if __name__ == "__main__":
    pytest.main([__file__, "-v"])