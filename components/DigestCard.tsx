import { Digest } from '@/types/digest'
import Link from 'next/link'

interface DigestCardProps {
  digest: Digest
}

export default function DigestCard({ digest }: DigestCardProps) {
  const formattedDate = new Date(digest.created_at).toLocaleString()
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Meeting Summary
        </h3>
        <time className="text-sm text-gray-500">{formattedDate}</time>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-3">{digest.overview}</p>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{digest.key_decisions.length} decisions</span>
          <span>{digest.action_items.length} action items</span>
        </div>
        
        {digest.public_id && (
          <Link
            href={`/digest/${digest.public_id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details →
          </Link>
        )}
      </div>
    </div>
  )
}