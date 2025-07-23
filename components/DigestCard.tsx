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
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-base font-medium text-gray-800">
          Meeting Summary
        </h3>
        <time className="text-xs text-gray-500">
          {formattedDate}
        </time>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {digest.overview}
      </p>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{digest.key_decisions.length} decisions</span>
          <span>•</span>
          <span>{digest.action_items.length} action items</span>
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
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.316C18.886 16.062 19 16.518 19 17c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3c.482 0 .938.114 1.342.316m0 0a3 3 0 00-4.316-4.316" />
                  </svg>
                )}
              </button>
              <Link
                href={`/digest/${digest.public_id}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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