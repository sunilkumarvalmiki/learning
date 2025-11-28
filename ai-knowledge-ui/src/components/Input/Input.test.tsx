import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from './Input';

expect.extend(toHaveNoViolations);

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('associates label with input using htmlFor', () => {
      render(<Input label="Username" id="username-input" />);
      const label = screen.getByText('Username');
      const input = screen.getByLabelText('Username');
      expect(label).toHaveAttribute('for', 'username-input');
      expect(input).toHaveAttribute('id', 'username-input');
    });

    it('generates unique ID when not provided', () => {
      const { container } = render(<Input label="Test" />);
      const input = container.querySelector('input');
      expect(input).toHaveAttribute('id');
      expect(input?.id).toMatch(/^input-/);
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      render(<Input helperText="This is helper text" />);
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows error instead of helper text when both provided', () => {
      render(<Input error="Error message" helperText="Helper text" />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('renders with required indicator', () => {
      render(<Input label="Email" required />);
      expect(screen.getByLabelText('required')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('renders with icon before', () => {
      render(<Input iconBefore={<span data-testid="icon-before">🔍</span>} />);
      expect(screen.getByTestId('icon-before')).toBeInTheDocument();
    });

    it('renders with icon after', () => {
      render(<Input iconAfter={<span data-testid="icon-after">✓</span>} />);
      expect(screen.getByTestId('icon-after')).toBeInTheDocument();
    });

    it('renders full width', () => {
      const { container } = render(<Input fullWidth />);
      expect(container.querySelector('.input-container--full-width')).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { container, rerender } = render(<Input size="small" />);
      expect(container.querySelector('.input-wrapper--small')).toBeInTheDocument();

      rerender(<Input size="medium" />);
      expect(container.querySelector('.input-wrapper--medium')).toBeInTheDocument();

      rerender(<Input size="large" />);
      expect(container.querySelector('.input-wrapper--large')).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('can be disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('shows disabled state styling', () => {
      const { container } = render(<Input disabled />);
      expect(container.querySelector('.input-wrapper--disabled')).toBeInTheDocument();
    });

    it('shows error state styling', () => {
      const { container } = render(<Input error="Error" />);
      expect(container.querySelector('.input-wrapper--error')).toBeInTheDocument();
    });

    it('sets aria-invalid when error exists', () => {
      render(<Input error="Invalid input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-invalid to false when no error', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('User Interactions', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('calls onChange handler', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('calls onFocus handler', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);

      await user.click(screen.getByRole('textbox'));
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur handler', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('can be focused with tab', async () => {
      const user = userEvent.setup();
      render(<Input />);

      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(input).toHaveValue('');
    });
  });

  describe('Input Types', () => {
    it('supports different input types', () => {
      const { rerender } = render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      const passwordInput = document.querySelector('input[type="password"]');
      expect(passwordInput).toBeInTheDocument();

      rerender(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Input label="Accessible Input" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations with error', async () => {
      const { container } = render(<Input label="Input" error="Error message" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations when required', async () => {
      const { container } = render(<Input label="Required Input" required />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations when disabled', async () => {
      const { container } = render(<Input label="Disabled Input" disabled />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates error with input using aria-describedby', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(screen.getByText('Error message')).toHaveAttribute('id', errorId!);
    });

    it('associates helper text with input using aria-describedby', () => {
      render(<Input helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      const helperId = input.getAttribute('aria-describedby');
      expect(helperId).toBeTruthy();
      expect(screen.getByText('Helper text')).toHaveAttribute('id', helperId!);
    });

    it('hides icons from screen readers', () => {
      const { container } = render(
        <Input
          iconBefore={<span>🔍</span>}
          iconAfter={<span>✓</span>}
        />
      );
      const icons = container.querySelectorAll('.input-icon');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(<Input className="custom-input" />);
      expect(container.querySelector('.custom-input')).toBeInTheDocument();
    });

    it('forwards ref', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });

    it('forwards additional HTML attributes', () => {
      render(<Input data-testid="custom-input" maxLength={10} />);
      const input = screen.getByTestId('custom-input');
      expect(input).toHaveAttribute('maxLength', '10');
    });
  });
});
