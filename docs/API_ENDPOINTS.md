# RAG MCP Server API Endpoints

This document describes the MCP (Model Context Protocol) endpoints available in the VTEX IO RAG Server.

## Base URL

All endpoints are prefixed with: `/_v/rag_server/v1/mcp/`

## Protocol

The service implements JSON-RPC 2.0 protocol for all MCP communications.

## Endpoints

### 1. Handshake

**Endpoint**: `POST /_v/rag_server/v1/mcp/handshake`

Establishes initial connection and checks compatibility.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "handshake",
  "params": {
    "version": "1.0.0",
    "capabilities": ["tools", "resources"]
  }
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "version": "1.0.0",
    "capabilities": ["resources", "tools", "logging"],
    "compatible": true,
    "serverInfo": {
      "name": "VTEX IO RAG Server",
      "version": "1.0.0",
      "description": "Model Context Protocol server for document search and retrieval"
    }
  }
}
```

### 2. Initialize

**Endpoint**: `POST /_v/rag_server/v1/mcp/initialize`

Initializes the MCP connection.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "resources": {}
    },
    "clientInfo": {
      "name": "My AI Agent",
      "version": "1.0.0"
    }
  }
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "resources": {}
    },
    "serverInfo": {
      "name": "VTEX IO RAG Server",
      "version": "1.0.0"
    }
  }
}
```

### 3. Tools List

**Endpoint**: `POST /_v/rag_server/v1/mcp/tools/list`

Returns available tools for document search.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/list"
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "tools": [
      {
        "name": "search_documents",
        "description": "Search for documents in the knowledge base using text matching",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Search query to match against document title and content"
            },
            "category": {
              "type": "string",
              "description": "Filter documents by category (e.g., Product, Business, Technical, FAQ)"
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Filter documents by tags"
            },
            "author": {
              "type": "string",
              "description": "Filter documents by author"
            },
            "limit": {
              "type": "number",
              "description": "Maximum number of results to return (default: 20, max: 100)",
              "minimum": 1,
              "maximum": 100,
              "default": 20
            }
          },
          "required": []
        }
      }
    ]
  }
}
```

### 4. Tools Call

**Endpoint**: `POST /_v/rag_server/v1/mcp/tools/call`

Executes a tool (currently only `search_documents`).

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "search_documents",
    "arguments": {
      "query": "product pricing",
      "category": "Business",
      "tags": ["pricing", "strategy"],
      "limit": 10
    }
  }
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"results\": [\n    {\n      \"id\": \"doc123\",\n      \"title\": \"Product Pricing Strategy\",\n      \"content\": \"Our pricing strategy is based on...\",\n      \"category\": \"Business\",\n      \"tags\": [\"pricing\", \"strategy\"],\n      \"author\": \"Business Team\",\n      \"createdDate\": \"2024-01-15T10:00:00Z\",\n      \"updatedDate\": \"2024-01-20T14:30:00Z\",\n      \"summary\": \"Comprehensive pricing strategy guide\"\n    }\n  ],\n  \"total\": 1,\n  \"hasMore\": false,\n  \"query\": {\n    \"query\": \"product pricing\",\n    \"category\": \"Business\",\n    \"tags\": [\"pricing\", \"strategy\"],\n    \"limit\": 10\n  }\n}"
      }
    ]
  }
}
```

### 5. Resources List

**Endpoint**: `POST /_v/rag_server/v1/mcp/resources/list`

Returns available resources for document access.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "resources/list"
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "resources": [
      {
        "uri": "rag://documents",
        "name": "All Documents",
        "description": "Access to all documents in the knowledge base",
        "mimeType": "application/json"
      },
      {
        "uri": "rag://categories",
        "name": "Document Categories",
        "description": "List of available document categories",
        "mimeType": "application/json"
      },
      {
        "uri": "rag://tags",
        "name": "Document Tags",
        "description": "List of available document tags",
        "mimeType": "application/json"
      },
      {
        "uri": "rag://documents/category/Product",
        "name": "Product Documents",
        "description": "Documents in the Product category",
        "mimeType": "application/json"
      },
      {
        "uri": "rag://documents/tag/pricing",
        "name": "Documents tagged with pricing",
        "description": "Documents tagged with pricing",
        "mimeType": "application/json"
      }
    ]
  }
}
```

### 6. Resources Read

**Endpoint**: `POST /_v/rag_server/v1/mcp/resources/read`

Reads a specific resource.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "resources/read",
  "params": {
    "uri": "rag://documents/category/Product"
  }
}
```

**Response**:

```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "contents": [
      {
        "uri": "rag://documents/category/Product",
        "mimeType": "application/json",
        "text": "{\n  \"category\": \"Product\",\n  \"documents\": [\n    {\n      \"id\": \"doc123\",\n      \"title\": \"Product Catalog Guide\",\n      \"content\": \"This guide covers our product catalog...\",\n      \"category\": \"Product\",\n      \"tags\": [\"catalog\", \"products\"],\n      \"author\": \"Product Team\",\n      \"createdDate\": \"2024-01-10T09:00:00Z\",\n      \"updatedDate\": \"2024-01-15T16:45:00Z\",\n      \"summary\": \"Complete product catalog documentation\"\n    }\n  ],\n  \"total\": 1,\n  \"hasMore\": false\n}"
      }
    ]
  }
}
```

### 7. Notifications Initialized

**Endpoint**: `POST /_v/rag_server/v1/mcp/notifications/initialized`

Notification that the client has been initialized.

**Request**:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

**Response**: No response body (notification only)

**Note**: This is a notification method, so it doesn't require an `id` field and doesn't return a response body. The server logs the notification for monitoring purposes.

### 8. Generic MCP Router

**Endpoint**: `POST /_v/rag_server/v1/mcp/:instance`

Generic router that handles all MCP methods in a single endpoint.

**Request**: Any of the above MCP requests

**Response**: Corresponding response based on the method

## Error Responses

All endpoints return standard JSON-RPC 2.0 error responses:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": {
      "httpStatusCode": 400
    }
  }
}
```

### Error Codes

- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32000`: Server error (Forbidden)
- `-32001`: Server error (Unauthorized)
- `-32002`: Server error (Too many requests)

## Resource URI Patterns

### Document Resources

- `rag://documents` - All documents
- `rag://documents/category/{category}` - Documents by category
- `rag://documents/tag/{tag}` - Documents by tag

### Metadata Resources

- `rag://categories` - Available categories
- `rag://tags` - Available tags

## Search Parameters

### search_documents Tool Arguments

- `query` (string, optional): Text to search in title and content
- `category` (string, optional): Filter by document category
- `tags` (array, optional): Filter by document tags
- `author` (string, optional): Filter by document author
- `limit` (number, optional): Maximum results (1-100, default: 20)

## Examples

### Complete MCP Workflow

1. **Handshake**:

```bash
curl -X POST "https://{{account}}.myvtex.com/_v/rag_server/v1/mcp/handshake" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"handshake","params":{"version":"1.0.0"}}'
```

2. **Initialize**:

```bash
curl -X POST "https://{{account}}.myvtex.com/_v/rag_server/v1/mcp/initialize" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"Test Client","version":"1.0.0"}}}'
```

3. **Search Documents**:

```bash
curl -X POST "https://{{account}}.myvtex.com/_v/rag_server/v1/mcp/tools/call" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_documents","arguments":{"query":"API","limit":5}}}'
```

4. **Get Categories**:

```bash
curl -X POST "https://{{account}}.myvtex.com/_v/rag_server/v1/mcp/resources/read" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"resources/read","params":{"uri":"rag://categories"}}'
```

## Rate Limiting

The service implements basic rate limiting and caching:

- **Cache TTL**: 5 minutes for search results
- **Max Results**: 100 documents per request
- **Timeout**: 50 seconds per request

## Authentication

Currently, the service allows all requests. In production, implement proper authentication based on:

- VTEX credentials
- API keys
- IP whitelisting
- Other security mechanisms
