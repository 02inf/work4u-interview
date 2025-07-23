import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasGeminiKey: !!process.env.GOOGLE_GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
  }

  // Test Supabase connection
  let supabaseStatus = 'not tested'
  try {
    const { supabase } = await import('@/lib/supabase')
    const { error } = await supabase.from('digests').select('count', { count: 'exact' })
    supabaseStatus = error ? `Error: ${error.message}` : 'Connected'
  } catch (e) {
    supabaseStatus = `Exception: ${e instanceof Error ? e.message : String(e)}`
  }

  // Test Gemini API
  let geminiStatus = 'not tested'
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      geminiStatus = 'API key present'
    } else {
      geminiStatus = 'API key missing'
    }
  } catch (e) {
    geminiStatus = `Exception: ${e instanceof Error ? e.message : String(e)}`
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    services: {
      supabase: supabaseStatus,
      gemini: geminiStatus,
    }
  })
}