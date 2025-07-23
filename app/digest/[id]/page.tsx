'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Digest } from '@/types/digest'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DigestPage() {
  const params = useParams()
  const router = useRouter()
  const [digest, setDigest] = useState<Digest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchDigest(params.id as string)
    }
  }, [params.id])

  const fetchDigest = async (id: string) => {
    try {
      const response = await fetch(`/api/digest/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Digest not found')
        } else {
          throw new Error('Failed to fetch digest')
        }
        return
      }
      const data = await response.json()
      setDigest(data.digest)
    } catch (err) {
      setError('Failed to load digest')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const copyShareLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  if (error || !digest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {error || 'Digest not found'}
          </h1>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  const formattedDate = new Date(digest.created_at).toLocaleString()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <ThemeToggle />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            ← Back to home
          </Link>
          <button
            onClick={copyShareLink}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            {copied ? '✓ Copied!' : 'Share'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors duration-300">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Meeting Summary
            </h1>
            <time className="text-gray-500 dark:text-gray-400">{formattedDate}</time>
          </header>

          {/* Overview */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Overview</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{digest.overview}</p>
          </section>

          {/* Key Decisions */}
          {digest.key_decisions.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Key Decisions
              </h2>
              <ul className="space-y-2">
                {digest.key_decisions.map((decision, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{decision}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Items */}
          {digest.action_items.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Action Items
              </h2>
              <ul className="space-y-2">
                {digest.action_items.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Original Transcript */}
          <details className="mt-8 border-t dark:border-gray-700 pt-8">
            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium">
              View Original Transcript
            </summary>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{digest.transcript}</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}