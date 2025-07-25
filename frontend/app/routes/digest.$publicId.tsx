import type { Route } from "./+types/digest.$publicId";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "会议详情 - AI Meeting Digest" },
    { name: "description", content: "查看会议摘要详情" },
  ];
}

interface AgendaItem {
  topic: string;
  update: string;
  blockers: string;
  action: string;
  responsible: string[];
  deadline: string;
  requires_approval: boolean;
}

interface MeetingSummary {
  id: string;
  title: string;
  date: string;
  participants: string[];
  agenda?: AgendaItem[];
  key_metrics?: string[];
  next_meeting?: string;
  duration?: string;
  transcript: string;
  public_id?: string;
  natural_summary?: string;
}

export default function SharedDigest() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const [digest, setDigest] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDigest = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/meetings/${publicId}`);
        if (response.ok) {
          const digestData = await response.json();
          // 适配数据库返回的数据结构
          if (digestData.summary) {
            setDigest({
              id: digestData.id,
              transcript: digestData.transcript,
              ...digestData.summary
            });
          } else {
            setDigest(digestData);
          }
        } else if (response.status === 404) {
          setError('会议摘要不存在');
        } else {
          setError('获取摘要失败');
        }
      } catch (error) {
        console.error('Error fetching digest:', error);
        setError('网络错误，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    if (publicId) {
      fetchDigest();
    }
  }, [publicId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button 
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span className="mr-2">←</span>
            返回
          </button>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading shared digest...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button 
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span className="mr-2">←</span>
            Back
          </button>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unavailable Digest</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!digest) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="mr-2">←</span>
          Back
        </button>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{digest.title}</h1>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <span>📅 {formatDate(digest.date)}</span>
              {digest.duration && <span>⏱️ {digest.duration}</span>}
              <span>👥 {digest.participants.join(', ')}</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* 自然语言摘要 */}
            {digest.natural_summary && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-blue-600 mr-2">📄</span>
                  Meeting Summary
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="markdown-content">
                    <ReactMarkdown>{digest.natural_summary}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* 新的议程结构显示 */}
            {digest.agenda && digest.agenda.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-blue-600 mr-2">📋</span>
                  Meeting Agenda
                </h2>
                <div className="space-y-4">
                  {digest.agenda.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-2">{item.topic}</h3>
                      {item.update && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-green-600">Progress: </span>
                          <span className="text-gray-700">{item.update}</span>
                        </div>
                      )}
                      {item.blockers && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-600">Blockers: </span>
                          <span className="text-gray-700">{item.blockers}</span>
                        </div>
                      )}
                      {item.action && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-orange-600">Action: </span>
                          <span className="text-gray-700">{item.action}</span>
                        </div>
                      )}
                      {item.responsible && item.responsible.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-blue-600">Responsible: </span>
                          <span className="text-gray-700">{item.responsible.join(', ')}</span>
                        </div>
                      )}
                      {item.deadline && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-purple-600">Deadline: </span>
                          <span className="text-gray-700">{item.deadline}</span>
                        </div>
                      )}
                      {item.requires_approval && (
                        <div className="mb-2">
                          <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                            Requires Approval
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 关键指标 */}
            {digest.key_metrics && digest.key_metrics.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-green-600 mr-2">📊</span>
                  Key Metrics
                </h2>
                <ul className="space-y-2">
                  {digest.key_metrics.map((metric, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1">•</span>
                      <div className="text-gray-700">{metric}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}



            {/* 下次会议安排 */}
            {digest.next_meeting && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-purple-600 mr-2">📅</span>
                  Next Meeting
                </h2>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-gray-700">{digest.next_meeting}</p>
                </div>
              </div>
            )}



            {/* 会议记录section */}
            {digest.transcript && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-gray-600 mr-2">📝</span>
                  Transcript
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {digest.transcript}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Meeting Digest is generated by AI Meeting Digest
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/history"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back To History
              </a>
              <a
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create New Digest
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}