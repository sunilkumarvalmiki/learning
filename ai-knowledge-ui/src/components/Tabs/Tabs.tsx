import React, { useState } from 'react';
import './Tabs.css';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
    disabled?: boolean;
    content?: React.ReactNode;
}

export interface TabsProps {
    /** Tab items */
    items: TabItem[];
    /** Default active tab ID */
    defaultActiveId?: string;
    /** Controlled active tab ID */
    activeId?: string;
    /** Change handler for controlled mode */
    onChange?: (id: string) => void;
    /** Variant */
    variant?: 'default' | 'pills';
    /** Full width tabs */
    fullWidth?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * Tabs component for switching between panels
 * 
 * @example
 * ```tsx
 * <Tabs
 *   items={[
 *     { id: '1', label: 'Tab 1', content: <div>Content 1</div> },
 *     { id: '2', label: 'Tab 2', content: <div>Content 2</div> },
 *   ]}
 * />
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
    items,
    defaultActiveId,
    activeId: controlledActiveId,
    onChange,
    variant = 'default',
    fullWidth = false,
    className = '',
}) => {
    const [internalActiveId, setInternalActiveId] = useState(
        defaultActiveId || items[0]?.id
    );

    const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId;

    const handleTabClick = (id: string, disabled?: boolean) => {
        if (disabled) return;

        if (controlledActiveId === undefined) {
            setInternalActiveId(id);
        }
        onChange?.(id);
    };

    const activeItem = items.find((item) => item.id === activeId);

    const tabsClasses = [
        'tabs',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const tabListClasses = [
        'tabs__list',
        `tabs__list--${variant}`,
        fullWidth && 'tabs__list--full-width',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={tabsClasses}>
            <div className={tabListClasses} role="tablist">
                {items.map((item) => {
                    const isActive = item.id === activeId;

                    const tabClasses = [
                        'tabs__tab',
                        `tabs__tab--${variant}`,
                        isActive && 'tabs__tab--active',
                        item.disabled && 'tabs__tab--disabled',
                    ]
                        .filter(Boolean)
                        .join(' ');

                    return (
                        <button
                            key={item.id}
                            className={tabClasses}
                            onClick={() => handleTabClick(item.id, item.disabled)}
                            disabled={item.disabled}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`tabpanel-${item.id}`}
                            id={`tab-${item.id}`}
                        >
                            {item.icon && (
                                <span className="tabs__tab-icon" aria-hidden="true">
                                    {item.icon}
                                </span>
                            )}
                            <span className="tabs__tab-label">{item.label}</span>
                            {item.badge && (
                                <span className="tabs__tab-badge" aria-label={`${item.badge} items`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {activeItem?.content && (
                <div
                    className="tabs__panel"
                    role="tabpanel"
                    aria-labelledby={`tab-${activeItem.id}`}
                    id={`tabpanel-${activeItem.id}`}
                >
                    {activeItem.content}
                </div>
            )}
        </div>
    );
};
