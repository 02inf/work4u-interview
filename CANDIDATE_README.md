# AI Meeting Digest - Technical Implementation

## 1. Technology Choices

* **Frontend:** React + Vite + TypeScript
* **Backend:** FastAPI (Python)
* **Database:** SQLite (development) / PostgreSQL (production ready)
* **AI Service:** Google Gemini API

### Why This Stack?

**React + Vite + TypeScript**: Modern, fast development experience with excellent TypeScript support. Vite provides instant hot module replacement and optimized builds. React's component-based architecture makes the UI maintainable and testable.

**FastAPI**: Chosen for its excellent async support, automatic API documentation, built-in validation with Pydantic, and native streaming support for real-time features. The async nature is perfect for AI API calls that can take several seconds.

**SQLite/PostgreSQL**: SQLite for development simplicity, with easy migration path to PostgreSQL for production. SQLAlchemy ORM provides database-agnostic code.

**Google Gemini API**: Recommended in the requirements, offers streaming support for real-time responses, generous free tier, and excellent text generation capabilities.

## 2. How to Run the Project

### Prerequisites
- Python 3.8+ 
- Node.js 16+
- Google Gemini API key (get from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\\Scripts\\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

5. **Run the server:**
   ```bash
   cd src
   python main.py
   ```
   
   Backend will be available at `http://localhost:8000`
   API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Frontend will be available at `http://localhost:5173`

### Running Tests

**Backend tests:**
```bash
cd backend/src
pytest test_main.py -v
```

**Frontend tests:**
```bash
cd frontend
npm test
```

## 3. Design Decisions & Trade-offs

### Architecture Decisions

**1. Monorepo Structure**: Kept frontend and backend in the same repository for easier development and deployment, while maintaining clear separation of concerns.

**2. Database Design**: Simple, flat schema with JSON fields for lists (decisions/actions). Trade-off: Less normalized but simpler queries and perfect for this use case.

**3. API Design**: RESTful endpoints with consistent response formats. Added both regular and streaming endpoints to support different UX preferences.

### Key Features Implemented

**Core Features:**
-  Responsive UI with transcript input
-  AI-powered digest generation with structured output
-  Database persistence of digests and transcripts
-  Past digests listing and viewing

**Bonus Features:**
-  **Shareable digest links**: Each digest gets a unique UUID for public sharing
-  **Real-time streaming**: Live word-by-word display using Server-Sent Events (SSE)

### Technical Highlights

**1. Real-time Streaming Implementation:**
- Used FastAPI's `StreamingResponse` with Server-Sent Events
- Gemini API's streaming support for word-by-word generation
- Frontend uses Fetch API's ReadableStream for real-time updates
- Graceful fallback to regular generation if streaming fails

**2. Error Handling & Edge Cases:**
- Input validation (empty, too long transcripts)
- Network error handling with user-friendly messages
- AI service quota/timeout handling
- Graceful parsing fallbacks for malformed AI responses
- Character count display with visual feedback

**3. User Experience:**
- Tab-based navigation between new digest and history
- Loading states and progress indicators
- Responsive design for mobile/desktop
- One-click share functionality with clipboard API
- Character count with visual limit warnings

### Trade-offs Made

**1. In-Memory vs Database Storage**: Initially implemented in-memory storage for faster development, then migrated to SQLite. This approach allowed rapid prototyping while maintaining production readiness.

**2. Client-Side Routing**: Chose not to implement React Router to keep the scope manageable. The shareable links currently require server-side handling or could be enhanced with routing.

**3. Authentication**: Not implemented to focus on core functionality. In production, would add user authentication and digest ownership.

**4. AI Prompt Engineering**: Chose a simple, structured prompt that works reliably rather than complex prompt chaining. Trade-off: Less sophisticated parsing but more reliable results.

### What I Would Do Differently With More Time

**1. Enhanced Testing:**
- Integration tests for the streaming endpoint
- E2E tests with Playwright
- Mocking Gemini API for reliable test runs
- Performance testing for large transcripts

**2. Production Readiness:**
- Add proper logging and monitoring
- Implement rate limiting
- Add input sanitization for XSS prevention
- Database migrations with Alembic
- Docker containerization
- Environment-specific configurations

**3. UX Improvements:**
- Client-side routing for shareable links
- Drag-and-drop file upload for transcripts
- Export functionality (PDF, Word, etc.)
- Bulk operations for digest management
- Search and filtering for past digests

**4. Performance Optimizations:**
- Implement caching for repeated requests
- Add pagination for digest history
- Optimize database queries with indexes
- Background processing for large transcripts

## 4. AI Usage Log

I extensively used Claude Code (Anthropic's Claude Sonnet 4) throughout this project for:

### Backend Development:
- **FastAPI Structure**: Generated the initial FastAPI application structure with proper CORS, dependency injection, and async patterns
- **Database Models**: Created SQLAlchemy models with proper relationships and JSON field handling
- **API Endpoint Logic**: Developed the core digest processing logic, including prompt engineering for Gemini API
- **Streaming Implementation**: Implemented Server-Sent Events with FastAPI's StreamingResponse for real-time features
- **Error Handling**: Added comprehensive error handling for various edge cases (timeouts, quotas, parsing errors)
- **Testing**: Created pytest test suite with proper mocking and database fixtures

### Frontend Development:
- **React Component Architecture**: Built the complete React application with TypeScript, including state management and event handling
- **UI/UX Design**: Created responsive CSS layouts with modern design patterns (flexbox, grid, animations)
- **API Integration**: Implemented both REST API calls and streaming response handling with the Fetch API
- **Error Handling**: Added comprehensive client-side error handling with user-friendly messages
- **Testing Setup**: Configured Vitest with React Testing Library for component testing

### Specific AI Assistance Examples:

**1. Prompt Engineering**: AI helped craft the structured prompt for Gemini API that consistently produces the desired format (Overview, Key Decisions, Action Items).

**2. Streaming Implementation**: The most complex part was implementing Server-Sent Events. AI provided the complete implementation pattern for both backend streaming and frontend consumption.

**3. Database Design**: AI suggested the JSON field approach for storing lists, which simplified queries while maintaining flexibility.

**4. Error Scenarios**: AI helped identify and implement error handling for various edge cases I hadn't initially considered (quota limits, malformed responses, network issues).

**5. CSS Styling**: Generated modern, responsive CSS with proper accessibility considerations and visual feedback elements.

### AI Impact on Development:
- **Speed**: Reduced development time by approximately 60-70% compared to manual coding
- **Quality**: AI suggested best practices and patterns I might have missed
- **Error Prevention**: Helped identify potential edge cases and implement proper error handling
- **Documentation**: Assisted in writing comprehensive documentation and code comments

The AI assistance was particularly valuable for:
- Boilerplate generation (reducing tedious setup work)
- Best practice implementation (async patterns, error handling)
- Complex feature implementation (streaming responses)
- Testing strategy and implementation
- Documentation and code organization

This project demonstrates how AI-assisted development can significantly accelerate full-stack application development while maintaining high code quality and following modern development practices.