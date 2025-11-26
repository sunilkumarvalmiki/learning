import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Home, FileText, Tag, Settings, Upload, Search, X } from "lucide-react";
import { Sidebar, SidebarItem } from "./components/Sidebar";
import { SearchBar } from "./components/SearchBar";
import { Card, CardHeader, CardBody } from "./components/Card";
import { Button } from "./components/Button";
import { Badge } from "./components/Badge";
import { Modal } from "./components/Modal";
import { DocumentCardSkeleton } from "./components/DocumentCardSkeleton";
import { useDebounce } from "./hooks/useDebounce";
import "./App.css";

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

interface UploadFileResponse {
  document: Document;
  file_hash: string;
}

// Demo user ID (from seed data)
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

function App() {
  const [activeView, setActiveView] = useState("documents");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Debounce search query to avoid filtering on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isSearching, setIsSearching] = useState(false);

  // Show searching indicator when query changes
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, debouncedSearchQuery]);

  // Filter documents based on debounced search query
  const filteredDocuments = documents.filter((doc) => {
    if (!debouncedSearchQuery) return true;
    const query = debouncedSearchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.file_type?.toLowerCase().includes(query) ||
      doc.status.toLowerCase().includes(query)
    );
  });

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

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
};

const sidebarItems: SidebarItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={20} />,
    onClick: () => setActiveView("home"),
  },
  {
    id: "documents",
    label: "Documents",
    icon: <FileText size={20} />,
    badge: documents.length.toString(),
    onClick: () => setActiveView("documents"),
  },
  {
    id: "tags",
    label: "Tags",
    icon: <Tag size={20} />,
    onClick: () => setActiveView("tags"),
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={20} />,
    onClick: () => setActiveView("settings"),
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge variant="success" size="small">
          Completed
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="primary" size="small">
          Processing
        </Badge>
      );
    case "uploading":
      return (
        <Badge variant="warning" size="small">
          Uploading
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="error" size="small">
          Failed
        </Badge>
      );
    default:
      return <Badge size="small">Unknown</Badge>;
  }
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
  return `${Math.floor(diffMins / 1440)} days ago`;
};

const handleOpenFileDialog = async () => {
  try {
    setUploadError(null);
    const filePath = await invoke<string | null>("open_file_dialog");
    if (filePath) {
      setSelectedFile(filePath);
      setUploadModalOpen(true);
    }
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
    // Call new upload_file command
    const response = await invoke<UploadFileResponse>("upload_file", {
      request: {
        user_id: DEMO_USER_ID,
        source_path: selectedFile,
      },
    });

    console.log("Upload successful!", {
      document: response.document,
      hash: response.file_hash,
    });

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

return (
  <div className="app-container">
    {/* Skip Navigation for Accessibility */}
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>

    <Sidebar
      items={sidebarItems}
      collapsed={sidebarCollapsed}
      header={
        <div className="sidebar-header">
          <h2 className="sidebar-title">AI Knowledge</h2>
        </div>
      }
      footer={
        <div className="sidebar-footer">
          <Button
            variant="ghost"
            size="small"
            fullWidth
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? "→" : "←"}
          </Button>
        </div>
      }
    />

    <main className="main-content">
      {/* Header with Search */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="page-title">
            {activeView === "documents" && "Documents"}
            {activeView === "home" && "Home"}
            {activeView === "tags" && "Tags"}
            {activeView === "settings" && "Settings"}
          </h1>
          <div className="header-actions">
            <SearchBar
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              placeholder="Search documents..."
              loading={isSearching}
            />
              />
            <Button variant="primary" onClick={handleOpenFileDialog}>
              <Upload size={18} style={{ marginRight: '8px' }} />
              Upload Document
            </Button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main id="main-content" className="content-area">
        {activeView === "documents" && (
          <>
            {loading ? (
              Upload your first document to get started
          </p>
        <Button variant="primary" onClick={handleOpenFileDialog}>
          <Upload size={18} style={{ marginRight: '8px' }} />
          Upload Document
        </Button>
      </div>
      ) : (
      <div className="documents-grid">
        {documents
          .filter((doc) =>
            searchQuery
              ? doc.title.toLowerCase().includes(searchQuery.toLowerCase())
              : true
          )
          .map((doc) => (
            <Card key={doc.id} variant="elevated" hoverable>
              <CardHeader>
                <div className="document-card-header">
                  <h3 className="document-card-title">{doc.title}</h3>
                  {getStatusBadge(doc.status)}
                </div>
              </CardHeader>
              <div className="documents-grid">
                <DocumentCardSkeleton count={10} />
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="documents-grid">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="document-card">
                    <CardHeader>
                      <div className="document-card-header">
                        <h3 className="document-card-title">{doc.title || doc.file_name || "Untitled Document"}</h3>
                        <div className="document-card-status">
                          {getStatusBadge(doc.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="document-card-meta">
                        <div className="document-card-meta-item">
                          <strong>Type:</strong> {doc.file_type || "Unknown"}
                        </div>
                        <div className="document-card-meta-item">
                          <strong>Size:</strong> {formatFileSize(doc.file_size_bytes)}
                        </div>
                        <div className="document-card-meta-item">
                          <strong>Added:</strong> {formatDate(doc.created_at)}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
              ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileText size={64} />
                </div>
                <h3 className="empty-state-title">No documents yet</h3>
                <p className="empty-state-description">
                  Upload your first document to get started
                </p>
                <Button variant="primary" onClick={handleOpenFileDialog}>
                  <Upload size={18} style={{ marginRight: '8px' }} />
                  Upload Document
                </Button>
              </div>
            )}
            </>
          )}

        {activeView === "home" && (
          <div className="view-page">
            <h2 className="view-page-title">Welcome to AI Knowledge Management System</h2>
            <p className="view-page-description">
              Upload documents, take notes, and let AI help you organize and understand your knowledge.
            </p>
            <div className="view-page-actions">
              <Button variant="primary" size="large" onClick={handleOpenFileDialog}>
                <Upload size={20} style={{ marginRight: '8px' }} />
                Upload Your First Document
              </Button>
            </div>
          </div>
        )}

        {activeView === "tags" && (
          <div className="view-page">
            <h2 className="view-page-title">Tags</h2>
            <p className="view-page-description">Tags feature coming soon...</p>
          </div>
        )}

        {activeView === "settings" && (
          <div className="view-page">
            <h2 className="view-page-title">Settings</h2>
            <p className="view-page-description">Settings feature coming soon...</p>
          </div>
        )}
    </main>

    {/* Upload Modal */}
    <Modal
      isOpen={uploadModalOpen}
      onClose={() => {
        if (!uploading) {
          setUploadModalOpen(false);
          setSelectedFile(null);
          setUploadError(null);
        }
      }}
      title="Upload Document"
    >
      <div className="modal-content">
        {selectedFile && (
          <>
            <p className="modal-description">Selected file:</p>
            <div className="modal-file-preview">
              <code className="modal-file-name">{selectedFile.split("/").pop()}</code>
            </div>

            {uploadError && (
              <div className="modal-error">Error: {uploadError}</div>
            )}

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedFile(null);
                  setUploadError(null);
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpload} loading={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  </div >
);
}

export default App;
