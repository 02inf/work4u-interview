import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDigest } from '@/lib/gemini';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Generate digest using Gemini AI
    const summary = await generateDigest(transcript);

    // Create a unique public ID for sharing
    const publicId = uuidv4();

    // Save to database
    const digest = await prisma.digest.create({
      data: {
        publicId,
        originalTranscript: transcript,
        summary,
      },
    });

    return NextResponse.json({
      id: digest.id,
      publicId: digest.publicId,
      summary: digest.summary,
      createdAt: digest.createdAt,
    });
  } catch (error) {
    console.error('Error generating digest:', error);
    return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const digests = await prisma.digest.findMany({
      select: {
        id: true,
        publicId: true,
        summary: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(digests);
  } catch (error) {
    console.error('Error fetching digests:', error);
    return NextResponse.json({ error: 'Failed to fetch digests' }, { status: 500 });
  }
}
