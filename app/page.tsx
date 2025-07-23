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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            AI Meeting Digest
          </h1>
          <p className="text-xl text-gray-700">
            Transform your meeting transcripts into actionable summaries with AI
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">New Meeting Transcript</h2>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-600">Stream output</span>
              </label>
            </div>
            
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              className="w-full h-72 p-5 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
              disabled={isGenerating}
            />

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={generateDigest}
              disabled={isGenerating || !transcript.trim()}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : 'Generate Digest'}
            </button>

            {/* Streaming Output Display */}
            {streamingContent && (
              <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">AI is generating your digest...</h3>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700">{streamingContent}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Recent Digests */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Recent Digests</h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <div className="animate-ping absolute inset-0 rounded-full h-12 w-12 border border-blue-400 opacity-20"></div>
                </div>
              </div>
            ) : digests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg">
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
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  )
}