# Frontend Integration Changes for App.tsx

## Current State

App.tsx currently uses Tauri `invoke()` commands to communicate with a Rust backend. We need to replace these with our new HTTP API clients.

## Changes Required

### 1. Update Imports

**Remove/Comment out:**

```typescript
import { invoke } from "@tauri-apps/api/core";
```

**Add:**

```typescript
import { documentAPI } from './api';
```

### 2. Update Document Interface

**Current (lines 14-25):**

```typescript
interface Document {
  id: string;
  user_id: string;
  title: string;
  status: "uploading" | "processing" | "completed" | "failed";
  file_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
  updated_at: string;
  file_name: string | null;
  file_path: string | null;
}
```

**Should be (import from API):**

```typescript
import { Document } from './api';
// Or add missing fields to API type
```

### 3. Replace fetchDocuments Function

**Current (lines 75-87):**

```typescript
const fetchDocuments = async () => {
  try {
    setLoading(true);
    const docs = await invoke<Document[]>("get_user_documents", {
      userId: DEMO_USER_ID,
    });
    setDocuments(docs);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
  } finally {
    setLoading(false);
  }
};
```

**Replace with:**

```typescript
const fetchDocuments = async () => {
  try {
    setLoading(true);
    const response = await documentAPI.list({ page: 1, limit: 100 });
    setDocuments(response.documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
  } finally {
    setLoading(false);
  }
};
```

### 4. Replace File Upload Logic

**Current (lines 182-213) uses:**

```typescript
const response = await invoke<UploadFileResponse>("upload_file", {
  request: {
    user_id: DEMO_USER_ID,
    source_path: selectedFile,
  },
});
```

**Replace with:**

```typescript
// Need to get File object instead of path
const handleOpenFileDialog = async () => {
  try {
    setUploadError(null);
    // Use HTML file input instead of Tauri dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt,.md,image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
        setUploadModalOpen(true);
      }
    };
    input.click();
  } catch (error) {
    console.error("Failed to open file dialog:", error);
    setUploadError("Failed to open file dialog");
  }
};

const handleUpload = async () => {
  if (!selectedFile) return;

  setUploading(true);
  setUploadError(null);

  try {
    const document = await documentAPI.upload(selectedFile as File, {
      title: (selectedFile as File).name,
    });

    console.log("Upload successful!", document);

    // Refresh document list
    await fetchDocuments();

    setUploadModalOpen(false);
    setSelectedFile(null);
  } catch (error) {
    console.error("Failed to upload document:", error);
    setUploadError(String(error));
  } finally {
    setUploading(false);
  }
};
```

### 5. Update State Types

**Change selectedFile state:**

```typescript
// From:
const [selectedFile, setSelectedFile] = useState<string | null>(null);

// To:
const [selectedFile, setSelectedFile] = useState<File | null>(null);
```

### 6. Update Modal Display

**In modal, change:**

```typescript
// From:
<code className="modal-file-name">{selectedFile.split("/").pop()}</code>

// To:
<code className="modal-file-name">{selectedFile?.name}</code>
```

### 7. Add Environment Variable

Create **`.env`** file in `ai-knowledge-system/`:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## Complete Modified App.tsx Structure

```typescript
import { useState, useEffect } from "react";
import { Home, FileText, Tag, Settings, Upload } from "lucide-react";
import { documentAPI, Document } from './api';  // ← NEW
// Remove Tauri imports when using HTTP API only

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // ← Changed type

  // Fetch documents - MODIFIED
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.list({ page: 1, limit: 100 });
      setDocuments(response.documents);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // File dialog - MODIFIED
  const handleOpenFileDialog = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt,.md,image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
        setUploadModalOpen(true);
      }
    };
    input.click();
  };

  // Upload - MODIFIED
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      await documentAPI.upload(selectedFile, { title: selectedFile.name });
      await fetchDocuments();
      setUploadModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      setUploadError(String(error));
    } finally {
      setUploading(false);
    }
  };

  // Rest of component remains the same...
}
```

## Testing Checklist

After making these changes:

1. ✅ Start backend: `cd backend && npm run dev`
2. ✅ Start frontend: `cd ai-knowledge-system && pnpm dev`
3. ✅ Test upload
4. ✅ Test document list
5. ✅ Test search (if connected)

## Notes

- **File handling change**: Tauri uses file paths, HTTP uses File objects
- **API differences**: Tauri commands vs REST endpoints
- **Error handling**: HTTP errors are different from Tauri errors
- **CORS**: Make sure backend CORS is configured for `http://localhost:1420`
