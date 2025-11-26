import React, { useState } from 'react';
import './CodeBlock.css';

export interface CodeBlockProps {
    /** Code content */
    code: string;
    /** Programming language */
    language?: string;
    /** Show line numbers */
    showLineNumbers?: boolean;
    /** Filename or title */
    filename?: string;
    /** Enable copy button */
    copyable?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * CodeBlock component for displaying code with syntax highlighting
 * 
 * @example
 * ```tsx
 * <CodeBlock
 *   code={`const hello = "world";`}
 *   language="javascript"
 *   filename="example.js"
 *   copyable
 * />
 * ```
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
    code,
    language = 'plaintext',
    showLineNumbers = true,
    filename,
    copyable = true,
    className = '',
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    const lines = code.split('\n');

    const codeBlockClasses = [
        'code-block',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={codeBlockClasses}>
            {(filename || copyable) && (
                <div className="code-block__header">
                    {filename && (
                        <span className="code-block__filename">{filename}</span>
                    )}
                    {language && !filename && (
                        <span className="code-block__language">{language}</span>
                    )}
                    {copyable && (
                        <button
                            className="code-block__copy"
                            onClick={handleCopy}
                            aria-label={copied ? 'Copied!' : 'Copy code'}
                        >
                            {copied ? (
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                            <span className="code-block__copy-text">
                                {copied ? 'Copied!' : 'Copy'}
                            </span>
                        </button>
                    )}
                </div>
            )}

            <div className="code-block__content">
                {showLineNumbers && (
                    <div className="code-block__line-numbers" aria-hidden="true">
                        {lines.map((_, index) => (
                            <div key={index} className="code-block__line-number">
                                {index + 1}
                            </div>
                        ))}
                    </div>
                )}

                <pre className="code-block__pre">
                    <code className={`code-block__code language-${language}`}>
                        {code}
                    </code>
                </pre>
            </div>
        </div>
    );
};
