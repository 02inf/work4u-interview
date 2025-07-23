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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Meeting Digest
          </h1>
          <p className="text-lg text-gray-600">
            Transform your meeting transcripts into actionable summaries
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">New Meeting Transcript</h2>
            
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isGenerating}
            />

            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            <button
              onClick={generateDigest}
              disabled={isGenerating || !transcript.trim()}
              className="mt-4 w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate Digest'}
            </button>
          </div>

          {/* Recent Digests */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Digests</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : digests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No digests yet. Create your first one!
              </p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {digests.map((digest) => (
                  <DigestCard key={digest.id} digest={digest} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}