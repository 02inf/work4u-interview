# Copilot Instructions for Meeting Digest Application

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a full-stack meeting digest application built with Next.js 14, TypeScript, Tailwind CSS, and Google Gemini AI. The application processes meeting transcripts and generates structured summaries.

## Key Technologies
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma ORM
- **AI**: Google Gemini AI for transcript processing
- **Package Manager**: pnpm
- **UI Components**: Radix UI and Lucide React icons

## Code Style Guidelines
- Use TypeScript for all files
- Follow Next.js 14 App Router patterns
- Use Tailwind CSS for styling
- Implement proper error handling and loading states
- Use React Server Components where appropriate
- Follow RESTful API design principles

## Database Schema
The application uses Prisma with SQLite and includes:
- Digest model with id, originalTranscript, summary, createdAt, publicId
- Proper indexing for performance

## AI Integration
- Use Google Gemini AI for transcript processing
- Implement structured prompts for consistent output format
- Support for streaming responses (bonus feature)

## Features to Implement
1. Core features: transcript input, AI digest generation, summary display, history view
2. Bonus features: shareable links, real-time streaming responses
3. Responsive design with modern UI components
4. Proper error handling and loading states
