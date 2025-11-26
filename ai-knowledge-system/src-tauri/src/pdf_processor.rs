use lopdf::Document;
use std::path::Path;

/// Extract text content from a PDF file
pub fn extract_text_from_pdf(path: &Path) -> Result<String, String> {
    let doc = Document::load(path).map_err(|e| format!("Failed to load PDF: {}", e))?;

    let mut text = String::new();
    let pages = doc.get_pages();

    for (page_num, _) in pages.iter() {
        if let Ok(page_text) = doc.extract_text(&[*page_num]) {
            text.push_str(&page_text);
            text.push('\n');
        }
    }

    Ok(text)
}

/// Generate a preview from text (first N characters)
pub fn generate_preview(text: &str, max_chars: usize) -> String {
    let trimmed = text.trim();
    if trimmed.len() <= max_chars {
        trimmed.to_string()
    } else {
        let preview = &trimmed[..max_chars];
        // Try to break at word boundary
        if let Some(last_space) = preview.rfind(' ') {
            format!("{}...", &preview[..last_space])
        } else {
            format!("{}...", preview)
        }
    }
}

/// Generate a basic summary from text (first paragraph or N chars)
pub fn generate_basic_summary(text: &str, max_chars: usize) -> String {
    let trimmed = text.trim();

    // Try to get first paragraph
    if let Some(first_para_end) = trimmed.find("\n\n") {
        let first_para = &trimmed[..first_para_end];
        if first_para.len() <= max_chars {
            return first_para.to_string();
        }
    }

    // Fall back to character limit
    generate_preview(trimmed, max_chars)
}
