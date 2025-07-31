import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { validateApiConnection, retryWithBackoff } from '@/lib/network-utils';

export async function GET() {
  try {
    console.log('Testing Google GenAI connection...');

    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.trim() === '') {
      return NextResponse.json({ error: 'Google API key not configured or empty' }, { status: 500 });
    }

    const apiKey = process.env.GOOGLE_API_KEY.trim();

    // First, validate API connection
    const validation = await validateApiConnection(apiKey);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'API validation failed',
          details: validation.error,
        },
        { status: 500 }
      );
    }

    // Initialize AI client
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 15000, // 15 second timeout
      },
    });

    // Test with retry mechanism
    const response = await retryWithBackoff(
      async () => {
        return await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: 'Say "Hello from Gemini!"',
        });
      },
      3,
      1000
    );

    // Extract text from the response
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || 'No response';

    console.log('GenAI response received successfully');

    return NextResponse.json({
      success: true,
      message: 'GenAI connection successful',
      response: text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GenAI test error:', error);

    let errorMessage = 'GenAI connection failed';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
        statusCode = 503;
      } else if (error.message.includes('401') || error.message.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your Google API configuration.';
        statusCode = 401;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        statusCode = 408;
      } else if (error.message.includes('429') || error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later.';
        statusCode = 429;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}
