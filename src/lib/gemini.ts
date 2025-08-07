import { GoogleGenAI } from '@google/genai';

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is not configured');
}

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export const generateDigest = async (transcript: string) => {
  const prompt = `
You are an expert meeting analyzer. Please analyze the following meeting transcript and provide a structured summary in the following format:

## Meeting Overview
[Provide a brief, one-paragraph overview of the meeting]

## Key Decisions
[List the key decisions made during the meeting as bullet points]

## Action Items
[List the action items assigned and to whom as bullet points]

Please ensure the summary is clear, concise, and well-structured. If no decisions or action items are mentioned, state "None identified" for those sections.

Transcript:
${transcript}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  });

  return response.text || 'No response generated';
};
