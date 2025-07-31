'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DigestDisplay from '@/components/DigestDisplay';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Digest } from '@/types/digest';

export default function SharedDigestPage() {
  const params = useParams();
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.publicId) {
      fetchDigest(params.publicId as string);
    }
  }, [params.publicId]);

  const fetchDigest = async (publicId: string) => {
    try {
      const response = await fetch(`/api/digests/${publicId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Digest not found');
        } else {
          setError('Failed to load digest');
        }
        return;
      }
      const data = await response.json();
      setDigest(data);
    } catch (err) {
      setError('Failed to load digest');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading digest...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Oops!</h1>
            <p className="text-lg text-muted-foreground mb-6">{error}</p>
            <Link href="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Shared Meeting Digest</h1>
            <p className="text-lg text-muted-foreground">This digest was shared with you</p>
          </div>
        </div>

        {digest && <DigestDisplay digest={digest} />}
      </div>
    </div>
  );
}
