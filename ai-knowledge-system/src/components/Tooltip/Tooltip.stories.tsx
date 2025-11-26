import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Button } from '../Button';

const meta: Meta<typeof Tooltip> = {
    title: 'Components/Tooltip',
    component: Tooltip,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Top: Story = {
    args: {
        content: 'This is a tooltip',
        placement: 'top',
        children: <Button>Hover me (Top)</Button>,
    },
};

export const Bottom: Story = {
    args: {
        content: 'This is a tooltip',
        placement: 'bottom',
        children: <Button>Hover me (Bottom)</Button>,
    },
};

export const Left: Story = {
    args: {
        content: 'This is a tooltip',
        placement: 'left',
        children: <Button>Hover me (Left)</Button>,
    },
};

export const Right: Story = {
    args: {
        content: 'This is a tooltip',
        placement: 'right',
        children: <Button>Hover me (Right)</Button>,
    },
};

export const LongText: Story = {
    args: {
        content: 'This is a much longer tooltip text that demonstrates how tooltips handle longer content',
        children: <Button>Hover me</Button>,
    },
};

export const NoDelay: Story = {
    args: {
        content: 'Instant tooltip',
        delay: 0,
        children: <Button>Instant (No delay)</Button>,
    },
};

export const LongDelay: Story = {
    args: {
        content: 'Delayed tooltip',
        delay: 1000,
        children: <Button>Slow (1s delay)</Button>,
    },
};

export const OnIcon: Story = {
    args: {
        content: 'Help information',
        children: (
            <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
            </button>
        ),
    },
};

export const AllPlacements: Story = {
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '100px', padding: '100px' }}>
            <div />
            <Tooltip content="Top tooltip" placement="top">
                <Button>Top</Button>
            </Tooltip>
            <div />

            <Tooltip content="Left tooltip" placement="left">
                <Button>Left</Button>
            </Tooltip>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span>Hover buttons</span>
            </div>
            <Tooltip content="Right tooltip" placement="right">
                <Button>Right</Button>
            </Tooltip>

            <div />
            <Tooltip content="Bottom tooltip" placement="bottom">
                <Button>Bottom</Button>
            </Tooltip>
            <div />
        </div>
    ),
};

export const UseCases: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
            <div>
                <Tooltip content="Click to edit this document">
                    <Button variant="primary">Edit Document</Button>
                </Tooltip>
            </div>

            <div>
                Settings
                <Tooltip content="Configure application preferences">
                    <button style={{ marginLeft: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                    </button>
                </Tooltip>
            </div>

            <div>
                <Tooltip content="This feature is only available in the Pro plan">
                    <Button disabled>Premium Feature</Button>
                </Tooltip>
            </div>
        </div>
    ),
};
