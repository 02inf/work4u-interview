import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { shouldUseMockResponse, createMockStreamingResponse } from '@/lib/mock-responses';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || transcript.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Transcript is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if API key is configured
    if (!process.env.GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Google API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
You are an expert meeting analyzer. Please analyze the following meeting transcript and provide a structured summary in the following format:

## Meeting Overview
[Provide a brief, one-paragraph overview of the meeting]

## Key Decisions
[List the key decisions made during the meeting as bullet points]

## Action Items
[List the action items assigned and to whom as bullet points]

Please ensure the summary is clear, concise, and well-structured. If no decisions or action items are mentioned, state "None identified" for those sections.

Transcript:
${transcript}
`;

    // Create a unique public ID for sharing
    const publicId = uuidv4();

    // Check if we should use mock responses (for offline testing)
    if (shouldUseMockResponse()) {
      console.log('Using mock responses for offline testing');

      const encoder = new TextEncoder();
      let fullSummary = '';

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send initial event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', publicId })}\n\n`));

            // Process mock streaming response
            for await (const chunk of createMockStreamingResponse()) {
              const chunkText = chunk.text;
              if (chunkText) {
                fullSummary += chunkText;

                // Send chunk event
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`)
                );
              }
            }

            // Save to database
            const digest = await prisma.digest.create({
              data: {
                publicId,
                originalTranscript: transcript,
                summary: fullSummary,
              },
            });

            // Send completion event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'complete',
                  digest: {
                    id: digest.id,
                    publicId: digest.publicId,
                    summary: digest.summary,
                    createdAt: digest.createdAt.toISOString(),
                  },
                })}\n\n`
              )
            );

            controller.close();
          } catch (error) {
            console.error('Mock streaming error:', error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  message: 'Failed to generate digest (mock mode)',
                })}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Original implementation for online mode
    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    let fullSummary = '';
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Validate API key
          if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.trim() === '') {
            throw new Error('Google API key is not configured or empty');
          }

          // Initialize Google GenAI client with timeout and retry options
          const ai = new GoogleGenAI({
            apiKey: process.env.GOOGLE_API_KEY.trim(),
            httpOptions: {
              timeout: 30000, // 30 second timeout
            },
          });

          // Send initial event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', publicId })}\n\n`));

          // Generate streaming content with retry mechanism
          let response;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              response = await ai.models.generateContentStream({
                model: 'gemini-2.0-flash',
                contents: prompt,
                config: {
                  maxOutputTokens: 2048,
                  temperature: 0.7,
                },
              });
              break; // Success, exit retry loop
            } catch (err) {
              retryCount++;
              console.warn(`API call attempt ${retryCount} failed:`, err);

              if (retryCount >= maxRetries) {
                throw err; // Max retries reached, throw the error
              }

              // Wait before retry (exponential backoff)
              await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
          }

          if (!response) {
            throw new Error('Failed to get response after retries');
          }

          // Process streaming response
          for await (const chunk of response) {
            const chunkText = chunk.text;
            if (chunkText) {
              fullSummary += chunkText;

              // Send chunk event
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunkText })}\n\n`));
            }
          }

          // Ensure we have some content
          if (!fullSummary.trim()) {
            throw new Error('No content generated from the model');
          }

          // Save to database
          const digest = await prisma.digest.create({
            data: {
              publicId,
              originalTranscript: transcript,
              summary: fullSummary,
            },
          });

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                digest: {
                  id: digest.id,
                  publicId: digest.publicId,
                  summary: digest.summary,
                  createdAt: digest.createdAt.toISOString(),
                },
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);

          let errorMessage = 'Failed to generate digest';
          if (error instanceof Error) {
            if (error.message.includes('fetch failed') || error.message.includes('network')) {
              errorMessage = 'Network connection failed. Please check your internet connection and try again.';
            } else if (
              error.message.includes('API key') ||
              error.message.includes('unauthorized') ||
              error.message.includes('401')
            ) {
              errorMessage = 'Invalid API key. Please check your Google API configuration.';
            } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
              errorMessage = 'Request timed out. Please try again with a shorter transcript.';
            } else if (error.message.includes('quota') || error.message.includes('429')) {
              errorMessage = 'API quota exceeded. Please try again later.';
            } else if (error.message.includes('model') || error.message.includes('400')) {
              errorMessage = 'Invalid request format. Please check your input.';
            } else {
              errorMessage = `Error: ${error.message}`;
            }
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                message: errorMessage,
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in streaming endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
