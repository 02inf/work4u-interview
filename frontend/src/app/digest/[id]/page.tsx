'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient, DigestDetailResponse } from '@/lib/api';
import { toast } from 'sonner';

export default function DigestPage() {
  const params = useParams();
  const router = useRouter();
  const [digest, setDigest] = useState<DigestDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const digestId = params.id as string;

  useEffect(() => {
    if (digestId) {
      loadDigest();
    }
  }, [digestId]);

  const loadDigest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to parse as number first (internal ID), then try as UUID (public ID)
      const numericId = parseInt(digestId);
      let result: DigestDetailResponse;
      
      if (!isNaN(numericId)) {
        result = await apiClient.getDigest(numericId);
      } else {
        result = await apiClient.getSharedDigest(digestId);
      }
      
      setDigest(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load digest';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

    const copyShareLink = async () => {
    if (!digest) return;
    
    try {
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

  const toggleVisibility = async () => {
    if (!digest) return;
    
    try {
      const newVisibility = !digest.is_public;
      const updatedDigest = await apiClient.updateDigestVisibility(digest.id, newVisibility);
      setDigest(updatedDigest);
      toast.success(`Digest is now ${newVisibility ? 'public' : 'private'}`);
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const deleteDigest = async () => {
    if (!digest || !confirm('Are you sure you want to delete this digest?')) {
      return;
    }

    try {
      await apiClient.deleteDigest(digest.id);
      toast.success('Digest deleted successfully');
      router.push('/digests');
    } catch (err) {
      toast.error('Failed to delete digest');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading digest...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Digest not found'}
              </AlertDescription>
            </Alert>
            <div className="text-center mt-6">
              <Link href="/digests">
                <Button>Back to Digests</Button>
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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Meeting Digest #{digest.id}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                📅 {new Date(digest.created_at).toLocaleDateString()} at{' '}
                {new Date(digest.created_at).toLocaleTimeString()}
              </p>
              {digest.updated_at !== digest.created_at && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  🔄 Updated on {new Date(digest.updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Link href="/digests">
                <Button variant="outline" size="lg" className="bg-white/50 backdrop-blur-sm">
                  📋 Back to List
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="bg-white/50 backdrop-blur-sm">
                  ✨ Create New
                </Button>
              </Link>
            </div>
          </div>

          {/* Digest Content */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Meeting Summary</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={digest.is_public ? 'default' : 'secondary'}>
                    {digest.is_public ? 'Public' : 'Private'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleVisibility}
                    className="bg-white/50 backdrop-blur-sm"
                  >
                    {digest.is_public ? '🔒 Make Private' : '🌐 Make Public'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyShareLink}
                    className="bg-white/50 backdrop-blur-sm"
                  >
                    📋 Share
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deleteDigest}
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  📝 Summary Overview
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {digest.summary_overview}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  🎯 Key Decisions
                </h3>
                {digest.key_decisions.length > 0 ? (
                  <ul className="space-y-3">
                    {digest.key_decisions.map((decision, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-blue-500 font-bold text-lg mt-0.5">•</span>
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {decision}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No key decisions identified in this meeting.
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  ✅ Action Items
                </h3>
                {digest.action_items.length > 0 ? (
                  <ul className="space-y-3">
                    {digest.action_items.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-green-500 font-bold text-lg mt-0.5">•</span>
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No action items identified in this meeting.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Original Transcript */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Original Transcript
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  {showTranscript ? 'Hide' : 'Show'} Transcript
                </Button>
              </CardTitle>
            </CardHeader>
            {showTranscript && (
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {digest.original_transcript}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
