import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function generateDigest(transcript: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `
You are an AI assistant that creates structured meeting summaries. Given the following meeting transcript, generate a comprehensive digest with:

1. Overview: A brief 2-3 sentence summary of the meeting
2. Key Decisions: An array of important decisions made during the meeting
3. Action Items: An array of specific tasks assigned with owners if mentioned

Meeting Transcript:
${transcript}

Respond in the following JSON format:
{
  "overview": "Brief summary here",
  "key_decisions": ["Decision 1", "Decision 2"],
  "action_items": ["Action item 1", "Action item 2"]
}
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid response format')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    return {
      overview: parsed.overview || '',
      key_decisions: parsed.key_decisions || [],
      action_items: parsed.action_items || [],
      summary: `${parsed.overview}\n\nKey Decisions:\n${parsed.key_decisions.map((d: string) => `- ${d}`).join('\n')}\n\nAction Items:\n${parsed.action_items.map((a: string) => `- ${a}`).join('\n')}`
    }
  } catch (error) {
    console.error('Error generating digest:', error)
    throw new Error('Failed to generate digest')
  }
}

export async function generateDigestStream(transcript: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `
You are an AI assistant that creates structured meeting summaries. Given the following meeting transcript, generate a comprehensive digest.

Start with an overview paragraph, then list key decisions, and finally list action items.

Meeting Transcript:
${transcript}
`

  const result = await model.generateContentStream(prompt)
  return result.stream
}