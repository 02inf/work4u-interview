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
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-5 border border-gray-100 hover:border-blue-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-base font-semibold text-gray-800">
          Meeting Summary
        </h3>
        <time className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
          {formattedDate}
        </time>
      </div>
      
      <p className="text-sm text-gray-600 mb-4 leading-relaxed whitespace-pre-wrap">
        {digest.overview}
      </p>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1 text-green-700">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {digest.key_decisions.length} decisions
          </span>
          <span className="flex items-center gap-1 text-blue-700">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2 1 1 0 100-2 2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
            </svg>
            {digest.action_items.length} actions
          </span>
        </div>
        
        <div className="flex gap-2 items-center">
          {digest.public_id && (
            <>
              <button
                onClick={copyShareLink}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Copy share link"
              >
                {copied ? (
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.316C18.886 16.062 19 16.518 19 17c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3c.482 0 .938.114 1.342.316m0 0a3 3 0 00-4.316-4.316" />
                  </svg>
                )}
              </button>
              <Link
                href={`/digest/${digest.public_id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
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