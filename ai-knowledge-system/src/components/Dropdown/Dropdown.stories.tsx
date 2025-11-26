import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './Dropdown';
import { Button } from '../Button';

const meta: Meta<typeof Dropdown> = {
    title: 'Components/Dropdown',
    component: Dropdown,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

// Mock icons
const EditIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const DeleteIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CopyIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const DownloadIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const sampleItems = [
    { id: '1', label: 'Edit', icon: <EditIcon />, onClick: () => console.log('Edit clicked') },
    { id: '2', label: 'Copy', icon: <CopyIcon />, onClick: () => console.log('Copy clicked') },
    { id: '3', label: 'Download', icon: <DownloadIcon />, onClick: () => console.log('Download clicked') },
    { id: 'divider-1', label: '', divider: true },
    { id: '4', label: 'Delete', icon: <DeleteIcon />, onClick: () => console.log('Delete clicked'), danger: true },
];

export const Default: Story = {
    args: {
        trigger: <Button variant="secondary">Options</Button>,
        items: sampleItems,
    },
};

export const WithPrimaryButton: Story = {
    args: {
        trigger: <Button variant="primary">Actions</Button>,
        items: sampleItems,
    },
};

export const BottomEnd: Story = {
    args: {
        trigger: <Button variant="secondary">Bottom End</Button>,
        items: sampleItems,
        placement: 'bottom-end',
    },
};

export const TopStart: Story = {
    args: {
        trigger: <Button variant="secondary">Top Start</Button>,
        items: sampleItems,
        placement: 'top-start',
    },
};

export const TopEnd: Story = {
    args: {
        trigger: <Button variant="secondary">Top End</Button>,
        items: sampleItems,
        placement: 'top-end',
    },
};

export const WithDisabledItems: Story = {
    args: {
        trigger: <Button variant="secondary">Options</Button>,
        items: [
            { id: '1', label: 'Edit', icon: <EditIcon /> },
            { id: '2', label: 'Copy', icon: <CopyIcon />, disabled: true },
            { id: '3', label: 'Download', icon: <DownloadIcon /> },
            { id: 'divider-1', label: '', divider: true },
            { id: '4', label: 'Delete', icon: <DeleteIcon />, danger: true, disabled: true },
        ],
    },
};

export const NoIcons: Story = {
    args: {
        trigger: <Button variant="secondary">Menu</Button>,
        items: [
            { id: '1', label: 'Profile' },
            { id: '2', label: 'Settings' },
            { id: '3', label: 'Billing' },
            { id: 'divider-1', label: '', divider: true },
            { id: '4', label: 'Logout', danger: true },
        ],
    },
};

export const ContextMenu: Story = {
    args: {
        trigger: (
            <Button variant="ghost" size="small">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
            </Button>
        ),
        items: sampleItems,
    },
};

export const FilterDropdown: Story = {
    args: {
        trigger: <Button variant="secondary">Filter</Button>,
        items: [
            { id: '1', label: 'All Notes' },
            { id: '2', label: 'Today' },
            { id: '3', label: 'Last 7 Days' },
            { id: '4', label: 'Last 30 Days' },
            { id: 'divider-1', label: '', divider: true },
            { id: '5', label: 'Custom Range...' },
        ],
    },
};

export const MultiplePlacementsDemo: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '200px', alignItems: 'center', padding: '100px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
                <Dropdown
                    trigger={<Button variant="secondary">Bottom Start</Button>}
                    items={sampleItems}
                    placement="bottom-start"
                />
                <Dropdown
                    trigger={<Button variant="secondary">Bottom End</Button>}
                    items={sampleItems}
                    placement="bottom-end"
                />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                <Dropdown
                    trigger={<Button variant="secondary">Top Start</Button>}
                    items={sampleItems}
                    placement="top-start"
                />
                <Dropdown
                    trigger={<Button variant="secondary">Top End</Button>}
                    items={sampleItems}
                    placement="top-end"
                />
            </div>
        </div>
    ),
};
