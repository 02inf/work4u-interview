'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient, DigestListResponse } from '@/services/api';
import { toast } from 'sonner';

export default function DigestsPage() {
  const [digests, setDigests] = useState<DigestListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDigests();
  }, []);

  const loadDigests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getAllDigests();
      setDigests(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load digests';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyShareLink = async (digest: DigestListResponse) => {
    try {
      if (!digest.is_public) {
        await apiClient.updateDigestVisibility(digest.id, true);
        // Update local state
        setDigests(prevDigests =>
          prevDigests.map(d =>
            d.id === digest.id ? { ...d, is_public: true } : d
          )
        );
      }
      
      const shareUrl = `${window.location.origin}/digest/share/${digest.public_id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy share link');
    }
  };

  const deleteDigest = async (id: number) => {
    if (!confirm('Are you sure you want to delete this digest?')) {
      return;
    }

    try {
      await apiClient.deleteDigest(id);
      setDigests(prevDigests => prevDigests.filter(d => d.id !== id));
      toast.success('Digest deleted successfully');
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
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading digests...</p>
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
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Meeting Digests
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                Your past meeting summaries and insights
              </p>
            </div>
            <Link href="/">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
              >
                ✨ Create New Digest
              </Button>
            </Link>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {digests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">No digests yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Start by creating your first meeting digest
                </p>
                <Link href="/">
                  <Button>Create Your First Digest</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {digests.map((digest) => (
                <Card key={digest.id} className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            #{digest.id}
                          </div>
                          <Link 
                            href={`/digest/${digest.id}`}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            Meeting Digest
                          </Link>
                        </CardTitle>
                        <CardDescription className="mt-2 ml-13">
                          📅 {new Date(digest.created_at).toLocaleDateString()} at{' '}
                          {new Date(digest.created_at).toLocaleTimeString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={digest.is_public ? 'default' : 'secondary'}
                          className={digest.is_public ? 'bg-green-100 text-green-800 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}
                        >
                          {digest.is_public ? '🌐 Public' : '🔒 Private'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                          {digest.summary_overview}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-3">
                          <Link href={`/digest/${digest.id}`}>
                            <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              👁️ View Details
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyShareLink(digest)}
                            className="hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            🔗 Share
                          </Button>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteDigest(digest.id)}
                          className="hover:bg-red-600"
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <div className="text-center mt-8">
            <Button variant="outline" onClick={loadDigests}>
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
