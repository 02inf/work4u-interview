import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('digests')
      .select('*')
      .eq('public_id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Digest not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ digest: data })
  } catch (error) {
    console.error('Error fetching digest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}