import type { Route } from "./+types/home";
import { useState } from "react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "AI Meeting Digest" },
    { name: "description", content: "Generate AI-powered meeting summaries" },
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
}

interface ApiResponse {
  success: boolean;
  summary?: MeetingSummary;
  error?: string;
}

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDigest = async () => {
    if (!transcript.trim()) {
      setError("请输入会议转录文本");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success && data.summary) {
        setSummary(data.summary);
      } else {
        setError(data.error || "生成摘要失败");
      }
    } catch (err) {
      console.error('API Error:', err);
      setError("连接服务器失败，请确保后端服务正在运行");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Meeting Digest
            </h1>
            <p className="text-lg text-gray-600">
              Transform your meeting transcripts into structured summaries
            </p>
          </div>
          <Link
            to="/history"
            className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
          >
            View History
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Transcript
          </label>
          <textarea
             id="transcript"
             value={transcript}
             onChange={(e) => setTranscript(e.target.value)}
             placeholder="Paste your meeting transcript here..."
             className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 bg-white"
           />
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          
          <button
            onClick={handleGenerateDigest}
            disabled={isLoading}
            className="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Generating Digest..." : "Generate Digest"}
          </button>
        </div>

        {summary && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Meeting Summary</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Overview</h3>
              <p className="text-gray-700 leading-relaxed">{summary.overview}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Decisions</h3>
              <ul className="list-disc list-inside space-y-1">
                {summary.keyDecisions.map((decision, index) => (
                  <li key={index} className="text-gray-700">{decision}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Action Items</h3>
              <ul className="list-disc list-inside space-y-1">
                {summary.actionItems.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
