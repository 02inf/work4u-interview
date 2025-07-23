# AI Meeting Digest - Candidate Submission

### 1. Technology Choices

* **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
* **Backend:** Next.js API Routes
* **Database:** Supabase (PostgreSQL)
* **AI Service:** Google Gemini API

I chose this stack because:
- **Next.js 15** provides an excellent full-stack framework with built-in API routes, server-side rendering, and excellent developer experience
- **TypeScript** ensures type safety and better code maintainability
- **Tailwind CSS** allows rapid UI development with utility-first classes
- **Supabase** offers a managed PostgreSQL database with real-time capabilities and built-in authentication (for future enhancements)
- **Google Gemini API** provides powerful AI capabilities with streaming support and a generous free tier

### 2. How to Run the Project

**Prerequisites:**
- Node.js 18+ and npm
- Supabase account (free tier works)
- Google AI Studio account for Gemini API key (free)

**Step-by-step instructions:**

1. Clone the repository:
```bash
git clone https://github.com/your-username/work4u-interview.git
cd work4u-interview
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Edit `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
```

5. Set up Supabase database:
   - Create a new Supabase project at https://supabase.com
   - Go to SQL Editor and run the commands from `supabase-schema.sql`
   - Copy your project URL and anon key from Settings → API

6. Get Google Gemini API key:
   - Visit https://aistudio.google.com/app/apikey
   - Create a new API key
   - Add it to `.env.local`

7. Run the development server:
```bash
npm run dev
```

8. Open http://localhost:3000 in your browser

### 3. Design Decisions & Trade-offs

**Key Design Decisions:**

1. **Real-time Streaming Implementation:**
   - Used Server-Sent Events (SSE) instead of WebSockets for simplicity
   - Created a toggle to switch between streaming and non-streaming modes
   - Implemented progressive text rendering with a dedicated streaming display area

2. **Database Design:**
   - Single `digests` table with JSON arrays for decisions and action items
   - Added `public_id` field for shareable links using nanoid for short, URL-safe IDs
   - Indexed `public_id` and `created_at` for better query performance

3. **UI/UX Improvements:**
   - Modern gradient design with glassmorphism effects
   - Added loading states, error handling, and success feedback
   - Implemented copy-to-clipboard functionality for share links
   - Responsive design that works well on mobile and desktop

4. **API Structure:**
   - Separate endpoints for streaming (`/api/digest/stream`) and non-streaming (`/api/digest/create`)
   - Pagination support in list endpoint for scalability
   - Error handling with appropriate HTTP status codes

**Trade-offs:**

1. **No Authentication:** Kept the app simple without user accounts, but added public IDs for basic access control
2. **Client-side State Management:** Used React hooks instead of a state management library for simplicity
3. **Streaming Parsing:** Basic text parsing for structured data extraction during streaming - could be improved with more sophisticated NLP

**What I Would Do Differently with More Time:**

1. **Testing:** Implement comprehensive unit and integration tests using Jest and React Testing Library
2. **Authentication:** Add Supabase Auth for user accounts and private digests
3. **Enhanced Streaming:** Implement markdown parsing during streaming for better formatting
4. **Caching:** Add Redis or Supabase caching for frequently accessed digests
5. **Export Features:** Add PDF and Word document export functionality
6. **Webhook Support:** Allow integration with Slack/Teams for automatic digest sharing

### 4. AI Usage Log

I used AI programming assistants extensively throughout this project:

1. **Project Setup & Architecture:**
   - Used Claude to help design the initial project structure and database schema
   - Asked for best practices for Next.js 15 app router implementation

2. **Streaming Implementation:**
   - Consulted on the best approach for implementing SSE with Next.js
   - Got help debugging CORS issues and proper header configuration
   - Used AI to understand the Gemini streaming API documentation

3. **UI Components:**
   - Generated initial Tailwind CSS classes for the gradient backgrounds
   - Asked for modern UI design patterns and animation suggestions
   - Got help with responsive design breakpoints

4. **Error Handling:**
   - Used AI to implement comprehensive error boundaries
   - Asked for best practices in API error responses
   - Got suggestions for user-friendly error messages

5. **Database Queries:**
   - Optimized Supabase queries with AI assistance
   - Implemented proper indexing strategies
   - Learned about Row Level Security considerations

6. **Code Quality:**
   - Used AI for TypeScript type definitions
   - Asked for ESLint rule recommendations
   - Got help with code organization and file structure

The AI assistants were invaluable for rapid development, helping me understand new APIs quickly and implement features I hadn't used before. They were particularly helpful for debugging streaming issues and optimizing performance.

## Features

### Core Features
1. **Meeting Transcript Processing**: Accept raw meeting transcripts and generate AI-powered summaries
2. **Structured Summaries**: Extract overview, key decisions, and action items
3. **History Management**: View and access previously generated digests
4. **Shareable Links**: Each digest has a unique public URL for sharing

### Bonus Features
1. **Real-time Streaming**: Watch the AI generate summaries in real-time using Server-Sent Events
2. **Responsive Design**: Works seamlessly on desktop and mobile devices

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google AI Studio account for Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/02inf/work4u-interview.git
cd work4u-interview
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
```

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the SQL commands in `supabase-schema.sql` in the SQL editor
   - Copy your project URL and anon key to `.env.local`

5. Get Google Gemini API key:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to `.env.local`

6. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
work4u-interview/
├── app/                          # Next.js App Router
│   ├── api/                     # API endpoints
│   │   └── digest/              # Digest-related APIs
│   │       ├── create/          # Create new digest
│   │       ├── list/            # List all digests
│   │       ├── stream/          # Streaming endpoint
│   │       └── [id]/            # Get digest by ID
│   ├── digest/
│   │   └── [id]/                # Share page route
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── DigestCard.tsx           # Digest preview card
│   └── StreamingDigest.tsx      # Streaming UI component
├── lib/                         # Utility functions
│   ├── supabase.ts              # Supabase client setup
│   └── gemini.ts                # Gemini AI integration
├── types/                       # TypeScript definitions
│   └── digest.ts                # Digest type interfaces
├── public/                      # Static assets
├── .env.local.example           # Environment variables template
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── supabase-schema.sql          # Database schema
```

## API Endpoints

### POST /api/digest/create
Create a new digest from a transcript.

Request:
```json
{
  "transcript": "Meeting transcript text..."
}
```

Response:
```json
{
  "digest": {
    "id": "uuid",
    "transcript": "...",
    "summary": "...",
    "overview": "...",
    "key_decisions": ["..."],
    "action_items": ["..."],
    "public_id": "abc123",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/digest/list
Get a list of recent digests.

Query params:
- `limit`: Number of items (default: 10)
- `offset`: Pagination offset (default: 0)

### GET /api/digest/[id]
Get a single digest by public ID.

### POST /api/digest/stream
Create a digest with real-time streaming response (SSE).

## Database Schema

The application uses a single `digests` table with the following structure:
- `id`: UUID primary key
- `transcript`: Original meeting text
- `summary`: Full AI-generated summary
- `overview`: Brief overview
- `key_decisions`: Array of decisions
- `action_items`: Array of tasks
- `public_id`: Unique 8-character ID for sharing
- `created_at`: Timestamp

## Development Workflow

1. **Linting**: `npm run lint`
2. **Type checking**: TypeScript checks run automatically
3. **Building**: `npm run build`
4. **Production**: `npm start`

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- Google Cloud Run

## Security Considerations

- API keys are stored as environment variables
- Supabase Row Level Security can be enabled for additional protection
- Input validation on all API endpoints
- No sensitive data exposed in client-side code

## Future Enhancements

1. **User Authentication**: Add user accounts with Supabase Auth
2. **Team Collaboration**: Share digests within teams
3. **Export Options**: PDF, Markdown, or Word document exports
4. **Template Support**: Different summary formats for different meeting types
5. **Multi-language Support**: Process meetings in different languages
6. **Analytics**: Track digest usage and engagement

## Testing

While formal tests weren't implemented due to time constraints, the application has been manually tested for:
- Creating digests with various transcript lengths
- Viewing digest history
- Sharing digests via public links
- Real-time streaming functionality
- Error handling for invalid inputs
- Responsive design on different screen sizes

## Performance Optimizations

- Pagination for digest list to handle large datasets
- Indexed database columns for faster queries
- Efficient streaming implementation
- Client-side caching of digest data

## Known Limitations

1. No user authentication (by design for simplicity)
2. Rate limiting depends on Google Gemini API quotas
3. Large transcripts may take longer to process
4. Streaming may not work behind certain proxies

## Contact

This project was created as part of the work4u interview process. For any questions or feedback, please reach out through the appropriate channels.