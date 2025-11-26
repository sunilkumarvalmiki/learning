# Error Handling Strategy
## AI Knowledge Management System

**Last Updated**: November 2025  
**Rust Error Crates**: `thiserror` 1.0+, `anyhow` 1.0+, `tracing` 0.1+

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Rust Error Handling](#rust-error-handling)
3. [TypeScript Error Handling](#typescript-error-handling)
4. [Go Error Handling](#go-error-handling)
5. [Error Categories](#error-categories)
6. [User-Facing Messages](#user-facing-messages)
7. [Logging Strategy](#logging-strategy)
8. [Examples](#examples)

---

## Philosophy

### Core Principles

1. **Fail Fast, Recover Gracefully**: Detect errors early, handle them appropriately
2. **Context-Rich Errors**: Every error should explain what went wrong and why
3. **User-Friendly Messages**: Technical details in logs, simple messages to users
4. **Structured Logging**: Use structured logs for debugging and monitoring
5. **Error Propagation**: Don't swallow errors, propagate with context

---

## Rust Error Handling

### Use `thiserror` for Library/Application Errors

**When**: Defining custom error types for your domain

**Installation**:
```toml
[dependencies]
thiserror = "1.0"
```

**Pattern**:
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DocumentError {
    #[error("Failed to parse PDF: {0}")]
    PdfParse(String),
    
    #[error("OCR failed with confidence {confidence}%: {reason}")]
    OcrFailed { confidence: f32, reason: String },
    
    #[error("Document not found: {document_id}")]
    NotFound { document_id: String },
    
    #[error("Storage quota exceeded: {used}/{limit} bytes")]
    StorageQuotaExceeded { used: u64, limit: u64 },
    
    #[error("Database error")]
    Database(#[from] sqlx::Error),
    
    #[error("I/O error")]
    Io(#[from] std::io::Error),
}
```

### Use `anyhow` for Application-Level Error Handling

**When**: In `main()`, CLI tools, or when you don't need structured error types

**Installation**:
```toml
[dependencies]
anyhow = "1.0"
```

**Pattern**:
```rust
use anyhow::{Context, Result};

pub async fn process_document(path: &str) -> Result<Document> {
    let file = tokio::fs::read(path)
        .await
        .context("Failed to read document file")?;
    
    let parsed = parse_pdf(&file)
        .with_context(|| format!("Failed to parse PDF: {}", path))?;
    
    Ok(parsed)
}
```

### Error Conversion Hierarchy

```rust
// src/error.rs

use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    // Domain errors
    #[error("Document error: {0}")]
    Document(#[from] DocumentError),
    
    #[error("User error: {0}")]
    User(#[from] UserError),
    
    #[error("Storage error: {0}")]
    Storage(#[from] StorageError),
    
    // Infrastructure errors
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Vector database error: {0}")]
    Qdrant(#[from] qdrant_client::QdrantError),
    
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    
    // External service errors
    #[error("OpenAI API error: {0}")]
    OpenAI(String),
    
    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),
}

// User-facing messages
impl AppError {
    pub fn user_message(&self) -> String {
        match self {
            Self::Document(DocumentError::NotFound { document_id }) => {
                format!("Document not found. It may have been deleted.")
            }
            Self::Document(DocumentError::StorageQuotaExceeded { used, limit }) => {
                format!(
                    "Storage limit reached ({:.1} GB / {:.1} GB). Please upgrade or delete files.",
                    *used as f64 / 1_073_741_824.0,
                    *limit as f64 / 1_073_741_824.0
                )
            }
            Self::Document(DocumentError::PdfParse(_)) => {
                "Unable to read PDF. The file may be corrupted or password-protected.".into()
            }
            Self::Database(_) => {
                "A database error occurred. Please try again.".into()
            }
            Self::OpenAI(_) => {
                "AI service temporarily unavailable. Please try again.".into()
            }
            _ => "An unexpected error occurred. Please contact support.".into()
        }
    }
}
```

### Async Error Handling

```rust
use anyhow::Result;
use tracing::instrument;

#[instrument(skip(db))]
pub async fn create_document(
    db: &PgPool,
    user_id: Uuid,
    data: CreateDocumentDto,
) -> Result<Document, AppError> {
    // Validate input
    if data.file_size_bytes > 10_737_418_240 {
        // 10GB
        return Err(DocumentError::FileTooLarge {
            size: data.file_size_bytes,
            max: 10_737_418_240,
        }.into());
    }
    
    // Check storage quota
    let user = get_user(db, user_id).await?;
    if user.storage_used_bytes + data.file_size_bytes > user.storage_limit_bytes {
        return Err(DocumentError::StorageQuotaExceeded {
            used: user.storage_used_bytes + data.file_size_bytes,
            limit: user.storage_limit_bytes,
        }.into());
    }
    
    // Insert document
    let document = sqlx::query_as!(
        Document,
        "INSERT INTO documents (user_id, title, file_size_bytes) VALUES ($1, $2, $3) RETURNING *",
        user_id,
        data.title,
        data.file_size_bytes
    )
    .fetch_one(db)
    .await?;
    
    Ok(document)
}
```

---

## TypeScript Error Handling

### Custom Error Classes

```typescript
// src/errors/AppError.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with ID ${id}` : ''} not found`,
      'NOT_FOUND',
      404
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class QuotaExceededError extends AppError {
  constructor(
    public quotaType: string,
    public used: number,
    public limit: number
  ) {
    super(
      `${quotaType} quota exceeded: ${used}/${limit}`,
      'QUOTA_EXCEEDED',
      403
    );
  }
}
```

### Error Boundary (React)

```typescript
// src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Async Error Handling

```typescript
// src/services/documentService.ts

import { AppError, NotFoundError, QuotaExceededError } from '../errors';

export async function uploadDocument(
  userId: string,
  file: File
): Promise<Document> {
  try {
    // Check file size
    const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
    if (file.size > MAX_SIZE) {
      throw new AppError(
        `File too large: ${(file.size / 1073741824).toFixed(2)} GB (max: 10 GB)`,
        'FILE_TOO_LARGE',
        400
      );
    }

    // Check quota
    const user = await getUser(userId);
    if (user.storageUsed + file.size > user.storageLimit) {
      throw new QuotaExceededError(
        'Storage',
        user.storageUsed + file.size,
        user.storageLimit
      );
    }

    // Upload to S3
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AppError(error.message, error.code, response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Wrap unknown errors
    throw new AppError(
      'Failed to upload document',
      'UPLOAD_FAILED',
      500,
      false
    );
  }
}
```

---

## Go Error Handling

### Custom Error Types

```go
// internal/errors/errors.go

package errors

import (
    "fmt"
)

type AppError struct {
    Code       string
    Message    string
    StatusCode int
    Cause      error
}

func (e *AppError) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("%s: %v", e.Message, e.Cause)
    }
    return e.Message
}

func (e *AppError) Unwrap() error {
    return e.Cause
}

// Constructors
func NewNotFoundError(resource string, id string) *AppError {
    return &AppError{
        Code:       "NOT_FOUND",
        Message:    fmt.Sprintf("%s with ID %s not found", resource, id),
        StatusCode: 404,
    }
}

func NewValidationError(message string) *AppError {
    return &AppError{
        Code:       "VALIDATION_ERROR",
        Message:    message,
        StatusCode: 400,
    }
}

func WrapError(err error, message string) *AppError {
    return &AppError{
        Code:       "INTERNAL_ERROR",
        Message:    message,
        StatusCode: 500,
        Cause:      err,
    }
}
```

---

## Error Categories

| Category | HTTP Code | User Message | Log Level | Action |
|----------|-----------|--------------|-----------|--------|
| **Validation** | 400 | "Invalid input: {field}" | WARN | Show form error |
| **Authentication** | 401 | "Please log in" | INFO | Redirect to login |
| **Authorization** | 403 | "You don't have permission" | WARN | Show access denied |
| **Not Found** | 404 | "{Resource} not found" | INFO | Show 404 page |
| **Quota Exceeded** | 403 | "Storage limit reached" | WARN | Show upgrade prompt |
| **Rate Limit** | 429 | "Too many requests" | WARN | Show retry message |
| **Server Error** | 500 | "Something went wrong" | ERROR | Show error page |
| **Service Unavailable** | 503 | "Service temporarily down" | ERROR | Show maintenance page |

---

## User-Facing Messages

### Guidelines

1. **Be Specific but Not Technical**: "File is too large (12 GB max: 10 GB)" NOT "BufferOverflowException"
2. **Suggest Solutions**: "Storage full. Delete files or upgrade to Pro"
3. **Reassure**: "Your data is safe" when appropriate
4. **Avoid Jargon**: "Search failed" NOT "Vector DB query timeout"

### Examples

```rust
// Good
"Your PDF couldn't be opened. It may be password-protected or corrupted."

// Bad
"lopdf::Parse error: Invalid xref table at offset 0x1234"

// Good
"Upload failed. Check your internet connection and try again."

// Bad  
"NetworkError: ECONNREFUSED at 192.168.1.1:6334"
```

---

## Logging Strategy

### Use `tracing` for Structured Logging

**Installation**:
```toml
[dependencies]
tracing = "0.1"
tracing-subscriber = "0.3"
```

**Setup**:
```rust
// src/main.rs

use tracing_subscriber::{fmt, prelude::*, EnvFilter};

fn init_tracing() {
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env())
        .init();
}

#[tokio::main]
async fn main() {
    init_tracing();
    // ...
}
```

**Usage**:
```rust
use tracing::{info, warn, error, instrument};

#[instrument(skip(db))]
pub async fn process_document(db: &PgPool, doc_id: Uuid) -> Result<()> {
    info!("Processing document {}", doc_id);
    
    match parse_pdf(doc_id).await {
        Ok(content) => {
            info!("PDF parsed successfully, {} pages", content.pages.len());
        }
        Err(e) => {
            warn!("PDF parsing failed: {}", e);
            return Err(e.into());
        }
    }
    
    Ok(())
}
```

### Log Levels

- **ERROR**: Unrecoverable errors, system failures
- **WARN**: Recoverable errors, degraded performance
- **INFO**: Important application events (user actions, state changes)
- **DEBUG**: Detailed diagnostic information
- **TRACE**: Very verbose, request/response details

### What to Log

**DO Log**:
- ✅ User actions (document uploaded, search performed)
- ✅ Errors with context (document ID, user ID, timestamp)
- ✅ Performance metrics (processing time, queue length)
- ✅ External API calls (rate limits, errors)

**DON'T Log**:
- ❌ Passwords, API keys, tokens
- ❌ Full document content (log IDs only)
- ❌ PII unless necessary (email, name)
- ❌ In tight loops (use sampling)

---

## Examples

### Complete Rust Example

```rust
// src/services/document_processor.rs

use anyhow::{Context, Result};
use tracing::{info, warn, instrument};
use crate::error::{AppError, DocumentError};

#[instrument(skip(file_data))]
pub async fn process_pdf(
    user_id: Uuid,
    file_data: Vec<u8>,
) -> Result<ProcessedDocument, AppError> {
    info!("Starting PDF processing for user {}", user_id);
    
    // Parse PDF
    let document = lopdf::Document::load_mem(&file_data)
        .map_err(|e| DocumentError::PdfParse(e.to_string()))?;
    
    // Extract text
    let mut text = String::new();
    for page_num in 1..=document.get_pages().len() {
        let page_text = extract_page_text(&document, page_num)
            .with_context(|| format!("Failed to extract text from page {}", page_num))?;
        text.push_str(&page_text);
    }
    
    info!("Extracted {} characters from PDF", text.len());
    
    // If empty, try OCR
    if text.trim().is_empty() {
        warn!("No text found, falling back to OCR");
        text = perform_ocr(&file_data).await?;
    }
    
    Ok(ProcessedDocument {
        text,
        page_count: document.get_pages().len(),
    })
}
```

### Complete TypeScript Example

```typescript
// src/api/documents.ts

import { AppError, NotFoundError } from '../errors';
import { logger } from '../utils/logger';

export async function getDocument(id: string): Promise<Document> {
  try {
    logger.info({ documentId: id }, 'Fetching document');

    const response = await fetch(`/api/documents/${id}`);

    if (response.status === 404) {
      throw new NotFoundError('Document', id);
    }

    if (!response.ok) {
      throw new AppError(
        'Failed to fetch document',
        'FETCH_FAILED',
        response.status
      );
    }

    const document = await response.json();
    logger.info({ documentId: id, title: document.title }, 'Document fetched');
    
    return document;
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn({ error: error.message, code: error.code }, 'Document fetch failed');
      throw error;
    }
    
    logger.error({ error }, 'Unexpected error fetching document');
    throw new AppError(
      'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      false
    );
  }
}
```

---

## Testing Error Handling

### Rust Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quota_exceeded_error() {
        let error = DocumentError::StorageQuotaExceeded {
            used: 6_000_000_000,
            limit: 5_000_000_000,
        };
        
        let app_error = AppError::Document(error);
        let message = app_error.user_message();
        
        assert!(message.contains("Storage limit reached"));
        assert!(message.contains("5.6 GB"));
    }
}
```

### TypeScript Tests

```typescript
describe('Error Handling', () => {
  it('should throw NotFoundError for missing document', async () => {
    fetchMock.mockResponseOnce('', { status: 404 });

    await expect(getDocument('123')).rejects.toThrow(NotFoundError);
  });

  it('should generate user-friendly message', () => {
    const error = new QuotaExceededError('Storage', 6e9, 5e9);
    expect(error.user_message()).toContain('quota exceeded');
  });
});
```

---

## Best Practices

1. ✅ **Always add context** when propagating errors (.context(), with_context())
2. ✅ **Use domain-specific error types** (DocumentError, UserError)
3. ✅ **Log errors before returning** to users
4. ✅ **Test error paths** (not just happy paths)
5. ✅ **Never expose internal details** to users
6. ✅ **Use structured logging** (tracing, pino, zerolog)
7. ✅ **Monitor error rates** (Sentry, DataDog, Prometheus)

---

## Integration with Monitoring

### Sentry (Error Tracking)

```rust
// Cargo.toml
[dependencies]
sentry = "0.31"

// src/main.rs
let _guard = sentry::init(("https://your-dsn@sentry.io/project", sentry::ClientOptions {
    release: sentry::release_name!(),
    ..Default::default()
}));
```

```typescript
// src/index.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://your-dsn@sentry.io/project',
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

**Error handling is complete!** All errors should now be consistent, user-friendly, and properly logged across the entire stack.
