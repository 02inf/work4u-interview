import type { Route } from "./+types/history";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Digest History - AI Meeting Digest" },
    { name: "description", content: "View your previous meeting summaries" },
  ];
}

interface MeetingSummary {
  id: string;
  title: string;
  date: string;
  participants: string[];
  key_points: string[];
  action_items: string[];
  decisions: string[];
  next_steps: string[];
  duration?: string;
  transcript: string;
  public_id?: string;
}

export default function History() {
  const [digests, setDigests] = useState<MeetingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/meetings');
        if (response.ok) {
          const meetings = await response.json();
          setDigests(meetings);
        } else {
          console.error('Failed to fetch meetings');
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = async (digest: MeetingSummary, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    if (!digest.public_id) {
      alert('该摘要暂不支持分享');
      return;
    }

    const shareUrl = `${window.location.origin}/digest/${digest.public_id}`;
    
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
    if (digest.public_id) {
      navigate(`/digest/${digest.public_id}`);
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
            <p className="text-gray-600 mb-4">暂无会议摘要记录</p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              创建第一个摘要
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
                      <span>📅 {formatDate(digest.date)}</span>
                      {digest.duration && <span>⏱️ {digest.duration}</span>}
                      <span>👥 {digest.participants.join(', ')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleShare(digest, e)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
                    disabled={!digest.public_id}
                  >
                    {copiedId === digest.id ? (
                      <>
                        <span className="text-green-600">✓</span>
                        已复制
                      </>
                    ) : (
                      <>
                        <span>🔗</span>
                        分享
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-1">🎯 关键要点</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {digest.key_points.slice(0, 2).map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {point}
                      </li>
                    ))}
                    {digest.key_points.length > 2 && (
                      <li className="text-gray-500 text-xs">
                        +{digest.key_points.length - 2} 更多
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">✅ 决策事项</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {digest.decisions.slice(0, 2).map((decision, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          {decision}
                        </li>
                      ))}
                      {digest.decisions.length > 2 && (
                        <li className="text-gray-500 text-xs">
                          +{digest.decisions.length - 2} 更多
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">📋 行动项</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {digest.action_items.slice(0, 2).map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-600 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                      {digest.action_items.length > 2 && (
                        <li className="text-gray-500 text-xs">
                          +{digest.action_items.length - 2} 更多
                        </li>
                      )}
                    </ul>
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