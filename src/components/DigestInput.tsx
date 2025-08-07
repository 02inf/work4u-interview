'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Zap } from 'lucide-react';
import { Digest } from '@/types/digest';
import { useToast } from '@/hooks/use-toast';

interface DigestInputProps {
  onDigestGenerated: (digest: Digest) => void;
  onStreamingUpdate: (content: string) => void;
  onStreamingStart: () => void;
  onStreamingComplete: () => void;
}

export default function DigestInput({
  onDigestGenerated,
  onStreamingUpdate,
  onStreamingStart,
  onStreamingComplete,
}: DigestInputProps) {
  const [transcript, setTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transcript.trim()) {
      setError('Please enter a meeting transcript');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      if (useStreaming) {
        await handleStreamingSubmit();
      } else {
        await handleRegularSubmit();
      }
    } catch (err) {
      setError('Failed to generate digest. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate digest. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStreamingSubmit = async () => {
    const response = await fetch('/api/digests/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate digest');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    onStreamingStart();
    let streamedContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'start') {
                streamedContent = '';
              } else if (data.type === 'chunk') {
                streamedContent += data.content;
                onStreamingUpdate(streamedContent);
              } else if (data.type === 'complete') {
                onStreamingComplete();
                onDigestGenerated(data.digest);
                setTranscript('');
                toast({
                  variant: 'success',
                  title: 'Success!',
                  description: 'Digest generated successfully',
                });
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseError) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const handleRegularSubmit = async () => {
    const response = await fetch('/api/digests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate digest');
    }

    const digest = await response.json();
    onDigestGenerated(digest);
    setTranscript('');
    toast({
      variant: 'success',
      title: 'Success!',
      description: 'Digest generated successfully',
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Meeting Transcript Digest</CardTitle>
        <CardDescription>
          Paste your meeting transcript below and get an AI-generated summary with key decisions and action items.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Paste your meeting transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px] resize-none"
              disabled={isGenerating}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="streaming"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="streaming"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable real-time streaming
            </label>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <Button type="submit" disabled={isGenerating || !transcript.trim()} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Digest...
              </>
            ) : (
              <>
                {useStreaming ? <Zap className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                Generate Digest
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
