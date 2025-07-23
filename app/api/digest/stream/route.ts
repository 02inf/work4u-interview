import { NextRequest } from 'next/server'
import { generateDigestStream } from '@/lib/gemini'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  
  try {
    const body = await request.json()
    const { transcript } = body

    if (!transcript || transcript.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Transcript is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const stream = await generateDigestStream(transcript)
    
    let fullContent = ''
    let overview = ''
    let keyDecisions: string[] = []
    let actionItems: string[] = []

    const customReadableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text()
            fullContent += text
            
            // Send the chunk to the client
            const data = `data: ${JSON.stringify({ text })}\n\n`
            controller.enqueue(encoder.encode(data))
          }

          // Parse the full content to extract structured data
          const lines = fullContent.split('\n').filter(line => line.trim())
          let section = ''
          
          for (const line of lines) {
            if (line.toLowerCase().includes('overview') || line.toLowerCase().includes('summary')) {
              section = 'overview'
            } else if (line.toLowerCase().includes('key decision') || line.toLowerCase().includes('decision')) {
              section = 'decisions'
            } else if (line.toLowerCase().includes('action item') || line.toLowerCase().includes('task')) {
              section = 'actions'
            } else if (line.trim()) {
              if (section === 'overview' && !overview) {
                overview = line.trim()
              } else if (section === 'decisions' && line.trim().startsWith('-')) {
                keyDecisions.push(line.trim().substring(1).trim())
              } else if (section === 'actions' && line.trim().startsWith('-')) {
                actionItems.push(line.trim().substring(1).trim())
              }
            }
          }

          // Save to database
          const { data, error } = await supabase
            .from('digests')
            .insert({
              transcript,
              summary: fullContent,
              overview: overview || fullContent.substring(0, 200) + '...',
              key_decisions: keyDecisions,
              action_items: actionItems,
            })
            .select()
            .single()

          if (!error && data) {
            // Send the final digest data
            const finalData = `data: ${JSON.stringify({ digest: data, done: true })}\n\n`
            controller.enqueue(encoder.encode(finalData))
          }

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(customReadableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in stream route:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}