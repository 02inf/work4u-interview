import { NextRequest, NextResponse } from 'next/server'
import { CreateDigestRequest, CreateDigestResponse } from '@/types/digest'

export async function POST(request: NextRequest) {
  console.log('API /api/digest/create called')
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasGeminiKey: !!process.env.GOOGLE_GEMINI_API_KEY
  })
  
  try {
    // Dynamic imports to better handle errors
    const { supabase } = await import('@/lib/supabase').catch(err => {
      console.error('Failed to import supabase:', err)
      throw new Error('Failed to load database module')
    })
    
    const { generateDigest } = await import('@/lib/gemini').catch(err => {
      console.error('Failed to import gemini:', err)
      throw new Error('Failed to load AI module')
    })
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
      console.error('Supabase insert error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to save digest' },
        { status: 500 }
      )
    }

    const response: CreateDigestResponse = { digest: data }
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating digest:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}