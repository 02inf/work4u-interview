import { useState } from 'react'
import { Digest } from '@/types/digest'

interface StreamingDigestProps {
  onComplete: (digest: Digest) => void
}

export default function StreamingDigest({ onComplete }: StreamingDigestProps) {
  const [transcript, setTranscript] = useState('')
  const [streamedContent, setStreamedContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateStreamingDigest = async () => {
    if (!transcript.trim()) {
      setError('Please enter a meeting transcript')
      return
    }

    setIsStreaming(true)
    setStreamedContent('')
    setError(null)

    try {
      const response = await fetch('/api/digest/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) throw new Error('Failed to generate digest')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.text) {
                setStreamedContent(prev => prev + data.text)
              }
              
              if (data.done && data.digest) {
                onComplete(data.digest)
                setTranscript('')
                setStreamedContent('')
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (err) {
      setError('Failed to generate digest. Please try again.')
      console.error(err)
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        New Meeting Transcript (with Streaming)
      </h2>
      
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste your meeting transcript here..."
        className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={isStreaming}
      />

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={generateStreamingDigest}
        disabled={isStreaming || !transcript.trim()}
        className="mt-4 w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isStreaming ? 'Generating...' : 'Generate with Streaming'}
      </button>

      {streamedContent && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
          <h3 className="font-medium mb-2">Generating Summary...</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{streamedContent}</p>
        </div>
      )}
    </div>
  )
}