'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatus {
  isOnline: boolean;
  isUsingMockResponses: boolean;
  lastChecked: string;
}

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: true,
    isUsingMockResponses: false,
    lastChecked: new Date().toISOString(),
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const response = await fetch('/api/diagnostics');
        const data = await response.json();

        setStatus({
          isOnline: data.success,
          isUsingMockResponses: !data.success,
          lastChecked: new Date().toISOString(),
        });

        // Show the status if there are issues
        setIsVisible(!data.success);
      } catch (error) {
        setStatus({
          isOnline: false,
          isUsingMockResponses: true,
          lastChecked: new Date().toISOString(),
        });
        setIsVisible(true);
      }
    };

    // Check on mount
    checkConnectionStatus();
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`
        flex items-center gap-2 px-4 py-2 rounded-lg border shadow-lg
        ${
          status.isOnline
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }
      `}
      >
        {status.isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Offline Mode</span>
          </>
        )}

        {status.isUsingMockResponses && (
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-current">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">Mock responses</span>
          </div>
        )}

        <button onClick={() => setIsVisible(false)} className="ml-2 text-xs opacity-70 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  );
}
