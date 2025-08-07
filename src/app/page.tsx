'use client';

import { useState } from 'react';
import DigestInput from '@/components/DigestInput';
import DigestDisplay from '@/components/DigestDisplay';
import DigestHistory from '@/components/DigestHistory';
import { Digest } from '@/types/digest';

export default function Home() {
  const [currentDigest, setCurrentDigest] = useState<Digest | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDigestGenerated = (digest: Digest) => {
    setCurrentDigest(digest);
    setStreamingContent('');
    setIsStreaming(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDigestSelect = (digest: Digest) => {
    setCurrentDigest(digest);
    setStreamingContent('');
    setIsStreaming(false);
  };

  const handleStreamingStart = () => {
    setIsStreaming(true);
    setStreamingContent('');
    setCurrentDigest(null);
  };

  const handleStreamingUpdate = (content: string) => {
    setStreamingContent(content);
  };

  const handleStreamingComplete = () => {
    setIsStreaming(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Meeting Digest</h1>
          <p className="text-lg text-muted-foreground">
            Transform your meeting transcripts into structured summaries with AI
          </p>
        </div>

        <div className="space-y-8">
          {/* Input Section */}
          <DigestInput
            onDigestGenerated={handleDigestGenerated}
            onStreamingStart={handleStreamingStart}
            onStreamingUpdate={handleStreamingUpdate}
            onStreamingComplete={handleStreamingComplete}
          />

          {/* Current Digest Display */}
          {(currentDigest || streamingContent || isStreaming) && (
            <DigestDisplay
              digest={currentDigest || undefined}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
            />
          )}

          {/* History Section */}
          <DigestHistory onDigestSelect={handleDigestSelect} refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
