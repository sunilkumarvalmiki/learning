import React from 'react';
import './Badge.css';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'ai';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Badge content */
    children: React.ReactNode;
    /** Visual variant */
    variant?: BadgeVariant;
    /** Size */
    size?: BadgeSize;
    /** Show dot indicator */
    dot?: boolean;
}

/**
 * Badge component for tags, counts, and status indicators
 * 
 * @example
 * ```tsx
 * <Badge variant="primary">New</Badge>
 * <Badge variant="success" dot>Online</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'medium',
    dot = false,
    className = '',
    ...props
}) => {
    const classes = [
        'badge',
        `badge--${variant}`,
        `badge--${size}`,
        dot && 'badge--dot',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <span className={classes} {...props}>
            {dot && <span className="badge__dot" aria-hidden="true" />}
            {children}
        </span>
    );
};
