import type { Route } from "./+types/history";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MeetingSummary } from "~/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Digest History - AI Meeting Digest" },
    { name: "description", content: "View your previous meeting summaries" },
  ];
}

// 获取会议列表的函数
const fetchMeetings = async (): Promise<MeetingSummary[]> => {
  const response = await fetch('http://localhost:8000/api/meetings');
  if (!response.ok) {
    throw new Error('Failed to fetch meetings');
  }
  const data = await response.json();
  return data.meetings || [];
};

export default function History() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 使用React Query获取会议数据
  const { data: digests = [], isLoading, error } = useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
    staleTime: 1000,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = async (digest: MeetingSummary, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    if (!digest.id) {
      alert('This digest is not shareable.');
      return;
    }

    const shareUrl = `${window.location.origin}/digest/${digest.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(digest.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // 如果剪贴板API不可用，使用fallback方法
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(digest.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCardClick = (digest: MeetingSummary) => {
    navigate(`/digest/${digest.id}`);
  };

  const handleDelete = async (digest: MeetingSummary, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    
    if (!confirm(`Are you sure you want to delete "${digest.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/meetings/${digest.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // 使用React Query的缓存更新机制
        queryClient.setQueryData(['meetings'], (oldData: MeetingSummary[] | undefined) => {
          return oldData ? oldData.filter(d => d.id !== digest.id) : [];
        });
      } else {
        alert('Delete failed. Please try again later.');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed. Please try again later.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your digest history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Digest History
            </h1>
            <p className="text-lg text-gray-600">
              Review your previous meeting summaries
            </p>
          </div>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Digest
          </Link>
        </div>

        {digests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No digests available</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create New Digest
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {digests.map((digest) => (
              <div 
                key={digest.id} 
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleCardClick(digest)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {digest.title}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>📅 {formatDate(digest.created_at || digest.date)}</span>
                      {digest.duration && <span>⏱️ {digest.duration}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleShare(digest, e)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
                      disabled={!digest.id}
                    >
                      {copiedId === digest.id ? (
                        <>
                          <span className="text-green-600">✓</span>
                          Copied
                        </>
                      ) : (
                        <>
                          <span>🔗</span>
                          Share
                        </>
                      )}
                    </button>
                    <button 
                      onClick={(e) => handleDelete(digest, e)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 transition-colors"
                      title="Delete Digest"
                    >
                      <span>🗑️</span>
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700">
                  <div className="overflow-hidden markdown-content" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {digest.natural_summary ? (
                      <ReactMarkdown>{digest.natural_summary}</ReactMarkdown>
                    ) : (
                      'No summary available'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}