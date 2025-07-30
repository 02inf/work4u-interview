from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from google import genai
import os
import json

from ...models import ChatRequest, ChatResponse
from ...constants import DEFAULT_GEMINI_MODEL

router = APIRouter()


def get_client():
    """Get Gemini client with API key"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    return genai.Client(api_key=api_key)


@router.post("/chat")
async def chat_with_gemini(request: ChatRequest):
    """
    Streaming chat with Gemini AI using the configured API key
    """
    import asyncio
    try:
        client = get_client()

        async def generate_stream():
            try:
                response = client.models.generate_content_stream(
                    model=DEFAULT_GEMINI_MODEL, contents=request.message
                )

                for chunk in response:
                    if chunk.text:
                        print(chunk.text)
                        # Send each chunk as Server-Sent Events format
                        yield f"data: {json.dumps({'content': chunk.text, 'model': DEFAULT_GEMINI_MODEL})}\n\n"
                        """
                            FastAPI StreamingResponse buffering:

                            FastAPI's StreamingResponse can buffer chunks internally
                            Without await asyncio.sleep(), the async generator might yield chunks faster than the HTTP response can flush them
                            This causes chunks to accumulate in buffers instead of streaming immediately
                            Python async generator behavior:

                            When you yield in an async generator, it doesn't guarantee immediate delivery
                            The event loop needs time to actually send the HTTP response
                            Without yielding control back to the event loop (via await), chunks get queued
                        """
                        await asyncio.sleep(0)

                # Send end signal
                yield f"data: {json.dumps({'done': True})}\n\n"

            except Exception as e:
                error_msg = str(e)
                if "quota" in error_msg.lower():
                    yield f"data: {json.dumps({'error': 'API quota exceeded. Please try again later.'})}\n\n"
                elif (
                    "api_key" in error_msg.lower()
                    or "authentication" in error_msg.lower()
                ):
                    yield f"data: {json.dumps({'error': 'Invalid API key or authentication error'})}\n\n"
                else:
                    yield f"data: {json.dumps({'error': f'Error communicating with Gemini: {error_msg}'})}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            },
        )

    except Exception as e:
        if "quota" in str(e).lower():
            raise HTTPException(
                status_code=429, detail="API quota exceeded. Please try again later."
            )
        elif "api_key" in str(e).lower() or "authentication" in str(e).lower():
            raise HTTPException(
                status_code=401, detail="Invalid API key or authentication error"
            )
        else:
            raise HTTPException(
                status_code=500, detail=f"Error communicating with Gemini: {str(e)}"
            )


@router.post("/chat/non-streaming", response_model=ChatResponse)
async def chat_with_gemini_non_streaming(request: ChatRequest):
    """
    Non-streaming chat with Gemini AI (original implementation)
    """
    try:
        # Generate response using new library
        client = get_client()
        response = client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL, contents=request.message
        )

        if not response or not response.text:
            raise HTTPException(
                status_code=500, detail="Gemini returned empty response"
            )

        return ChatResponse(response=response.text, model=DEFAULT_GEMINI_MODEL)

    except Exception as e:
        if "quota" in str(e).lower():
            raise HTTPException(
                status_code=429, detail="API quota exceeded. Please try again later."
            )
        elif "api_key" in str(e).lower() or "authentication" in str(e).lower():
            raise HTTPException(
                status_code=401, detail="Invalid API key or authentication error"
            )
        else:
            raise HTTPException(
                status_code=500, detail=f"Error communicating with Gemini: {str(e)}"
            )


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
            models.append(
                {
                    "name": model.name,
                    "display_name": getattr(model, "display_name", model.name),
                    "description": getattr(
                        model, "description", "No description available"
                    ),
                }
            )

        return {"models": models}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing models: {str(e)}")

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("/test")
async def test_gemini_connection():
    """
    Test if Gemini API connection is working
    """
    try:
        client = get_client()
        response = client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL, contents="Say 'Hello' if you can hear me."
        )

        return {
            "status": "success",
            "message": "Gemini API connection is working",
            "test_response": (
                response.text if response and response.text else "No response"
            ),
        }

    except Exception as e:
        return {"status": "error", "message": f"Gemini API connection failed: {str(e)}"}
