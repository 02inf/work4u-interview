### 1. Technology Choices

* **Frontend:**  `[React + Vite + Tailwind CSS + React Router]`
* **Backend:**  `[FastAPI (Python 3.10+) + Uvicorn + SQLAlchemy]`
* **Database:** `[SQLite (dev) via SQLAlchemy ORM]`
* **AI Service:** `[Google Gemini API (streaming)]`

Briefly explain why you chose this stack.
* React + Vite + Tailwind: fast dev experience (HMR), minimal styling overhead, clean responsive UI; React Router keeps routes simple (/, /history, /digest/:publicId).

* FastAPI: type-hinted, high performance, great auto docs (/docs), straightforward Server-Sent Events (SSE) via StreamingResponse.

* SQLite: zero-config and file-based, ideal for a take-home; easily swappable to Postgres/MySQL through SQLAlchemy.

* Gemini: strong long-text summarization and streaming support; generous free tier; can be swapped out if needed.
### 2. How to Run the Project

Provide clear, step-by-step instructions for how to get your project running locally.

Frontend and backend run as separate processes. Default backend: http://localhost:8000. Default frontend: http://localhost:5173.
#### 2.1 Backend (FastAPI)
##### 1. Install dependencies
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

```
##### 2. Configure environment
```bash
export GEMINI_API_KEY="<your_gemini_api_key>"
```
#### 3. Start the server
```bash
uvicorn main:app --reload --port 8000
```
#### 4. Open API docs
Swagger UI: http://localhost:8000/docs
#### 5. Key endpoints
* POST /summaries — create a job from transcript; returns { id, public_id }
* GET /summaries/{id}/stream — SSE stream of the AI summary; persists on completion
* GET /summaries — list past digests with overview snippets and timestamps
* GET /summaries/{public_id} — fetch a single digest by shareable public_id

#### 2.2 Frontend (React + Vite)
##### 1. Install dependencies
```bash
cd frontend
npm install
```
##### 2. Configure environment
* Create frontend/.env if backend URL differs:
```bash
VITE_API_BASE_URL=http://localhost:8000
```
#### 3. Start the server
```bash
npm run dev
```
#### 4. Use the app
Swagger UI: http://localhost:8000/docs
#### 5. Key endpoints
* Home: paste transcript → click Generate Summary → watch streaming output (Overview / Key Decisions / Action Items). On finish, a share link appears.
* History: see previously generated digests (timestamp + overview snippet); copy share links.
* Share page: /digest/:publicId shows a single digest (viewable by anyone with the link).

### 3. Design Decisions & Trade-offs

Explain any significant architectural or design decisions you made. What were the trade-offs? If you implemented the challenge features, describe your approach. What would you do differently if you had more time?

#### 3.1 Two-step flow (create + stream)
* Create the record via POST /summaries (persist transcript, return id and public_id), then stream via GET /summaries/{id}/stream.
* Pros: clear lifecycle; better UX/error isolation; easy to persist final summary after streaming.
* Cons: one extra request—acceptable for clarity and robustness.

#### 3.2 SSE vs WebSockets
* Chose SSE for simplicity: native EventSource in browsers; minimal server code.
* Trade-off: unidirectional (server → client). If future features need duplex or collaborative editing, switch to WebSockets.
#### 3.3 Output shaping
* Prompt enforces three sections: Overview, Key Decisions, Action Items.
* Initially streams raw text for immediacy; persists the full text at the end.
* If more time: move to structured JSON (response schema / function calling) and store fields separately for search/analytics.
#### 3.4 IDs and share links
* Internal numeric id + external public_id (UUID) for shareable URLs.
* Pros: non-guessable public links; simple read-only sharing.
* Cons: demo omits auth. In production, add auth/ACL for sensitive transcripts.
#### 3.5 Extensibility and deployment
* DB swap to Postgres by changing the SQLAlchemy URL.
* For multi-instance streaming, consider sticky sessions or a shared pub/sub (e.g., Redis).
* Production: reverse proxy with TLS, observability (structured logs, tracing), and stricter CORS.

### 4. AI Usage Log

Describe how you used AI programming assistants during this project. Be specific!
SSE boilerplate and edge cases
Used an AI assistant to scaffold a minimal FastAPI StreamingResponse endpoint, then refined to include a final [DONE], error propagation, and DB persistence after streaming.