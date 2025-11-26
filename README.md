# Learning - AI Knowledge Management System

[![AI Knowledge UI CI](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-ui-ci.yml/badge.svg)](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-ui-ci.yml)
[![AI Knowledge System CI](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-system-ci.yml/badge.svg)](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-system-ci.yml)

A comprehensive AI-powered knowledge management system consisting of a modern component library and a cross-platform desktop application.

## 📦 Projects

### [ai-knowledge-ui](./ai-knowledge-ui)

React component library with 11 production-ready, accessible components. Built with TypeScript, Vitest, and Storybook.

**Features**: Badge, Button, Card, CodeBlock, Dropdown, Input, Modal, SearchBar, Sidebar, Tabs, Tooltip

**Tech Stack**: React 19.2, TypeScript, Vite, Vitest, Storybook

[View Documentation →](./ai-knowledge-ui/README.md)

### [ai-knowledge-system](./ai-knowledge-system)

Cross-platform desktop application for AI-powered knowledge management. Built with Tauri 2, React, and Rust.

**Features**: Document management, advanced search, modern UI with skeleton loading, E2E tested

**Tech Stack**: Tauri 2, React 19.1, Rust, TypeScript, Playwright

[View Documentation →](./ai-knowledge-system/README.md)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher (for ai-knowledge-system)
- **Rust** 1.70+ (for ai-knowledge-system) - [Install Rust](https://rustup.rs)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/sunilkumarvalmiki/learning.git
cd learning

# Set up ai-knowledge-ui (Component Library)
cd ai-knowledge-ui
npm install
npm run storybook    # View components
npm test             # Run tests (125 tests)

# Set up ai-knowledge-system (Desktop App)
cd ../ai-knowledge-system
pnpm install
pnpm tauri dev       # Start development
```

## 📁 Repository Structure

```
learning/
├── ai-knowledge-ui/           # React component library
│   ├── src/components/        # 11 production components
│   ├── src/stories/           # Storybook examples
│   └── README.md
├── ai-knowledge-system/       # Tauri desktop application
│   ├── src/                   # React frontend
│   ├── src-tauri/             # Rust backend
│   ├── tests/                 # Playwright E2E tests
│   └── README.md
├── docs/                      # Documentation
│   ├── setup_guide.md
│   ├── testing_guide.md
│   └── error_handling.md
├── migrations/                # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_qdrant_collections.sql
│   ├── 003_neo4j_schema.cypher
│   └── ...
├── .github/workflows/         # CI/CD pipelines
│   ├── ai-knowledge-ui-ci.yml
│   ├── ai-knowledge-system-ci.yml
│   └── ai-knowledge-system-release.yml
├── PRD_AI_Knowledge_System.md # Product requirements
└── research_findings.md       # Research documentation
```

## 🛠️ Development

### Component Library Development

```bash
cd ai-knowledge-ui

# Development
npm run dev              # Start dev server
npm run storybook        # View components

# Testing
npm test                 # Run all tests
npm run lint             # Lint code

# Building
npm run build            # Production build
npm run build-storybook  # Build Storybook
```

### Desktop App Development

```bash
cd ai-knowledge-system

# Development
pnpm tauri dev           # Start app with hot reload

# Testing
npx playwright test      # Run E2E tests
npx playwright test --headed  # With browser visible

# Building
pnpm tauri build         # Production build for current platform
```

## 🧪 Testing

### Component Library

- **Framework**: Vitest with Playwright browser testing
- **Coverage**: 125 tests across 14 test suites
- **Components**: All 11 components fully tested
- **Run**: `cd ai-knowledge-ui && npm test`

### Desktop App

- **Framework**: Playwright E2E
- **Test Files**: 3 spec files (app, document-grid, search)
- **Coverage**: UI rendering, navigation, search functionality
- **Run**: `cd ai-knowledge-system && npx playwright test`

## 📖 Documentation

- **[Setup Guide](./docs/setup_guide.md)**: Installation and configuration
- **[Testing Guide](./docs/testing_guide.md)**: Testing strategies and tools
- **[Error Handling](./docs/error_handling.md)**: Error handling patterns
- **[PRD](./PRD_AI_Knowledge_System.md)**: Product requirements document
- **[Research Findings](./research_findings.md)**: Research and decisions

## 🚢 CI/CD

Automated workflows using GitHub Actions:

- **ai-knowledge-ui-ci.yml**: Run tests, lint, type-check, and build
- **ai-knowledge-system-ci.yml**: Type-check and build for all platforms
- **ai-knowledge-system-release.yml**: Create release builds on version tags

All workflows run automatically on push to `main` or pull requests.

## 🗄️ Database

Database migrations are available in the `migrations/` directory:

- PostgreSQL schema (initial, seed data)
- Qdrant collections configuration
- Neo4j graph schema

## 🏗️ Architecture

### Component Library (ai-knowledge-ui)

- **Pattern**: Atomic design with isolated components
- **Styling**: CSS with design tokens
- **Testing**: Component testing with Vitest
- **Documentation**: Storybook for interactive demos

### Desktop App (ai-knowledge-system)

- **Frontend**: React with TypeScript
- **Backend**: Rust via Tauri
- **State**: React hooks (useDebounce, useFocusTrap)
- **UI**: Custom components from ai-knowledge-ui
- **Testing**: Playwright E2E tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test` or `npx playwright test`
5. Commit with descriptive messages
6. Push and create a pull request

See individual project READMEs for detailed contribution guidelines.

## 📝 License

See the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **Documentation**: [docs/](./docs)
- **Issues**: [GitHub Issues](https://github.com/sunilkumarvalmiki/learning/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sunilkumarvalmiki/learning/discussions)

---

**Status**: Active Development | **Version**: 0.1.0 | **Last Updated**: November 2025
