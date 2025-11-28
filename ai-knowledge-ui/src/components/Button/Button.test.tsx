import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with text content', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with primary variant by default', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn--primary');
    });

    it('renders with correct variant classes', () => {
      const { rerender } = render(<Button variant="secondary">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--secondary');

      rerender(<Button variant="ghost">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--ghost');

      rerender(<Button variant="danger">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--danger');
    });

    it('renders with correct size classes', () => {
      const { rerender } = render(<Button size="small">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--small');

      rerender(<Button size="medium">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--medium');

      rerender(<Button size="large">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--large');
    });

    it('renders full width when specified', () => {
      render(<Button fullWidth>Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn--full-width');
    });

    it('renders with icon before text', () => {
      render(
        <Button iconBefore={<span data-testid="icon-before">🔍</span>}>
          Search
        </Button>
      );
      expect(screen.getByTestId('icon-before')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('renders with icon after text', () => {
      render(
        <Button iconAfter={<span data-testid="icon-after">→</span>}>
          Next
        </Button>
      );
      expect(screen.getByTestId('icon-after')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn--loading');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('hides icons when loading', () => {
      render(
        <Button
          loading
          iconBefore={<span data-testid="icon-before">🔍</span>}
          iconAfter={<span data-testid="icon-after">→</span>}
        >
          Loading
        </Button>
      );
      expect(screen.queryByTestId('icon-before')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-after')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('cannot be clicked when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be triggered with keyboard (Enter)', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be triggered with keyboard (Space)', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Press me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('receives focus when tabbed to', async () => {
      const user = userEvent.setup();
      render(<Button>Focus me</Button>);

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('forwards additional HTML attributes', () => {
      render(<Button data-testid="custom-button" aria-label="Custom button">Button</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('aria-label', 'Custom button');
    });

    it('supports ref forwarding', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations with icons', async () => {
      const { container } = render(
        <Button iconBefore={<span>🔍</span>} iconAfter={<span>→</span>}>
          Button with Icons
        </Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations when disabled', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations when loading', async () => {
      const { container } = render(<Button loading>Loading Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });
  });
});
