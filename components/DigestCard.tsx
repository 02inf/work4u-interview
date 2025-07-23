import { Digest } from '@/types/digest'
import Link from 'next/link'
import { useState } from 'react'

interface DigestCardProps {
  digest: Digest
}

export default function DigestCard({ digest }: DigestCardProps) {
  const [copied, setCopied] = useState(false)
  const formattedDate = new Date(digest.created_at).toLocaleString()
  
  const copyShareLink = async () => {
    if (digest.public_id) {
      const url = `${window.location.origin}/digest/${digest.public_id}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Meeting Summary
        </h3>
        <time className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {formattedDate}
        </time>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
        {digest.overview}
      </p>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600">{digest.key_decisions.length} decisions</span>
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-gray-600">{digest.action_items.length} action items</span>
          </span>
        </div>
        
        <div className="flex gap-2">
          {digest.public_id && (
            <>
              <button
                onClick={copyShareLink}
                className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Copy share link"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.316C18.886 16.062 19 16.518 19 17c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3c.482 0 .938.114 1.342.316m0 0a3 3 0 00-4.316-4.316" />
                  </svg>
                )}
              </button>
              <Link
                href={`/digest/${digest.public_id}`}
                className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                View Details →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}