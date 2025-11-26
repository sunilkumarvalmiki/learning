import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'ghost', 'danger'],
            description: 'Visual variant of the button',
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size of the button',
        },
        loading: {
            control: 'boolean',
            description: 'Show loading spinner',
        },
        disabled: {
            control: 'boolean',
            description: 'Disable button interaction',
        },
        fullWidth: {
            control: 'boolean',
            description: 'Make button full width',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Primary Button',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Secondary Button',
    },
};

export const Ghost: Story = {
    args: {
        variant: 'ghost',
        children: 'Ghost Button',
    },
};

export const Danger: Story = {
    args: {
        variant: 'danger',
        children: 'Delete',
    },
};

export const Small: Story = {
    args: {
        size: 'small',
        children: 'Small Button',
    },
};

export const Medium: Story = {
    args: {
        size: 'medium',
        children: 'Medium Button',
    },
};

export const Large: Story = {
    args: {
        size: 'large',
        children: 'Large Button',
    },
};

export const Loading: Story = {
    args: {
        loading: true,
        children: 'Loading...',
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
        children: 'Disabled Button',
    },
};

export const FullWidth: Story = {
    args: {
        fullWidth: true,
        children: 'Full Width Button',
    },
    parameters: {
        layout: 'padded',
    },
};

export const WithIconBefore: Story = {
    args: {
        children: 'New Note',
        iconBefore: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        ),
    },
};

export const WithIconAfter: Story = {
    args: {
        children: 'Next',
        iconAfter: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        ),
    },
};

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
        </div>
    ),
    parameters: {
        layout: 'padded',
    },
};

export const AllSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Button size="small">Small</Button>
            <Button size="medium">Medium</Button>
            <Button size="large">Large</Button>
        </div>
    ),
    parameters: {
        layout: 'padded',
    },
};
