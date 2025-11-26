# CI/CD Pipeline Configuration
## GitHub Actions Workflows

This directory contains automated workflows for continuous integration, building, and deployment of the AI Knowledge Management System.

---

## Workflows

### 1. `ci.yml` - Continuous Integration

**Triggers**: Push, Pull Requests  
**Purpose**: Run tests and linting on every code change

**Jobs**:
- **test-rust**: Unit tests for Rust services
- **test-frontend**: Frontend tests (Vitest + Playwright)
- **lint**: Code quality checks (clippy, eslint, prettier)
- **security**: Dependency vulnerability scanning

**Platforms**: Ubuntu (Linux), Windows, macOS

### 2. `build.yml` - Multi-Platform Builds

**Triggers**: Tagsstarting with `v*` (e.g., `v1.0.0`)  
**Purpose**: Build desktop app binaries for all platforms

**Jobs**:
- **build-tauri**: Create installers for Windows, macOS, Linux
- **upload-artifacts**: Store build artifacts

**Outputs**: `.exe`, `.dmg`, `.AppImage`, `.deb`, `.rpm`

### 3. `release.yml` - Automated Releases

**Triggers**: Tags starting with `v*`  
**Purpose**: Create GitHub releases with changelogs

**Jobs**:
- **create-release**: Generate release notes
- **upload-binaries**: Attach platform-specific installers

### 4. `security.yml` - Security Scanning

**Triggers**: Daily at 00:00 UTC, Manual  
**Purpose**: Scan dependencies for vulnerabilities

**Jobs**:
- **cargo-audit**: Rust dependency audit
- **npm-audit**: Node.js dependency audit
- **codeql**: Static analysis security testing

---

## Setup Instructions

### 1. Enable GitHub Actions

Workflows are automatically enabled when pushed to `.github/workflows/`.

### 2. Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `TAURI_PRIVATE_KEY` | Code signing key (see below) | Build |
| `TAURI_KEY_PASSWORD` | Key passphrase | Build |
| `APPLE_CERTIFICATE` | macOS code signing cert (base64) | macOS build |
| `APPLE_CERTIFICATE_PASSWORD` | Cert password | macOS build |
| `APPLE_SIGNING_IDENTITY` | Developer ID | macOS build |
| `APPLE_ID` | Apple ID email | macOS notarization |
| `APPLE_PASSWORD` | App-specific password | macOS notarization |

### 3. Generate Tauri Signing Keys

```bash
# Generate new keypair for update signing
cargo tauri signer generate -w ~/.tauri/myapp.key

# This creates:
# - Private key: ~/.tauri/myapp.key
# - Public key: printed to console

# Add private key to GitHub Secrets:
# TAURI_PRIVATE_KEY = contents of myapp.key
# TAURI_KEY_PASSWORD = password you set (if any)
```

### 4. macOS Code Signing (Optional but Recommended)

```bash
# Export certificate from Keychain as .p12
# Convert to base64:
base64 -i certificate.p12 -o certificate-base64.txt

# Add to GitHub Secrets:
# APPLE_CERTIFICATE = contents of certificate-base64.txt
# APPLE_CERTIFICATE_PASSWORD = password for .p12 file
```

---

## Workflow Details

### CI Workflow (`ci.yml`)

**What it does**:
1. Checks out code
2. Installs Rust toolchain
3. Caches dependencies (cargo, npm)
4. Runs tests (cargo test, npm test)
5. Lints code (clippy, eslint)
6. Checks formatting (rustfmt, prettier)
7. Scans for vulnerabilities (cargo audit, npm audit)

**Status Checks**:
- ✅ All jobs must pass before merging PRs
- Runs on: `ubuntu-latest`, `windows-latest`, `macos-latest`

**Duration**: ~5-10 minutes

### Build Workflow (`build.yml`)

**What it does**:
1. Sets up build environment for each platform
2. Installs platform-specific dependencies
3. Builds Tauri app (`cargo tauri build`)
4. Signs binaries (Windows: signtool, macOS: codesign)
5. Creates installers/packages
6. Uploads artifacts

**Artifacts**:
- **Windows**: `.exe` (NSIS installer), `.msi`
- **macOS**: `.dmg` (signed and notarized)
- **Linux**: `.AppImage`, `.deb`, `.rpm`

**Duration**: ~20-30 minutes per platform

### Release Workflow (`release.yml`)

**What it does**:
1. Waits for build workflow to complete
2. Downloads all build artifacts
3. Generates changelog from commits
4. Creates GitHub release
5. Attaches binaries to release
6. Publishes release notes

**Triggered by**: Git tags (e.g., `git tag v1.0.0 && git push --tags`)

---

## Local Testing

### Test CI Workflow Locally

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# Run CI workflow
act pull_request

# Run specific job
act -j test-rust

# With secrets
act -s TAURI_PRIVATE_KEY="$(cat ~/.tauri/myapp.key)"
```

### Test Build Locally

```bash
# Build for current platform
cargo tauri build

# Output location:
# - macOS: src-tauri/target/release/bundle/
# - Windows: src-tauri\target\release\bundle\
# - Linux: src-tauri/target/release/bundle/
```

---

## Troubleshooting

### Build Fails on macOS

**Error**: `Code signing failed`

**Solution**:
1. Ensure certificate is not expired
2. Check `APPLE_SIGNING_IDENTITY` matches cert exactly
3. Verify Keychain Access on macOS runner has cert installed

### Build Fails on Windows

**Error**: `signtool not found`

**Solution**:
- Windows SDK is auto-installed by GitHub runner
- Check workflow uses `windows-2022` runner (not older versions)

### Cargo Cache Issues

**Error**: `Dependency resolution failed`

**Solution**:
```yaml
# Clear cache in workflow
- name: Clear cargo cache
  run: |
    rm -rf ~/.cargo/registry/index
    rm -rf ~/.cargo/registry/cache
```

### NPM Audit Fails

**Error**: `High severity vulnerabilities found`

**Solution**:
```bash
# Update dependencies
npm audit fix

# If unfixable, document in security.md
# and add exception to workflow:
npm audit --audit-level=critical
```

---

## Performance Optimization

### Cache Strategy

**Current caching**:
- Rust: `~/.cargo`, `target/`
- Node.js: `node_modules/`, `~/.npm`

**Cache hit rate**: ~80-90% for typical PRs

**Time saved**: ~3-5 minutes per run

### Parallel Jobs

Workflows use matrix strategy for parallel execution:
```yaml
strategy:
  matrix:
    platform: [ubuntu-latest, macos-latest, windows-latest]
```

**Total CI time** (parallel): ~10 minutes  
**Total CI time** (sequential): ~30 minutes

---

## Badge Status

Add these badges to `README.md`:

```markdown
![CI](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg)
![Build](https://github.com/USERNAME/REPO/actions/workflows/build.yml/badge.svg)
![Security](https://github.com/USERNAME/REPO/actions/workflows/security.yml/badge.svg)
```

---

## Next Steps

1. ✅ **Push workflows** to`.github/workflows/`
2. ✅ **Configure secrets** in GitHub repository settings
3. ✅ **Create first tag** to trigger release: `git tag v0.1.0 && git push --tags`
4. ✅ **Monitor workflow runs** in Actions tab
5. 📦 **Download build artifacts** from successful runs

---

## References

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Tauri CI/CD Guide**: https://v2.tauri.app/distribute/
- **cargo-audit**: https://github.com/rustsec/rustsec
- **act (local testing)**: https://github.com/nektos/act
