```typescript
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './Modal.css';

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

export interface ModalProps {
    /** Whether modal is open */
    isOpen: boolean;
    /** Close handler */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Modal content */
    children: React.ReactNode;
    /** Modal size */
    size?: ModalSize;
    /** Footer content */
    footer?: React.ReactNode;
    /** Close on overlay click */
    closeOnBackdrop?: boolean;
    /** Close on Escape key */
    closeOnEscape?: boolean;
    /** Show close button */
    showCloseButton?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * Modal dialog component with portal rendering
 * 
 * @example
 * ```tsx
    * <Modal
 * isOpen={ isOpen }
 * onClose={ () => setIsOpen(false) }
 * title="Settings"
    * footer={
 * <>
        *       <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        *       <Button variant="primary" onClick={onSave}>Save</Button>
        *     </>
        *   }
 * >
 * Modal content goes here
    * </Modal >
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'medium',
    closeOnBackdrop = true,
    closeOnEscape = true,
    showCloseButton = true,
    className = '',
}) => {
    // Trap focus within modal for accessibility
    const trapRef = useFocusTrap(isOpen);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Focus trap and restoration
    useEffect(() => {
        if (!isOpen) return;

        // Store previously focused element
        previousActiveElement.current = document.activeElement as HTMLElement;

        // Focus modal
        if (modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }

            // Focus trap
            const handleTab = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            };

            document.addEventListener('keydown', handleTab);
            return () => {
                document.removeEventListener('keydown', handleTab);

                // Restore focus
                if (previousActiveElement.current) {
                    previousActiveElement.current.focus();
                }
            };
        }
    }, [isOpen]);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const modalClasses = [
        'modal',
        `modal--${ size } `,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const modalContent = (
        <div className="modal-overlay" onClick={closeOnOverlayClick ? onClose : undefined}>
            <div
                ref={modalRef}
                className={modalClasses}
                onClick={(e) => e.stopPropagation()}
                ref={trapRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                <div className="modal__header">
                    {title && (
                        <h2 id="modal-title" className="modal__title">
                            {title}
                        </h2>
                    )}
                    <button
                        className="modal__close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal__body">{children}</div>

                {footer && <div className="modal__footer">{footer}</div>}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
