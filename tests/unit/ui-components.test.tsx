import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('UI Components', () => {
  describe('Button Component', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading state', () => {
      render(<Button disabled>Loading...</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Textarea Component', () => {
    it('should render textarea with placeholder', () => {
      render(<Textarea placeholder="Enter text here" />);
      expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
    });

    it('should handle input changes', async () => {
      const user = userEvent.setup();
      render(<Textarea placeholder="Test input" />);

      const textarea = screen.getByPlaceholderText('Test input');
      await user.type(textarea, 'Hello world');

      expect(textarea).toHaveValue('Hello world');
    });

    it('should support value and onChange props', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Textarea value="" onChange={handleChange} placeholder="Controlled" />);

      const textarea = screen.getByPlaceholderText('Controlled');
      await user.type(textarea, 'a');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Card Component', () => {
    it('should render card with header and content', () => {
      render(
        <Card>
          <CardHeader>
            <h2>Card Title</h2>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <Card className="custom-card">
          <CardContent>Content</CardContent>
        </Card>
      );

      const card = screen.getByText('Content').closest('div');
      expect(card?.closest('div')).toHaveClass('custom-card');
    });
  });

  describe('Form Validation Logic', () => {
    it('should validate required fields', () => {
      const validateForm = (transcript: string) => {
        const errors: string[] = [];

        if (!transcript || transcript.trim().length === 0) {
          errors.push('Please enter a transcript');
        } else if (transcript.trim().length < 20) {
          errors.push('Transcript must be at least 20 characters long');
        }

        return errors;
      };

      expect(validateForm('')).toContain('Please enter a transcript');
      expect(validateForm('   ')).toContain('Please enter a transcript');
      expect(validateForm('Short')).toContain('Transcript must be at least 20 characters long');
      expect(validateForm('This is a valid transcript with enough content')).toHaveLength(0);
    });

    it('should sanitize input', () => {
      const sanitizeInput = (input: string) => {
        return input.trim().replace(/\s+/g, ' ');
      };

      expect(sanitizeInput('  hello   world  ')).toBe('hello world');
      expect(sanitizeInput('multiple\n\nlines\twith\ttabs')).toBe('multiple lines with tabs');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <div>
          <label htmlFor="transcript">Meeting Transcript</label>
          <Textarea id="transcript" placeholder="Enter transcript" />
          <Button aria-label="Generate summary">Generate</Button>
        </div>
      );

      expect(screen.getByLabelText('Meeting Transcript')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Generate summary' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
        </div>
      );

      const firstButton = screen.getByRole('button', { name: 'First Button' });
      const secondButton = screen.getByRole('button', { name: 'Second Button' });

      firstButton.focus();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();
    });
  });

  describe('Error Handling in UI', () => {
    it('should display error messages', () => {
      const ErrorDisplay = ({ error }: { error?: string }) => (
        <div>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
        </div>
      );

      render(<ErrorDisplay error="Something went wrong" />);

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('Something went wrong');
    });

    it('should handle loading states', () => {
      const LoadingButton = ({ isLoading }: { isLoading: boolean }) => (
        <Button disabled={isLoading}>{isLoading ? 'Loading...' : 'Submit'}</Button>
      );

      const { rerender } = render(<LoadingButton isLoading={false} />);
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByRole('button')).not.toBeDisabled();

      rerender(<LoadingButton isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
