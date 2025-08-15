import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TranscriptInput from '../components/TranscriptInput';
import * as apiService from '../utils/apiService';

// Mock the API service
vi.mock('../utils/apiService', () => ({
  createDigest: vi.fn()
}));

describe('TranscriptInput', () => {
  const mockOnDigestCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders transcript input form', () => {
    render(<TranscriptInput onDigestCreated={mockOnDigestCreated} />);
    
    expect(screen.getByLabelText(/meeting transcript/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate summary/i })).toBeInTheDocument();
  });

  test('shows error when submitting empty transcript', async () => {
    render(<TranscriptInput onDigestCreated={mockOnDigestCreated} />);
    
    const submitButton = screen.getByRole('button', { name: /generate summary/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a meeting transcript/i)).toBeInTheDocument();
    });
  });

  test('submits transcript successfully', async () => {
    const mockDigest = {
      id: 1,
      transcript: 'Test transcript',
      summary: 'Test summary',
      created_at: new Date().toISOString()
    };

    apiService.createDigest.mockResolvedValue(mockDigest);

    render(<TranscriptInput onDigestCreated={mockOnDigestCreated} />);
    
    const textarea = screen.getByLabelText(/meeting transcript/i);
    const submitButton = screen.getByRole('button', { name: /generate summary/i });
    
    fireEvent.change(textarea, { target: { value: 'Test transcript content' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiService.createDigest).toHaveBeenCalledWith('Test transcript content');
      expect(mockOnDigestCreated).toHaveBeenCalledWith(mockDigest);
    });
  });

  test('handles API error gracefully', async () => {
    apiService.createDigest.mockRejectedValue(new Error('API Error'));

    render(<TranscriptInput onDigestCreated={mockOnDigestCreated} />);
    
    const textarea = screen.getByLabelText(/meeting transcript/i);
    const submitButton = screen.getByRole('button', { name: /generate summary/i });
    
    fireEvent.change(textarea, { target: { value: 'Test transcript' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to create digest/i)).toBeInTheDocument();
    });
  });

  test('uses example text when "Use Example" is clicked', () => {
    render(<TranscriptInput onDigestCreated={mockOnDigestCreated} />);
    
    const useExampleButton = screen.getByRole('button', { name: /use example/i });
    const textarea = screen.getByLabelText(/meeting transcript/i);
    
    fireEvent.click(useExampleButton);
    
    expect(textarea.value).toContain('John: Good morning everyone');
  });

  test('clears textarea when "Clear" is clicked', () => {
    render(<TranscriptInput onDigestCreated={mockOnDigestCreated} />);
    
    const textarea = screen.getByLabelText(/meeting transcript/i);
    
    // Add some text first
    fireEvent.change(textarea, { target: { value: 'Some text' } });
    expect(textarea.value).toBe('Some text');
    
    // Click clear button
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    expect(textarea.value).toBe('');
  });

  test('shows loading state during submission', async () => {
    // Mock a delayed response
    apiService.createDigest.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 100))
    );

    render(<TranscriptInput onDigestCreated={mockOnDigestCreated} />);
    
    const textarea = screen.getByLabelText(/meeting transcript/i);
    const submitButton = screen.getByRole('button', { name: /generate summary/i });
    
    fireEvent.change(textarea, { target: { value: 'Test transcript' } });
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText(/generating.../i)).toBeInTheDocument();
    expect(screen.getByText(/processing.../i)).toBeInTheDocument();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/generating.../i)).not.toBeInTheDocument();
    });
  });
});