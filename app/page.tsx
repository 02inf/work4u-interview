'use client'

import { useState, useEffect } from 'react'
import { Digest } from '@/types/digest'
import DigestCard from '@/components/DigestCard'

export default function Home() {
  const [transcript, setTranscript] = useState('')
  const [digests, setDigests] = useState<Digest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [useStreaming, setUseStreaming] = useState(true)

  useEffect(() => {
    fetchDigests()
  }, [])

  const fetchDigests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/digest/list')
      if (!response.ok) throw new Error('Failed to fetch digests')
      const data = await response.json()
      setDigests(data.digests)
    } catch (err) {
      setError('Failed to load digests')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const generateDigest = async () => {
    if (!transcript.trim()) {
      setError('Please enter a meeting transcript')
      return
    }

    setIsGenerating(true)
    setError(null)
    setStreamingContent('')

    if (useStreaming) {
      // Stream the response
      try {
        const response = await fetch('/api/digest/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        })

        if (!response.ok) throw new Error('Failed to generate digest')

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error('No reader available')

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.text) {
                  setStreamingContent(prev => prev + data.text)
                }
                if (data.done && data.digest) {
                  setDigests([data.digest, ...digests])
                  setTranscript('')
                  setTimeout(() => setStreamingContent(''), 3000)
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (err) {
        setError('Failed to generate digest. Please try again.')
        console.error(err)
      } finally {
        setIsGenerating(false)
      }
    } else {
      // Non-streaming response
      try {
        const response = await fetch('/api/digest/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        })

        if (!response.ok) throw new Error('Failed to generate digest')
        
        const data = await response.json()
        setDigests([data.digest, ...digests])
        setTranscript('')
      } catch (err) {
        setError('Failed to generate digest. Please try again.')
        console.error(err)
      } finally {
        setIsGenerating(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI Meeting Digest
          </h1>
          <p className="text-lg text-gray-600">
            Transform your meeting transcripts into actionable summaries
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">New Meeting Transcript</h2>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 transition-colors">
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                />
                <span className="text-gray-600">Stream output</span>
              </label>
            </div>
            
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here...\n\nExample:\nJohn: Let's discuss our Q4 priorities...\nSarah: I think we should focus on..."
              className="w-full min-h-[400px] p-6 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base leading-relaxed bg-gray-50 focus:bg-white"
              disabled={isGenerating}
            />

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={generateDigest}
              disabled={isGenerating || !transcript.trim()}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isGenerating ? 'Generating...' : 'Generate Digest'}
            </button>

            {/* Streaming Output Display */}
            {streamingContent && (
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  AI is generating your digest...
                </h3>
                <div className="text-sm text-gray-700 leading-relaxed">
                  <pre className="whitespace-pre-wrap font-sans">{streamingContent}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Recent Digests */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Digests</h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-400 animate-pulse">Loading digests...</p>
              </div>
            ) : digests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <p className="text-gray-500">
                  No digests yet. Create your first one!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {digests.map((digest) => (
                  <DigestCard key={digest.id} digest={digest} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
      `}</style>
    </div>
  )
}