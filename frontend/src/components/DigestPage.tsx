import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface AiResponse {
  summary: string;
  decisions: string[];
  actions: {
    thing: string;
    assignee: string;
  }[];
}

const DigestPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [digest, setDigest] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDigest = async () => {
      try {
        // Assuming an endpoint structure like this.
        // This might need adjustment based on the actual backend implementation.
        const response = await fetch(`http://localhost:3000/conversation/${uuid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch digest.');
        }
        const data = await response.json();
        // Assuming the backend returns the parsedOutput field which is a JSON string
        setDigest(JSON.parse(data.parsedOutput));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (uuid) {
      fetchDigest();
    }
  }, [uuid]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading digest...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  if (!digest) {
    return <div className="flex justify-center items-center h-screen">Digest not found.</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Meeting Digest</h1>
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-xl mb-2 text-gray-700">Summary</h2>
            <p className="text-gray-600">{digest.summary}</p>
          </div>
          <div>
            <h2 className="font-semibold text-xl mb-2 text-gray-700">Decisions</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {digest.decisions.map((decision, i) => (
                <li key={i}>{decision}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold text-xl mb-2 text-gray-700">Action Items</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {digest.actions.map((action, i) => (
                <li key={i}>
                  <strong>{action.assignee}:</strong> {action.thing}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigestPage;
