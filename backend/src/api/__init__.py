from fastapi import APIRouter
from .digests import router as digests_router

api_router = APIRouter()

# Include all API routes
api_router.include_router(digests_router)

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "message": "AI Meeting Digest API is running"}
