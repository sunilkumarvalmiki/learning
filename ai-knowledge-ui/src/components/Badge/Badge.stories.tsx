import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
    title: 'Components/Badge',
    component: Badge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
    args: {
        children: 'Default',
    },
};

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Primary',
    },
};

export const Success: Story = {
    args: {
        variant: 'success',
        children: 'Success',
    },
};

export const Warning: Story = {
    args: {
        variant: 'warning',
        children: 'Warning',
    },
};

export const Error: Story = {
    args: {
        variant: 'error',
        children: 'Error',
    },
};

export const AI: Story = {
    args: {
        variant: 'ai',
        children: 'AI Generated',
    },
};

export const WithDot: Story = {
    args: {
        variant: 'success',
        children: 'Online',
        dot: true,
    },
};

export const Small: Story = {
    args: {
        size: 'small',
        variant: 'primary',
        children: 'Small',
    },
};

export const Medium: Story = {
    args: {
        size: 'medium',
        variant: 'primary',
        children: 'Medium',
    },
};

export const Large: Story = {
    args: {
        size: 'large',
        variant: 'primary',
        children: 'Large',
    },
};

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="ai">AI</Badge>
        </div>
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge size="small" variant="primary">Small</Badge>
            <Badge size="medium" variant="primary">Medium</Badge>
            <Badge size="large" variant="primary">Large</Badge>
        </div>
    ),
};

export const UseCases: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
                <Badge variant="primary">3</Badge> New messages
            </div>
            <div>
                Status: <Badge variant="success" dot>Active</Badge>
            </div>
            <div>
                <Badge variant="ai">AI Generated</Badge> Summary available
            </div>
            <div>
                Tags: <Badge>React</Badge> <Badge>TypeScript</Badge> <Badge>Storybook</Badge>
            </div>
        </div>
    ),
};
