import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from '../Button';
import { Input } from '../Input';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
    title: 'Components/Modal',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: 'select',
            options: ['small', 'medium', 'large', 'fullscreen'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title">
                    <p>This is the modal content.</p>
                    <p>Click outside or press Escape to close.</p>
                </Modal>
            </>
        );
    },
};

export const Small: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Small Modal</Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Small Modal" size="small">
                    <p>This is a small modal (max-width: 400px).</p>
                </Modal>
            </>
        );
    },
};

export const Medium: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Medium Modal</Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Medium Modal" size="medium">
                    <p>This is a medium modal (max-width: 600px - default).</p>
                </Modal>
            </>
        );
    },
};

export const Large: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Large Modal</Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Large Modal" size="large">
                    <p>This is a large modal (max-width: 900px).</p>
                    <p>Good for content-heavy modals like settings or forms.</p>
                </Modal>
            </>
        );
    },
};

export const Fullscreen: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Fullscreen Modal</Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Fullscreen Modal" size="fullscreen">
                    <div style={{ height: '1000px' }}>
                        <p>This is a fullscreen modal.</p>
                        <p>Scroll to see more content...</p>
                        {Array.from({ length: 20 }, (_, i) => (
                            <p key={i}>Line {i + 1}</p>
                        ))}
                    </div>
                </Modal>
            </>
        );
    },
};

export const WithFooter: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Modal with Footer</Button>
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Confirm Action"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={() => setIsOpen(false)}>
                                Confirm
                            </Button>
                        </>
                    }
                >
                    <p>Are you sure you want to perform this action?</p>
                    <p>This cannot be undone.</p>
                </Modal>
            </>
        );
    },
};

export const FormExample: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Settings Modal</Button>
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Settings"
                    size="medium"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={() => setIsOpen(false)}>
                                Save Changes
                            </Button>
                        </>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Input label="Name" placeholder="Enter your name" fullWidth />
                        <Input label="Email" type="email" placeholder="you@example.com" fullWidth />
                        <Input label="Username" placeholder="@username" helperText="This will be visible to others" fullWidth />
                    </div>
                </Modal>
            </>
        );
    },
};

export const LongContent: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Modal with Long Content</Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Terms and Conditions">
                    <div>
                        <h3>1. Introduction</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>

                        <h3>2. User Agreement</h3>
                        <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>

                        <h3>3. Privacy Policy</h3>
                        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>

                        {Array.from({ length: 10 }, (_, i) => (
                            <div key={i}>
                                <h3>{i + 4}. Section {i + 4}</h3>
                                <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                            </div>
                        ))}
                    </div>
                </Modal>
            </>
        );
    },
};

export const NoCloseOnOverlay: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Important Action"
                    closeOnOverlayClick={false}
                    footer={
                        <Button variant="primary" onClick={() => setIsOpen(false)}>
                            I Understand
                        </Button>
                    }
                >
                    <p>You must use the button to close this modal.</p>
                    <p>Clicking outside or pressing Escape won't work for closeOnOverlayClick=false.</p>
                </Modal>
            </>
        );
    },
};

export const NoTitle: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button onClick={() => setIsOpen(true)}>Open Modal without Title</Button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <svg style={{ width: '64px', height: '64px', color: 'var(--color-success)', margin: '0 auto 16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2>Success!</h2>
                        <p>Your changes have been saved.</p>
                    </div>
                </Modal>
            </>
        );
    },
};

export const DangerConfirmation: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <>
                <Button variant="danger" onClick={() => setIsOpen(true)}>Delete Account</Button>
                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Delete Account"
                    size="small"
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={() => setIsOpen(false)}>
                                Delete Account
                            </Button>
                        </>
                    }
                >
                    <p>Are you sure you want to delete your account?</p>
                    <p style={{ color: 'var(--color-error)' }}>This action cannot be undone. All your data will be permanently deleted.</p>
                </Modal>
            </>
        );
    },
};
