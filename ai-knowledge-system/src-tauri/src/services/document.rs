use crate::models::{Document, CreateDocumentDto, DocumentStatus};
use sqlx::PgPool;
use uuid::Uuid;

pub struct DocumentService {
    pool: PgPool,
}

impl DocumentService {
    pub fn new(pool: PgPool) -> Self {
        DocumentService { pool }
    }
    
    pub async fn create_document(&self, dto: CreateDocumentDto) -> Result<Document, sqlx::Error> {
        let doc = sqlx::query_as!(
            Document,
            r#"
            INSERT INTO documents (
                user_id, title, file_name, file_size_bytes, file_type, mime_type, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'uploading')
            RETURNING 
                id, user_id, workspace_id, title, content, summary, 
                file_path, file_name, file_size_bytes, file_type, mime_type,
                status as "status!: DocumentStatus",
                processing_error, created_at, updated_at, deleted_at
            "#,
            dto.user_id,
            dto.title,
            dto.file_name,
            dto.file_size_bytes,
            dto.file_type,
            dto.mime_type
        )
        .fetch_one(&self.pool)
        .await?;
        
        Ok(doc)
    }
    
    pub async fn update_file_path(&self, doc_id: Uuid, file_path: String) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            UPDATE documents
            SET file_path = $2, updated_at = NOW()
            WHERE id = $1
            "#,
            doc_id,
            file_path
        )
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn update_content_and_summary(
        &self,
        doc_id: Uuid,
        content: String,
        summary: String,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            UPDATE documents
            SET content = $2, summary = $3, status = 'completed', updated_at = NOW()
            WHERE id = $1
            "#,
            doc_id,
            content,
            summary
        )
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn get_documents_by_user(&self, user_id: Uuid) -> Result<Vec<Document>, sqlx::Error> {
        let docs = sqlx::query_as!(
            Document,
            r#"
            SELECT 
                id, user_id, workspace_id, title, content, summary,
                file_path, file_name, file_size_bytes, file_type, mime_type,
                status as "status!: DocumentStatus",
                processing_error, created_at, updated_at, deleted_at
            FROM documents
            WHERE user_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            "#,
            user_id
        )
        .fetch_all(&self.pool)
        .await?;
        
        Ok(docs)
    }
    
    pub async fn update_document_status(
        &self,
        doc_id: Uuid,
        status: DocumentStatus,
        error: Option<String>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            UPDATE documents
            SET status = $2, processing_error = $3, updated_at = NOW()
            WHERE id = $1
            "#,
            doc_id,
            status as DocumentStatus,
            error
        )
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
}
