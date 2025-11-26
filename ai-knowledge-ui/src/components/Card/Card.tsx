import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Card children */
    children: React.ReactNode;
    /** Whether the card is clickable/hoverable */
    hoverable?: boolean;
    /** Whether the card has padding */
    padded?: boolean;
    /** Card variant */
    variant?: 'default' | 'outlined' | 'elevated';
}

/**
 * Card component for containing content
 * 
 * @example
 * ```tsx
 * <Card hoverable onClick={() => console.log('clicked')}>
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    (
        {
            children,
            hoverable = false,
            padded = true,
            variant = 'default',
            className = '',
            onClick,
            ...props
        },
        ref
    ) => {
        const classes = [
            'card',
            `card--${variant}`,
            padded && 'card--padded',
            hoverable && 'card--hoverable',
            onClick && 'card--clickable',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const Component = onClick ? 'button' : 'div';

        return React.createElement(
            Component,
            {
                ref,
                className: classes,
                onClick,
                ...(onClick && { role: 'button', tabIndex: 0 }),
                ...props,
            },
            children
        );
    }
);

Card.displayName = 'Card';

/**
 * Card Header component
 */
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <div className={`card-header ${className}`} {...props}>
            {children}
        </div>
    );
};

CardHeader.displayName = 'CardHeader';

/**
 * Card Body component
 */
export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <div className={`card-body ${className}`} {...props}>
            {children}
        </div>
    );
};

CardBody.displayName = 'CardBody';

/**
 * Card Footer component
 */
export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <div className={`card-footer ${className}`} {...props}>
            {children}
        </div>
    );
};

CardFooter.displayName = 'CardFooter';
