import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
    title: 'Components/Input',
    component: Input,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
        },
        type: {
            control: 'select',
            options: ['text', 'email', 'password', 'search', 'number', 'tel', 'url'],
        },
        disabled: {
            control: 'boolean',
        },
        fullWidth: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
    args: {
        placeholder: 'Enter text...',
    },
};

export const WithLabel: Story = {
    args: {
        label: 'Email Address',
        type: 'email',
        placeholder: 'you@example.com',
    },
};

export const WithHelperText: Story = {
    args: {
        label: 'Password',
        type: 'password',
        placeholder: 'Enter your password',
        helperText: 'Must be at least 8 characters',
    },
};

export const WithError: Story = {
    args: {
        label: 'Username',
        placeholder: 'Enter username',
        error: 'Username is already taken',
        defaultValue: 'invalid_user',
    },
};

export const Required: Story = {
    args: {
        label: 'Full Name',
        placeholder: 'John Doe',
        required: true,
    },
};

export const Small: Story = {
    args: {
        size: 'small',
        placeholder: 'Small input',
    },
};

export const Medium: Story = {
    args: {
        size: 'medium',
        placeholder: 'Medium input',
    },
};

export const Large: Story = {
    args: {
        size: 'large',
        placeholder: 'Large input',
    },
};

export const Disabled: Story = {
    args: {
        label: 'Disabled Input',
        placeholder: 'Cannot edit',
        disabled: true,
        defaultValue: 'Disabled value',
    },
};

export const FullWidth: Story = {
    args: {
        label: 'Full Width Input',
        placeholder: 'This input spans full width',
        fullWidth: true,
    },
};

export const WithIconBefore: Story = {
    args: {
        label: 'Search',
        type: 'search',
        placeholder: 'Search everywhere...',
        iconBefore: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
    },
};

export const WithIconAfter: Story = {
    args: {
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email',
        iconAfter: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
            </svg>
        ),
    },
};

export const SearchInput: Story = {
    args: {
        type: 'search',
        placeholder: 'Search documents...',
        fullWidth: true,
        iconBefore: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
    },
};

export const AllSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
            <Input size="small" placeholder="Small input" />
            <Input size="medium" placeholder="Medium input" />
            <Input size="large" placeholder="Large input" />
        </div>
    ),
};

export const FormExample: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
            <Input
                label="Full Name"
                placeholder="John Doe"
                required
                fullWidth
            />
            <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                helperText="We'll never share your email"
                fullWidth
            />
            <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                helperText="Must be at least 8 characters"
                fullWidth
            />
            <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error="Passwords do not match"
                fullWidth
            />
        </div>
    ),
};
