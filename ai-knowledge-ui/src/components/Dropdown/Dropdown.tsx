import React, { useState, useRef, useEffect } from 'react';
import './Dropdown.css';

export interface DropdownItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    divider?: boolean;
    danger?: boolean;
}

export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export interface DropdownProps {
    /** Trigger element (button, etc.) */
    trigger: React.ReactNode;
    /** Dropdown menu items */
    items: DropdownItem[];
    /** Placement of dropdown */
    placement?: DropdownPlacement;
    /** Custom className */
    className?: string;
}

/**
 * Dropdown menu component
 * 
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<Button>Options</Button>}
 *   items={[
 *     { id: '1', label: 'Edit', icon: <EditIcon /> },
 *     { id: '2', label: 'Delete', icon: <DeleteIcon />, danger: true },
 *   ]}
 * />
 * ```
 */
export const Dropdown: React.FC<DropdownProps> = ({
    trigger,
    items,
    placement = 'bottom-start',
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleItemClick = (item: DropdownItem) => {
        if (item.disabled) return;
        item.onClick?.();
        setIsOpen(false);
    };

    const dropdownClasses = [
        'dropdown',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const menuClasses = [
        'dropdown__menu',
        `dropdown__menu--${placement}`,
        isOpen && 'dropdown__menu--open',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div ref={dropdownRef} className={dropdownClasses}>
            <div
                className="dropdown__trigger"
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {trigger}
            </div>

            {isOpen && (
                <div className={menuClasses} role="menu">
                    {items.map((item) => {
                        if (item.divider) {
                            return <div key={item.id} className="dropdown__divider" role="separator" />;
                        }

                        const itemClasses = [
                            'dropdown__item',
                            item.disabled && 'dropdown__item--disabled',
                            item.danger && 'dropdown__item--danger',
                        ]
                            .filter(Boolean)
                            .join(' ');

                        return (
                            <button
                                key={item.id}
                                className={itemClasses}
                                onClick={() => handleItemClick(item)}
                                disabled={item.disabled}
                                role="menuitem"
                            >
                                {item.icon && (
                                    <span className="dropdown__item-icon" aria-hidden="true">
                                        {item.icon}
                                    </span>
                                )}
                                <span className="dropdown__item-label">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
