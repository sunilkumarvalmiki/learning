import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Card, CardHeader, CardBody, CardFooter } from './Card';

expect.extend(toHaveNoViolations);

describe('Card', () => {
  describe('Rendering', () => {
    it('renders children content', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders as div by default', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('div.card')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      const { container } = render(<Card>Default</Card>);
      expect(container.querySelector('.card--default')).toBeInTheDocument();
    });

    it('renders with different variants', () => {
      const { container, rerender } = render(<Card variant="outlined">Outlined</Card>);
      expect(container.querySelector('.card--outlined')).toBeInTheDocument();

      rerender(<Card variant="elevated">Elevated</Card>);
      expect(container.querySelector('.card--elevated')).toBeInTheDocument();
    });

    it('renders with padding by default', () => {
      const { container } = render(<Card>Padded</Card>);
      expect(container.querySelector('.card--padded')).toBeInTheDocument();
    });

    it('renders without padding when specified', () => {
      const { container } = render(<Card padded={false}>No padding</Card>);
      expect(container.querySelector('.card--padded')).not.toBeInTheDocument();
    });

    it('renders with hoverable class', () => {
      const { container } = render(<Card hoverable>Hoverable</Card>);
      expect(container.querySelector('.card--hoverable')).toBeInTheDocument();
    });
  });

  describe('Clickable Card', () => {
    it('renders as button when onClick provided', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has clickable class when onClick provided', () => {
      const { container } = render(<Card onClick={() => {}}>Clickable</Card>);
      expect(container.querySelector('.card--clickable')).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Click me</Card>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be activated with keyboard', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Press me</Card>);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });

    it('is focusable when clickable', async () => {
      const user = userEvent.setup();
      render(<Card onClick={() => {}}>Focusable</Card>);

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(<Card className="custom">Content</Card>);
      const card = container.querySelector('.card');
      expect(card).toHaveClass('custom');
      expect(card).toHaveClass('card');
    });

    it('forwards ref', () => {
      const ref = vi.fn();
      render(<Card ref={ref}>Content</Card>);
      expect(ref).toHaveBeenCalled();
    });

    it('forwards additional HTML attributes', () => {
      render(<Card data-testid="custom-card" title="Card title">Content</Card>);
      expect(screen.getByTestId('custom-card')).toHaveAttribute('title', 'Card title');
    });
  });

  describe('Accessibility', () => {
    it('should not have violations', async () => {
      const { container } = render(<Card>Accessible card</Card>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have violations when clickable', async () => {
      const { container } = render(<Card onClick={() => {}}>Clickable card</Card>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('has correct class', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(container.querySelector('.card-header')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardHeader className="custom">Header</CardHeader>);
    expect(container.querySelector('.card-header')).toHaveClass('custom');
  });

  it('should not have violations', async () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('CardBody', () => {
  it('renders children', () => {
    render(<CardBody>Body content</CardBody>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('has correct class', () => {
    const { container } = render(<CardBody>Body</CardBody>);
    expect(container.querySelector('.card-body')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardBody className="custom">Body</CardBody>);
    expect(container.querySelector('.card-body')).toHaveClass('custom');
  });

  it('should not have violations', async () => {
    const { container } = render(<CardBody>Body</CardBody>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('has correct class', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect(container.querySelector('.card-footer')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardFooter className="custom">Footer</CardFooter>);
    expect(container.querySelector('.card-footer')).toHaveClass('custom');
  });

  it('should not have violations', async () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Card Composition', () => {
  it('works with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should not have violations with composition', async () => {
    const { container } = render(
      <Card variant="elevated" hoverable>
        <CardHeader>Card Header</CardHeader>
        <CardBody>Card Body</CardBody>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
