// Export all API clients
export { documentAPI } from './documents';
export { searchAPI } from './search';
export { config, DEFAULT_USER_ID } from './config';

// Re-export types
export type { Document, DocumentListResponse, UploadResponse } from './documents';
export type { SearchResult, SearchResponse } from './search';
