import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Tabs, TabItem } from './Tabs';

expect.extend(toHaveNoViolations);

const mockItems: TabItem[] = [
  { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
  { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
  { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
];

describe('Tabs', () => {
  describe('Rendering', () => {
    it('renders all tab buttons', () => {
      render(<Tabs items={mockItems} />);
      expect(screen.getByRole('tab', { name: /tab 1/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /tab 2/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /tab 3/i })).toBeInTheDocument();
    });

    it('renders first tab as active by default', () => {
      render(<Tabs items={mockItems} />);
      expect(screen.getByRole('tab', { name: /tab 1/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('renders with defaultActiveId', () => {
      render(<Tabs items={mockItems} defaultActiveId="tab2" />);
      expect(screen.getByRole('tab', { name: /tab 2/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('renders with controlled activeId', () => {
      render(<Tabs items={mockItems} activeId="tab3" />);
      expect(screen.getByRole('tab', { name: /tab 3/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });

    it('renders tabs with icons', () => {
      const itemsWithIcons: TabItem[] = [
        { id: 'tab1', label: 'Home', icon: <span data-testid="icon-home">🏠</span>, content: <div>Home</div> },
        { id: 'tab2', label: 'Profile', icon: <span data-testid="icon-profile">👤</span>, content: <div>Profile</div> },
      ];
      render(<Tabs items={itemsWithIcons} />);
      expect(screen.getByTestId('icon-home')).toBeInTheDocument();
      expect(screen.getByTestId('icon-profile')).toBeInTheDocument();
    });

    it('renders tabs with badges', () => {
      const itemsWithBadges: TabItem[] = [
        { id: 'tab1', label: 'Messages', badge: 5, content: <div>Messages</div> },
        { id: 'tab2', label: 'Notifications', badge: '99+', content: <div>Notifications</div> },
      ];
      render(<Tabs items={itemsWithBadges} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('renders with different variants', () => {
      const { container, rerender } = render(<Tabs items={mockItems} variant="default" />);
      expect(container.querySelector('.tabs__list--default')).toBeInTheDocument();

      rerender(<Tabs items={mockItems} variant="pills" />);
      expect(container.querySelector('.tabs__list--pills')).toBeInTheDocument();
    });

    it('renders full width when specified', () => {
      const { container } = render(<Tabs items={mockItems} fullWidth />);
      expect(container.querySelector('.tabs__list--full-width')).toBeInTheDocument();
    });

    it('renders disabled tabs', () => {
      const itemsWithDisabled: TabItem[] = [
        { id: 'tab1', label: 'Enabled', content: <div>Enabled</div> },
        { id: 'tab2', label: 'Disabled', disabled: true, content: <div>Disabled</div> },
      ];
      render(<Tabs items={itemsWithDisabled} />);
      expect(screen.getByRole('tab', { name: /disabled/i })).toBeDisabled();
    });
  });

  describe('Tab Switching', () => {
    it('switches tabs on click', async () => {
      const user = userEvent.setup();
      render(<Tabs items={mockItems} />);

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();

      await user.click(screen.getByRole('tab', { name: /tab 2/i }));

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /tab 2/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('calls onChange when tab clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Tabs items={mockItems} onChange={handleChange} />);

      await user.click(screen.getByRole('tab', { name: /tab 2/i }));
      expect(handleChange).toHaveBeenCalledWith('tab2');
    });

    it('does not switch when disabled tab clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const itemsWithDisabled: TabItem[] = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab 2', disabled: true, content: <div>Content 2</div> },
      ];
      render(<Tabs items={itemsWithDisabled} onChange={handleChange} />);

      await user.click(screen.getByRole('tab', { name: /tab 2/i }));
      expect(handleChange).not.toHaveBeenCalled();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('works in controlled mode', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const { rerender } = render(
        <Tabs items={mockItems} activeId="tab1" onChange={handleChange} />
      );

      await user.click(screen.getByRole('tab', { name: /tab 2/i }));
      expect(handleChange).toHaveBeenCalledWith('tab2');

      // Parent component updates activeId
      rerender(<Tabs items={mockItems} activeId="tab2" onChange={handleChange} />);
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });
  });

  describe('Panel Content', () => {
    it('shows active tab content', () => {
      render(<Tabs items={mockItems} defaultActiveId="tab2" />);
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    });

    it('does not render panel when tab has no content', () => {
      const itemsNoContent: TabItem[] = [
        { id: 'tab1', label: 'No Content' },
        { id: 'tab2', label: 'With Content', content: <div>Content</div> },
      ];
      const { container } = render(<Tabs items={itemsNoContent} />);
      expect(container.querySelector('.tabs__panel')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have violations', async () => {
      const { container } = render(<Tabs items={mockItems} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations with icons and badges', async () => {
      const itemsWithAll: TabItem[] = [
        {
          id: 'tab1',
          label: 'Home',
          icon: <span>🏠</span>,
          badge: 5,
          content: <div>Content</div>,
        },
      ];
      const { container } = render(<Tabs items={itemsWithAll} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA roles', () => {
      render(<Tabs items={mockItems} />);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('associates tabs with panels using aria-controls', () => {
      render(<Tabs items={mockItems} />);
      const tab1 = screen.getByRole('tab', { name: /tab 1/i });
      expect(tab1).toHaveAttribute('aria-controls', 'tabpanel-tab1');
      expect(tab1).toHaveAttribute('id', 'tab-tab1');
    });

    it('associates panels with tabs using aria-labelledby', () => {
      render(<Tabs items={mockItems} defaultActiveId="tab1" />);
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', 'tab-tab1');
      expect(panel).toHaveAttribute('id', 'tabpanel-tab1');
    });

    it('sets aria-selected correctly', () => {
      render(<Tabs items={mockItems} defaultActiveId="tab2" />);
      expect(screen.getByRole('tab', { name: /tab 1/i })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: /tab 2/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /tab 3/i })).toHaveAttribute('aria-selected', 'false');
    });

    it('hides icons from screen readers', () => {
      const itemsWithIcons: TabItem[] = [
        { id: 'tab1', label: 'Home', icon: <span>🏠</span>, content: <div>Content</div> },
      ];
      const { container } = render(<Tabs items={itemsWithIcons} />);
      const icon = container.querySelector('.tabs__tab-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('provides accessible label for badges', () => {
      const itemsWithBadges: TabItem[] = [
        { id: 'tab1', label: 'Messages', badge: 5, content: <div>Content</div> },
      ];
      render(<Tabs items={itemsWithBadges} />);
      const badge = screen.getByText('5');
      expect(badge).toHaveAttribute('aria-label', '5 items');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(<Tabs items={mockItems} className="custom-tabs" />);
      expect(container.querySelector('.custom-tabs')).toBeInTheDocument();
      expect(container.querySelector('.tabs')).toHaveClass('custom-tabs');
    });
  });

  describe('Keyboard Navigation', () => {
    it('tabs are keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Tabs items={mockItems} />);

      await user.tab();
      expect(screen.getByRole('tab', { name: /tab 1/i })).toHaveFocus();
    });

    it('can activate tab with keyboard', async () => {
      const user = userEvent.setup();
      render(<Tabs items={mockItems} />);

      const tab2 = screen.getByRole('tab', { name: /tab 2/i });
      tab2.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(tab2).toHaveAttribute('aria-selected', 'true');
    });
  });
});
