# Development Environment Setup Guide
## AI Knowledge Management System

**Last Updated**: November 2025  
**Tauri Version**: 2.1+  
**Rust Version**: 1.75+  
**Node.js Version**: 18 LTS or 20 LTS

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Platform-Specific Setup](#platform-specific-setup)
   - [Windows 11](#windows-11)
   - [macOS](#macos)
   - [Linux (Ubuntu/Debian)](#linux-ubuntudebian)
3. [Core Tools Installation](#core-tools-installation)
4. [Verification](#verification)
5. [IDE Setup](#ide-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- **Stable internet connection** (for downloads)
- **8GB RAM minimum** (16GB recommended for large file processing)
- **10GB free disk space** (for all tools and dependencies)
- **Administrator/sudo access** (for initial installation only)

---

## Platform-Specific Setup

### Windows 11

#### 1. Install Microsoft Visual Studio C++ Build Tools

**Why**: Tauri requires C++ compiler for native Windows integration.

**Download**: [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

**Installation Steps**:
```powershell
# Download and run the installer
# Select "Desktop development with C++" workload
# Ensure these components are checked:
# - MSVC v143 - VS 2022 C++ x64/x86 build tools
# - Windows 10/11 SDK
```

**Disk Space**: ~6GB

#### 2. Install WebView2

**Why**: Tauri uses EdgeWebView2 as the rendering engine on Windows.

**Check if already installed**:
```powershell
# Open PowerShell and run:
Get-AppxPackage -Name Microsoft.WebView2Runtime
```

If not installed:
```powershell
# Download from Microsoft Edge WebView2 Runtime
# https://developer.microsoft.com/en-us/microsoft-edge/webview2/
# Install the "Evergreen Standalone Installer"
```

**Verification**:
```powershell
# Check registry:
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv
```

#### 3. Install Rust via rustup

**Download**: [rustup-init.exe](https://rustup.rs/)

```powershell
# Download and run rustup-init.exe
# Accept default installation (press 1 and Enter)
# This installs:
# - Rust toolchain (stable)
# - Cargo (package manager)
# - rustc (compiler)
# - rustfmt (code formatter)
# - clippy (linter)
```

**Add to PATH** (automatic, but verify):
```powershell
# Close and reopen PowerShell
rustc --version
# Expected: rustc 1.75.0 (or higher)
```

---

### macOS

#### 1. Install Xcode Command Line Tools

**Why**: Required for native compilation.

```bash
xcode-select --install
```

**Verify**:
```bash
xcode-select -p
# Expected: /Library/Developer/CommandLineTools
```

#### 2. Install Homebrew (if not already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Add to PATH**:
```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### 3. Install Rust via rustup

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Accept default installation (press 1)
# Add to current shell:
source "$HOME/.cargo/env"
```

**Verify**:
```bash
rustc --version
# Expected: rustc 1.75.0 (or higher)
```

---

### Linux (Ubuntu/Debian)

#### 1. Install System Dependencies

```bash
sudo apt update
sudo apt install -y \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libwebkit2gtk-4.1-dev
```

**For Fedora/RHEL**:
```bash
sudo dnf install -y \
    gcc \
    gcc-c++ \
    make \
    openssl-devel \
    gtk3-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel \
    webkit2gtk4.1-devel
```

**For Arch Linux**:
```bash
sudo pacman -S --needed \
    base-devel \
    curl \
    wget \
    file \
    openssl \
    gtk3 \
    libappindicator-gtk3 \
    librsvg \
    webkit2gtk
```

#### 2. Install Rust via rustup

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Accept default installation
source "$HOME/.cargo/env"
```

**Verify**:
```bash
rustc --version
# Expected: rustc 1.75.0 (or higher)
```

---

## Core Tools Installation

### 1. Node.js (All Platforms)

**Recommended**: Use Node Version Manager (nvm)

#### Windows (nvm-windows):
```powershell
# Download from: https://github.com/coreybutler/nvm-windows/releases
# Install nvm-setup.exe

# Install Node.js LTS:
nvm install 20
nvm use 20
```

#### macOS/Linux (nvm):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# Restart terminal or run:
source ~/.bashrc  # or ~/.zshrc on macOS

# Install Node.js LTS:
nvm install 20
nvm use 20
nvm alias default 20
```

**Verify**:
```bash
node --version
# Expected: v20.x.x

npm --version
# Expected: 10.x.x
```

### 2. Tauri CLI

**Install globally**:
```bash
cargo install tauri-cli@^2.0
```

**This will take 5-10 minutes** ☕

**Verify**:
```bash
cargo tauri --version
# Expected: tauri-cli 2.0.x
```

### 3. Development Tools

#### Install pnpm (faster than npm):
```bash
npm install -g pnpm
```

#### Install essential Cargo tools:
```bash
# Fast compile checks (optional but recommended)
cargo install cargo-watch

# Security auditing
cargo install cargo-audit

# Better error messages
cargo install cargo-expand
```

---

## Verification

### Complete System Check

Run this comprehensive verification script:

```bash
# Create a verification script
cat > verify_setup.sh << 'EOF'
#!/bin/bash

echo "=== Development Environment Verification ==="
echo ""

# Rust
echo "✓ Rust:"
rustc --version || echo "❌ Rust not found"
cargo --version || echo "❌ Cargo not found"
echo ""

# Node.js
echo "✓ Node.js:"
node --version || echo "❌ Node.js not found"
npm --version || echo "❌ npm not found"
echo ""

# Tauri CLI
echo "✓ Tauri CLI:"
cargo tauri --version || echo "❌ Tauri CLI not found"
echo ""

# Platform-specific
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✓ macOS Tools:"
    xcode-select -p || echo "❌ Xcode Command Line Tools not found"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✓ Linux Tools:"
    dpkg -l | grep libwebkit2gtk-4.1-dev || echo "❌ webkit2gtk not found"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "✓ Windows Tools:"
    reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv || echo "❌ WebView2 not found"
fi

echo ""
echo "=== Verification Complete ==="
EOF

chmod +x verify_setup.sh
./verify_setup.sh
```

**Expected Output**:
```
=== Development Environment Verification ===

✓ Rust:
rustc 1.75.0 (...)
cargo 1.75.0 (...)

✓ Node.js:
v20.11.0
10.2.4

✓ Tauri CLI:
tauri-cli 2.0.8

✓ [Platform] Tools:
[platform-specific verification]

=== Verification Complete ===
```

### Test Tauri Project Creation

```bash
# Create a test project
npm create tauri-app@latest

# Follow prompts:
# ? Project name: test-tauri-app
# ? Choose which language to use for your frontend: TypeScript / JavaScript
# ? Choose your package manager: pnpm
# ? Choose your UI template: React
# ? Choose your UI flavor: TypeScript

cd test-tauri-app
pnpm install
pnpm tauri dev
```

**Expected**: A window should open with "Welcome to Tauri!" message.

**If successful**: Delete the test project:
```bash
cd ..
rm -rf test-tauri-app
```

---

## IDE Setup

### Visual Studio Code (Recommended)

**Download**: [https://code.visualstudio.com/](https://code.visualstudio.com/)

#### Essential Extensions:
```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",          // Rust language support
    "tauri-apps.tauri-vscode",          // Tauri debugging
    "dbaeumer.vscode-eslint",           // TypeScript linting
    "esbenp.prettier-vscode",           // Code formatting
    "bradlc.vscode-tailwindcss",        // Tailwind CSS IntelliSense
    "ms-vscode.vscode-typescript-next", // Latest TypeScript
    "formulahendry.auto-rename-tag",    // Auto rename paired tags
    "christian-kohler.path-intellisense" // Path autocomplete
  ]
}
```

**Install all at once**:
```bash
# Save the above as .vscode/extensions.json in your project
# VS Code will prompt to install
```

#### VS Code Settings:
```json
{
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.cargo.features": "all",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Debugging Setup

#### Tauri Debugging (VS Code):

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Development Debug",
      "cargo": {
        "args": [
          "build",
          "--manifest-path=./src-tauri/Cargo.toml",
          "--no-default-features"
        ]
      },
      "preLaunchTask": "ui:dev"
    }
  ]
}
```

#### Browser DevTools:

Access Chrome DevTools inside Tauri app:
- **macOS**: `Cmd + Option + I`
- **Windows/Linux**: `Ctrl + Shift + I`
- Or enable in `tauri.conf.json`:
  ```json
  {
    "tauri": {
      "bundle": {
        "active": true
      },
      "windows": [{
        "devtools": true
      }]
    }
  }
  ```

---

## Troubleshooting

### Common Issues

#### 1. `cargo tauri` not found after installation

**Solution**:
```bash
# Add Cargo bin to PATH manually
# Linux/macOS:
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Windows PowerShell:
$env:Path += ";$env:USERPROFILE\.cargo\bin"
# Add permanently via System Environment Variables
```

#### 2. WebView2 missing on Windows

**Error**: `WebView2 runtime not found`

**Solution**:
```powershell
# Download and install from:
# https://developer.microsoft.com/en-us/microsoft-edge/webview2/consumer/

# Or via winget:
winget install Microsoft.EdgeWebView2Runtime
```

#### 3. `libwebkit2gtk-4.1` not found on Linux

**Error**: `package 'webkit2gtk-4.1' not found`

**Solution (Ubuntu 22.04+)**:
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

**For Ubuntu 20.04**:
```bash
# webkit2gtk-4.1 is not available, install 4.0:
sudo apt install libwebkit2gtk-4.0-dev
```

#### 4. Rust compilation errors on Windows

**Error**: `linker 'link.exe' not found`

**Solution**:
- Reinstall Visual Studio Build Tools
- Ensure "MSVC v143" is checked during installation
- Restart terminal after installation

#### 5. Slow Rust compilation

**Solution** (Optional but recommended):
```bash
# Use mold linker (Linux/macOS) or lld (Windows)
# Install mold:
cargo install mold

# Configure in ~/.cargo/config.toml:
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]

# For Windows, use lld:
[target.x86_64-pc-windows-msvc]
rustflags = ["-C", "link-arg=/INCREMENTAL:NO"]
```

**Alternative**: Use separate target directory for rust-analyzer:
```bash
# Add to VS Code settings.json:
{
  "rust-analyzer.server.extraEnv": {
    "CARGO_TARGET_DIR": "target/rust-analyzer"
  }
}
```

#### 6. Permission denied errors

**Linux/macOS**:
```bash
# Don't use sudo with cargo install
# If you already did:
sudo chown -R $(whoami) ~/.cargo
```

**Windows**:
- Run terminal as Administrator once for installation
- Regular user permissions sufficient for development

---

## Environment Variables

### Recommended Setup

Create a `.env` file in your project root:

```bash
# Development
NODE_ENV=development
RUST_LOG=debug
RUST_BACKTRACE=1

# Tauri
TAURI_DEBUG=true

# API Keys (for testing, use .env.local for real keys)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://localhost/ai_knowledge_dev
QDRANT_URL=http://localhost:6334
```

**Add to `.gitignore`**:
```
.env.local
.env.*.local
```

---

## Next Steps

Once setup is complete:

1. ✅ **Verify everything works** with the test project
2. 📖 **Read Next**: `docs/project_structure.md` (to be created)
3. 🚀 **Start Development**: Follow `docs/getting_started.md` (to be created)

---

## Getting Help

- **Tauri Docs**: https://v2.tauri.app
- **Rust Book**: https://doc.rust-lang.org/book/
- **Troubleshooting**: Open an issue in the project repository
- **Discord**: Tauri Discord server (https://discord.gg/tauri)

---

## Appendix: Version Requirements

| Tool | Minimum Version | Recommended | Notes |
|------|----------------|-------------|-------|
| Rust | 1.75.0 | Latest stable | Auto-updates via rustup |
| Node.js | 18.0.0 | 20.x LTS | Use nvm for version management |
| npm | 9.0.0 | 10.x | Comes with Node.js |
| Tauri CLI | 2.0.0 | 2.1+ | Install via cargo |
| VS Code | 1.85.0 | Latest | Optional but recommended |

---

**Setup Complete!** 🎉  
You're ready to start building the AI Knowledge Management System.
