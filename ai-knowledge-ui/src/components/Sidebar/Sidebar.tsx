import React, { useState } from 'react';
import './Sidebar.css';

export interface SidebarItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
    badge?: string | number;
    children?: SidebarItem[];
}

export interface SidebarProps {
    /** Sidebar items */
    items: SidebarItem[];
    /** Active item ID */
    activeId?: string;
    /** Collapsed state */
    collapsed?: boolean;
    /** Width when expanded (default: 240px) */
    width?: number;
    /** Header content */
    header?: React.ReactNode;
    /** Footer content */
    footer?: React.ReactNode;
    /** Custom className */
    className?: string;
}

/**
 * Sidebar navigation component
 * 
 * @example
 * ```tsx
 * <Sidebar
 *   items={[
 *     { id: '1', label: 'All Notes', icon: <FolderIcon /> },
 *     { id: '2', label: 'Starred', icon: <StarIcon />, badge: 5 }
 *   ]}
 *   activeId="1"
 * />
 * ```
 */
export const Sidebar: React.FC<SidebarProps> = ({
    items,
    activeId,
    collapsed = false,
    width = 240,
    header,
    footer,
    className = '',
}) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const renderItem = (item: SidebarItem, depth: number = 0) => {
        const isActive = item.id === activeId;
        const isExpanded = expandedIds.has(item.id);
        const hasChildren = item.children && item.children.length > 0;

        const classes = [
            'sidebar-item',
            isActive && 'sidebar-item--active',
            collapsed && depth === 0 && 'sidebar-item--collapsed',
        ]
            .filter(Boolean)
            .join(' ');

        const content = (
            <>
                {item.icon && (
                    <span className="sidebar-item__icon" aria-hidden="true">
                        {item.icon}
                    </span>
                )}
                {!collapsed && (
                    <>
                        <span className="sidebar-item__label">{item.label}</span>
                        {item.badge && (
                            <span className="sidebar-item__badge" aria-label={`${item.badge} items`}>
                                {item.badge}
                            </span>
                        )}
                        {hasChildren && (
                            <button
                                className="sidebar-item__expand"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleExpanded(item.id);
                                }}
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                aria-expanded={isExpanded}
                            >
                                <svg
                                    className={`sidebar-item__expand-icon ${isExpanded ? 'sidebar-item__expand-icon--expanded' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </>
                )}
            </>
        );

        const itemElement = item.href ? (
            <a
                href={item.href}
                className={classes}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                aria-current={isActive ? 'page' : undefined}
            >
                {content}
            </a>
        ) : (
            <button
                className={classes}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={item.onClick}
                aria-current={isActive ? 'page' : undefined}
            >
                {content}
            </button>
        );

        return (
            <div key={item.id} className="sidebar-item-wrapper">
                {itemElement}
                {!collapsed && hasChildren && isExpanded && (
                    <div className="sidebar-item__children" role="group">
                        {item.children!.map((child) => renderItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const sidebarClasses = [
        'sidebar',
        collapsed && 'sidebar--collapsed',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <aside
            className={sidebarClasses}
            style={{ width: collapsed ? '64px' : `${width}px` }}
            aria-label="Sidebar navigation"
        >
            {header && <div className="sidebar__header">{header}</div>}

            <nav className="sidebar__nav" role="navigation">
                {items.map((item) => renderItem(item))}
            </nav>

            {footer && <div className="sidebar__footer">{footer}</div>}
        </aside>
    );
};
