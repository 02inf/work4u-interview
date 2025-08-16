import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function SummaryPage() {
  const { publicId } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the summary by its public ID when the component loads
    fetch(`${API_BASE}/summaries/${publicId}`)
      .then(res => {
        if (!res.ok) throw new Error("Summary not found");
        return res.json();
      })
      .then(data => {
        setSummary(data);
      })
      .catch(err => {
        console.error(err);
        setSummary({ error: "Summary not found or an error occurred." });
      })
      .finally(() => setLoading(false));
  }, [publicId]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard!");
  };

  if (loading) {
    return <p>Loading summary...</p>;
  }
  if (!summary || summary.error) {
    return <p className="text-red-600">Unable to load summary.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Summary Details</h1>
      <div className="bg-gray-50 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <div className="whitespace-pre-wrap">{summary.text}</div>
      </div>
      {/* Copy link button */}
      <button onClick={handleCopyLink} className="mt-3 px-3 py-1 border rounded text-sm hover:bg-gray-100">
        Copy Share Link
      </button>
    </div>
  );
}
