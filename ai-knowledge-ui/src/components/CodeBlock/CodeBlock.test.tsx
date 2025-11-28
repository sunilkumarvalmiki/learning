import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CodeBlock } from './CodeBlock';

expect.extend(toHaveNoViolations);

describe('CodeBlock', () => {
  const sampleCode = 'const hello = "world";\nconsole.log(hello);';

  // Mock clipboard API
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  describe('Rendering', () => {
    it('renders code content', () => {
      render(<CodeBlock code={sampleCode} />);
      expect(screen.getByText(/const hello/i)).toBeInTheDocument();
    });

    it('renders with filename', () => {
      render(<CodeBlock code={sampleCode} filename="example.js" />);
      expect(screen.getByText('example.js')).toBeInTheDocument();
    });

    it('renders with language when no filename', () => {
      render(<CodeBlock code={sampleCode} language="javascript" />);
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    it('does not show language when filename is present', () => {
      render(<CodeBlock code={sampleCode} language="javascript" filename="test.js" />);
      expect(screen.getByText('test.js')).toBeInTheDocument();
      expect(screen.queryByText('javascript')).not.toBeInTheDocument();
    });

    it('shows line numbers by default', () => {
      const { container } = render(<CodeBlock code={sampleCode} />);
      expect(container.querySelector('.code-block__line-numbers')).toBeInTheDocument();
    });

    it('hides line numbers when showLineNumbers is false', () => {
      const { container } = render(<CodeBlock code={sampleCode} showLineNumbers={false} />);
      expect(container.querySelector('.code-block__line-numbers')).not.toBeInTheDocument();
    });

    it('renders correct number of line numbers', () => {
      const multiLineCode = 'line1\nline2\nline3';
      const { container } = render(<CodeBlock code={multiLineCode} />);
      const lineNumbers = container.querySelectorAll('.code-block__line-number');
      expect(lineNumbers).toHaveLength(3);
    });

    it('applies language class to code element', () => {
      const { container } = render(<CodeBlock code={sampleCode} language="javascript" />);
      const codeElement = container.querySelector('.code-block__code');
      expect(codeElement).toHaveClass('language-javascript');
    });

    it('shows copy button by default', () => {
      render(<CodeBlock code={sampleCode} />);
      expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
    });

    it('hides copy button when copyable is false', () => {
      render(<CodeBlock code={sampleCode} copyable={false} />);
      expect(screen.queryByLabelText('Copy code')).not.toBeInTheDocument();
    });

    it('does not render header when no filename and not copyable', () => {
      const { container } = render(<CodeBlock code={sampleCode} copyable={false} />);
      expect(container.querySelector('.code-block__header')).not.toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('copies code to clipboard when copy button clicked', async () => {
      const user = userEvent.setup();
      render(<CodeBlock code={sampleCode} />);

      await user.click(screen.getByLabelText('Copy code'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleCode);
    });

    it('shows "Copied!" feedback after copying', async () => {
      const user = userEvent.setup();
      render(<CodeBlock code={sampleCode} />);

      await user.click(screen.getByLabelText('Copy code'));
      await waitFor(() => {
        expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('resets copy state after 2 seconds', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      render(<CodeBlock code={sampleCode} />);

      await user.click(screen.getByLabelText('Copy code'));
      expect(screen.getByLabelText('Copied!')).toBeInTheDocument();

      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('handles copy failure gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.reject(new Error('Failed to copy'))),
        },
      });

      const user = userEvent.setup();
      render(<CodeBlock code={sampleCode} />);

      await user.click(screen.getByLabelText('Copy code'));
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should not have violations', async () => {
      const { container } = render(<CodeBlock code={sampleCode} language="javascript" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations with filename and copy button', async () => {
      const { container } = render(
        <CodeBlock code={sampleCode} filename="test.js" copyable />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('hides line numbers from screen readers', () => {
      const { container } = render(<CodeBlock code={sampleCode} />);
      const lineNumbers = container.querySelector('.code-block__line-numbers');
      expect(lineNumbers).toHaveAttribute('aria-hidden', 'true');
    });

    it('has proper aria-label on copy button', () => {
      render(<CodeBlock code={sampleCode} />);
      expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
    });

    it('updates aria-label after copying', async () => {
      const user = userEvent.setup();
      render(<CodeBlock code={sampleCode} />);

      await user.click(screen.getByLabelText('Copy code'));
      await waitFor(() => {
        expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(<CodeBlock code={sampleCode} className="custom-code" />);
      expect(container.querySelector('.custom-code')).toBeInTheDocument();
      expect(container.querySelector('.code-block')).toHaveClass('custom-code');
    });

    it('handles empty code', () => {
      render(<CodeBlock code="" />);
      const { container } = render(<CodeBlock code="" />);
      expect(container.querySelector('.code-block__code')).toBeInTheDocument();
    });

    it('handles single line code', () => {
      const { container } = render(<CodeBlock code="const x = 1;" />);
      const lineNumbers = container.querySelectorAll('.code-block__line-number');
      expect(lineNumbers).toHaveLength(1);
    });

    it('handles code with special characters', () => {
      const specialCode = 'const regex = /[a-z]+/gi;\nconst html = <div className="test">';
      render(<CodeBlock code={specialCode} />);
      expect(screen.getByText(/const regex/i)).toBeInTheDocument();
    });
  });

  describe('Different Languages', () => {
    it('supports various programming languages', () => {
      const languages = ['javascript', 'typescript', 'python', 'rust', 'go'];

      languages.forEach((lang) => {
        const { container, unmount } = render(
          <CodeBlock code="console.log('test');" language={lang} />
        );
        const codeElement = container.querySelector('.code-block__code');
        expect(codeElement).toHaveClass(`language-${lang}`);
        unmount();
      });
    });

    it('defaults to plaintext when no language specified', () => {
      const { container } = render(<CodeBlock code={sampleCode} />);
      const codeElement = container.querySelector('.code-block__code');
      expect(codeElement).toHaveClass('language-plaintext');
    });
  });
});
