# Contributing to AI Knowledge Management System

Thank you for your interest in contributing! This document provides guidelines and best practices for contributing to this project.

## Code of Conduct

Be respectful, inclusive, and collaborative. We're here to build great software together.

## Getting Started

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/learning.git
cd learning
```

### Set Up Development Environment

#### For ai-knowledge-ui

```bash
cd ai-knowledge-ui
npm install
npm test  # Ensure tests pass
```

#### For ai-knowledge-system

```bash
cd ai-knowledge-system
pnpm install
pnpm tauri dev  # Ensure app runs
```

## Development Workflow

### 1. Create a Branch

Use descriptive branch names:

```bash
git checkout -b feature/add-new-component
git checkout -b fix/search-bug
git checkout -b docs/update-readme
```

**Branch naming conventions**:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

### 2. Make Changes

#### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Code will be automatically formatted
- **Linting**: Run `npm run lint` before committing
- **Naming**: Use camelCase for variables/functions, PascalCase for components

#### Component Guidelines (ai-knowledge-ui)

```tsx
// Good: Self-contained component with props interface
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button className={`button button--${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

- Include TypeScript interfaces for props
- Add CSS in separate `.css` file
- Create Storybook story in `.stories.tsx`
- Export from `index.ts`

### 3. Write Tests

**All new features must include tests.**

#### Component Tests (ai-knowledge-ui)

```typescript
import { test, expect } from 'vitest';
import { Button } from './Button';

test('Button renders correctly', async ({ mount }) => {
  const component = await mount(<Button onClick={() => {}}>Click me</Button>);
  await expect(component).toContainText('Click me');
});
```

#### E2E Tests (ai-knowledge-system)

```typescript
import { test, expect } from '@playwright/test';

test('should display documents', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.document-grid')).toBeVisible();
});
```

### 4. Update Documentation

- Update README if adding features
- Add JSDoc comments for public APIs
- Create Storybook stories for UI components
- Update type definitions

### 5. Commit Changes

Use clear, descriptive commit messages:

```bash
# Good commit messages
git commit -m "feat: add Tooltip component with accessibility support"
git commit -m "fix: resolve search bar focus issue on mobile"
git commit -m "docs: update installation instructions for Windows"
git commit -m "test: add E2E tests for document upload flow"

# Bad commit messages
git commit -m "updates"
git commit -m "fix bug"
git commit -m "wip"
```

**Commit message format**:

```
type: brief description

Optional detailed explanation of changes.

Fixes #123
```

**Types**: feat, fix, docs, test, refactor, chore, style

### 6. Push and Create PR

```bash
git push origin feature/add-new-component
```

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass locally
- [ ] Code is linted and formatted
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No merge conflicts with main

### PR Description

Use the PR template to describe:

- What changes were made
- Why the changes are needed
- How to test the changes
- Screenshots (for UI changes)
- Related issues

### Review Process

1. **Automated Checks**: CI must pass
2. **Code Review**: At least one approval required
3. **Testing**: Reviewers may test locally
4. **Feedback**: Address review comments
5. **Merge**: Maintainer will merge when ready

## Testing Requirements

### ai-knowledge-ui

- **Unit Tests**: All components must have tests
- **Coverage**: Aim for >80% coverage
- **Run Tests**: `npm test`

### ai-knowledge-system

- **E2E Tests**: Critical user flows must be tested
- **Manual Testing**: Test on your platform before submitting
- **Run Tests**: `npx playwright test`

## Code Review Checklist

When reviewing PRs, check for:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] No unnecessary dependencies added
- [ ] Performance implications considered
- [ ] Accessibility standards met (for UI)
- [ ] Mobile responsiveness (for UI)

## Project-Specific Guidelines

### ai-knowledge-ui Components

1. **Accessibility**: Use semantic HTML and ARIA attributes
2. **Responsive**: Test on different screen sizes
3. **Dark Mode**: Support both light and dark themes
4. **Performance**: Avoid unnecessary re-renders
5. **Storybook**: Create comprehensive stories

### ai-knowledge-system (Tauri)

1. **Security**: Validate all Tauri commands
2. **Performance**: Minimize Rust-JS communication
3. **Error Handling**: Graceful error handling in UI
4. **Platforms**: Test on macOS, Windows, and Linux if possible
5. **Bundle Size**: Keep dependencies minimal

## Questions?

- **Documentation**: Check the [docs](./docs) folder
- **Discussions**: Use [GitHub Discussions](https://github.com/sunilkumarvalmiki/learning/discussions)
- **Issues**: Search existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
