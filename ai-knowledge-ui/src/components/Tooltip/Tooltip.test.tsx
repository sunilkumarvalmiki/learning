import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Tooltip } from './Tooltip';

expect.extend(toHaveNoViolations);

describe('Tooltip', () => {
  describe('Rendering', () => {
    it('renders children element', () => {
      render(
        <Tooltip content="Helpful text">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('button', { name: /hover me/i })).toBeInTheDocument();
    });

    it('does not show tooltip by default', () => {
      render(
        <Tooltip content="Tooltip text">
          <button>Button</button>
        </Tooltip>
      );
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('shows tooltip on mouse enter', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText('Tooltip text')).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      await user.unhover(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('shows tooltip on focus', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      await user.tab();
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('hides tooltip on blur', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      button.focus();
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      await user.tab();
      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Placement', () => {
    it('applies correct placement classes', async () => {
      const user = userEvent.setup();
      const placements = ['top', 'bottom', 'left', 'right'] as const;

      for (const placement of placements) {
        const { container, unmount } = render(
          <Tooltip content="Text" placement={placement} delay={0}>
            <button>Button</button>
          </Tooltip>
        );

        await user.hover(screen.getByRole('button'));
        await waitFor(() => {
          expect(container.querySelector(`.tooltip__content--${placement}`)).toBeInTheDocument();
        });
        unmount();
      }
    });
  });

  describe('Delay', () => {
    it('respects custom delay', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      render(
        <Tooltip content="Tooltip text" delay={500}>
          <button>Button</button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));

      // Should not be visible immediately
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Fast-forward time
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('cancels delayed show on mouse leave', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      render(
        <Tooltip content="Tooltip text" delay={500}>
          <button>Button</button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));
      vi.advanceTimersByTime(100);
      await user.unhover(screen.getByRole('button'));
      vi.advanceTimersByTime(400);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should not have violations', async () => {
      const { container } = render(
        <Tooltip content="Tooltip text">
          <button>Button</button>
        </Tooltip>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations when visible', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates tooltip with trigger using aria-describedby', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-describedby');

      await user.hover(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-describedby', 'tooltip-content');
        expect(screen.getByRole('tooltip')).toHaveAttribute('id', 'tooltip-content');
      });
    });

    it('has role="tooltip"', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Content Types', () => {
    it('renders string content', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="String content" delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByText('String content')).toBeInTheDocument();
      });
    });

    it('renders React element content', async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content={<span data-testid="custom-content">Custom content</span>} delay={0}>
          <button>Button</button>
        </Tooltip>
      );

      await user.hover(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      });
    });
  });
});
