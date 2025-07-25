import type { Route } from "./+types/digest.$publicId";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Shared Digest - AI Meeting Digest" },
    { name: "description", content: "View a shared meeting summary" },
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

export default function SharedDigest() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const [digest, setDigest] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDigest = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/digest/${publicId}`);
        if (response.ok) {
          const digestData = await response.json();
          setDigest(digestData);
        } else if (response.status === 404) {
          setError('分享链接无效或摘要不存在');
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
    return new Date(dateString).toLocaleDateString('zh-CN', {
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
            返回
          </button>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">无法访问摘要</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              返回首页
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
          返回
        </button>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{digest.title}</h1>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                分享的摘要
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <span>📅 {formatDate(digest.date)}</span>
              {digest.duration && <span>⏱️ {digest.duration}</span>}
              <span>👥 {digest.participants.join(', ')}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-blue-600 mr-2">🎯</span>
                关键要点
              </h2>
              <ul className="space-y-2">
                {digest.key_points.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                决策事项
              </h2>
              <ul className="space-y-2">
                {digest.decisions.map((decision, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{decision}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-orange-600 mr-2">📋</span>
                行动项
              </h2>
              <ul className="space-y-2">
                {digest.action_items.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-600 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-purple-600 mr-2">🚀</span>
                下一步行动
              </h2>
              <ul className="space-y-2">
                {digest.next_steps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-600 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-gray-600 mr-2">📝</span>
                会议记录
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {digest.transcript}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-4">
              这是一个分享的会议摘要，由 AI Meeting Digest 生成
            </p>
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              创建你自己的摘要
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}