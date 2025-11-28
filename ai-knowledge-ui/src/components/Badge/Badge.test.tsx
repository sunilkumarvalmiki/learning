import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Badge } from './Badge';

expect.extend(toHaveNoViolations);

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders with text content', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      render(<Badge>Default</Badge>);
      expect(screen.getByText('Default')).toHaveClass('badge--default');
    });

    it('renders with correct variant classes', () => {
      const variants = ['default', 'primary', 'success', 'warning', 'error', 'ai'] as const;

      variants.forEach((variant) => {
        const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
        expect(screen.getByText(variant)).toHaveClass(`badge--${variant}`);
        unmount();
      });
    });

    it('renders with correct size classes', () => {
      const { rerender } = render(<Badge size="small">Small</Badge>);
      expect(screen.getByText('Small')).toHaveClass('badge--small');

      rerender(<Badge size="medium">Medium</Badge>);
      expect(screen.getByText('Medium')).toHaveClass('badge--medium');

      rerender(<Badge size="large">Large</Badge>);
      expect(screen.getByText('Large')).toHaveClass('badge--large');
    });

    it('renders with dot indicator', () => {
      const { container } = render(<Badge dot>With Dot</Badge>);
      expect(container.querySelector('.badge__dot')).toBeInTheDocument();
      expect(screen.getByText('With Dot')).toHaveClass('badge--dot');
    });

    it('renders without dot by default', () => {
      const { container } = render(<Badge>No Dot</Badge>);
      expect(container.querySelector('.badge__dot')).not.toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      expect(screen.getByText('Custom')).toHaveClass('custom-badge');
      expect(screen.getByText('Custom')).toHaveClass('badge');
    });

    it('forwards additional HTML attributes', () => {
      render(<Badge data-testid="test-badge" title="Badge title">Test</Badge>);
      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('title', 'Badge title');
    });

    it('renders children of different types', () => {
      const { rerender } = render(<Badge>Text</Badge>);
      expect(screen.getByText('Text')).toBeInTheDocument();

      rerender(<Badge>123</Badge>);
      expect(screen.getByText('123')).toBeInTheDocument();

      rerender(<Badge><span data-testid="custom-element">Custom</span></Badge>);
      expect(screen.getByTestId('custom-element')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Badge>Accessible Badge</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations with dot indicator', async () => {
      const { container } = render(<Badge dot>Online</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations with all variants', async () => {
      const variants = ['default', 'primary', 'success', 'warning', 'error', 'ai'] as const;

      for (const variant of variants) {
        const { container, unmount } = render(<Badge variant={variant}>{variant}</Badge>);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
        unmount();
      }
    });

    it('hides dot from screen readers', () => {
      const { container } = render(<Badge dot>Status</Badge>);
      const dot = container.querySelector('.badge__dot');
      expect(dot).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Combinations', () => {
    it('renders with variant, size, and dot', () => {
      render(
        <Badge variant="success" size="large" dot>
          Active
        </Badge>
      );
      const badge = screen.getByText('Active');
      expect(badge).toHaveClass('badge--success');
      expect(badge).toHaveClass('badge--large');
      expect(badge).toHaveClass('badge--dot');
    });

    it('renders with all props combined', () => {
      const { container } = render(
        <Badge
          variant="error"
          size="small"
          dot
          className="custom"
          data-testid="combo-badge"
        >
          Error
        </Badge>
      );
      const badge = screen.getByTestId('combo-badge');
      expect(badge).toHaveClass('badge--error');
      expect(badge).toHaveClass('badge--small');
      expect(badge).toHaveClass('badge--dot');
      expect(badge).toHaveClass('custom');
      expect(container.querySelector('.badge__dot')).toBeInTheDocument();
    });
  });
});
