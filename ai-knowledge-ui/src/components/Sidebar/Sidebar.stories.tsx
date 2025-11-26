import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';
import { useState } from 'react';

const meta: Meta<typeof Sidebar> = {
    title: 'Components/Sidebar',
    component: Sidebar,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

// Mock icons
const FolderIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

const FileIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const StarIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const TagIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
);

const ClockIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const sampleItems = [
    { id: '1', label: 'All Notes', icon: <FolderIcon /> },
    {
        id: '2',
        label: 'Collections',
        icon: <FolderIcon />,
        children: [
            { id: '2-1', label: 'Work', icon: <FolderIcon /> },
            { id: '2-2', label: 'Personal', icon: <FolderIcon />, badge: 3 },
            { id: '2-3', label: 'Research', icon: <FolderIcon /> },
        ],
    },
    { id: '3', label: 'Starred', icon: <StarIcon />, badge: 5 },
    { id: '4', label: 'Tags', icon: <TagIcon /> },
    { id: '5', label: 'Recent', icon: <ClockIcon /> },
];

export const Default: Story = {
    args: {
        items: sampleItems,
        activeId: '1',
    },
};

export const WithHeader: Story = {
    args: {
        items: sampleItems,
        activeId: '1',
        header: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>AI Knowledge</h2>
            </div>
        ),
    },
};

export const WithFooter: Story = {
    args: {
        items: sampleItems,
        activeId: '1',
        footer: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                    U
                </div>
                <span>User Name</span>
            </div>
        ),
    },
};

export const Collapsed: Story = {
    args: {
        items: sampleItems,
        activeId: '1',
        collapsed: true,
    },
};

export const WithAllFeatures: Story = {
    args: {
        items: sampleItems,
        activeId: '2-2',
        header: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>AI Knowledge</h2>
            </div>
        ),
        footer: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                    U
                </div>
                <span>User Name</span>
            </div>
        ),
    },
};

export const Interactive: Story = {
    render: () => {
        const [activeId, setActiveId] = useState('1');
        const [collapsed, setCollapsed] = useState(false);

        const itemsWithClick = sampleItems.map((item) => ({
            ...item,
            onClick: () => setActiveId(item.id),
            children: item.children?.map((child) => ({
                ...child,
                onClick: () => setActiveId(child.id),
            })),
        }));

        return (
            <div style={{ display: 'flex', height: '600px' }}>
                <Sidebar
                    items={itemsWithClick}
                    activeId={activeId}
                    collapsed={collapsed}
                    header={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                {!collapsed && 'AI Knowledge'}
                            </h2>
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                style={{
                                    padding: '4px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
                                </svg>
                            </button>
                        </div>
                    }
                    footer={
                        !collapsed && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                    U
                                </div>
                                <span>User Name</span>
                            </div>
                        )
                    }
                />
                <div style={{ flex: 1, padding: '24px', background: 'var(--color-bg-base)' }}>
                    <h1>Active Item: {activeId}</h1>
                    <p>Click sidebar items to change active state</p>
                    <p>Click arrow in header to toggle collapse</p>
                </div>
            </div>
        );
    },
};
