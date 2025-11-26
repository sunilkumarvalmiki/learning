import type { Meta, StoryObj } from '@storybook/react';
import { SearchBar } from './SearchBar';
import { useState } from 'react';

const meta: Meta<typeof SearchBar> = {
    title: 'Components/SearchBar',
    component: SearchBar,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
    args: {
        placeholder: 'Search...',
    },
};

export const WithShortcut: Story = {
    args: {
        placeholder: 'Search everywhere...',
        enableShortcut: true,
    },
};

export const CustomPlaceholder: Story = {
    args: {
        placeholder: 'Search documents, tags, and content...',
        enableShortcut: true,
    },
};

export const Controlled: Story = {
    render: () => {
        const [value, setValue] = useState('');

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '600px' }}>
                <SearchBar
                    placeholder="Controlled search..."
                    value={value}
                    onChange={setValue}
                    enableShortcut
                />
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    Current value: "{value}"
                </p>
            </div>
        );
    },
};

export const WithSubmit: Story = {
    render: () => {
        const [lastSearch, setLastSearch] = useState('');

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '600px' }}>
                <SearchBar
                    placeholder="Type and press Enter..."
                    onSubmit={setLastSearch}
                    enableShortcut
                />
                {lastSearch && (
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        Last search: "{lastSearch}"
                    </p>
                )}
            </div>
        );
    },
};

export const ModalMode: Story = {
    args: {
        placeholder: 'Search everywhere...',
        modal: true,
        enableShortcut: true,
    },
};

export const FullExample: Story = {
    render: () => {
        const [query, setQuery] = useState('');
        const [results, setResults] = useState<string[]>([]);

        const handleSearch = (value: string) => {
            setQuery(value);

            // Mock search results
            if (value) {
                const mockResults = [
                    'Meeting Notes - Q4 2024',
                    'Project Proposal Draft',
                    'Research: AI Integration',
                    'Budget Planning 2025',
                    'Team Retrospective',
                ].filter(item =>
                    item.toLowerCase().includes(value.toLowerCase())
                );
                setResults(mockResults);
            } else {
                setResults([]);
            }
        };

        return (
            <div style={{ width: '600px' }}>
                <SearchBar
                    placeholder="Search documents..."
                    value={query}
                    onChange={handleSearch}
                    enableShortcut
                />

                {results.length > 0 && (
                    <div style={{
                        marginTop: '8px',
                        background: 'var(--color-bg-surface-1)',
                        border: '1px solid var(--color-bg-surface-3)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        {results.map((result, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: index < results.length - 1 ? '1px solid var(--color-bg-surface-3)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'background 150ms',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-surface-2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                {result}
                            </div>
                        ))}
                    </div>
                )}

                {query && results.length === 0 && (
                    <div style={{
                        marginTop: '16px',
                        padding: '24px',
                        textAlign: 'center',
                        color: 'var(--color-text-tertiary)',
                        fontSize: '14px'
                    }}>
                        No results found for "{query}"
                    </div>
                )}
            </div>
        );
    },
};

export const InToolbar: Story = {
    render: () => (
        <div style={{
            width: '100%',
            padding: '12px 16px',
            background: 'var(--color-bg-surface-1)',
            border: '1px solid var(--color-bg-surface-3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Documents
            </h2>
            <div style={{ flex: 1, maxWidth: '400px' }}>
                <SearchBar placeholder="Search..." enableShortcut />
            </div>
            <button style={{
                padding: '8px 16px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
            }}>
                New Document
            </button>
        </div>
    ),
};
