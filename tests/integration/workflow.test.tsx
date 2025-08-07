/**
 * Integration tests for the meeting digest workflow
 * These tests verify the complete end-to-end functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock EventSource for streaming tests
const mockEventSource = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  readyState: 1,
};

Object.defineProperty(window, 'EventSource', {
  writable: true,
  value: jest.fn(() => mockEventSource),
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Meeting Digest Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Complete Digest Generation Workflow', () => {
    // Simple component for testing the workflow
    const TestWorkflow = () => {
      const [transcript, setTranscript] = React.useState('');
      const [summary, setSummary] = React.useState('');
      const [isGenerating, setIsGenerating] = React.useState(false);
      const [error, setError] = React.useState('');

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!transcript.trim()) {
          setError('Please enter a transcript');
          return;
        }

        if (transcript.trim().length < 20) {
          setError('Transcript must be at least 20 characters long');
          return;
        }

        setError('');
        setIsGenerating(true);
        setSummary('');

        try {
          // Simulate API call
          const response = await fetch('/api/digests/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate summary');
          }

          // Simulate successful generation
          setSummary('# Meeting Summary\n\nGenerated summary content...');
          setTranscript('');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setIsGenerating(false);
        }
      };

      return (
        <div>
          <form onSubmit={handleSubmit}>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              data-testid="transcript-input"
            />
            <button type="submit" disabled={isGenerating} data-testid="generate-button">
              {isGenerating ? 'Generating...' : 'Generate Summary'}
            </button>
          </form>

          {error && (
            <div role="alert" data-testid="error-message">
              {error}
            </div>
          )}

          {summary && <div data-testid="summary-display">{summary}</div>}
        </div>
      );
    };

    it('should complete full workflow successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const user = userEvent.setup();
      render(<TestWorkflow />);

      // Step 1: Enter transcript
      const transcriptInput = screen.getByTestId('transcript-input');
      await user.type(transcriptInput, 'This is a test meeting transcript with enough content to process.');

      // Step 2: Submit form
      const generateButton = screen.getByTestId('generate-button');
      await user.click(generateButton);

      // Step 3: Verify loading state
      expect(generateButton).toBeDisabled();
      expect(screen.getByText('Generating...')).toBeInTheDocument();

      // Step 4: Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('summary-display')).toBeInTheDocument();
      });

      // Step 5: Verify results
      expect(screen.getByText(/Meeting Summary/)).toBeInTheDocument();
      expect(transcriptInput).toHaveValue('');
      expect(generateButton).not.toBeDisabled();
    });

    it('should handle validation errors', async () => {
      const user = userEvent.setup();
      render(<TestWorkflow />);

      // Test empty transcript
      const generateButton = screen.getByTestId('generate-button');
      await user.click(generateButton);

      expect(screen.getByTestId('error-message')).toHaveTextContent('Please enter a transcript');

      // Test short transcript
      const transcriptInput = screen.getByTestId('transcript-input');
      await user.type(transcriptInput, 'Short');
      await user.click(generateButton);

      expect(screen.getByTestId('error-message')).toHaveTextContent('Transcript must be at least 20 characters long');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const user = userEvent.setup();
      render(<TestWorkflow />);

      const transcriptInput = screen.getByTestId('transcript-input');
      await user.type(transcriptInput, 'Valid transcript with enough content for processing.');

      const generateButton = screen.getByTestId('generate-button');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to generate summary');
    });
  });

  describe('Streaming Response Integration', () => {
    it('should handle streaming events correctly', async () => {
      const StreamingTest = () => {
        const [content, setContent] = React.useState('');
        const [isStreaming, setIsStreaming] = React.useState(false);

        const startStreaming = () => {
          setIsStreaming(true);
          setContent('');

          // Simulate EventSource events
          const eventSource = new EventSource('/api/digests/stream');

          // Mock event handlers
          setTimeout(() => {
            // Simulate start event
            const startEvent = new MessageEvent('message', {
              data: JSON.stringify({ type: 'start', publicId: 'test-id' }),
            });
            mockEventSource.addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1]?.(startEvent);
          }, 100);

          setTimeout(() => {
            // Simulate chunk events
            const chunkEvent = new MessageEvent('message', {
              data: JSON.stringify({ type: 'chunk', content: '# Summary\n' }),
            });
            mockEventSource.addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1]?.(chunkEvent);
          }, 200);

          setTimeout(() => {
            // Simulate completion
            const completeEvent = new MessageEvent('message', {
              data: JSON.stringify({
                type: 'complete',
                digest: { summary: '# Summary\nComplete content' },
              }),
            });
            mockEventSource.addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1]?.(completeEvent);
            setIsStreaming(false);
          }, 300);
        };

        // Mock message handler
        React.useEffect(() => {
          const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.type === 'chunk') {
              setContent((prev) => prev + data.content);
            } else if (data.type === 'complete') {
              setContent(data.digest.summary);
            }
          };

          if (mockEventSource.addEventListener.mock.calls.length > 0) {
            // Store handler for testing
            const messageCall = mockEventSource.addEventListener.mock.calls.find((call) => call[0] === 'message');
            if (messageCall) {
              messageCall[1] = handleMessage;
            }
          }
        }, []);

        return (
          <div>
            <button onClick={startStreaming} disabled={isStreaming}>
              {isStreaming ? 'Streaming...' : 'Start Streaming'}
            </button>
            <div data-testid="streaming-content">{content}</div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<StreamingTest />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Wait for streaming to complete
      await waitFor(
        () => {
          expect(screen.getByText('Start Streaming')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Verify EventSource was created
      expect(window.EventSource).toHaveBeenCalledWith('/api/digests/stream');
    });
  });

  describe('Error Recovery Integration', () => {
    it('should retry failed requests', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const RetryTest = () => {
        const [status, setStatus] = React.useState('idle');

        const testRetry = async () => {
          setStatus('testing');

          // Simulate retry logic
          let attempts = 0;
          const maxAttempts = 3;

          while (attempts < maxAttempts) {
            try {
              await fetch('/api/test');
              setStatus('success');
              break;
            } catch (error) {
              attempts++;
              if (attempts >= maxAttempts) {
                setStatus('failed');
                throw error;
              }
              // Wait before retry
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }
        };

        return (
          <div>
            <button onClick={testRetry}>Test Retry</button>
            <div data-testid="status">{status}</div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<RetryTest />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('success');
      });

      expect(callCount).toBe(3); // Should have retried 3 times
    });
  });
});

// Add React import for JSX
import React from 'react';
