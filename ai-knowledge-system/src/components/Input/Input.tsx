import React from 'react';
import './Input.css';

export type InputSize = 'small' | 'medium' | 'large';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** Size of the input */
    size?: InputSize;
    /** Error message to display */
    error?: string;
    /** Helper text to display below input */
    helperText?: string;
    /** Label for the input */
    label?: string;
    /** Icon to display before input */
    iconBefore?: React.ReactNode;
    /** Icon to display after input */
    iconAfter?: React.ReactNode;
    /** Full width input */
    fullWidth?: boolean;
}

/**
 * Input component following the design system
 * 
 * @example
 * ```tsx
 * <Input 
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   helperText="We'll never share your email"
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            size = 'medium',
            error,
            helperText,
            label,
            iconBefore,
            iconAfter,
            fullWidth = false,
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${React.useId()}`;
        const errorId = `${inputId}-error`;
        const helperTextId = `${inputId}-helper`;

        const containerClasses = [
            'input-container',
            fullWidth && 'input-container--full-width',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const wrapperClasses = [
            'input-wrapper',
            `input-wrapper--${size}`,
            error && 'input-wrapper--error',
            props.disabled && 'input-wrapper--disabled',
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={containerClasses}>
                {label && (
                    <label htmlFor={inputId} className="input-label">
                        {label}
                        {props.required && <span className="input-label__required" aria-label="required">*</span>}
                    </label>
                )}

                <div className={wrapperClasses}>
                    {iconBefore && (
                        <span className="input-icon input-icon--before" aria-hidden="true">
                            {iconBefore}
                        </span>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        className="input"
                        aria-invalid={error ? 'true' : 'false'}
                        aria-describedby={
                            error ? errorId : helperText ? helperTextId : undefined
                        }
                        {...props}
                    />

                    {iconAfter && (
                        <span className="input-icon input-icon--after" aria-hidden="true">
                            {iconAfter}
                        </span>
                    )}
                </div>

                {error && (
                    <span id={errorId} className="input-error" role="alert">
                        {error}
                    </span>
                )}

                {!error && helperText && (
                    <span id={helperTextId} className="input-helper">
                        {helperText}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
