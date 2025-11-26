import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

export interface SearchBarProps {
    /** Placeholder text */
    placeholder?: string;
    /** Search query */
    value?: string;
    /** Change handler */
    onChange?: (value: string) => void;
    /** Submit handler */
    onSubmit?: (value: string) => void;
    /** Enable keyboard shortcut (Cmd+K / Ctrl+K) */
    enableShortcut?: boolean;
    /** Show as modal */
    modal?: boolean;
    /** Modal close handler */
    onClose?: () => void;
    /** Custom className */
    className?: string;
}

/**
 * SearchBar component with Cmd+K shortcut support
 * 
 * @example
 * ```tsx
 * <SearchBar
 *   placeholder="Search everywhere..."
 *   enableShortcut
 *   onChange={(value) => console.log(value)}
 * />
 * ```
 */
export const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = 'Search...',
    value: controlledValue,
    onChange,
    onSubmit,
    enableShortcut = false,
    modal = false,
    onClose,
    className = '',
}) => {
    const [internalValue, setInternalValue] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(value);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        onClose?.();
    };

    // Keyboard shortcut (Cmd+K / Ctrl+K)
    useEffect(() => {
        if (!enableShortcut) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (modal) {
                    setIsModalOpen(true);
                } else {
                    inputRef.current?.focus();
                }
            }

            // Escape to close modal
            if (modal && isModalOpen && e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enableShortcut, modal, isModalOpen]);

    // Focus input when modal opens
    useEffect(() => {
        if (modal && isModalOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [modal, isModalOpen]);

    const searchBarClasses = [
        'search-bar',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const searchInput = (
        <form className={searchBarClasses} onSubmit={handleSubmit}>
            <div className="search-bar__icon" aria-hidden="true">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            <input
                ref={inputRef}
                type="search"
                className="search-bar__input"
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                aria-label="Search"
            />

            {enableShortcut && !value && (
                <div className="search-bar__shortcut" aria-hidden="true">
                    <kbd>⌘K</kbd>
                </div>
            )}

            {value && (
                <button
                    type="button"
                    className="search-bar__clear"
                    onClick={() => {
                        if (controlledValue === undefined) {
                            setInternalValue('');
                        }
                        onChange?.('');
                        inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </form>
    );

    if (modal) {
        return (
            <>
                {isModalOpen && (
                    <div className="search-modal-overlay" onClick={handleClose}>
                        <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                            {searchInput}
                            <div className="search-modal__hint">
                                Press <kbd>ESC</kbd> to close
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return searchInput;
};
