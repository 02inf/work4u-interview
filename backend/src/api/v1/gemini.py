from fastapi import APIRouter, HTTPException
from google import genai
import os

from ...models import ChatRequest, ChatResponse
from ...constants import DEFAULT_GEMINI_MODEL

router = APIRouter()

def get_client():
    """Get Gemini client with API key"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    return genai.Client(api_key=api_key)

@router.post("/chat", response_model=ChatResponse)
async def chat_with_gemini(request: ChatRequest):
    """
    Basic chat with Gemini AI using the configured API key
    """
    try:
        # Generate response using new library
        client = get_client()
        response = client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL, 
            contents=request.message
        )
        
        if not response or not response.text:
            raise HTTPException(status_code=500, detail="Gemini returned empty response")
        
        return ChatResponse(
            response=response.text,
            model=DEFAULT_GEMINI_MODEL
        )
        
    except Exception as e:
        if "quota" in str(e).lower():
            raise HTTPException(status_code=429, detail="API quota exceeded. Please try again later.")
        elif "api_key" in str(e).lower() or "authentication" in str(e).lower():
            raise HTTPException(status_code=401, detail="Invalid API key or authentication error")
        else:
            raise HTTPException(status_code=500, detail=f"Error communicating with Gemini: {str(e)}")

@router.get("/models")
async def list_available_models():
    """
    List available Gemini models
    """
    try:
        client = get_client()
        models_response = client.models.list()
        models = []
        
        for model in models_response:
            models.append({
                "name": model.name,
                "display_name": getattr(model, 'display_name', model.name),
                "description": getattr(model, 'description', 'No description available')
            })
        
        return {"models": models}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing models: {str(e)}")

@router.get("/test")
async def test_gemini_connection():
    """
    Test if Gemini API connection is working
    """
    try:
        client = get_client()
        response = client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL,
            contents="Say 'Hello' if you can hear me."
        )
        
        return {
            "status": "success",
            "message": "Gemini API connection is working",
            "test_response": response.text if response and response.text else "No response"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gemini API connection failed: {str(e)}"
        }