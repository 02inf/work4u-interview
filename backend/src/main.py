from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import google.generativeai as genai
from .database import create_tables
from .api.v1 import digest, health

load_dotenv()

app = FastAPI(title="AI Meeting Digest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Create database tables
create_tables()

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(digest.router, prefix="/api", tags=["digest"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)