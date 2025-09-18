import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import DigestDisplay from '../DigestDisplay';
import { DigestResponse } from '../../types';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
};
global.navigator.clipboard = mockClipboard as any;

// Mock document.execCommand
global.document.execCommand = jest.fn();

const mockDigest: DigestResponse = {
  id: 1,
  public_id: 'test-public-id',
  summary_overview: 'This is a test meeting summary',
  key_decisions: ['Decision 1', 'Decision 2'],
  action_items: ['Action 1', 'Action 2'],
  created_at: '2023-01-01T10:00:00.000000'
};

describe('DigestDisplay', () => {
  const renderWithProvider = (digest = mockDigest, showActions = false) => {
    return render(
      <LanguageProvider>
        <DigestDisplay digest={digest} showActions={showActions} />
      </LanguageProvider>
    );
  };

  beforeEach(() => {
    mockClipboard.writeText.mockClear();
    (global.document.execCommand as jest.Mock).mockClear();
  });

  test('renders digest content', () => {
    renderWithProvider();
    
    expect(screen.getByText('This is a test meeting summary')).toBeInTheDocument();
    expect(screen.getByText('Decision 1')).toBeInTheDocument();
    expect(screen.getByText('Decision 2')).toBeInTheDocument();
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  test('shows share button when showActions is true', () => {
    renderWithProvider(mockDigest, true);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/分享链接|Share Link/)).toBeInTheDocument();
  });

  test('does not show share button when showActions is false', () => {
    renderWithProvider(mockDigest, false);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('share button copies URL to clipboard', async () => {
    mockClipboard.writeText.mockResolvedValueOnce(undefined);
    renderWithProvider(mockDigest, true);
    
    const shareButton = screen.getByRole('button');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/shared/test-public-id`
      );
    });
  });

  test('shows success message after copying', async () => {
    mockClipboard.writeText.mockResolvedValueOnce(undefined);
    renderWithProvider(mockDigest, true);
    
    const shareButton = screen.getByRole('button');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(screen.getByText(/已复制|copied/i)).toBeInTheDocument();
    });
  });

  test('falls back to execCommand when clipboard API fails', async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard not available'));
    (global.document.execCommand as jest.Mock).mockReturnValueOnce(true);
    
    // Mock document methods for fallback
    const mockTextArea = {
      value: '',
      select: jest.fn(),
    };
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValueOnce(mockTextArea as any);
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementationOnce(() => mockTextArea as any);
    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementationOnce(() => mockTextArea as any);
    
    renderWithProvider(mockDigest, true);
    
    const shareButton = screen.getByRole('button');
    fireEvent.click(shareButton);
    
    await waitFor(() => {
      expect(createElementSpy).toHaveBeenCalledWith('textarea');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(mockTextArea.select).toHaveBeenCalled();
      expect(global.document.execCommand).toHaveBeenCalledWith('copy');
      expect(removeChildSpy).toHaveBeenCalled();
    });
    
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  test('displays empty state messages for missing data', () => {
    const emptyDigest = {
      ...mockDigest,
      key_decisions: [],
      action_items: []
    };
    
    renderWithProvider(emptyDigest);
    
    expect(screen.getByText(/未识别到明确的决策内容|No clear decisions identified/)).toBeInTheDocument();
    expect(screen.getByText(/未识别到明确的行动项目|No clear action items identified/)).toBeInTheDocument();
  });
});