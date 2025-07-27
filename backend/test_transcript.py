"""
Test the backend with a sample transcript using direct API calls.
"""

import sys
from pathlib import Path
import requests
import json
import time

# Test transcript
TRANSCRIPT = """Meeting Transcript
Meeting Title: Project Phoenix - Weekly Sync
Date: July 25, 2025
Time: 10:00 AM
Attendees: Priya Sharma (Project Manager), Mark Chen (Lead Engineer), Sarah Jenkins (Head of Marketing), David Miller (UX/UI Designer)

Priya Sharma (10:01:15): "Alright everyone, good morning! Thanks for joining. Hope you all had a good week. Let's kick off our weekly sync for Project Phoenix. The main goals for today are to get a status update on the beta build, review the initial marketing assets, and address the user feedback from our internal testing last week. Let's start with you, Mark. How's the engineering team looking?"

Mark Chen (10:02:05): "Morning, Priya. Things are progressing well. We've successfully integrated the new payment API from Stripe. It's stable. However, we did run into a significant bug on the Android build. The push notification service is crashing the app on older Android versions, specifically Android 11 and 12."

Priya Sharma (10:02:40): "Oof, that's not great. What's the impact on our launch timeline?"

Mark Chen (10:02:55): "It's a high-priority issue. We've dedicated two developers to it full-time. Best case, we have a patch by end-of-day Tuesday. Worst case, it pushes our beta code freeze back by a full week. The core issue seems to be a deprecated library we're using. We need to refactor that module."

Sarah Jenkins (10:03:30): "A week's delay would be a problem for us. We have the influencer campaign scheduled to kick off on August 15th. Any delay in the public beta link would mean we have to reschedule with them, and that's always messy."

Priya Sharma (10:04:05): "Understood, Sarah. Okay, Mark, let's make this bug our number one priority. Can you provide a status update in the main channel by EOD Monday? We need to know if that Tuesday timeline is holding. For now, let's tentatively plan for the delay and Sarah, can you check what a one-week slip would do to the influencer contracts? Just as a contingency."

Sarah Jenkins (10:04:45): "Will do. On a more positive note, the creative team has finalized the initial set of social media ads for the launch campaign. I've dropped a link in the chat. We focused on the 'effortless collaboration' angle we discussed. David, we'd love your team's eyes on them to ensure they're consistent with the app's UI."

David Miller (10:05:20): "Thanks, Sarah. Just opened them... wow, these look sharp. The color palette is perfect. One minor thought: the screenshot used in the third ad shows the old dashboard layout. We updated that in the last sprint to include the new 'Quick Add' button."

Mark Chen (10:05:55): "Oh, good catch, David. Yeah, that's the old UI. We can get you a high-res screenshot of the new dashboard by this afternoon."

Sarah Jenkins (10:06:10): "Perfect, thanks, Mark! That's an easy fix. David, any other feedback from the internal user testing you wanted to share?"

David Miller (10:06:30): "Yes. Overall, feedback was positive. People found the onboarding process very intuitive. The main point of friction was the file-sharing feature. Users reported that it wasn't clear if they were sharing with an individual or with the entire project team. The dialog box needs to be more explicit."

Priya Sharma (10:07:15): "Okay, that sounds like a critical usability issue. Is that a quick fix, David?"

David Miller (10:07:30): "My team has already mocked up a new design for the sharing modal. It uses clearer iconography and text. I'll share the Figma link with you and Mark right after this call. I think it's a straightforward change for the front-end team."

Mark Chen (10:08:00): "Okay, send it over. If it's just a front-end tweak, we can probably squeeze it into the next sprint without impacting the bug fix timeline."

Priya Sharma (10:08:25): "Excellent. So, to recap the key decisions and actions:

Engineering's top priority is the Android push notification bug. Mark will update us on Monday.

Sarah will investigate the contingency plan for a one-week slip in the marketing campaign.

Mark will provide Sarah with an updated screenshot of the new dashboard for the ad creative.

David is sending the revised sharing modal design, and Mark's team will assess its inclusion in the next sprint.

Priya Sharma (10:09:40): "Does that cover everything? Any other business?"

(Silence)

Priya Sharma (10:09:55): "Great. Let's keep the communication flowing in Slack, especially on that bug. Thanks for a productive meeting, everyone. Let's connect again next Friday, same time. Have a great weekend."

Sarah Jenkins (10:10:10): "You too, Priya. Bye all."

Mark Chen (10:10:12): "Thanks. Bye."

David Miller (10:10:15): "See you."

Recording Stopped: 10:10:30 AM"""

def test_backend_with_transcript():
    """Test the backend by starting server and making real API calls."""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Backend with Sample Transcript...")
    print("-" * 60)
    
    try:
        # Test 1: Check if server is running
        print("1️⃣ Testing server connection...")
        response = requests.get(f"{base_url}/", timeout=5)
        
        if response.status_code == 200:
            print("✅ Server is running!")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on localhost:8000")
        print("   Start server with: python run_server.py")
        return False
    except Exception as e:
        print(f"❌ Error connecting to server: {e}")
        return False
    
    try:
        # Test 2: Check health endpoint
        print("\n2️⃣ Testing health endpoint...")
        response = requests.get(f"{base_url}/api/v1/health", timeout=5)
        
        if response.status_code == 200:
            print("✅ Health check passed!")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    try:
        # Test 3: Create digest with transcript
        print("\n3️⃣ Testing digest creation with sample transcript...")
        print("   📝 Sending transcript to AI service...")
        
        payload = {"transcript": TRANSCRIPT}
        response = requests.post(
            f"{base_url}/api/v1/digests/",
            json=payload,
            timeout=30  # AI requests can take longer
        )
        
        if response.status_code == 201:
            print("✅ Digest created successfully!")
            result = response.json()
            
            print("\n📊 AI-Generated Summary:")
            print("-" * 40)
            print(f"Overview: {result['summary_overview']}")
            print(f"\nKey Decisions:")
            for i, decision in enumerate(result['key_decisions'], 1):
                print(f"  {i}. {decision}")
            print(f"\nAction Items:")
            for i, action in enumerate(result['action_items'], 1):
                print(f"  {i}. {action}")
            print(f"\nCreated: {result['created_at']}")
            print(f"Public ID: {result['public_id']}")
            print(f"Shareable: {result['is_public']}")
            
            # Test 4: Get all digests
            print("\n4️⃣ Testing digest retrieval...")
            response = requests.get(f"{base_url}/api/v1/digests/", timeout=5)
            
            if response.status_code == 200:
                digests = response.json()
                print(f"✅ Retrieved {len(digests)} digests")
                
                if digests:
                    digest_id = digests[0]['id']
                    
                    # Test 5: Get specific digest
                    print(f"\n5️⃣ Testing specific digest retrieval (ID: {digest_id})...")
                    response = requests.get(f"{base_url}/api/v1/digests/{digest_id}", timeout=5)
                    
                    if response.status_code == 200:
                        print("✅ Retrieved specific digest successfully!")
                        detailed = response.json()
                        print(f"   Original transcript length: {len(detailed['original_transcript'])} characters")
                    else:
                        print(f"❌ Failed to retrieve specific digest: {response.status_code}")
                        
                    # Test 6: Test shareable link
                    public_id = digests[0]['public_id']
                    print(f"\n6️⃣ Testing shareable link (Public ID: {public_id})...")
                    response = requests.get(f"{base_url}/api/v1/digests/share/{public_id}", timeout=5)
                    
                    if response.status_code == 200:
                        print("✅ Shareable link works!")
                    else:
                        print(f"❌ Shareable link failed: {response.status_code}")
            else:
                print(f"❌ Failed to retrieve digests: {response.status_code}")
        
        elif response.status_code == 500:
            print("❌ Server error - likely database or AI service issue")
            print(f"   Response: {response.text}")
        else:
            print(f"❌ Digest creation failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out - AI service might be slow or unavailable")
    except Exception as e:
        print(f"❌ Error testing digest creation: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Backend testing completed!")
    print("💡 Start the server with: python run_server.py")
    print("📚 View API docs at: http://localhost:8000/docs")

if __name__ == "__main__":
    test_backend_with_transcript()
