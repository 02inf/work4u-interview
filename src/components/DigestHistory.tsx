'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Calendar, Share2, Search, X } from 'lucide-react';
import { Digest } from '@/types/digest';
import { useToast } from '@/hooks/use-toast';

interface DigestHistoryProps {
  onDigestSelect: (digest: Digest) => void;
  refreshTrigger?: number;
}

export default function DigestHistory({ onDigestSelect, refreshTrigger }: DigestHistoryProps) {
  const [digests, setDigests] = useState<Digest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchDigests();
  }, [refreshTrigger]);

  const fetchDigests = async () => {
    try {
      const response = await fetch('/api/digests');
      if (!response.ok) {
        throw new Error('Failed to fetch digests');
      }
      const data = await response.json();
      setDigests(data);
    } catch (err) {
      setError('Failed to load digest history');
    } finally {
      setLoading(false);
    }
  };

  const filteredDigests = useMemo(() => {
    if (!searchQuery.trim()) return digests;

    return digests.filter((digest) => digest.summary.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [digests, searchQuery]);

  const handleShare = async (publicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/digest/${publicId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        variant: 'success',
        title: 'Copied!',
        description: 'Share link copied to clipboard',
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to copy to clipboard',
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const truncateSummary = (summary: string, maxLength: number = 150) => {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Digest History</CardTitle>
          <CardDescription>Loading your previous digests...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Digest History</CardTitle>
          <CardDescription>Error loading digests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Digest History</CardTitle>
        <CardDescription>
          {digests.length === 0
            ? 'No digests generated yet'
            : `${digests.length} digest${digests.length === 1 ? '' : 's'} generated`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {digests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Generate your first digest by pasting a meeting transcript above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search digests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search Results Info */}
            {searchQuery && (
              <div className="text-sm text-muted-foreground">
                {filteredDigests.length === 0
                  ? 'No digests found matching your search'
                  : `Found ${filteredDigests.length} digest${filteredDigests.length === 1 ? '' : 's'}`}
              </div>
            )}

            {/* Digest List */}
            <div className="space-y-3">
              {filteredDigests.map((digest) => (
                <div
                  key={digest.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onDigestSelect(digest)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(digest.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <p className="text-sm line-clamp-2 mb-2">{truncateSummary(digest.summary)}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={(e) => handleShare(digest.publicId, e)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Share digest"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View digest">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
