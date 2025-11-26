import React, { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
    /** Tooltip content */
    content: React.ReactNode;
    /** Target element */
    children: React.ReactElement;
    /** Placement */
    placement?: TooltipPlacement;
    /** Delay before showing (ms) */
    delay?: number;
}

/**
 * Tooltip component for help text and hints
 * 
 * @example
 * ```tsx
 * <Tooltip content="Click to edit">
 *   <button>Edit</button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    placement = 'top',
    delay = 200,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const tooltipClasses = [
        'tooltip__content',
        `tooltip__content--${placement}`,
        isVisible && 'tooltip__content--visible',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className="tooltip"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleMouseEnter}
            onBlur={handleMouseLeave}
        >
            {React.cloneElement(children, {
                'aria-describedby': isVisible ? 'tooltip-content' : undefined,
            })}
            {isVisible && (
                <div
                    id="tooltip-content"
                    className={tooltipClasses}
                    role="tooltip"
                >
                    {content}
                    <div className="tooltip__arrow" />
                </div>
            )}
        </div>
    );
};
