import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';
import { useState } from 'react';

const meta: Meta<typeof Tabs> = {
    title: 'Components/Tabs',
    component: Tabs,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// Mock icons
const SparklesIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const ListIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
);

const LinkIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const sampleTabs = [
    {
        id: '1',
        label: 'AI Insights',
        icon: <SparklesIcon />,
        content: (
            <div>
                <h3>AI Insights</h3>
                <p>This panel shows AI-generated insights and summaries.</p>
            </div>
        ),
    },
    {
        id: '2',
        label: 'Outline',
        icon: <ListIcon />,
        badge: 5,
        content: (
            <div>
                <h3>Document Outline</h3>
                <ul>
                    <li>Section 1</li>
                    <li>Section 2</li>
                    <li>Section 3</li>
                </ul>
            </div>
        ),
    },
    {
        id: '3',
        label: 'Backlinks',
        icon: <LinkIcon />,
        badge: 12,
        content: (
            <div>
                <h3>Backlinks</h3>
                <p>Documents that link to this note.</p>
            </div>
        ),
    },
];

export const Default: Story = {
    args: {
        items: sampleTabs,
    },
};

export const Pills: Story = {
    args: {
        items: sampleTabs,
        variant: 'pills',
    },
};

export const FullWidth: Story = {
    args: {
        items: sampleTabs,
        fullWidth: true,
    },
};

export const WithDisabled: Story = {
    args: {
        items: [
            ...sampleTabs,
            {
                id: '4',
                label: 'Premium Feature',
                disabled: true,
                content: <div>Premium content</div>,
            },
        ],
    },
};

export const NoIcons: Story = {
    args: {
        items: [
            { id: '1', label: 'General', content: <div>General settings</div> },
            { id: '2', label: 'Appearance', content: <div>Appearance settings</div> },
            { id: '3', label: 'Editor', content: <div>Editor settings</div> },
            { id: '4', label: 'AI & Sync', content: <div>AI & Sync settings</div> },
        ],
    },
};

export const NoBadges: Story = {
    args: {
        items: [
            { id: '1', label: 'Tab 1', icon: <SparklesIcon />, content: <div>Content 1</div> },
            { id: '2', label: 'Tab 2', icon: <ListIcon />, content: <div>Content 2</div> },
            { id: '3', label: 'Tab 3', icon: <LinkIcon />, content: <div>Content 3</div> },
        ],
    },
};

export const ManyTabs: Story = {
    args: {
        items: Array.from({ length: 10 }, (_, i) => ({
            id: String(i + 1),
            label: `Tab ${i + 1}`,
            content: <div>Content for Tab {i + 1}</div>,
        })),
    },
};

export const Controlled: Story = {
    render: () => {
        const [activeId, setActiveId] = useState('1');

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setActiveId('1')}>Go to Tab 1</button>
                    <button onClick={() => setActiveId('2')}>Go to Tab 2</button>
                    <button onClick={() => setActiveId('3')}>Go to Tab 3</button>
                </div>
                <Tabs
                    items={sampleTabs}
                    activeId={activeId}
                    onChange={setActiveId}
                />
                <p>Current active tab: {activeId}</p>
            </div>
        );
    },
};

export const SettingsExample: Story = {
    args: {
        variant: 'pills',
        items: [
            {
                id: 'general',
                label: 'General',
                content: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label>Language</label>
                            <select style={{ marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'var(--color-bg-surface-1)', border: '1px solid var(--color-bg-surface-3)', color: 'var(--color-text-primary)' }}>
                                <option>English</option>
                                <option>Spanish</option>
                            </select>
                        </div>
                        <div>
                            <label>
                                <input type="checkbox" defaultChecked /> Enable notifications
                            </label>
                        </div>
                    </div>
                ),
            },
            {
                id: 'appearance',
                label: 'Appearance',
                content: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label>Theme</label>
                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                <button style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--color-primary)', color: 'white', border: 'none' }}>Dark</button>
                                <button style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--color-bg-surface-1)', color: 'var(--color-text-primary)', border: '1px solid var(--color-bg-surface-3)' }}>Light</button>
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                id: 'privacy',
                label: 'Privacy',
                content: (
                    <div>
                        <h4>Privacy Settings</h4>
                        <p>Manage your privacy and data preferences.</p>
                    </div>
                ),
            },
        ],
    },
};
