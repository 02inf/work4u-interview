'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient, DigestDetailResponse } from '@/services/api';
import { toast } from 'sonner';

export default function SharedDigestPage() {
  const params = useParams();
  const [digest, setDigest] = useState<DigestDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const publicId = params.publicId as string;

  useEffect(() => {
    if (publicId) {
      loadDigest();
    }
  }, [publicId]);

  const loadDigest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiClient.getSharedDigest(publicId);
      setDigest(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load shared digest';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyShareLink = async () => {
    if (!digest) return;
    
    try {
      const shareUrl = `${window.location.origin}/digest/share/${digest.public_id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy share link');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading shared digest...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                {error || 'Shared digest not found or is no longer public'}
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <Link href="/">
                <Button>Create Your Own Digest</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                  🤖
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Shared Meeting Digest
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 ml-13">
                Created on {new Date(digest.created_at).toLocaleDateString()} at{' '}
                {new Date(digest.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline" className="bg-white/50 backdrop-blur-sm">
                  Create Your Own
                </Button>
              </Link>
            </div>
          </div>

          {/* Digest Content */}
          <Card className="mb-6 shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Meeting Summary</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    Public
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyShareLink}
                    className="bg-white/50 backdrop-blur-sm"
                  >
                    📋 Copy Link
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  📝 Summary Overview
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                    {digest.summary_overview}
                  </p>
                </div>
              </div>

              <Separator className="my-8" />

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  🎯 Key Decisions
                </h3>
                {digest.key_decisions.length > 0 ? (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-6 rounded-xl border border-orange-100 dark:border-orange-800">
                    <ul className="space-y-4">
                      {digest.key_decisions.map((decision, index) => (
                        <li key={index} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {decision}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    No key decisions identified in this meeting.
                  </p>
                )}
              </div>

              <Separator className="my-8" />

              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                  ✅ Action Items
                </h3>
                {digest.action_items.length > 0 ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800">
                    <ul className="space-y-4">
                      {digest.action_items.map((item, index) => (
                        <li key={index} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                            ✓
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    No action items identified in this meeting.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Original Transcript */}
          <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Original Transcript
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="bg-white/50 backdrop-blur-sm"
                >
                  {showTranscript ? 'Hide' : 'Show'} Transcript
                </Button>
              </CardTitle>
            </CardHeader>
            {showTranscript && (
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    {digest.original_transcript}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Powered by AI Meeting Digest
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Create Your Own Digest
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
