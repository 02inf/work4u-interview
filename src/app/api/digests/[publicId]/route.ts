import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;

    const digest = await prisma.digest.findUnique({
      where: {
        publicId: publicId,
      },
      select: {
        id: true,
        publicId: true,
        summary: true,
        createdAt: true,
      },
    });

    if (!digest) {
      return NextResponse.json({ error: 'Digest not found' }, { status: 404 });
    }

    return NextResponse.json(digest);
  } catch (error) {
    console.error('Error fetching digest:', error);
    return NextResponse.json({ error: 'Failed to fetch digest' }, { status: 500 });
  }
}
