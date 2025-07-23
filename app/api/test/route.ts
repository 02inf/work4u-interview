import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test if environment variables are set
    const envCheck = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      geminiKey: process.env.GOOGLE_GEMINI_API_KEY ? 'Set' : 'Missing',
    }

    // Test database connection
    const { data, error } = await supabase
      .from('digests')
      .select('count')
      .limit(1)

    return NextResponse.json({
      status: 'ok',
      env: envCheck,
      database: {
        connected: !error,
        error: error?.message || null,
        code: error?.code || null,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}