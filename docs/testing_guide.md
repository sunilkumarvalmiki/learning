# Testing Infrastructure Setup
## AI Knowledge Management System

**Last Updated**: November 2025  
**Testing Framework**: Vitest 1.0+, Playwright 1.40+, cargo test

---

## Table of Contents

1. [Overview](#overview)
2. [Rust Testing](#rust-testing)
3. [Frontend Testing](#frontend-testing)
4. [E2E Testing](#e2e-testing)
5. [Performance Testing](#performance-testing)
6. [Test Data](#test-data)
7. [CI Integration](#ci-integration)

---

## Overview

### Testing Strategy

| Type | Tool | Coverage Target | When to Run |
|------|------|-----------------|-------------|
| **Unit Tests** | cargo test, Vitest | >80% | Every commit |
| **Integration Tests** | cargo test, Vitest | >70% | Every PR |
| **E2E Tests** | Playwright | Critical paths | Pre-release |
| **Performance Tests** | criterion, k6 | Benchmarks | Weekly |

---

## Rust Testing

### Unit Tests

**Location**: Same file as code or `tests/` module

```rust
// src/services/document_parser.rs

pub fn extract_text_from_pdf(data: &[u8]) -> Result<String> {
    // Implementation...
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_text_basic() {
        let pdf_data = include_bytes!("../../testdata/sample.pdf");
        let result = extract_text_from_pdf(pdf_data).unwrap();
        
        assert!(!result.is_empty());
        assert!(result.contains("Machine Learning"));
    }

    #[test]
    fn test_extract_text_empty_pdf() {
        let empty_pdf = vec![];
        let result = extract_text_from_pdf(&empty_pdf);
        
        assert!(result.is_err());
    }

    #[test]
    #[should_panic(expected = "Invalid PDF")]
    fn test_extract_text_corrupted() {
        let corrupted = vec![0u8; 100];
        extract_text_from_pdf(&corrupted).unwrap();
    }
}
```

### Async Tests

```rust
#[cfg(test)]
mod async_tests {
    use super::*;

    #[tokio::test]
    async fn test_upload_document() {
        let pool = setup_test_db().await;
        
        let document = create_document(
            &pool,
            Uuid::new_v4(),
            "Test Doc".to_string(),
        ).await.unwrap();
        
        assert_eq!(document.title, "Test Doc");
        assert_eq!(document.status, DocumentStatus::Uploading);
        
        cleanup_test_db(&pool).await;
    }
}
```

### Integration Tests

**Location**: `tests/integration/`

```rust
// tests/integration/document_pipeline_test.rs

use ai_knowledge::{DocumentProcessor, VectorStore};

#[tokio::test]
async fn test_full_document_pipeline() {
    // Setup
    let db = setup_test_database().await;
    let vector_db = setup_test_qdrant().await;
    let processor = DocumentProcessor::new(db.clone(), vector_db.clone());
    
    // Upload
    let pdf_data = std::fs::read("testdata/sample.pdf").unwrap();
    let doc_id = processor.upload(pdf_data).await.unwrap();
    
    // Process
    processor.process_document(doc_id).await.unwrap();
    
    // Verify
    let document = db.get_document(doc_id).await.unwrap();
    assert_eq!(document.status, DocumentStatus::Completed);
    assert!(document.embedding.is_some());
    
    // Search
    let results = vector_db.search(&document.embedding.unwrap(), 5).await.unwrap();
    assert!(!results.is_empty());
    
    // Cleanup
    cleanup_test_data(&db, &vector_db).await;
}
```

### Mocking

```rust
// tests/mocks.rs

use mockall::*;

#[automock]
pub trait LlmClient {
    async fn generate_summary(&self, text: &str) -> Result<String>;
    async fn extract_entities(&self, text: &str) -> Result<Vec<Entity>>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_summary_generation() {
        let mut mock_llm = MockLlmClient::new();
        mock_llm
            .expect_generate_summary()
            .with(eq("Sample text"))
            .times(1)
            .returning(|_| Ok("Summary".to_string()));
        
        let result = mock_llm.generate_summary("Sample text").await.unwrap();
        assert_eq!(result, "Summary");
    }
}
```

### Property-Based Testing

```rust
// Cargo.toml
[dev-dependencies]
proptest = "1.0"

// tests/property_tests.rs
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_text_chunking_always_returns_valid_chunks(
        text in "\\PC{1,10000}",
        chunk_size in 100usize..2000,
    ) {
        let chunks = chunk_text(&text, chunk_size);
        
        // Properties that must always hold
        prop_assert!(!chunks.is_empty());
        prop_assert!(chunks.iter().all(|c| c.len() <= chunk_size * 1.2));
        prop_assert_eq!(chunks.join("").len(), text.len());
    }
}
```

### Running Rust Tests

```bash
# All tests
cargo test

# Specific test
cargo test test_extract_text_basic

# With output
cargo test -- --nocapture

# Integration tests only
cargo test --test '*'

# With coverage (using tarpaulin)
cargo install cargo-tarpaulin
cargo tarpaulin --out Html
```

---

## Frontend Testing

### Vitest Setup

**Installation**:
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

**Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/*.stories.tsx',
        '**/*.test.tsx',
        '**/*.config.ts',
        '**/node_modules/**',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
});
```

**Setup File** (`src/test/setup.ts`):
```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### Component Tests

```typescript
// src/components/Button/Button.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument(); // loading spinner
  });

  it('renders all variants', () => {
    const { rerender } = render(<Button variant="primary">Text</Button>);
    expect(screen.getByRole('button')).toHaveClass('button--primary');

    rerender(<Button variant="secondary">Text</Button>);
    expect(screen.getByRole('button')).toHaveClass('button--secondary');
  });
});
```

### Hook Tests

```typescript
// src/hooks/useDocuments.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDocuments } from './useDocuments';

describe('useDocuments', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('fetches documents on mount', async () => {
    const mockDocuments = [
      { id: '1', title: 'Doc 1' },
      { id: '2', title: 'Doc 2' },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    const { result } = renderHook(() => useDocuments());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.documents).toEqual(mockDocuments);
    expect(result.current.error).toBeNull();
  });
});
```

### Running Frontend Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# Coverage
npm run test:coverage

# Specific file
npm run test Button.test.tsx
```

**package.json scripts**:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## E2E Testing

### Playwright Setup

**Installation**:
```bash
npm install -D @playwright/test
npx playwright install
```

**Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// tests/e2e/document-upload.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Document Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByLabel('Email').fill('demo@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should upload PDF successfully', async ({ page }) => {
    // Click upload button
    await page.getByRole('button', { name: 'Upload Document' }).click();

    // Select file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('testdata/sample.pdf');

    // Wait for upload to complete
    await expect(page.getByText('Upload complete')).toBeVisible({ timeout: 10000 });

    // Verify document appears in list
    await expect(page.getByText('sample.pdf')).toBeVisible();

    // Check status badge
    await expect(page.getByText('Processing')).toBeVisible();
  });

  test('should show error for large files', async ({ page }) => {
    await page.getByRole('button', { name: 'Upload Document' }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('testdata/large-file.pdf'); // > 10GB

    await expect(page.getByText(/File too large/)).toBeVisible();
    await expect(page.getByText(/max: 10 GB/)).toBeVisible();
  });

  test('should search documents', async ({ page }) => {
    // Type in search bar
    await page.getByPlaceholder('Search everywhere...').fill('machine learning');
    await page.keyboard.press('Enter');

    // Wait for results
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();

    // Verify results contain search term
    const results = page.getByTestId('search-result');
    await expect(results.first()).toContainText(/machine learning/i);

    // Click first result
    await results.first().click();

    // Verify document opened
    await expect(page).toHaveURL(/\/documents\/.+/);
  });
});
```

### Visual Regression Testing

```typescript
// tests/e2e/visual.spec.ts

import { test, expect } from '@playwright/test';

test('homepage screenshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
});

test('dark mode screenshot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page).toHaveScreenshot('homepage-dark.png');
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test
npx playwright test document-upload

# Run in UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run on specific browser
npx playwright test --project=chromium

# Generate report
npx playwright show-report
```

---

## Performance Testing

### Criterion (Rust Benchmarks)

```rust
// benches/pdf_parsing.rs

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use ai_knowledge::parse_pdf;

fn benchmark_pdf_parsing(c: &mut Criterion) {
    let small_pdf = std::fs::read("testdata/small.pdf").unwrap();
    let medium_pdf = std::fs::read("testdata/medium.pdf").unwrap();
    let large_pdf = std::fs::read("testdata/large.pdf").unwrap();

    let mut group = c.benchmark_group("pdf_parsing");

    group.bench_with_input(
        BenchmarkId::new("small", "2MB"),
        &small_pdf,
        |b, data| b.iter(|| parse_pdf(black_box(data)))
    );

    group.bench_with_input(
        BenchmarkId::new("medium", "50MB"),
        &medium_pdf,
        |b, data| b.iter(|| parse_pdf(black_box(data)))
    );

    group.bench_with_input(
        BenchmarkId::new("large", "500MB"),
        &large_pdf,
        |b, data| b.iter(|| parse_pdf(black_box(data)))
    );

    group.finish();
}

criterion_group!(benches, benchmark_pdf_parsing);
criterion_main!(benches);
```

**Run benchmarks**:
```bash
cargo bench
```

### k6 (API Load Testing)

**Installation**:
```bash
brew install k6  # macOS
```

**Test Script** (`tests/load/document-upload.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be below 1%
  },
};

export default function () {
  const url = 'http://localhost:3000/api/documents/upload';
  
  const fd = new FormData();
  fd.append('file', http.file(open('./testdata/sample.pdf', 'b'), 'sample.pdf'));

  const res = http.post(url, fd.body(), {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${fd.boundary}`,
      'Authorization': `Bearer ${__ENV.API_TOKEN}`,
    },
  });

  check(res, {
    'is status 201': (r) => r.status === 201,
    'has document ID': (r) => JSON.parse(r.body).id !== '',
  });

  sleep(1);
}
```

**Run load test**:
```bash
k6 run tests/load/document-upload.js
```

---

## Test Data

### Test Database Setup

```sql
-- tests/fixtures/test_data.sql

-- Create test user
INSERT INTO users (id, email, password_hash, role, email_verified) VALUES
('test-user-id', 'test@example.com', '$2b$12$...', 'pro', true);

-- Create test documents
INSERT INTO documents (id, user_id, title, content, status) VALUES
('test-doc-1', 'test-user-id', 'Test Document 1', 'Content...', 'completed'),
('test-doc-2', 'test-user-id', 'Test Document 2', 'Content...', 'processing');
```

### Test Fixtures (Rust)

```rust
// tests/fixtures/mod.rs

pub async fn setup_test_db() -> PgPool {
    let db_url = std::env::var("TEST_DATABASE_URL")
        .unwrap_or_else(|_| "postgresql://localhost/ai_knowledge_test".to_string());
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to test database");
    
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    
    pool
}

pub async fn cleanup_test_db(pool: &PgPool) {
    sqlx::query("TRUNCATE users, documents, tags, notes CASCADE")
        .execute(pool)
        .await
        .expect("Failed to cleanup test database");
}
```

---

## CI Integration

### GitHub Actions (Already Created in `.github/workflows/ci.yml`)

**Key Points**:
- ✅ Runs on every push and PR
- ✅ Tests Rust, TypeScript, E2E
- ✅ Generates coverage reports
- ✅ Caches dependencies

---

## Best Practices

1. ✅ **Test Pyramid**: Many unit tests, fewer integration tests, few E2E tests
2. ✅ **Test Isolation**: Each test should be independent
3. ✅ **Descriptive Names**: `test_upload_fails_when_quota_exceeded` not `test_upload_2`
4. ✅ **AAA Pattern**: Arrange → Act → Assert
5. ✅ **Mock External Dependencies**: Don't call real APIs in tests
6. ✅ **Snapshot Testing**: For UI components (use `insta` in Rust)
7. ✅ **Coverage Goals**: Aim for >80% but focus on critical paths

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `cargo test` | Run Rust tests |
| `cargo bench` | Run Rust benchmarks |
| `npm run test` | Run frontend unit tests |
| `npx playwright test` | Run E2E tests |
| `k6 run tests/load/*.js` | Run load tests |
| `cargo tarpaulin` | Generate Rust coverage |
| `npm run test:coverage` | Generate frontend coverage |

---

**Testing infrastructure is complete!** You now have comprehensive testing across all layers of the application.
