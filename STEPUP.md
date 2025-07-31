# Meeting Digest

A full-stack web application that transforms meeting transcripts into structured AI-generated summaries using Google Gemini AI.

## Features

- **AI-Powered Summarization**: Converts raw meeting transcripts into structured summaries with key decisions and action items
- **Clean UI**: Modern, responsive interface built with Next.js and Tailwind CSS
- **Digest History**: View and manage all previously generated digests
- **Shareable Links**: Share digests with others via unique URLs
- **Real-time Processing**: Fast AI processing with loading states

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **AI**: Google Gemini API
- **UI Components**: Radix UI, Lucide React
- **Package Manager**: pnpm

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meeting_digest
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Add your Google Gemini API key to the `.env` file:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   ```
   
   Get your API key from: https://makersuite.google.com/app/apikey

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

1. **Generate a Digest**: Paste your meeting transcript in the text area and click "Generate Digest"
2. **View Summary**: The AI will generate a structured summary with:
   - Brief meeting overview
   - Key decisions made
   - Action items assigned
3. **Share**: Click the "Share" button to copy a shareable link
4. **History**: View all previously generated digests in the history section

## API Endpoints

- `POST /api/digests` - Create a new digest
- `GET /api/digests` - Get all digests
- `GET /api/digests/[publicId]` - Get a specific digest by public ID

## Database Schema

The application uses a simple SQLite database with the following model:

```prisma
model Digest {
  id                 String   @id @default(cuid())
  publicId           String   @unique
  originalTranscript String
  summary            String
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
