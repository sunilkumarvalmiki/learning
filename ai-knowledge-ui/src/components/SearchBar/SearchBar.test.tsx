import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SearchBar } from './SearchBar';

expect.extend(toHaveNoViolations);

describe('SearchBar', () => {
  describe('Rendering', () => {
    it('renders search input', () => {
      render(<SearchBar />);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<SearchBar placeholder="Search documents..." />);
      expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
    });

    it('renders default placeholder', () => {
      render(<SearchBar />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with search icon', () => {
      const { container } = render(<SearchBar />);
      expect(container.querySelector('.search-bar__icon')).toBeInTheDocument();
    });

    it('shows keyboard shortcut hint when enableShortcut is true', () => {
      render(<SearchBar enableShortcut />);
      expect(screen.getByText('⌘K')).toBeInTheDocument();
    });

    it('hides shortcut hint when there is a value', async () => {
      const user = userEvent.setup();
      render(<SearchBar enableShortcut />);

      expect(screen.getByText('⌘K')).toBeInTheDocument();

      await user.type(screen.getByRole('searchbox'), 'test');
      expect(screen.queryByText('⌘K')).not.toBeInTheDocument();
    });

    it('shows clear button when there is a value', async () => {
      const user = userEvent.setup();
      render(<SearchBar />);

      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

      await user.type(screen.getByRole('searchbox'), 'test');
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(<SearchBar />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'search query');
      expect(input).toHaveValue('search query');
    });

    it('calls onChange when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<SearchBar onChange={handleChange} />);

      await user.type(screen.getByRole('searchbox'), 'test');
      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenLastCalledWith('test');
    });

    it('calls onSubmit when form submitted', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<SearchBar onSubmit={handleSubmit} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'search query');
      await user.type(input, '{Enter}');

      expect(handleSubmit).toHaveBeenCalledWith('search query');
    });

    it('clears input when clear button clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<SearchBar onChange={handleChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');
      expect(input).toHaveValue('test');

      await user.click(screen.getByLabelText('Clear search'));
      expect(input).toHaveValue('');
      expect(handleChange).toHaveBeenLastCalledWith('');
    });

    it('focuses input after clearing', async () => {
      const user = userEvent.setup();
      render(<SearchBar />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');
      await user.click(screen.getByLabelText('Clear search'));

      expect(input).toHaveFocus();
    });
  });

  describe('Controlled Mode', () => {
    it('works in controlled mode', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const { rerender } = render(<SearchBar value="" onChange={handleChange} />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveValue('');

      await user.type(input, 'a');
      expect(handleChange).toHaveBeenCalledWith('a');

      // Simulate parent updating value
      rerender(<SearchBar value="a" onChange={handleChange} />);
      expect(input).toHaveValue('a');
    });
  });

  describe('Keyboard Shortcut', () => {
    it('focuses input on Cmd+K', async () => {
      const user = userEvent.setup();
      render(<SearchBar enableShortcut />);

      const input = screen.getByRole('searchbox');
      expect(input).not.toHaveFocus();

      await user.keyboard('{Meta>}k{/Meta}');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('focuses input on Ctrl+K', async () => {
      const user = userEvent.setup();
      render(<SearchBar enableShortcut />);

      const input = screen.getByRole('searchbox');
      expect(input).not.toHaveFocus();

      await user.keyboard('{Control>}k{/Control}');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('does not activate shortcut when enableShortcut is false', async () => {
      const user = userEvent.setup();
      render(<SearchBar />);

      const input = screen.getByRole('searchbox');
      await user.keyboard('{Meta>}k{/Meta}');

      // Input should not be focused
      expect(input).not.toHaveFocus();
    });
  });

  describe('Modal Mode', () => {
    it('does not show modal by default', () => {
      render(<SearchBar modal />);
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('shows modal on Cmd+K when enableShortcut is true', async () => {
      const user = userEvent.setup();
      render(<SearchBar modal enableShortcut />);

      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();

      await user.keyboard('{Meta>}k{/Meta}');
      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });
    });

    it('closes modal on Escape', async () => {
      const user = userEvent.setup();
      render(<SearchBar modal enableShortcut />);

      await user.keyboard('{Meta>}k{/Meta}');
      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      });
    });

    it('calls onClose when modal closed', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<SearchBar modal enableShortcut onClose={handleClose} />);

      await user.keyboard('{Meta>}k{/Meta}');
      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalled();
    });

    it('shows ESC hint in modal', async () => {
      const user = userEvent.setup();
      render(<SearchBar modal enableShortcut />);

      await user.keyboard('{Meta>}k{/Meta}');
      await waitFor(() => {
        expect(screen.getByText(/ESC/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should not have violations', async () => {
      const { container } = render(<SearchBar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations with shortcut', async () => {
      const { container } = render(<SearchBar enableShortcut />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper aria-label', () => {
      render(<SearchBar />);
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Search');
    });

    it('search input has type="search"', () => {
      render(<SearchBar />);
      expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
    });

    it('hides decorative icons from screen readers', () => {
      const { container } = render(<SearchBar />);
      const icon = container.querySelector('.search-bar__icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('hides shortcut hint from screen readers', () => {
      const { container } = render(<SearchBar enableShortcut />);
      const shortcut = container.querySelector('.search-bar__shortcut');
      expect(shortcut).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(<SearchBar className="custom-search" />);
      expect(container.querySelector('.custom-search')).toBeInTheDocument();
    });
  });
});
