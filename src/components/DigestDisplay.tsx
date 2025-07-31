'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Share2, Loader2 } from 'lucide-react';
import { Digest } from '@/types/digest';
import { useToast } from '@/hooks/use-toast';

interface DigestDisplayProps {
  digest?: Digest;
  streamingContent?: string;
  isStreaming?: boolean;
}

export default function DigestDisplay({ digest, streamingContent, isStreaming = false }: DigestDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formatSummary = (summary: string) => {
    // Split the summary into sections and format for better readability
    const sections = summary.split(/##\s+/).filter(Boolean);

    return sections.map((section, index) => {
      const lines = section.split('\n').filter(Boolean);
      const title = lines[0];
      const content = lines.slice(1).join('\n');

      return (
        <div key={index} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <div className="prose prose-sm max-w-none">
            {content.split('\n').map((line, lineIndex) => {
              if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                return (
                  <div key={lineIndex} className="flex items-start mb-1">
                    <span className="mr-2 text-primary">•</span>
                    <span>{line.replace(/^[•-]\s*/, '')}</span>
                  </div>
                );
              }
              return line.trim() ? (
                <p key={lineIndex} className="mb-2">
                  {line}
                </p>
              ) : null;
            })}
          </div>
        </div>
      );
    });
  };

  const handleShare = async () => {
    if (!digest) return;

    const shareUrl = `${window.location.origin}/digest/${digest.publicId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const displayContent = streamingContent || digest?.summary || '';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              Meeting Digest
              {isStreaming && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              {digest ? (
                <>
                  Generated on{' '}
                  {new Date(digest.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              ) : isStreaming ? (
                'Generating in real-time...'
              ) : (
                'Processing...'
              )}
            </CardDescription>
          </div>
          {digest && (
            <Button onClick={handleShare} variant="outline" size="sm" className="flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Share
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayContent ? (
            <div className={isStreaming ? 'animate-pulse' : ''}>{formatSummary(displayContent)}</div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No content to display</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
