import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Button } from '../Button';

const meta: Meta<typeof Card> = {
    title: 'Components/Card',
    component: Card,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'outlined', 'elevated'],
        },
        hoverable: {
            control: 'boolean',
        },
        padded: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
    args: {
        children: (
            <>
                <h3>Card Title</h3>
                <p>This is a simple card with default styling.</p>
            </>
        ),
    },
};

export const Outlined: Story = {
    args: {
        variant: 'outlined',
        children: (
            <>
                <h3>Outlined Card</h3>
                <p>This card has an outlined variant.</p>
            </>
        ),
    },
};

export const Elevated: Story = {
    args: {
        variant: 'elevated',
        children: (
            <>
                <h3>Elevated Card</h3>
                <p>This card has a shadow for elevation effect.</p>
            </>
        ),
    },
};

export const Hoverable: Story = {
    args: {
        hoverable: true,
        children: (
            <>
                <h3>Hoverable Card</h3>
                <p>Hover over this card to see the effect.</p>
            </>
        ),
    },
};

export const Clickable: Story = {
    args: {
        hoverable: true,
        onClick: () => alert('Card clicked!'),
        children: (
            <>
                <h3>Clickable Card</h3>
                <p>Click this entire card to trigger an action.</p>
            </>
        ),
    },
};

export const WithSections: Story = {
    render: () => (
        <Card style={{ maxWidth: '400px' }}>
            <CardHeader>
                <h3 style={{ margin: 0 }}>Card with Sections</h3>
            </CardHeader>
            <CardBody>
                <p>This card uses CardHeader, CardBody, and CardFooter components.</p>
                <p>The body can contain multiple elements.</p>
            </CardBody>
            <CardFooter>
                <Button variant="secondary" size="small">Cancel</Button>
                <Button variant="primary" size="small">Save</Button>
            </CardFooter>
        </Card>
    ),
};

export const DocumentCard: Story = {
    render: () => (
        <Card hoverable className="document-card">
            <div className="document-card__icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h4 className="document-card__title">
                Introduction to Machine Learning Fundamentals
            </h4>
            <p className="document-card__preview">
                This document covers the basics of machine learning, including supervised and unsupervised learning algorithms...
            </p>
            <div className="document-card__tags">
                <span className="document-card__tag">AI</span>
                <span className="document-card__tag">ML</span>
                <span className="document-card__tag">Research</span>
            </div>
            <div className="document-card__meta">
                Modified 2 hours ago
            </div>
        </Card>
    ),
};

export const DocumentGrid: Story = {
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', maxWidth: '1000px' }}>
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} hoverable className="document-card">
                    <div className="document-card__icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h4 className="document-card__title">
                        Document Title {i}
                    </h4>
                    <p className="document-card__preview">
                        This is a preview of the document content that shows the first few lines...
                    </p>
                    <div className="document-card__tags">
                        <span className="document-card__tag">Tag {i}</span>
                        <span className="document-card__tag">Work</span>
                    </div>
                    <div className="document-card__meta">
                        {i} {i === 1 ? 'hour' : 'hours'} ago
                    </div>
                </Card>
            ))}
        </div>
    ),
};

export const NoPadding: Story = {
    args: {
        padded: false,
        children: (
            <img
                src="https://via.placeholder.com/400x200"
                alt="Placeholder"
                style={{ width: '100%', display: 'block', borderRadius: '8px' }}
            />
        ),
    },
};

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card variant="default" style={{ width: '200px' }}>
                <h4>Default</h4>
                <p>Standard card</p>
            </Card>
            <Card variant="outlined" style={{ width: '200px' }}>
                <h4>Outlined</h4>
                <p>Outlined variant</p>
            </Card>
            <Card variant="elevated" style={{ width: '200px' }}>
                <h4>Elevated</h4>
                <p>With shadow</p>
            </Card>
        </div>
    ),
};
