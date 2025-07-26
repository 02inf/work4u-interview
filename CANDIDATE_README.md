# AI Meeting Digest - Candidate Submission

## 1. Technology Choices

* **Frontend:** Vue.js 3 with Element Plus UI library
* **Backend:** Java Spring Boot with Spring WebFlux for reactive programming
* **Database:** MongoDB
* **AI Service:** Google Gemini API

### Why This Stack?

I chose this modern full-stack combination for several reasons:

- **Vue.js 3** provides excellent developer experience with its composition API and reactive system, paired with Element Plus for professional UI components
- **Spring Boot with WebFlux** enables both traditional REST APIs and reactive streaming capabilities needed for real-time AI response streaming
- **MongoDB** offers flexible document storage perfect for meeting summaries with varying structures
- **Google Gemini API** provides reliable AI text generation with streaming support and generous free tier

## 2. How to Run the Project

### Prerequisites
- Java 17 or higher
- Node.js 16+ and npm/yarn
- MongoDB instance (configured for 192.168.0.49:29001)

### Backend Setup
```bash
cd backend
# Run the Spring Boot application
./mvnw spring-boot:run
# Or: mvn spring-boot:run
```

### Frontend Setup
```bash
cd frontend
npm install
npm run serve
```

### Database Setup
The application will automatically connect to the configured MongoDB instance at 192.168.0.49:29001 and create the `meeting_summary` database if it doesn't exist.

### Access the Application
- Frontend: http://localhost:8081
- Backend API: http://localhost:8080

## 3. Design Decisions & Trade-offs

### Architecture Decisions

1. **Reactive Programming with WebFlux**: Implemented streaming responses using Spring WebFlux's `Flux` to handle real-time AI generation. This provides better user experience but adds complexity.

2. **Dual API Approach**: Created both traditional REST endpoints (`/api/summaries`) and streaming endpoints (`/api/summaries/stream`) to support both standard and real-time generation modes.

3. **Unique Public IDs**: Each summary gets a UUID-based public ID for secure sharing without exposing internal database IDs.

4. **Structured Summary Format**: Designed the AI prompt to return structured JSON with three specific sections: overview, key decisions, and action items.

### Implemented Features

#### Core Features 
- Clean, responsive UI with textarea for transcript input
- "Generate Digest" button with loading states
- Structured summary display (overview, decisions, action items)
- History view of all past summaries
- Database persistence of transcripts and summaries

#### Bonus Features 
- **Shareable Digest Links**: Each summary has a unique public URL (`/summary/:publicId`)
- **Real-time Streaming Response**: Implemented Server-Sent Events for word-by-word AI response streaming

### Trade-offs Made

1. **Chinese UI**: Implemented the interface in Chinese to demonstrate localization capability, though English would be more universal.

2. **Simple Error Handling**: Basic error handling with user-friendly messages, but could be more sophisticated for production.

3. **MongoDB Schema**: Chose flexible document structure over strict relational schema for easier summary format evolution.

4. **Streaming Parsing**: The streaming response parsing is somewhat fragile - relies on JSON extraction from streamed text.

### What I'd Do With More Time

- Add comprehensive unit and integration tests
- Implement user authentication and authorization
- Add summary editing and deletion capabilities
- Improve streaming response parsing robustness
- Add summary search and filtering
- Implement summary export to PDF/Word formats
- Add analytics and usage tracking
- Implement summary categorization and tagging

## 4. AI Usage Log

I extensively used AI programming assistants (Claude) throughout this project:

### Backend Development
- **Spring Boot Setup**: Used AI to generate the initial project structure and Maven dependencies
- **Reactive Programming**: Got help implementing WebFlux streaming endpoints, particularly the `Flux<String>` return types
- **Gemini Integration**: AI helped with HTTP client configuration and JSON request/response handling
- **Database Modeling**: Assistance with MongoDB repository setup and entity relationships

### Frontend Development
- **Vue.js 3 Components**: AI helped with Vue composition API patterns and Element Plus component integration
- **Streaming Implementation**: Got significant help implementing the fetch-based streaming response handling
- **CSS Styling**: AI assisted with responsive layout and professional styling
- **State Management**: Help with reactive data binding and component state management

### API Integration
- **CORS Configuration**: AI helped resolve cross-origin issues between frontend and backend
- **Error Handling**: Assistance with proper error propagation and user feedback
- **Stream Processing**: Significant help parsing Server-Sent Events format in the frontend

### Prompt Engineering
- **Gemini Prompt Design**: AI helped craft the prompt to ensure consistent JSON output format from Gemini API
- **Response Parsing**: Assistance with robust JSON extraction from AI responses

### Key AI Contributions
- Approximately 60% of boilerplate code generation
- 80% of complex reactive programming patterns
- 90% of streaming implementation logic
- 70% of error handling patterns
- 50% of UI component structure

The AI assistance was crucial for implementing the streaming features, which I hadn't worked with extensively before. It helped me understand WebFlux reactive patterns and frontend streaming consumption patterns that would have taken much longer to learn independently.