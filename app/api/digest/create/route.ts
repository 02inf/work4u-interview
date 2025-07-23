import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateDigest } from '@/lib/gemini'
import { CreateDigestRequest, CreateDigestResponse } from '@/types/digest'

export async function POST(request: NextRequest) {
  try {
    const body: CreateDigestRequest = await request.json()
    const { transcript } = body

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    // Generate digest using Gemini API
    const digestResult = await generateDigest(transcript)

    // Save to database
    const { data, error } = await supabase
      .from('digests')
      .insert({
        transcript,
        summary: digestResult.summary,
        overview: digestResult.overview,
        key_decisions: digestResult.key_decisions,
        action_items: digestResult.action_items,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save digest' },
        { status: 500 }
      )
    }

    const response: CreateDigestResponse = { digest: data }
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating digest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}