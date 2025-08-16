import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// The history list displays each summary with its creation timestamp and an overview snippet.
// Each entry has a "View" link (navigating to the summary’s detail page) and a "Copy Link" button to copy the share URL.

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all past summaries on mount
    fetch(`${API_BASE}/summaries`)
      .then(res => res.json())
      .then(data => {
        setHistory(data);
      })
      .catch(err => console.error("Failed to load history:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (publicId) => {
    const url = `${window.location.origin}/digest/${publicId}`;
    navigator.clipboard.writeText(url);
    alert("Copied share link for summary ID " + publicId);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Summary History</h1>
      {loading ? (
        <p>Loading summaries...</p>
      ) : history.length === 0 ? (
        <p>No summaries found.</p>
      ) : (
        <ul className="space-y-3">
          {history.map(item => (
            <li key={item.id} className="border-b pb-2">
              <div>
                <span className="font-semibold">[{new Date(item.created_at).toLocaleString()}]</span>
                <span className="ml-2">{item.overview_snippet}</span>
              </div>
              <div className="text-sm text-gray-600 flex space-x-4">
                <Link to={`/digest/${item.public_id}`} className="text-blue-600 hover:underline">View</Link>
                <button onClick={() => handleCopy(item.public_id)} className="hover:underline">Copy Link</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
