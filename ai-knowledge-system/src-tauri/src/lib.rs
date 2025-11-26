mod models;
mod db;
mod services;
mod file_utils;
mod pdf_processor;

use tauri::Manager;
use tauri::State;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::path::PathBuf;

use models::{Document, CreateDocumentDto, UploadFileRequest, UploadFileResponse, DocumentStatus};
use services::DocumentService;

// Application state
pub struct AppState {
    pub document_service: Arc<Mutex<DocumentService>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn open_file_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let file_path = app.dialog()
        .file()
        .add_filter("Documents", &["pdf", "docx", "txt", "md"])
        .blocking_pick_file();
    
    match file_path {
        Some(path) => {
            let path_str = path.as_path()
                .expect("FilePath should have a path")
                .to_string_lossy()
                .to_string();
            Ok(Some(path_str))
        }
        None => Ok(None),
    }
}

#[tauri::command]
async fn upload_file(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    request: UploadFileRequest,
) -> Result<UploadFileResponse, String> {
    let user_id = uuid::Uuid::parse_str(&request.user_id).map_err(|e| e.to_string())?;
    let source_path = PathBuf::from(&request.source_path);
    
    // Validate source file exists
    if !source_path.exists() {
        return Err("Source file does not exist".to_string());
    }
    
    // Get file metadata
    let metadata = std::fs::metadata(&source_path).map_err(|e| e.to_string())?;
    let file_size = metadata.len() as i64;
    
    let file_name = source_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    
    // Detect MIME type
    let mime_type = file_utils::detect_mime_type(&source_path).map_err(|e| e.to_string())?;
    
    // Get file extension
    let file_type = file_utils::get_file_extension(&source_path);
    
    // Calculate SHA-256 hash
    let file_hash = file_utils::calculate_sha256(&source_path).map_err(|e| e.to_string())?;
    
    // Create app data directory
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let documents_dir = app_data_dir.join("documents");
    std::fs::create_dir_all(&documents_dir).map_err(|e| e.to_string())?;
    
    // Generate unique filename using hash prefix + original name
    let hash_prefix = &file_hash[..8];
    let dest_filename = format!("{}_{}", hash_prefix, file_name);
    let dest_path = documents_dir.join(&dest_filename);
    
    // Copy file to app directory
    std::fs::copy(&source_path, &dest_path).map_err(|e| e.to_string())?;
    
    // Create document in database
    let dto = CreateDocumentDto {
        user_id,
        title: file_name.clone(),
        file_name: file_name,
        file_size_bytes: file_size,
        file_type: file_type.clone(),
        mime_type: mime_type.clone(),
    };
    
    let service = state.document_service.lock().await;
    let mut document = service.create_document(dto).await.map_err(|e| e.to_string())?;
    
    // Update file_path in database
    let dest_path_str = dest_path.to_string_lossy().to_string();
    service.update_file_path(document.id, dest_path_str.clone()).await.map_err(|e| e.to_string())?;
    
    document.file_path = Some(dest_path_str);
    
    // Process PDF if applicable (spawn background task)
    if mime_type == "application/pdf" || file_type == "PDF" {
        let doc_id = document.id;
        let pdf_path = dest_path.clone();
        let service_clone = Arc::clone(&state.document_service);
        
        tokio::spawn(async move {
            // Update status to processing
            if let Ok(service) = service_clone.try_lock() {
                let _ = service.update_document_status(doc_id, DocumentStatus::Processing, None).await;
            }
            
            // Extract text from PDF
            match pdf_processor::extract_text_from_pdf(&pdf_path) {
                Ok(text) => {
                    // Generate summary (first 500 chars)
                    let summary = pdf_processor::generate_basic_summary(&text, 500);
                    
                    // Update database
                    if let Ok(service) = service_clone.try_lock() {
                        if let Err(e) = service.update_content_and_summary(doc_id, text, summary).await {
                            eprintln!("Failed to update document content: {}", e);
                            let _ = service.update_document_status(
                                doc_id,
                                DocumentStatus::Failed,
                                Some(format!("Failed to save content: {}", e))
                            ).await;
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to extract PDF text: {}", e);
                    if let Ok(service) = service_clone.try_lock() {
                        let _ = service.update_document_status(
                            doc_id,
                            DocumentStatus::Failed,
                            Some(format!("PDF extraction failed: {}", e))
                        ).await;
                    }
                }
            }
        });
    }
    
    Ok(UploadFileResponse {
        document,
        file_hash,
    })
}

#[tauri::command]
async fn create_document(
    state: State<'_, AppState>,
    dto: CreateDocumentDto,
) -> Result<Document, String> {
    let service = state.document_service.lock().await;
    service
        .create_document(dto)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_user_documents(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<Vec<Document>, String> {
    let uuid = uuid::Uuid::parse_str(&user_id).map_err(|e| e.to_string())?;
    let service = state.document_service.lock().await;
    service
        .get_documents_by_user(uuid)
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenvy::dotenv().ok(); // Load .env file
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize database connection
            let runtime = tokio::runtime::Runtime::new().unwrap();
            let db = runtime.block_on(async {
                db::Database::new().await.expect("Failed to connect to database")
            });
            
            let document_service = Arc::<Mutex<DocumentService>>::new(Mutex::new(
                DocumentService::new(db.pool().clone())
            ));
            
            app.manage(AppState {
                document_service,
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            open_file_dialog,
            upload_file,
            create_document,
            get_user_documents
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
