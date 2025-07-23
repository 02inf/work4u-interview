import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ListDigestsResponse } from '@/types/digest'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error } = await supabase
      .from('digests')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
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