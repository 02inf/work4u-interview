import os, uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base, Summary

# Google Gemini API client (assuming API key is set in environment)
try:
    from google import genai  # Google GenAI SDK
    client = genai.Client()   # This will use GEMINI_API_KEY from env if set
except ImportError:
    client = None

DATABASE_URL = "sqlite:///./summaries.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)  # Create tables if not exist

app = FastAPI()

# Enable CORS for all origins (for frontend cross-domain calls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/summaries")
def create_summary(payload: dict, db: Session = Depends(get_db)):
    """Create a new summary record from a given transcript."""
    transcript_text = payload.get("transcript")
    if not transcript_text:
        raise HTTPException(status_code=400, detail="Transcript text is required.")
    # Create new Summary record (without summary content yet)
    new_summary = Summary(transcript=transcript_text, summary=None)
    db.add(new_summary)
    db.commit()
    db.refresh(new_summary)
    # Return the new record's ID and public_id for further processing (SSE)
    return {"id": new_summary.id, "public_id": new_summary.public_id}

@app.get("/summaries/{summary_id}/stream")
async def stream_summary(summary_id: int):
    """Stream the summary content for the given summary record ID via SSE."""
    # Get the transcript from DB
    db = SessionLocal()
    summary_record = db.query(Summary).get(summary_id)
    if not summary_record:
        db.close()
        raise HTTPException(status_code=404, detail="Summary record not found.")
    transcript_text = summary_record.transcript

    # Define an async generator for SSE
    async def event_generator():
        summary_text = ""  # to accumulate the result
        try:
            if client:
                # Use Google Gemini API streaming (pseudo-code / example usage)
                # Prepare the prompt for structured summary
                prompt = (
                    "Summarize the following meeting transcript. "
                    "Provide an 'Overview' of the meeting, a list of 'Key Decisions', and a list of 'Action Items'.\n\n"
                    f"Transcript:\n{transcript_text}\n\nSummary:"
                )
                # Call the Gemini API with streaming enabled
                response_stream = client.models.generate_content(
                    model="gemini-2.5-fast",
                    contents=prompt,
                    # Hypothetical streaming config (the real SDK may differ)
                    stream=True  
                )
                for chunk in response_stream:
                    # Each chunk contains part of the text
                    text_part = getattr(chunk, "text", None)
                    if text_part:
                        summary_text += text_part
                        # Yield SSE data chunk
                        yield f"data: {text_part}\n\n"
            else:
                # Fallback: If Gemini client not available, simulate a dummy summary in one chunk
                dummy_summary = "Overview: [AI summary of the meeting]\nKey Decisions:\n- Decision 1\n- Decision 2\nAction Items:\n- Action 1\n- Action 2\n"
                summary_text = dummy_summary
                yield f"data: {dummy_summary}\n\n"
        except Exception as e:
            # If an error occurs during generation, log and stop streaming
            print("Error during AI generation:", e)
            yield f"data: [ERROR] {str(e)}\n\n"
        finally:
            # After streaming is done, save the complete summary to the database
            summary_record.summary = summary_text
            db.add(summary_record)
            db.commit()
            db.close()
            # Send final done marker
            yield "data: [DONE]\n\n"

    # Return a StreamingResponse that streams data as Server-Sent Events
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/summaries")
def list_summaries(db: Session = Depends(get_db)):
    """Get a list of all summaries with overview snippets and metadata."""
    summaries = db.query(Summary).order_by(Summary.created_at.desc()).all()
    result = []
    for s in summaries:
        # Derive an overview snippet from the summary text (if available)
        if s.summary:
            text = s.summary
            # Try to extract Overview section (assuming output contains "Overview:")
            snippet = text
            if "Overview:" in text:
                # Extract text after "Overview:" up to "Key Decisions:" or first 100 chars
                start = text.index("Overview:") + len("Overview:")
                if "Key Decisions:" in text:
                    end = text.index("Key Decisions:")
                    snippet = text[start:end].strip()
                else:
                    snippet = text[start:].strip()
            # Limit snippet length for brevity
            overview_snippet = snippet[:100] + ("..." if len(snippet) > 100 else "")
        else:
            overview_snippet = "(Summary not yet available)"
        result.append({
            "id": s.id,
            "public_id": s.public_id,
            "created_at": s.created_at.isoformat(),
            "overview_snippet": overview_snippet
        })
    return result

@app.get("/summaries/{public_id}")
def get_summary(public_id: str, db: Session = Depends(get_db)):
    """Retrieve a single summary by its public shareable ID."""
    summary_record = db.query(Summary).filter(Summary.public_id == public_id).first()
    if not summary_record or not summary_record.summary:
        raise HTTPException(status_code=404, detail="Summary not found or not generated yet.")
    return {
        "id": summary_record.id,
        "public_id": summary_record.public_id,
        "created_at": summary_record.created_at.isoformat(),
        "text": summary_record.summary
    }
