use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::Read;
use std::path::Path;

/// Calculate SHA-256 hash of a file
pub fn calculate_sha256(path: &Path) -> Result<String, std::io::Error> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0; 8192];

    loop {
        let count = file.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }

    Ok(format!("{:x}", hasher.finalize()))
}

/// Detect MIME type from file content
pub fn detect_mime_type(path: &Path) -> Result<String, std::io::Error> {
    match infer::get_from_path(path)? {
        Some(kind) => Ok(kind.mime_type().to_string()),
        None => {
            // Fallback based on extension
            match path.extension().and_then(|e| e.to_str()) {
                Some("txt") => Ok("text/plain".to_string()),
                Some("md") => Ok("text/markdown".to_string()),
                Some("pdf") => Ok("application/pdf".to_string()),
                Some("docx") => Ok(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        .to_string(),
                ),
                _ => Ok("application/octet-stream".to_string()),
            }
        }
    }
}

/// Get file extension as string
pub fn get_file_extension(path: &Path) -> String {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_uppercase())
        .unwrap_or_else(|| "FILE".to_string())
}
