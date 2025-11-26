// Database models
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Document {
    pub id: Uuid,
    pub user_id: Uuid,
    pub workspace_id: Option<Uuid>,
    pub title: String,
    pub content: Option<String>,
    pub summary: Option<String>,
    pub file_path: Option<String>,
    pub file_name: Option<String>,
    pub file_size_bytes: Option<i64>,
    pub file_type: Option<String>,
    pub mime_type: Option<String>,
    pub status: DocumentStatus,
    pub processing_error: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub deleted_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "document_status", rename_all = "lowercase")]
pub enum DocumentStatus {
    Uploading,
    Processing,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDocumentDto {
    pub user_id: Uuid,
    pub title: String,
    pub file_name: String,
    pub file_size_bytes: i64,
    pub file_type: String,
    pub mime_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadFileRequest {
    pub user_id: String,
    pub source_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadFileResponse {
    pub document: Document,
    pub file_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub full_name: Option<String>,
    pub role: String,
    pub storage_used_bytes: i64,
    pub storage_limit_bytes: i64,
}
