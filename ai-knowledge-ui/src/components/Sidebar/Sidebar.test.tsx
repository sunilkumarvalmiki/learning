import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Sidebar, SidebarItem } from './Sidebar';

expect.extend(toHaveNoViolations);

const mockItems: SidebarItem[] = [
  { id: '1', label: 'Dashboard', icon: <span data-testid="icon-1">📊</span>, onClick: vi.fn() },
  { id: '2', label: 'Documents', icon: <span data-testid="icon-2">📄</span>, badge: 5, onClick: vi.fn() },
  { id: '3', label: 'Settings', icon: <span data-testid="icon-3">⚙️</span>, onClick: vi.fn() },
];

describe('Sidebar', () => {
  describe('Rendering', () => {
    it('renders all sidebar items', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders items as buttons by default', () => {
      render(<Sidebar items={mockItems} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it('renders items as links when href provided', () => {
      const itemsWithLinks: SidebarItem[] = [
        { id: '1', label: 'Home', href: '/home' },
        { id: '2', label: 'About', href: '/about' },
      ];
      render(<Sidebar items={itemsWithLinks} />);

      expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/home');
      expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about');
    });

    it('renders icons', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByTestId('icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('icon-2')).toBeInTheDocument();
      expect(screen.getByTestId('icon-3')).toBeInTheDocument();
    });

    it('renders badges', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders with header', () => {
      render(<Sidebar items={mockItems} header={<div>Header Content</div>} />);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('renders with footer', () => {
      render(<Sidebar items={mockItems} footer={<div>Footer Content</div>} />);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('marks active item correctly', () => {
      const { container } = render(<Sidebar items={mockItems} activeId="2" />);
      const activeItem = screen.getByText('Documents').closest('.sidebar-item');
      expect(activeItem).toHaveClass('sidebar-item--active');
    });

    it('sets aria-current on active item', () => {
      render(<Sidebar items={mockItems} activeId="1" />);
      const activeButton = screen.getByRole('button', { name: /dashboard/i });
      expect(activeButton).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Nested Items', () => {
    const nestedItems: SidebarItem[] = [
      {
        id: '1',
        label: 'Parent',
        children: [
          { id: '1-1', label: 'Child 1' },
          { id: '1-2', label: 'Child 2' },
        ],
      },
    ];

    it('renders nested items when parent expanded', async () => {
      const user = userEvent.setup();
      render(<Sidebar items={nestedItems} />);

      expect(screen.queryByText('Child 1')).not.toBeInTheDocument();

      const expandButton = screen.getByLabelText('Expand');
      await user.click(expandButton);

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('toggles nested items', async () => {
      const user = userEvent.setup();
      render(<Sidebar items={nestedItems} />);

      const expandButton = screen.getByLabelText('Expand');

      // Expand
      await user.click(expandButton);
      expect(screen.getByText('Child 1')).toBeInTheDocument();

      // Collapse
      const collapseButton = screen.getByLabelText('Collapse');
      await user.click(collapseButton);
      expect(screen.queryByText('Child 1')).not.toBeInTheDocument();
    });

    it('has proper aria-expanded attribute', async () => {
      const user = userEvent.setup();
      render(<Sidebar items={nestedItems} />);

      const expandButton = screen.getByLabelText('Expand');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders children in a group', async () => {
      const user = userEvent.setup();
      render(<Sidebar items={nestedItems} />);

      await user.click(screen.getByLabelText('Expand'));
      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
      expect(within(group).getByText('Child 1')).toBeInTheDocument();
    });

    it('prevents parent onClick when expanding', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const itemsWithClick: SidebarItem[] = [
        {
          id: '1',
          label: 'Parent',
          onClick: handleClick,
          children: [{ id: '1-1', label: 'Child 1' }],
        },
      ];
      render(<Sidebar items={itemsWithClick} />);

      await user.click(screen.getByLabelText('Expand'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Collapsed State', () => {
    it('applies collapsed class when collapsed', () => {
      const { container } = render(<Sidebar items={mockItems} collapsed />);
      expect(container.querySelector('.sidebar--collapsed')).toBeInTheDocument();
    });

    it('hides labels when collapsed', () => {
      const { container } = render(<Sidebar items={mockItems} collapsed />);
      const labels = container.querySelectorAll('.sidebar-item__label');
      expect(labels).toHaveLength(0);
    });

    it('hides badges when collapsed', () => {
      render(<Sidebar items={mockItems} collapsed />);
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('shows only icons when collapsed', () => {
      render(<Sidebar items={mockItems} collapsed />);
      expect(screen.getByTestId('icon-1')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('sets width based on collapsed state', () => {
      const { container, rerender } = render(<Sidebar items={mockItems} />);
      const sidebar = container.querySelector('.sidebar') as HTMLElement;
      expect(sidebar.style.width).toBe('240px');

      rerender(<Sidebar items={mockItems} collapsed />);
      expect(sidebar.style.width).toBe('64px');
    });

    it('respects custom width', () => {
      const { container } = render(<Sidebar items={mockItems} width={300} />);
      const sidebar = container.querySelector('.sidebar') as HTMLElement;
      expect(sidebar.style.width).toBe('300px');
    });
  });

  describe('User Interactions', () => {
    it('calls onClick when item clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const items: SidebarItem[] = [
        { id: '1', label: 'Item', onClick: handleClick },
      ];
      render(<Sidebar items={items} />);

      await user.click(screen.getByRole('button', { name: /item/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<Sidebar items={mockItems} />);

      await user.tab();
      expect(screen.getByText('Dashboard').closest('button')).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should not have violations', async () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations when collapsed', async () => {
      const { container } = render(<Sidebar items={mockItems} collapsed />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations with nested items', async () => {
      const user = userEvent.setup();
      const nestedItems: SidebarItem[] = [
        {
          id: '1',
          label: 'Parent',
          children: [{ id: '1-1', label: 'Child' }],
        },
      ];
      const { container } = render(<Sidebar items={nestedItems} />);
      await user.click(screen.getByLabelText('Expand'));
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper landmark role', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('has aria-label on sidebar', () => {
      render(<Sidebar items={mockItems} />);
      const sidebar = screen.getByLabelText('Sidebar navigation');
      expect(sidebar).toBeInTheDocument();
    });

    it('has navigation role on nav element', () => {
      render(<Sidebar items={mockItems} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('hides icons from screen readers', () => {
      const { container } = render(<Sidebar items={mockItems} />);
      const icons = container.querySelectorAll('.sidebar-item__icon');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('provides accessible label for badges', () => {
      render(<Sidebar items={mockItems} />);
      const badge = screen.getByText('5');
      expect(badge).toHaveAttribute('aria-label', '5 items');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(<Sidebar items={mockItems} className="custom-sidebar" />);
      expect(container.querySelector('.custom-sidebar')).toBeInTheDocument();
      expect(container.querySelector('.sidebar')).toHaveClass('custom-sidebar');
    });
  });

  describe('Indentation', () => {
    it('applies correct padding for nested items', async () => {
      const user = userEvent.setup();
      const nestedItems: SidebarItem[] = [
        {
          id: '1',
          label: 'Parent',
          children: [
            {
              id: '1-1',
              label: 'Child',
              children: [{ id: '1-1-1', label: 'Grandchild' }],
            },
          ],
        },
      ];
      render(<Sidebar items={nestedItems} />);

      await user.click(screen.getByLabelText('Expand'));

      const childButton = screen.getByRole('button', { name: /^child/i });
      expect(childButton).toHaveStyle({ paddingLeft: '28px' }); // 12 + 1*16

      await user.click(within(childButton.parentElement!).getByLabelText('Expand'));

      const grandchildButton = screen.getByRole('button', { name: /grandchild/i });
      expect(grandchildButton).toHaveStyle({ paddingLeft: '44px' }); // 12 + 2*16
    });
  });
});
