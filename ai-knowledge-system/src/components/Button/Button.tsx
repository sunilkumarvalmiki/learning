import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to display before text */
  iconBefore?: React.ReactNode;
  /** Icon to display after text */
  iconAfter?: React.ReactNode;
  /** Button children (text/elements) */
  children: React.ReactNode;
}

/**
 * Button component following the design system
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="medium" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      fullWidth = false,
      iconBefore,
      iconAfter,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = [
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      fullWidth && 'btn--full-width',
      loading && 'btn--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className="btn__spinner" aria-hidden="true">
            <svg className="btn__spinner-icon" viewBox="0 0 24 24">
              <circle
                className="btn__spinner-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="3"
              />
            </svg>
          </span>
        )}
        {!loading && iconBefore && (
          <span className="btn__icon btn__icon--before" aria-hidden="true">
            {iconBefore}
          </span>
        )}
        <span className="btn__text">{children}</span>
        {!loading && iconAfter && (
          <span className="btn__icon btn__icon--after" aria-hidden="true">
            {iconAfter}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
