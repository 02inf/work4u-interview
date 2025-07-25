import type { Route } from "./+types/digest.$publicId";
import { useParams, useNavigate } from "react-router";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@tanstack/react-query";
import type { MeetingSummary } from "~/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Meeting Digest" },
    { name: "description", content: "Generate AI-powered meeting summaries" },
  ];
}

// 获取单个会议详情的函数
const fetchDigest = async (publicId: string): Promise<MeetingSummary> => {
  const response = await fetch(`http://localhost:8000/api/meetings/${publicId}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('会议摘要不存在');
    }
    throw new Error('获取摘要失败');
  }
  const digestData = await response.json();
  // 适配数据库返回的数据结构
  if (digestData.summary) {
    return {
      id: digestData.id,
      transcript: digestData.transcript,
      ...digestData.summary
    };
  }
  return digestData;
};

export default function SharedDigest() {
  const { publicId } = useParams();
  const navigate = useNavigate();

  // 使用React Query获取会议详情
  const { data: digest, isLoading, error } = useQuery({
    queryKey: ['meeting', publicId],
    queryFn: () => fetchDigest(publicId!),
    enabled: !!publicId, // 只有当publicId存在时才执行查询
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
            <p className="text-gray-600 mb-6">{error?.message || '未知错误'}</p>
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
              <span>📅 {formatDate(digest.created_at || digest.date)}</span>
              {digest.duration && <span>⏱️ {digest.duration}</span>}
              <span>👥 {digest.participants.join(', ')}</span>
            </div>
          </div>

          <div className="space-y-6">
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