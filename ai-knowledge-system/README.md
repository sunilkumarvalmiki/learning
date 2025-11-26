# AI Knowledge System

[![CI](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-system-ci.yml/badge.svg)](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-system-ci.yml)
[![Release](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-system-release.yml/badge.svg)](https://github.com/sunilkumarvalmiki/learning/actions/workflows/ai-knowledge-system-release.yml)

A modern desktop application for AI-powered knowledge management, built with Tauri 2, React, and TypeScript.

## Features

🖥️ **Cross-Platform Desktop App**: Native apps for macOS, Windows, and Linux  
⚡ **Lightning Fast**: Rust-powered backend with React frontend  
🎨 **Modern UI**: Beautiful interface with skeleton loading states  
🔍 **Advanced Search**: Full-text search across your knowledge base  
📁 **Document Management**: Import, organize, and manage documents  
🎯 **Tauri 2**: Latest Tauri framework for optimal performance  
🧪 **Tested**: Playwright E2E tests for reliability

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher
- **Rust** 1.70 or higher (install from [rustup.rs](https://rustup.rs))

### Platform-Specific Requirements

#### macOS

- **Xcode Command Line Tools**:

  ```bash
  xcode-select --install
  ```

#### Windows

- **Microsoft C++ Build Tools**
- **WebView2** (usually pre-installed on Windows 10/11)

#### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libwebkit2gtk-4.1-dev
```

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/sunilkumarvalmiki/learning.git
cd learning/ai-knowledge-system

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server (hot reload enabled)
pnpm tauri dev
```

The app will automatically open. Changes to frontend code will hot-reload, while Rust changes require recompilation.

### Testing

```bash
# Run Playwright E2E tests (requires dev server running)
# Terminal 1:
pnpm tauri dev

# Terminal 2:
npx playwright test

# View test report
npx playwright show-report
```

### Building for Production

```bash
# Build for your current platform
pnpm tauri build

# Output locations:
# - macOS: src-tauri/target/release/bundle/dmg/
# - Windows: src-tauri/target/release/bundle/msi/
# - Linux: src-tauri/target/release/bundle/deb/ or appimage/
```

## Project Structure

```
ai-knowledge-system/
├── src/                      # React frontend
│   ├── components/           # UI components
│   │   ├── Badge/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── DocumentCardSkeleton/  # Loading states
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   │   ├── useDebounce.ts
│   │   └── useFocusTrap.ts
│   ├── styles/               # Global styles & tokens
│   ├── App.tsx               # Main application
│   └── main.tsx              # Entry point
├── src-tauri/                # Rust backend
│   ├── src/
│   │   └── main.rs           # Tauri commands
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── tests/                    # Playwright E2E tests
│   └── ui/
│       ├── app.spec.ts
│       ├── document-grid.spec.ts
│       └── search.spec.ts
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server only |
| `pnpm tauri dev` | Start full Tauri app in dev mode |
| `pnpm build` | Build frontend for production |
| `pnpm tauri build` | Build complete desktop app |
| `npx playwright test` | Run E2E tests |

## Development Workflow

### Adding New Features

1. **Frontend Components**: Add to `src/components/`
2. **Tauri Commands**: Add to `src-tauri/src/main.rs`
3. **Tests**: Add E2E tests to `tests/ui/`

### Hot Reload

- **Frontend changes**: Instant hot reload
- **Rust changes**: Automatic rebuild (takes a few seconds)
- **Config changes**: Requires restart

## Testing Guide

### E2E Tests

Tests are located in `tests/ui/` and cover:

- Application UI rendering
- Document grid functionality
- Search functionality
- Sidebar interactions
- Navigation flows

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/ui/app.spec.ts

# Run in headed mode (see the browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Building & Distribution

### Development Build

```bash
pnpm tauri build --debug
```

### Production Build

```bash
pnpm tauri build
```

### Code Signing (Optional)

For distribution, you may want to sign your application:

#### macOS

- Requires Apple Developer account
- Configure in `src-tauri/tauri.conf.json`

#### Windows

- Use `signtool` with a code signing certificate
- Configure in Tauri build settings

## Configuration

### Tauri Settings

Edit `src-tauri/tauri.conf.json` to customize:

- App name and identifier
- Window size and behavior
- Security settings
- Build options
- Update settings

### Environment Variables

Create `.env` file for development:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=AI Knowledge System
```

## Troubleshooting

### Build Fails on macOS

**Error**: `xcrun: error: unable to find utility "metal"`

**Solution**:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Build Fails on Linux

**Error**: `webkit2gtk not found`

**Solution**:

```bash
sudo apt-get install libwebkit2gtk-4.1-dev
```

### Hot Reload Not Working

1. Ensure dev server is running: `pnpm tauri dev`
2. Check for console errors
3. Restart the development server

## Tech Stack

- **Framework**: Tauri 2.0
- **Frontend**: React 19.1.0 + TypeScript 5.8.3
- **Build Tool**: Vite 7.0.4
- **Backend**: Rust (via Tauri)
- **Testing**: Playwright 1.57.0
- **Icons**: Lucide React 0.554.0

## Performance

- **Bundle Size**: ~2-5 MB (platform-dependent)
- **Memory Usage**: ~50-100 MB
- **Startup Time**: <1 second

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

See the [LICENSE](../LICENSE) file for details.

## Support

For issues and questions:

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/sunilkumarvalmiki/learning/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/sunilkumarvalmiki/learning/discussions)
