'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient, DigestResponse } from '@/services/api';
import { toast } from 'sonner';

interface StreamChunk {
  content: string;
  is_complete: boolean;
  digest_id?: number;
  error?: string;
}

export function DigestCreator() {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [displayedContent, setDisplayedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Word-by-word animation effect
  useEffect(() => {
    if (streamingContent && streamingContent !== displayedContent) {
      // Clear existing interval
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }

      const words = streamingContent.split(' ');
      const currentWords = displayedContent.split(' ');
      let currentIndex = currentWords.length;

      if (currentIndex < words.length) {
        streamingIntervalRef.current = setInterval(() => {
          if (currentIndex < words.length) {
            const newContent = words.slice(0, currentIndex + 1).join(' ');
            setDisplayedContent(newContent);
            currentIndex++;
          } else {
            if (streamingIntervalRef.current) {
              clearInterval(streamingIntervalRef.current);
              streamingIntervalRef.current = null;
            }
          }
        }, 40); // Slightly slower for smoother animation
      }
    }

    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, [streamingContent, displayedContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) {
      toast.error('Please enter a meeting transcript');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDigest(null);
    setStreamingContent('');
    setDisplayedContent('');

    try {
      if (useStreaming) {
        await handleStreamingSubmit();
      } else {
        await handleRegularSubmit();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegularSubmit = async () => {
    const result = await apiClient.createDigest(transcript);
    setDigest(result);
    toast.success('Digest created successfully!');
  };

  const handleStreamingSubmit = async () => {
    abortControllerRef.current = new AbortController();
    
    try {
      const stream = await apiClient.createDigestStream(transcript);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamChunk = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.content) {
                setStreamingContent(prev => prev + data.content);
              }
              
              if (data.is_complete && data.digest_id) {
                // Fetch the complete digest
                const completeDigest = await apiClient.getDigest(data.digest_id);
                setDigest(completeDigest);
                setStreamingContent('');
                toast.success('Digest created successfully!');
                break;
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        toast.info('Stream cancelled');
      } else {
        throw err;
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setIsLoading(false);
    setStreamingContent('');
    setDisplayedContent('');
    toast.info('Operation cancelled');
  };

  const copyShareLink = async () => {
    if (!digest) return;
    
    try {
      // First make the digest public if it's not already
      if (!digest.is_public) {
        await apiClient.updateDigestVisibility(digest.id, true);
        setDigest({ ...digest, is_public: true });
      }
      
      const shareUrl = `${window.location.origin}/digest/share/${digest.public_id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy share link');
    }
  };

  const sampleTranscript = `Meeting Notes - Project Alpha Planning
Date: July 26, 2025
Attendees: Sarah Johnson (PM), Mike Chen (Engineering), Lisa Park (Design), Tom Wilson (QA)

Sarah: Good morning everyone. Let's start with our project roadmap. Mike, can you give us an update on the backend API development?

Mike: Sure. We've completed about 70% of the core API endpoints. The user authentication system is done, and we're working on the data processing modules. I estimate we'll be finished by August 15th.

Lisa: That sounds good. On the design side, we've finalized the UI mockups and created the design system. Sarah, I'll need your approval on the color scheme by Friday so we can start implementation.

Sarah: Absolutely. I'll review them tomorrow and get back to you. Tom, what's the testing plan looking like?

Tom: I've drafted a comprehensive test plan covering unit tests, integration tests, and user acceptance testing. We should start testing as soon as the first beta build is ready. I recommend we allocate 2 weeks for the full testing cycle.

Sarah: Perfect. Let's make sure we have enough buffer time. Our client deadline is September 30th, so we need to account for any unexpected issues.

Mike: Speaking of issues, we might need to revisit the database schema. The current design might not scale well with the expected user load.

Sarah: Good point. Mike, can you prepare a proposal for database optimization by next Wednesday? We'll discuss it in our next planning meeting.

Lisa: Also, I think we should consider doing user testing sessions before the final release. It would help us catch usability issues early.

Tom: I agree. I can coordinate with the UX research team to set up testing sessions in early September.

Sarah: Excellent. Let me summarize our action items: Mike will finish the API by August 15th and prepare a database optimization proposal by next Wednesday. Lisa will get design approval from me by Friday. Tom will coordinate user testing sessions for early September. Our next check-in is scheduled for Friday at 2 PM.

Mike: Sounds good. One more thing - we should consider implementing automated deployment to streamline our release process.

Sarah: Great suggestion. Mike, can you research deployment automation tools and present options in our Friday meeting?

Mike: Will do.

Sarah: Perfect. Thanks everyone. Meeting adjourned.`;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label htmlFor="transcript" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Meeting Transcript
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTranscript(sampleTranscript)}
              className="text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              📝 Load Sample
            </Button>
          </div>
          <Textarea
            id="transcript"
            placeholder="Paste your meeting transcript here... Include attendee names, dialogue, and any notes from your meeting."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={12}
            className="min-h-[300px] resize-y border-2 focus:border-blue-300 dark:focus:border-blue-600 rounded-lg shadow-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            💡 Tip: Include speaker names and clear dialogue for better AI analysis
          </p>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <input
              id="streaming"
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="streaming" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              🚀 Enable real-time streaming response
            </label>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            See the AI analysis appear word by word as it's generated
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            type="submit" 
            disabled={isLoading || !transcript.trim()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                ✨ Generate Digest
              </>
            )}
          </Button>
          {isLoading && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              size="lg"
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              ⏹️ Cancel
            </Button>
          )}
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {streamingContent && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              Generating Digest...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-inner">
              <div className="max-h-full overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed font-mono text-sm streaming-text">
                  <div className="whitespace-pre-wrap break-words">
                    {displayedContent}
                    {displayedContent !== streamingContent && (
                      <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1 align-text-top"></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {digest && (
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
          <CardHeader className="border-b border-green-200 dark:border-green-800">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-lg">
                  ✨
                </div>
                <span className="text-2xl">Meeting Digest</span>
              </div>
              <div className="flex gap-3">
                <Badge 
                  variant={digest.is_public ? 'default' : 'secondary'}
                  className={digest.is_public ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}
                >
                  {digest.is_public ? '🌐 Public' : '🔒 Private'}
                </Badge>
                <Button
                  size="sm"
                  onClick={copyShareLink}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
                >
                  🔗 Share
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-base">
              Created on {new Date(digest.created_at).toLocaleDateString()} at {new Date(digest.created_at).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold mb-4 flex items-center gap-3 text-lg text-gray-800 dark:text-gray-200">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm">
                  📝
                </div>
                Summary Overview
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border-l-4 border-blue-500">
                {digest.summary_overview}
              </p>
            </div>

            <Separator className="border-gray-200 dark:border-gray-700" />

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold mb-4 flex items-center gap-3 text-lg text-gray-800 dark:text-gray-200">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm">
                  🎯
                </div>
                Key Decisions
              </h3>
              {digest.key_decisions.length > 0 ? (
                <ul className="space-y-3">
                  {digest.key_decisions.map((decision, index) => (
                    <li key={index} className="flex items-start gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{decision}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  No key decisions identified in this meeting.
                </p>
              )}
            </div>

            <Separator className="border-gray-200 dark:border-gray-700" />

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold mb-4 flex items-center gap-3 text-lg text-gray-800 dark:text-gray-200">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm">
                  ✅
                </div>
                Action Items
              </h3>
              {digest.action_items.length > 0 ? (
                <ul className="space-y-3">
                  {digest.action_items.map((item, index) => (
                    <li key={index} className="flex items-start gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  No action items identified in this meeting.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
