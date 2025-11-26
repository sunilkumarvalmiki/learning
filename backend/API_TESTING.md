# Testing the Document API

## Prerequisites

1. **Backend running**:

```bash
cd backend
npm install
docker-compose up -d
npm run setup
npm run dev
```

2. **Verify health**:

```bash
curl http://localhost:8080/health
```

---

## API Endpoints

### 1. Upload a Document

```bash
curl -X POST http://localhost:8080/api/v1/documents/upload \
  -F "file=@/path/to/your/document.pdf" \
  -F "title=My Test Document" \
  -F "userId=00000000-0000-0000-0000-000000000001"
```

**Expected Response (201)**:

```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": "uuid-here",
    "title": "My Test Document",
    "fileName": "document.pdf",
    "fileSize": 123456,
    "fileType": "pdf",
    "status": "processing",
    "createdAt": "2025-11-27T..."
  }
}
```

---

### 2. List Documents

```bash
curl "http://localhost:8080/api/v1/documents?userId=00000000-0000-0000-0000-000000000001&page=1&limit=10"
```

**Expected Response (200)**:

```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "My Test Document",
      "fileName": "document.pdf",
      "fileSize": 123456,
      "fileType": "pdf",
      "status": "processing",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 3. Get Single Document

```bash
curl "http://localhost:8080/api/v1/documents/{DOCUMENT_ID}?userId=00000000-0000-0000-0000-000000000001"
```

**Expected Response (200)**:

```json
{
  "document": {
    "id": "uuid",
    "title": "My Test Document",
    "content": null,
    "summary": null,
    "fileName": "document.pdf",
    "filePath": "user-xxx/uuid.pdf",
    "fileSize": 123456,
    "fileType": "pdf",
    "mimeType": "application/pdf",
    "status": "processing",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 4. Update Document

```bash
curl -X PATCH http://localhost:8080/api/v1/documents/{DOCUMENT_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "summary": "This is a summary",
    "userId": "00000000-0000-0000-0000-000000000001"
  }'
```

**Expected Response (200)**:

```json
{
  "message": "Document updated successfully",
  "document": {
    "id": "uuid",
    "title": "Updated Title",
    "summary": "This is a summary",
    "updatedAt": "..."
  }
}
```

---

### 5. Delete Document

```bash
curl -X DELETE "http://localhost:8080/api/v1/documents/{DOCUMENT_ID}?userId=00000000-0000-0000-0000-000000000001"
```

**Expected Response (200)**:

```json
{
  "message": "Document deleted successfully",
  "documentId": "uuid"
}
```

---

## Testing with Postman/Insomnia

Import this collection:

```json
{
  "name": "AI Knowledge API",
  "requests": [
    {
      "name": "Upload Document",
      "method": "POST",
      "url": "http://localhost:8080/api/v1/documents/upload",
      "body": {
        "type": "formdata",
        "formdata": [
          {"key": "file", "type": "file"},
          {"key": "title", "value": "Test Doc"},
          {"key": "userId", "value": "00000000-0000-0000-0000-000000000001"}
        ]
      }
    },
    {
      "name": "List Documents",
      "method": "GET",
      "url": "http://localhost:8080/api/v1/documents?userId=00000000-0000-0000-0000-000000000001&page=1&limit=10"
    }
  ]
}
```

---

## Verify MinIO Storage

1. Open MinIO Console: <http://localhost:9001>
2. Login: `minioadmin` / `minioadmin`
3. Navigate to `documents` bucket
4. Verify file uploaded to `user-00000000-0000-0000-0000-000000000001/` directory

---

## Verify PostgreSQL

```bash
psql -h localhost -U postgres -d knowledge_db

SELECT id, title, file_name, status, created_at 
FROM documents 
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

---

## Error Cases

### File Too Large

```bash
# Upload a file > 100MB
# Expected: 400 Bad Request
{
  "error": "File too large",
  "message": "Maximum file size is 100MB"
}
```

### Invalid File Type

```bash
# Upload .exe file
# Expected: 400 Bad Request
{
  "error": "Invalid file",
  "message": "File type .exe is not allowed"
}
```

### Document Not Found

```bash
curl "http://localhost:8080/api/v1/documents/invalid-id?userId=00000000-0000-0000-0000-000000000001"

# Expected: 404 Not Found
{
  "error": "Document not found",
  "message": "Document with ID invalid-id not found"
}
```

---

## Performance Testing

```bash
# Upload 10 documents
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/v1/documents/upload \
    -F "file=@test.pdf" \
    -F "title=Test Document $i" \
    -F "userId=00000000-0000-0000-0000-000000000001"
done

# List all
curl "http://localhost:8080/api/v1/documents?userId=00000000-0000-0000-0000-000000000001&limit=20"
```

---

## Next Steps

1. **Search API** - Implement semantic and full-text search
2. **Authentication** - Add JWT-based user authentication
3. **Frontend Integration** - Connect Tauri app to API
4. **Document Processing** - Add text extraction and embedding generation
