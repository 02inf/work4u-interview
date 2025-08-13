"""
Quick test to demonstrate the backend functionality and endpoint usage.
"""

import requests
import json

# Sample transcript for testing
SAMPLE_TRANSCRIPT = """Meeting started at 2 PM. John discussed the quarterly budget increase. 
Sarah will prepare the financial report by Friday. 
We decided to hire two new developers for the mobile team.
Action items: Mark will review the vendor contracts by Tuesday."""

def test_backend_functionality():
    """Test the main backend functionality."""
    base_url = "http://localhost:8000"
    
    print("🚀 Testing AI Meeting Digest Backend")
    print("=" * 50)
    
    try:
        # Test health endpoint
        print("1. Testing health endpoint...")
        response = requests.get(f"{base_url}/api/v1/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        
        # Test digest creation
        print("\n2. Creating digest...")
        response = requests.post(
            f"{base_url}/api/v1/digests/",
            json={"transcript": SAMPLE_TRANSCRIPT}
        )
        
        if response.status_code == 201:
            digest = response.json()
            print("✅ Digest created successfully!")
            print(f"   ID: {digest['id']}")
            print(f"   Public ID: {digest['public_id']}")
            print(f"   Overview: {digest['summary_overview']}")
            
            # Test both endpoint types
            digest_id = digest['id']
            public_id = digest['public_id']
            
            print(f"\n3. Testing endpoint access...")
            print(f"   Integer ID endpoint: /api/v1/digests/{digest_id}")
            print(f"   UUID endpoint: /api/v1/digests/share/{public_id}")
            
            # Test integer endpoint
            response = requests.get(f"{base_url}/api/v1/digests/{digest_id}")
            if response.status_code == 200:
                print("✅ Integer ID endpoint works")
            
            # Test UUID endpoint
            response = requests.get(f"{base_url}/api/v1/digests/share/{public_id}")
            if response.status_code == 200:
                print("✅ UUID sharing endpoint works")
            
            print(f"\n🎉 Backend is fully functional!")
            print(f"📚 API docs: {base_url}/docs")
            
        else:
            print(f"❌ Digest creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Start with: python run_server.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_backend_functionality()
