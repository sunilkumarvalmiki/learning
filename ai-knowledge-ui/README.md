# AI Knowledge UI

[![CI](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-ui-ci.yml/badge.svg)](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-ui-ci.yml)

A modern, accessible React component library for the AI Knowledge Management System. Built with TypeScript, Vitest, and Storybook.

## Features

✨ **11 Production-Ready Components**: Badge, Button, Card, CodeBlock, Dropdown, Input, Modal, SearchBar, Sidebar, Tabs, Tooltip  
🎨 **Design System**: Consistent design tokens and styling  
♿ **Accessible**: Built with accessibility best practices  
📚 **Storybook**: Interactive component documentation  
🧪 **Fully Tested**: 125 tests with Vitest and Playwright  
⚡ **Fast**: Optimized build with Vite  
📦 **TypeScript**: Full type safety

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
# Start development server
npm run dev

# Start Storybook
npm run storybook

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## Components

### Core Components

- **Badge**: Status indicators and labels
- **Button**: Primary, secondary, and tertiary button variants
- **Card**: Content containers with headers and footers
- **Input**: Form input fields with validation states

### Layout Components

- **Sidebar**: Collapsible navigation sidebar
- **Tabs**: Tab navigation component
- **Modal**: Overlay dialogs and modals

### Specialty Components

- **CodeBlock**: Syntax-highlighted code display
- **SearchBar**: Search input with suggestions
- **Dropdown**: Select menus and dropdowns
- **Tooltip**: Contextual help tooltips

## Project Structure

```
ai-knowledge-ui/
├── src/
│   ├── components/       # Component library
│   │   ├── Badge/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── ...
│   ├── stories/          # Storybook examples
│   └── styles/           # Design tokens
├── .storybook/           # Storybook configuration
└── package.json
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### View Test Coverage

```bash
npm run test:coverage
```

## Storybook

View and interact with all components:

```bash
npm run storybook
```

Build Storybook for deployment:

```bash
npm run build-storybook
```

## Usage Example

```tsx
import { Button, Card, Badge } from 'ai-knowledge-ui';

function MyComponent() {
  return (
    <Card>
      <h2>Welcome <Badge variant="success">New</Badge></h2>
      <Button variant="primary" onClick={() => alert('Clicked!')}>
        Get Started
      </Button>
    </Card>
  );
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
| `npm run storybook` | Start Storybook |
| `npm run build-storybook` | Build Storybook |

## Tech Stack

- **React 19.2.0**: UI framework
- **TypeScript 5.9.3**: Type safety
- **Vite 7.2.4**: Build tool
- **Vitest 4.0.14**: Testing framework
- **Storybook 10.0.8**: Component documentation
- **Playwright**: Browser testing

## Contributing

1. Create a new branch for your feature
2. Add tests for new components
3. Ensure all tests pass: `npm test`
4. Update Storybook stories
5. Submit a pull request

## License

See the [LICENSE](../LICENSE) file for details.
