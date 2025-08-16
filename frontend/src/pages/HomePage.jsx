import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function HomePage() {
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const handleGenerate = async () => {
    if (!transcript.trim()) return;
    setSummary("");
    setShareLink("");
    setIsLoading(true);

    try {
      // 1. Send transcript to backend to create a summary record
      const res = await fetch(`${API_BASE}/summaries`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ transcript })
      });
      const data = await res.json();
      const { id, public_id } = data;
      if (!id) throw new Error("Failed to create summary task");

      // 2. Open SSE connection for streaming summary
      const evtSource = new EventSource(`${API_BASE}/summaries/${id}/stream`);
      evtSource.onmessage = (event) => {
        if (event.data === "[DONE]") {
          // Streaming finished
          evtSource.close();
          setIsLoading(false);
          // Prepare shareable link (frontend route)
          if (public_id) {
            const url = `${window.location.origin}/digest/${public_id}`;
            setShareLink(url);
          }
        } else {
          // Append incoming chunk to summary text
          setSummary(prev => prev + event.data);
        }
      };
      evtSource.onerror = (err) => {
        console.error("SSE error:", err);
        evtSource.close();
        setIsLoading(false);
      };
    } catch (err) {
      console.error("Error generating summary:", err);
      alert("Failed to generate summary. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert("Share link copied to clipboard!");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">AI Meeting Digest</h1>
      <textarea 
        className="w-full border rounded p-2 focus:outline-none focus:ring mb-2"
        rows="8"
        placeholder="Paste meeting transcript here..."
        value={transcript}
        onChange={e => setTranscript(e.target.value)}
      />
      <button 
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={isLoading || !transcript.trim()}>
        {isLoading ? "Summarizing..." : "Generate Summary"}
      </button>

      {/* Display the summary result */}
      {summary && (
        <div className="mt-6 bg-gray-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Summary</h2>
          <div className="whitespace-pre-wrap">{summary}</div>
          {/* Share link section */}
          {shareLink && (
            <div className="mt-3 text-sm text-gray-700">
              <strong>Share this summary:</strong> 
              <div className="flex items-center">
                <a href={shareLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {shareLink}
                </a>
                <button 
                  onClick={handleCopyLink} 
                  className="ml-2 px-2 py-1 border text-sm rounded hover:bg-gray-100">
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
