import { config, DEFAULT_USER_ID } from './config';

export interface SearchResult {
    id: string;
    title: string;
    content?: string;
    fileName?: string;
    fileType?: string;
    score: number;
    highlights?: string[];
}

export interface SearchResponse {
    query: string;
    type: 'full-text' | 'semantic' | 'hybrid';
    results: SearchResult[];
    total: number;
    took_ms?: number;
    note?: string;
}

export class SearchAPI {
    private baseURL: string;

    constructor() {
        this.baseURL = `${config.baseURL}/search`;
    }

    /**
     * Full-text search
     */
    async fullText(query: string, options?: { limit?: number; offset?: number }): Promise<SearchResponse> {
        const params = new URLSearchParams({
            q: query,
            userId: DEFAULT_USER_ID,
            limit: String(options?.limit || 20),
            offset: String(options?.offset || 0),
        });

        const response = await fetch(`${this.baseURL}?${params}`, {
            method: 'GET',
            headers: config.headers,
        });

        if (!response.ok) {
            throw new Error('Search failed');
        }

        return response.json();
    }

    /**
     * Semantic search using vector embeddings
     */
    async semantic(query: string, options?: { limit?: number; offset?: number }): Promise<SearchResponse> {
        const params = new URLSearchParams({
            q: query,
            userId: DEFAULT_USER_ID,
            limit: String(options?.limit || 20),
            offset: String(options?.offset || 0),
        });

        const response = await fetch(`${this.baseURL}/semantic?${params}`, {
            method: 'GET',
            headers: config.headers,
        });

        if (!response.ok) {
            throw new Error('Semantic search failed');
        }

        return response.json();
    }

    /**
     * Hybrid search combining full-text and semantic
     */
    async hybrid(query: string, options?: { limit?: number; offset?: number }): Promise<SearchResponse> {
        const params = new URLSearchParams({
            q: query,
            userId: DEFAULT_USER_ID,
            limit: String(options?.limit || 20),
            offset: String(options?.offset || 0),
        });

        const response = await fetch(`${this.baseURL}/hybrid?${params}`, {
            method: 'GET',
            headers: config.headers,
        });

        if (!response.ok) {
            throw new Error('Hybrid search failed');
        }

        return response.json();
    }

    /**
     * Get search suggestions
     */
    async suggestions(partial: string): Promise<string[]> {
        const params = new URLSearchParams({
            q: partial,
            userId: DEFAULT_USER_ID,
        });

        const response = await fetch(`${this.baseURL}/suggestions?${params}`, {
            method: 'GET',
            headers: config.headers,
        });

        if (!response.ok) {
            throw new Error('Failed to get suggestions');
        }

        const data = await response.json();
        return data.suggestions;
    }
}

// Export singleton instance
export const searchAPI = new SearchAPI();
