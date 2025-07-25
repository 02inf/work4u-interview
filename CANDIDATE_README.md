# Candidate README - AI Meeting Digest

## 1. Technology Choices

* **Frontend:** React with React Router v7 + TypeScript + Tailwind CSS
* **Backend:** Python with FastAPI
* **Database:** SQLite
* **AI Service:** DeepSeek
* **Additional Libraries:** @tanstack/react-query for state management and caching

### Why This Stack?

- **React Router v7**: Modern React framework with excellent TypeScript support and built-in routing
- **FastAPI**: Fast, modern Python web framework with automatic API documentation and excellent async support
- **SQLite**: Simple, file-based database perfect for this project's scope, easy to set up and deploy
- **DeepSeek**: Advanced AI service with powerful language models and customizability
- **React Query**: Provides excellent caching, background updates, and prevents duplicate API calls with staleTime configuration
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

## 2. How to Run the Project

### Prerequisites
- Python 3.8+
- Node.js 18+
- DeepSeekAPIkey

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file based on `.env.example` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the backend server:
   ```bash
   python run.py
   ```
   The backend will run on `http://localhost:8000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Access the Application
Open your browser and go to `http://localhost:5173` to use the AI Meeting Digest application.

## 3. Design Decisions & Trade-offs
implementation of share feature, users can generate digest and share link, other users can access digest content through link.
### Architecture Decisions

1. **Separation of Concerns**: Clear separation between frontend and backend with RESTful API design
2. **Database Schema**: Simple but effective schema with separate tables for meetings and summaries, supporting both structured and natural language summaries
3. **Error Handling**: Comprehensive error handling on both frontend and backend with user-friendly error messages
4. **Responsive Design**: Mobile-first approach with Tailwind CSS for consistent UI across devices

### Key Features Implemented

#### Core Features
- ✅ Clean, responsive UI with transcript input and summary display
- ✅ AI-powered summary generation using DeepSeek
- ✅ Database storage of transcripts and summaries
- ✅ List view of previous digests with search and filtering

#### Bonus Features
- ✅ **Shareable Digest Links**: Implemented with UUID-based public IDs and dedicated share pages
- ✅ **React Query Integration**: Added caching and staleTime to prevent duplicate API calls

### Technical Improvements Made

1. **API Optimization**: 
   - Added `natural_summary` field to database schema
   - Standardized time format to ISO format for better frontend handling
   - Implemented proper error handling and status codes

2. **Frontend Enhancements**:
   - Integrated React Query for better state management and caching
   - Configured 5-minute staleTime to prevent unnecessary API calls
   - Improved time display logic to use `created_at` field
   - Added loading states and error boundaries

3. **User Experience**:
   - Copy-to-clipboard functionality for sharing
   - Markdown rendering for better summary formatting
   - Responsive design with proper mobile support
   - Progressive loading with skeleton screens

### Trade-offs

1. **SQLite vs PostgreSQL**: Chose SQLite for simplicity and ease of setup, though PostgreSQL would be better for production
2. **File-based Storage**: Simple approach suitable for the project scope, but would need cloud storage for production
3. **Client-side Routing**: Using React Router for SPA experience, though SSR might be better for SEO

### What I Would Do Differently With More Time

1. **Testing**: Add comprehensive unit and integration tests
2. **Authentication**: Implement user authentication and authorization
3. **Performance**: Add pagination for large datasets and implement virtual scrolling
4. **Deployment**: Set up CI/CD pipeline and containerization with Docker
5. **Monitoring**: Add logging, metrics, and error tracking
6. **Security**: Implement rate limiting, input validation, and CSRF protection

## 4. AI Usage Log

### How I Used AI Programming Assistants

I extensively used AI coding assistants (Claude) throughout this project in the following ways:

#### Backend Development
- **API Design**: Used AI to help structure FastAPI endpoints and implement proper async/await patterns
- **Database Schema**: Got assistance with SQLite schema design and query optimization
- **Error Handling**: AI helped implement comprehensive error handling patterns
- **DeepSeek API Integration**: Used AI to understand and implement the DeepSeek API with streaming support

#### Frontend Development
- **React Router v7**: AI assisted with understanding the new React Router patterns and TypeScript integration
- **React Query Integration**: Got help implementing useQuery hooks and configuring staleTime for caching
- **UI Components**: Used AI to create responsive Tailwind CSS components and layouts
- **State Management**: AI helped optimize component state and prop drilling issues

#### Problem Solving
- **Debugging**: Used AI to troubleshoot issues with CORS, API endpoints, and React hydration
- **Code Optimization**: Got suggestions for improving code structure and performance
- **Best Practices**: AI provided guidance on modern React patterns and Python async programming

### AI Effectiveness
- **Productivity Boost**: AI significantly accelerated development, especially for boilerplate code and configuration
- **Learning Tool**: Helped me understand new technologies like React Router v7 and React Query
- **Code Quality**: AI suggestions improved code structure and helped identify potential issues
- **Documentation**: Assisted in writing clear, comprehensive documentation

I began by leveraging AI assistants for requirement analysis and development workflow planning, then continuously refined and optimized the codebase through iterative AI-assisted conversations.
