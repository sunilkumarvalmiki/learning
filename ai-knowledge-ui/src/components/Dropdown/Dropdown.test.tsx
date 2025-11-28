import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Dropdown, DropdownItem } from './Dropdown';

expect.extend(toHaveNoViolations);

const mockItems: DropdownItem[] = [
  { id: '1', label: 'Edit', onClick: vi.fn() },
  { id: '2', label: 'Duplicate', onClick: vi.fn() },
  { id: '3', label: 'Delete', onClick: vi.fn(), danger: true },
];

describe('Dropdown', () => {
  describe('Rendering', () => {
    it('renders trigger element', () => {
      render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);
      expect(screen.getByRole('button', { name: /options/i })).toBeInTheDocument();
    });

    it('does not show menu by default', () => {
      render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('shows menu when trigger clicked', async () => {
      const user = userEvent.setup();
      render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('renders all menu items', async () => {
      const user = userEvent.setup();
      render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /duplicate/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
    });

    it('renders items with icons', async () => {
      const user = userEvent.setup();
      const itemsWithIcons: DropdownItem[] = [
        { id: '1', label: 'Edit', icon: <span data-testid="edit-icon">✏️</span> },
      ];
      render(<Dropdown trigger={<button>Options</button>} items={itemsWithIcons} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    });

    it('renders disabled items', async () => {
      const user = userEvent.setup();
      const itemsWithDisabled: DropdownItem[] = [
        { id: '1', label: 'Edit', onClick: vi.fn() },
        { id: '2', label: 'Delete', onClick: vi.fn(), disabled: true },
      ];
      render(<Dropdown trigger={<button>Options</button>} items={itemsWithDisabled} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getByRole('menuitem', { name: /delete/i })).toBeDisabled();
    });

    it('renders dividers', async () => {
      const user = userEvent.setup();
      const itemsWithDivider: DropdownItem[] = [
        { id: '1', label: 'Edit', onClick: vi.fn() },
        { id: 'div1', label: '', divider: true },
        { id: '2', label: 'Delete', onClick: vi.fn() },
      ];
      render(<Dropdown trigger={<button>Options</button>} items={itemsWithDivider} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      const separators = screen.getAllByRole('separator');
      expect(separators).toHaveLength(1);
    });

    it('applies danger class to danger items', async () => {
      const user = userEvent.setup();
      const { container } = render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      const deleteItem = screen.getByRole('menuitem', { name: /delete/i });
      expect(deleteItem).toHaveClass('dropdown__item--danger');
    });
  });

  describe('Interaction', () => {
    it('toggles menu on trigger click', async () => {
      const user = userEvent.setup();
      render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('calls item onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const items: DropdownItem[] = [
        { id: '1', label: 'Edit', onClick: handleClick },
      ];
      render(<Dropdown trigger={<button>Options</button>} items={items} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      await user.click(screen.getByRole('menuitem', { name: /edit/i }));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('closes menu after item click', async () => {
      const user = userEvent.setup();
      render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(screen.getByRole('menuitem', { name: /edit/i }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('does not call onClick when disabled item clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const items: DropdownItem[] = [
        { id: '1', label: 'Edit', onClick: handleClick, disabled: true },
      ];
      render(<Dropdown trigger={<button>Options</button>} items={items} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      await user.click(screen.getByRole('menuitem', { name: /edit/i }));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('closes on outside click', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <button>Outside</button>
          <Dropdown trigger={<button>Options</button>} items={mockItems} />
        </div>
      );

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /outside/i }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup();
      render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Placement', () => {
    it('applies correct placement classes', async () => {
      const user = userEvent.setup();
      const { container, rerender } = render(
        <Dropdown trigger={<button>Options</button>} items={mockItems} placement="bottom-start" />
      );

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(container.querySelector('.dropdown__menu--bottom-start')).toBeInTheDocument();

      rerender(<Dropdown trigger={<button>Options</button>} items={mockItems} placement="top-end" />);
      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(container.querySelector('.dropdown__menu--top-end')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have violations', async () => {
      const { container } = render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations when open', async () => {
      const user = userEvent.setup();
      const { container } = render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);
      await user.click(screen.getByRole('button', { name: /options/i }));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes on trigger', () => {
      const { container } = render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);
      const trigger = container.querySelector('.dropdown__trigger');
      expect(trigger).toHaveAttribute('role', 'button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      const { container } = render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);
      const trigger = container.querySelector('.dropdown__trigger');

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('menu has role="menu"', async () => {
      const user = userEvent.setup();
      render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('menu items have role="menuitem"', async () => {
      const user = userEvent.setup();
      render(<Dropdown trigger={<button>Options</button>} items={mockItems} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    });

    it('hides icons from screen readers', async () => {
      const user = userEvent.setup();
      const itemsWithIcons: DropdownItem[] = [
        { id: '1', label: 'Edit', icon: <span>✏️</span> },
      ];
      const { container } = render(<Dropdown trigger={<button>Options</button>} items={itemsWithIcons} />);

      await user.click(screen.getByRole('button', { name: /options/i }));
      const icon = container.querySelector('.dropdown__item-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Dropdown trigger={<button>Options</button>} items={mockItems} className="custom-dropdown" />
      );
      expect(container.querySelector('.custom-dropdown')).toBeInTheDocument();
    });
  });
});
