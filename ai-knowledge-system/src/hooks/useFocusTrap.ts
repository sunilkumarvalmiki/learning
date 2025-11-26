import { useEffect, useRef } from 'react';

/**
 * Custom hook to trap focus within a container (typically a modal)
 * Prevents keyboard users from tabbing out of the modal into background content
 * 
 * WCAG 2.4.3 Focus Order (Level A) compliance
 * 
 * @param isActive - Whether the focus trap should be active
 * @returns Ref to attach to the container element
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose, children }) {
 *   const trapRef = useFocusTrap(isOpen);
 *   
 *   return isOpen ? (
 *     <div className="modal-overlay">
 *       <div ref={trapRef} className="modal">
 *         {children}
 *       </div>
 *     </div>
 *   ) : null;
 * }
 * ```
 */
export function useFocusTrap(isActive: boolean) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isActive) return;

        const container = containerRef.current;
        if (!container) return;

        // Store the previously focused element
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Get all focusable elements within the container
        const getFocusableElements = () => {
            const focusableSelectors = [
                'button:not([disabled])',
                '[href]',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])',
            ].join(',');

            return Array.from(
                container.querySelectorAll<HTMLElement>(focusableSelectors)
            );
        };

        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus the first focusable element
        if (firstElement) {
            // Small delay to ensure modal is rendered
            setTimeout(() => firstElement.focus(), 50);
        }

        // Handle Tab key to trap focus
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle Tab key
            if (event.key !== 'Tab') return;

            // Refresh focusable elements (in case content changed)
            const currentFocusable = getFocusableElements();
            const currentFirst = currentFocusable[0];
            const currentLast = currentFocusable[currentFocusable.length - 1];

            if (event.shiftKey) {
                // Shift + Tab: Moving backwards
                if (document.activeElement === currentFirst) {
                    currentLast?.focus();
                    event.preventDefault();
                }
            } else {
                // Tab: Moving forwards
                if (document.activeElement === currentLast) {
                    currentFirst?.focus();
                    event.preventDefault();
                }
            }
        };

        // Add event listener to the container
        container.addEventListener('keydown', handleKeyDown);

        // Cleanup function
        return () => {
            container.removeEventListener('keydown', handleKeyDown);

            // Restore focus to the previously focused element
            if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
                previousFocusRef.current.focus();
            }
        };
    }, [isActive]);

    return containerRef;
}
