import { NextRequest, NextResponse } from 'next/server'
import { ListDigestsResponse } from '@/types/digest'

export async function GET(request: NextRequest) {
  console.log('API /api/digest/list called')
  console.log('Environment check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
  
  try {
    // Dynamic import to better handle errors
    const { supabase } = await import('@/lib/supabase').catch(err => {
      console.error('Failed to import supabase:', err)
      throw new Error('Failed to load database module')
    })
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error } = await supabase
      .from('digests')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase query error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to fetch digests' },
        { status: 500 }
      )
    }

    const response: ListDigestsResponse = { digests: data || [] }
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching digests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}