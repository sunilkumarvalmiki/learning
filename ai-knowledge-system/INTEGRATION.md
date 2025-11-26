# Frontend Integration Guide

## Overview

This guide explains how to integrate the ai-knowledge-system frontend with the backend API.

## API Client Setup

### Files Created

1. **`src/api/config.ts`** - API configuration
2. **`src/api/documents.ts`** - Document API client
3. **`src/api/search.ts`** - Search API client
4. **`src/api/index.ts`** - API exports

### Environment Variables

Create a `.env` file in `ai-knowledge-system/`:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

For production:

```env
VITE_API_URL=https://your-api-domain.com/api/v1
```

## Usage Examples

### Document Upload

```typescript
import { documentAPI } from './api';

// Upload a file
const handleFileUpload = async (file: File) => {
  try {
    const document = await documentAPI.upload(file, {
      title: file.name,
    });
    
    console.log('Uploaded:', document);
    // Update UI with new document
  } catch (error) {
    console.error('Upload failed:', error);
    // Show error to user
  }
};
```

### List Documents

```typescript
import { documentAPI } from './api';

// Fetch documents with pagination
const loadDocuments = async (page = 1) => {
  try {
    const response = await documentAPI.list({
      page,
      limit: 20,
      search: searchQuery, // optional
    });
    
    setDocuments(response.documents);
    setPagination(response.pagination);
  } catch (error) {
    console.error('Failed to load documents:', error);
  }
};
```

### Search

```typescript
import { searchAPI } from './api';

// Full-text search
const handleSearch = async (query: string) => {
  try {
    const results = await searchAPI.fullText(query);
    setSearchResults(results.results);
  } catch (error) {
    console.error('Search failed:', error);
  }
};

// Hybrid search (recommended)
const handleHybridSearch = async (query: string) => {
  try {
    const results = await searchAPI.hybrid(query);
    setSearchResults(results.results);
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

### Get Suggestions

```typescript
import { searchAPI } from './api';

// Search autocomplete
const handleInputChange = async (value: string) => {
  if (value.length < 2) return;
  
  try {
    const suggestions = await searchAPI.suggestions(value);
    setSuggestions(suggestions);
  } catch (error) {
    console.error('Failed to get suggestions:', error);
  }
};
```

### Delete Document

```typescript
import { documentAPI } from './api';

const handleDelete = async (documentId: string) => {
  try {
    await documentAPI.delete(documentId);
    // Remove from UI
    setDocuments(docs => docs.filter(d => d.id !== documentId));
  } catch (error) {
    console.error('Delete failed:', error);
  }
};
```

## Integration Steps

### 1. Start Backend

```bash
cd backend
docker-compose up -d
npm run setup
npm run dev
```

Backend will run on `http://localhost:8080`

### 2. Update Frontend

Replace mock data imports with API calls:

**Before:**

```typescript
const documents = mockDocuments;
```

**After:**

```typescript
import { documentAPI } from './api';

const [documents, setDocuments] = useState([]);

useEffect(() => {
  documentAPI.list().then(response => {
    setDocuments(response.documents);
  });
}, []);
```

### 3. Add Error Handling

```typescript
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const loadDocuments = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await documentAPI.list();
    setDocuments(response.documents);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load documents');
  } finally {
    setLoading(false);
  }
};
```

### 4. Add Loading States

```typescript
{loading && <div>Loading...</div>}
{error && <div className="error">{error}</div>}
{!loading && !error && documents.map(doc => (
  <DocumentCard key={doc.id} document={doc} />
))}
```

## Testing

### Test API Connection

```typescript
// In your component
useEffect(() => {
  fetch('http://localhost:8080/health')
    .then(res => res.json())
    .then(data => console.log('Backend health:', data))
    .catch(err => console.error('Backend not reachable:', err));
}, []);
```

### Test Document Upload

Create a simple upload test:

```typescript
const testUpload = async () => {
  const testFile = new File(['test content'], 'test.txt', {
    type: 'text/plain',
  });
  
  try {
    const doc = await documentAPI.upload(testFile);
    console.log('Test upload successful:', doc);
  } catch (error) {
    console.error('Test upload failed:', error);
  }
};
```

## CORS Configuration

If you get CORS errors, the backend already has CORS enabled. Verify:

1. Backend is running on `http://localhost:8080`
2. Frontend is running on `http://localhost:1420` (Tauri default)
3. Both are using HTTP (not mixed HTTP/HTTPS)

## Next Steps

1. ✅ API clients created
2. ⏳ Replace mock data in components
3. ⏳ Add error boundaries
4. ⏳ Implement file upload UI
5. ⏳ Add loading skeletons
6. ⏳ Test E2E flow

## Troubleshooting

### Backend Not Reachable

```bash
# Check if backend is running
curl http://localhost:8080/health

# Check Docker services
cd backend
docker-compose ps

# View backend logs
npm run dev
```

### Upload Fails

- Check file size (<100MB)
- Verify file type is allowed (pdf, docx, txt, md, images)
- Check network tab in DevTools for error details

### Search Returns No Results

- Upload some documents first
- Ensure documents have content
- Try different search terms
- Check backend logs for errors
