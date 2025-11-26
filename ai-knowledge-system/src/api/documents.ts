import { config, DEFAULT_USER_ID } from './config';

export interface Document {
    id: string;
    title: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    content?: string;
    summary?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DocumentListResponse {
    documents: Document[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface UploadResponse {
    message: string;
    document: Document;
}

export class DocumentAPI {
    private baseURL: string;

    constructor() {
        this.baseURL = `${config.baseURL}/documents`;
    }

    /**
     * Upload a new document
     */
    async upload(file: File, metadata?: { title?: string }): Promise<Document> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', DEFAULT_USER_ID);

        if (metadata?.title) {
            formData.append('title', metadata.title);
        }

        const response = await fetch(`${this.baseURL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        const data: UploadResponse = await response.json();
        return data.document;
    }

    /**
     * List documents with pagination
     */
    async list(options?: {
        page?: number;
        limit?: number;
        status?: string;
        fileType?: string;
        search?: string;
    }): Promise<DocumentListResponse> {
        const params = new URLSearchParams({
            userId: DEFAULT_USER_ID,
            page: String(options?.page || 1),
            limit: String(options?.limit || 20),
        });

        if (options?.status) params.append('status', options.status);
        if (options?.fileType) params.append('fileType', options.fileType);
        if (options?.search) params.append('search', options.search);

        const response = await fetch(`${this.baseURL}?${params}`, {
            method: 'GET',
            headers: config.headers,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        return response.json();
    }

    /**
     * Get a single document by ID
     */
    async getById(id: string): Promise<Document> {
        const response = await fetch(
            `${this.baseURL}/${id}?userId=${DEFAULT_USER_ID}`,
            {
                method: 'GET',
                headers: config.headers,
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Document not found');
            }
            throw new Error('Failed to fetch document');
        }

        const data = await response.json();
        return data.document;
    }

    /**
     * Update document metadata
     */
    async update(
        id: string,
        updates: { title?: string; summary?: string }
    ): Promise<Document> {
        const response = await fetch(`${this.baseURL}/${id}`, {
            method: 'PATCH',
            headers: config.headers,
            body: JSON.stringify({
                ...updates,
                userId: DEFAULT_USER_ID,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to update document');
        }

        const data = await response.json();
        return data.document;
    }

    /**
     * Delete a document
     */
    async delete(id: string): Promise<void> {
        const response = await fetch(
            `${this.baseURL}/${id}?userId=${DEFAULT_USER_ID}`,
            {
                method: 'DELETE',
                headers: config.headers,
            }
        );

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }
    }
}

// Export singleton instance
export const documentAPI = new DocumentAPI();
