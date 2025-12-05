# MCP (Model Context Protocol) Testing Guide

## Overview

This guide covers testing strategies for Model Context Protocol (MCP) implementations in the AI Knowledge Management System. MCP enables AI assistants to interact with external tools and data sources in a standardized way.

## Table of Contents

1. [Understanding MCP](#understanding-mcp)
2. [Testing MCP Servers](#testing-mcp-servers)
3. [Testing MCP Tools](#testing-mcp-tools)
4. [Integration Testing](#integration-testing)
5. [Security Testing](#security-testing)
6. [Best Practices](#best-practices)

---

## Understanding MCP

### What is MCP?

Model Context Protocol (MCP) is a standardized protocol that allows AI assistants to:
- Execute tools and functions
- Access external data sources
- Perform actions on behalf of users
- Maintain context across interactions

### MCP Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  MCP Server │────▶│  Resources  │
│ (AI Agent)  │◀────│   (Tools)   │◀────│  (APIs/DB)  │
└─────────────┘     └─────────────┘     └─────────────┘
        │                   │
        │  JSON-RPC 2.0     │
        │  Protocol         │
        └───────────────────┘
```

---

## Testing MCP Servers

### Unit Testing MCP Tools

```typescript
// __tests__/mcp/tools/searchDocuments.test.ts
import { describe, it, expect, vi } from 'vitest';
import { searchDocumentsTool } from '../tools/searchDocuments';

describe('Search Documents Tool', () => {
  it('should return correct tool definition', () => {
    const definition = searchDocumentsTool.getDefinition();
    
    expect(definition).toEqual({
      name: 'search_documents',
      description: 'Search through stored documents',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          limit: {
            type: 'number',
            description: 'Maximum results to return',
            default: 10,
          },
        },
        required: ['query'],
      },
    });
  });

  it('should execute search with valid query', async () => {
    const mockService = {
      search: vi.fn().mockResolvedValue([
        { id: '1', title: 'Test Doc', score: 0.95 },
      ]),
    };

    const result = await searchDocumentsTool.execute(
      { query: 'test', limit: 5 },
      { searchService: mockService }
    );

    expect(result).toEqual({
      content: [
        { type: 'text', text: expect.stringContaining('Test Doc') },
      ],
      isError: false,
    });
    expect(mockService.search).toHaveBeenCalledWith('test', { limit: 5 });
  });

  it('should handle empty results', async () => {
    const mockService = {
      search: vi.fn().mockResolvedValue([]),
    };

    const result = await searchDocumentsTool.execute(
      { query: 'nonexistent' },
      { searchService: mockService }
    );

    expect(result.content[0].text).toContain('No documents found');
    expect(result.isError).toBe(false);
  });

  it('should handle search errors gracefully', async () => {
    const mockService = {
      search: vi.fn().mockRejectedValue(new Error('Database error')),
    };

    const result = await searchDocumentsTool.execute(
      { query: 'test' },
      { searchService: mockService }
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error');
  });
});
```

### Testing MCP Server Responses

```typescript
// __tests__/mcp/server.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPServer } from '../mcp/server';

describe('MCP Server', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({
      name: 'ai-knowledge-mcp',
      version: '1.0.0',
    });
  });

  afterEach(() => {
    server.close();
  });

  describe('tools/list', () => {
    it('should list all available tools', async () => {
      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      });

      expect(response.result).toHaveProperty('tools');
      expect(Array.isArray(response.result.tools)).toBe(true);
      expect(response.result.tools).toContainEqual(
        expect.objectContaining({
          name: 'search_documents',
          inputSchema: expect.any(Object),
        })
      );
    });
  });

  describe('tools/call', () => {
    it('should execute tool with valid parameters', async () => {
      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'search_documents',
          arguments: { query: 'test' },
        },
      });

      expect(response).toHaveProperty('result');
      expect(response.result).toHaveProperty('content');
      expect(response.error).toBeUndefined();
    });

    it('should return error for unknown tool', async () => {
      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {},
        },
      });

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32601); // Method not found
    });

    it('should validate input schema', async () => {
      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'search_documents',
          arguments: { /* missing required 'query' */ },
        },
      });

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32602); // Invalid params
    });
  });

  describe('resources/list', () => {
    it('should list available resources', async () => {
      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 5,
        method: 'resources/list',
      });

      expect(response.result).toHaveProperty('resources');
    });
  });

  describe('resources/read', () => {
    it('should read resource content', async () => {
      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 6,
        method: 'resources/read',
        params: {
          uri: 'document://123',
        },
      });

      expect(response.result).toHaveProperty('contents');
    });

    it('should handle non-existent resource', async () => {
      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 7,
        method: 'resources/read',
        params: {
          uri: 'document://nonexistent',
        },
      });

      expect(response.error).toBeDefined();
    });
  });
});
```

---

## Testing MCP Tools

### Tool Input Validation Tests

```typescript
// __tests__/mcp/tools/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateToolInput } from '../mcp/validation';

describe('Tool Input Validation', () => {
  const schema = {
    type: 'object',
    properties: {
      query: { type: 'string', minLength: 1, maxLength: 500 },
      limit: { type: 'number', minimum: 1, maximum: 100 },
      filters: {
        type: 'object',
        properties: {
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    required: ['query'],
  };

  it('should accept valid input', () => {
    const result = validateToolInput(schema, {
      query: 'test query',
      limit: 10,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should reject missing required fields', () => {
    const result = validateToolInput(schema, {
      limit: 10,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        path: 'query',
        message: expect.stringContaining('required'),
      })
    );
  });

  it('should reject invalid types', () => {
    const result = validateToolInput(schema, {
      query: 'test',
      limit: 'not a number',
    });

    expect(result.valid).toBe(false);
  });

  it('should enforce string length limits', () => {
    const result = validateToolInput(schema, {
      query: 'a'.repeat(501),
    });

    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe('query');
  });

  it('should enforce number range limits', () => {
    const result = validateToolInput(schema, {
      query: 'test',
      limit: 101,
    });

    expect(result.valid).toBe(false);
  });
});
```

### Tool Output Formatting Tests

```typescript
// __tests__/mcp/tools/output.test.ts
import { describe, it, expect } from 'vitest';
import { formatToolOutput, ContentType } from '../mcp/output';

describe('Tool Output Formatting', () => {
  it('should format text output', () => {
    const output = formatToolOutput({
      type: ContentType.TEXT,
      data: 'Search results: 5 documents found',
    });

    expect(output).toEqual({
      content: [
        { type: 'text', text: 'Search results: 5 documents found' },
      ],
      isError: false,
    });
  });

  it('should format JSON output', () => {
    const data = { results: [{ id: '1', title: 'Test' }] };
    const output = formatToolOutput({
      type: ContentType.JSON,
      data,
    });

    expect(output.content[0]).toHaveProperty('type', 'text');
    expect(JSON.parse(output.content[0].text)).toEqual(data);
  });

  it('should format error output', () => {
    const output = formatToolOutput({
      type: ContentType.ERROR,
      data: 'Something went wrong',
    });

    expect(output.isError).toBe(true);
    expect(output.content[0].text).toContain('Something went wrong');
  });

  it('should format image output', () => {
    const output = formatToolOutput({
      type: ContentType.IMAGE,
      data: 'base64encodeddata',
      mimeType: 'image/png',
    });

    expect(output.content[0]).toHaveProperty('type', 'image');
    expect(output.content[0]).toHaveProperty('data', 'base64encodeddata');
    expect(output.content[0]).toHaveProperty('mimeType', 'image/png');
  });
});
```

---

## Integration Testing

### End-to-End MCP Flow

```typescript
// __tests__/mcp/e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMCPClient } from '@modelcontextprotocol/sdk/client';
import { spawn } from 'child_process';

describe('MCP E2E Tests', () => {
  let mcpProcess: any;
  let client: any;

  beforeAll(async () => {
    // Start MCP server
    mcpProcess = spawn('npx', ['ts-node', 'src/mcp/server.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create client
    client = createMCPClient({
      transport: {
        send: async (message) => {
          mcpProcess.stdin.write(JSON.stringify(message) + '\n');
        },
        onMessage: (callback) => {
          mcpProcess.stdout.on('data', (data) => {
            callback(JSON.parse(data.toString()));
          });
        },
      },
    });

    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
    mcpProcess.kill();
  });

  it('should complete full search workflow', async () => {
    // List tools
    const tools = await client.listTools();
    expect(tools).toContainEqual(
      expect.objectContaining({ name: 'search_documents' })
    );

    // Execute search
    const result = await client.callTool('search_documents', {
      query: 'test document',
      limit: 5,
    });

    expect(result.isError).toBe(false);
    expect(result.content).toBeDefined();
  });

  it('should complete full document upload workflow', async () => {
    const result = await client.callTool('upload_document', {
      title: 'Test Document',
      content: 'This is test content',
      tags: ['test', 'sample'],
    });

    expect(result.isError).toBe(false);
    expect(result.content[0].text).toContain('uploaded');
  });
});
```

---

## Security Testing

### Input Sanitization

```typescript
// __tests__/mcp/security/sanitization.test.ts
describe('MCP Security - Input Sanitization', () => {
  it('should sanitize XSS attempts', async () => {
    const result = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_documents',
        arguments: {
          query: '<script>alert("xss")</script>',
        },
      },
    });

    // Should not throw, should sanitize
    expect(result.error).toBeUndefined();
    // Result should not contain raw script tags
    expect(result.result.content[0].text).not.toContain('<script>');
  });

  it('should prevent SQL injection', async () => {
    const result = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_documents',
        arguments: {
          query: "'; DROP TABLE documents; --",
        },
      },
    });

    // Should handle safely
    expect(result.error).toBeUndefined();
  });

  it('should limit input size', async () => {
    const result = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'search_documents',
        arguments: {
          query: 'a'.repeat(100000), // Very long input
        },
      },
    });

    expect(result.error).toBeDefined();
    expect(result.error.code).toBe(-32602);
  });
});
```

### Authentication & Authorization

```typescript
// __tests__/mcp/security/auth.test.ts
describe('MCP Security - Auth', () => {
  it('should require authentication for protected tools', async () => {
    const result = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'delete_document',
        arguments: { documentId: '123' },
      },
      // No auth token
    });

    expect(result.error).toBeDefined();
    expect(result.error.code).toBe(-32000); // Unauthorized
  });

  it('should validate user permissions', async () => {
    const result = await server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'delete_document',
        arguments: { documentId: '123' },
      },
      context: {
        userId: 'user-456',
        role: 'viewer', // Not enough permissions
      },
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('permission');
  });
});
```

---

## Best Practices

### 1. Mock External Dependencies

```typescript
// Always mock external services in unit tests
vi.mock('../services/SearchService', () => ({
  SearchService: {
    search: vi.fn(),
    getSuggestions: vi.fn(),
  },
}));
```

### 2. Test Error Scenarios

```typescript
// Test all error paths
const errorScenarios = [
  { input: null, expectedError: 'INVALID_INPUT' },
  { input: {}, expectedError: 'MISSING_QUERY' },
  { input: { query: '' }, expectedError: 'EMPTY_QUERY' },
];

errorScenarios.forEach(({ input, expectedError }) => {
  it(`should handle ${expectedError}`, async () => {
    const result = await tool.execute(input);
    expect(result.error?.code).toBe(expectedError);
  });
});
```

### 3. Use Snapshot Testing for Outputs

```typescript
it('should produce consistent output format', async () => {
  const result = await tool.execute({ query: 'test' });
  expect(result).toMatchSnapshot();
});
```

### 4. Test Timeouts

```typescript
it('should timeout long-running operations', async () => {
  const slowService = {
    search: vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 10000))
    ),
  };

  await expect(
    tool.execute({ query: 'test' }, { searchService: slowService, timeout: 1000 })
  ).rejects.toThrow('Operation timed out');
});
```

### 5. Performance Testing

```typescript
it('should handle concurrent requests', async () => {
  const requests = Array(100).fill(null).map((_, i) => 
    server.handleRequest({
      jsonrpc: '2.0',
      id: i,
      method: 'tools/call',
      params: { name: 'search_documents', arguments: { query: 'test' } },
    })
  );

  const results = await Promise.all(requests);
  expect(results.every(r => !r.error)).toBe(true);
});
```

---

## Resources

### Official Documentation
- [MCP Specification](https://modelcontextprotocol.io/specification) - Official protocol specification (accessed December 2025)
- [MCP SDK Documentation](https://modelcontextprotocol.io/sdk) - Official SDK for TypeScript/JavaScript
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification) - JSON-RPC 2.0 protocol (stable specification)

### Alternative Resources
If the above resources become unavailable:
- MCP protocol details are often documented in AI assistant documentation
- JSON-RPC 2.0 is a stable specification with many alternative reference implementations
- Search for "Model Context Protocol" in the GitHub repository for @modelcontextprotocol

---

*Last Updated: December 2025*
