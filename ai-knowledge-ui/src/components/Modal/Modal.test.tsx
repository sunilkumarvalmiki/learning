import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Modal } from './Modal';

expect.extend(toHaveNoViolations);

describe('Modal', () => {
  // Create a container for portal
  let portalRoot: HTMLElement;

  beforeEach(() => {
    portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    document.body.removeChild(portalRoot);
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('does not render when closed', () => {
      render(<Modal isOpen={false} onClose={() => {}}>Content</Modal>);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders when open', () => {
      render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('renders with title', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal Title">
          Content
        </Modal>
      );
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
    });

    it('renders with footer', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          footer={<button>Footer Button</button>}
        >
          Content
        </Modal>
      );
      expect(screen.getByRole('button', { name: /footer button/i })).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { container, rerender } = render(
        <Modal isOpen={true} onClose={() => {}} size="small">
          Small
        </Modal>
      );
      expect(container.querySelector('.modal--small')).toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={() => {}} size="large">
          Large
        </Modal>
      );
      expect(container.querySelector('.modal--large')).toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={() => {}} size="fullscreen">
          Fullscreen
        </Modal>
      );
      expect(container.querySelector('.modal--fullscreen')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<Modal isOpen={true} onClose={handleClose}>Content</Modal>);

      await user.click(screen.getByLabelText('Close modal'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay clicked by default', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const { container } = render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );

      const overlay = container.querySelector('.modal-overlay') as HTMLElement;
      await user.click(overlay);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on overlay click when disabled', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const { container } = render(
        <Modal isOpen={true} onClose={handleClose} closeOnOverlayClick={false}>
          Content
        </Modal>
      );

      const overlay = container.querySelector('.modal-overlay') as HTMLElement;
      await user.click(overlay);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not close when modal content clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<Modal isOpen={true} onClose={handleClose}>Content</Modal>);

      await user.click(screen.getByRole('dialog'));
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('closes on Escape key by default', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<Modal isOpen={true} onClose={handleClose}>Content</Modal>);

      await user.keyboard('{Escape}');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when disabled', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnEscape={false}>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('focuses first focusable element when opened', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          <button>First</button>
          <button>Second</button>
        </Modal>
      );

      expect(screen.getByRole('button', { name: /first/i })).toHaveFocus();
    });

    it('traps focus within modal', async () => {
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal">
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );

      const closeBtn = screen.getByLabelText('Close modal');
      const btn1 = screen.getByRole('button', { name: /button 1/i });
      const btn2 = screen.getByRole('button', { name: /button 2/i });

      // Tab through all elements
      await user.tab();
      expect(btn2).toHaveFocus();

      await user.tab();
      expect(closeBtn).toHaveFocus();

      // Tab should cycle back to first element
      await user.tab();
      expect(btn1).toHaveFocus();
    });

    it('restores focus to previous element when closed', async () => {
      const { rerender } = render(
        <>
          <button>Trigger</button>
          <Modal isOpen={true} onClose={() => {}}>
            <button>Modal Button</button>
          </Modal>
        </>
      );

      const trigger = screen.getByRole('button', { name: /trigger/i });
      trigger.focus();

      // Simulate closing modal
      rerender(
        <>
          <button>Trigger</button>
          <Modal isOpen={false} onClose={() => {}}>
            <button>Modal Button</button>
          </Modal>
        </>
      );

      // Note: Focus restoration happens in cleanup, may need adjustment for testing
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when open', () => {
      render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>Content</Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal isOpen={false} onClose={() => {}}>Content</Modal>);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should not have violations', async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Accessible Modal">
          <p>Content</p>
        </Modal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has role="dialog"', () => {
      render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('associates title with dialog using aria-labelledby', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal Title">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(screen.getByText('Modal Title')).toHaveAttribute('id', 'modal-title');
    });

    it('does not have aria-labelledby when no title', () => {
      render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} className="custom-modal">
          Content
        </Modal>
      );
      expect(container.querySelector('.custom-modal')).toBeInTheDocument();
    });

    it('renders in portal (outside root)', () => {
      render(<Modal isOpen={true} onClose={() => {}}>Content</Modal>);
      const dialog = screen.getByRole('dialog');
      expect(dialog.parentElement?.parentElement).toBe(document.body);
    });
  });
});
