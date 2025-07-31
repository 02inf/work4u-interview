import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DigestInput from '../DigestInput';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock EventSource for SSE
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

describe('DigestInput', () => {
  const mockOnDigestGenerated = jest.fn();
  const mockOnStreamingUpdate = jest.fn();
  const mockOnStreamingStart = jest.fn();
  const mockOnStreamingComplete = jest.fn();

  const defaultProps = {
    onDigestGenerated: mockOnDigestGenerated,
    onStreamingUpdate: mockOnStreamingUpdate,
    onStreamingStart: mockOnStreamingStart,
    onStreamingComplete: mockOnStreamingComplete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render input form correctly', () => {
    render(<DigestInput {...defaultProps} />);

    expect(screen.getByPlaceholderText(/paste your meeting transcript/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate digest/i })).toBeInTheDocument();
    expect(screen.getByText(/enter your meeting transcript/i)).toBeInTheDocument();
  });

  it('should show error for empty transcript', async () => {
    const user = userEvent.setup();
    render(<DigestInput {...defaultProps} />);

    const button = screen.getByRole('button', { name: /generate digest/i });
    await user.click(button);

    expect(screen.getByText(/please enter a transcript/i)).toBeInTheDocument();
  });

  it('should show error for transcript that is too short', async () => {
    const user = userEvent.setup();
    render(<DigestInput {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/paste your meeting transcript/i);
    await user.type(textarea, 'Short');

    const button = screen.getByRole('button', { name: /generate digest/i });
    await user.click(button);

    expect(screen.getByText(/transcript must be at least 20 characters/i)).toBeInTheDocument();
  });

  it('should disable submit button when generating', async () => {
    const user = userEvent.setup();
    render(<DigestInput {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/paste your meeting transcript/i);
    await user.type(textarea, 'This is a long enough transcript for testing purposes.');

    const button = screen.getByRole('button', { name: /generate digest/i });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });

  it('should handle successful streaming response', async () => {
    const user = userEvent.setup();
    render(<DigestInput {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/paste your meeting transcript/i);
    await user.type(textarea, 'This is a test meeting transcript with enough content.');

    const button = screen.getByRole('button', { name: /generate digest/i });
    await user.click(button);

    // Simulate EventSource events
    const addEventListener = mockEventSource.addEventListener;
    const messageHandler = addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1];

    if (messageHandler) {
      // Simulate start event
      messageHandler({
        data: JSON.stringify({ type: 'start', publicId: 'test-id' }),
      });

      expect(screen.getByText(/generating summary/i)).toBeInTheDocument();

      // Simulate chunk events
      messageHandler({
        data: JSON.stringify({ type: 'chunk', content: '# Test Summary\n' }),
      });
      messageHandler({
        data: JSON.stringify({ type: 'chunk', content: 'This is a test summary.' }),
      });

      expect(screen.getByText(/# test summary/i)).toBeInTheDocument();
      expect(screen.getByText(/this is a test summary/i)).toBeInTheDocument();

      // Simulate completion
      const mockDigest = {
        id: 'test-id',
        publicId: 'public-test-id',
        summary: '# Test Summary\nThis is a test summary.',
        createdAt: new Date().toISOString(),
      };

      messageHandler({
        data: JSON.stringify({ type: 'complete', digest: mockDigest }),
      });

      await waitFor(() => {
        expect(mockOnDigestGenerated).toHaveBeenCalledWith(mockDigest);
      });
    }
  });

  it('should handle streaming errors', async () => {
    const user = userEvent.setup();
    render(<DigestInput {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/paste your meeting transcript/i);
    await user.type(textarea, 'This is a test meeting transcript.');

    const button = screen.getByRole('button', { name: /generate digest/i });
    await user.click(button);

    // Simulate error event
    const addEventListener = mockEventSource.addEventListener;
    const messageHandler = addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1];

    if (messageHandler) {
      messageHandler({
        data: JSON.stringify({ type: 'error', message: 'Network error occurred' }),
      });

      await waitFor(() => {
        expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
      });
    }
  });

  it('should clear form after successful generation', async () => {
    const user = userEvent.setup();
    render(<DigestInput {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/paste your meeting transcript/i);
    await user.type(textarea, 'Test transcript content');

    const button = screen.getByRole('button', { name: /generate digest/i });
    await user.click(button);

    // Simulate completion
    const addEventListener = mockEventSource.addEventListener;
    const messageHandler = addEventListener.mock.calls.find((call) => call[0] === 'message')?.[1];

    if (messageHandler) {
      const mockDigest = {
        id: 'test-id',
        publicId: 'public-test-id',
        summary: 'Test summary',
        createdAt: new Date().toISOString(),
      };

      messageHandler({
        data: JSON.stringify({ type: 'complete', digest: mockDigest }),
      });

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    }
  });

  it('should handle connection errors', async () => {
    const user = userEvent.setup();
    render(<DigestInput {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/paste your meeting transcript/i);
    await user.type(textarea, 'Test transcript content');

    const button = screen.getByRole('button', { name: /generate digest/i });
    await user.click(button);

    // Simulate error event
    const addEventListener = mockEventSource.addEventListener;
    const errorHandler = addEventListener.mock.calls.find((call) => call[0] === 'error')?.[1];

    if (errorHandler) {
      errorHandler(new Event('error'));

      await waitFor(() => {
        expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
      });
    }
  });
});
