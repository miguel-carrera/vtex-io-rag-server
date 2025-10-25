# VTEX IO RAG Server

A VTEX IO service that provides document search and retrieval capabilities through the Model Context Protocol (MCP). This service enables AI agents to search and access product/business documentation stored in MasterData v2.

## Overview

The RAG (Retrieval-Augmented Generation) server implements the MCP protocol to expose document search tools and resources to AI agents. Documents are stored in MasterData v2 and can be searched using text matching on titles, content, categories, tags, and authors.

## Architecture

### Storage Layer

- **MasterData v2**: Documents are stored in the `vtex_rag_documents` data entity
- **Schema**: Each document has title, content, category, tags, author, and metadata
- **Indexing**: Full-text search capabilities on title, content, and tags
- **Configuration**: Instance-specific settings stored in `vtex_rag_configs` data entity

### MCP Layer

- **JSON-RPC 2.0**: Standard MCP protocol implementation
- **Tools**: `search_documents` tool for AI agents to search documents
- **Resources**: Direct access to documents, categories, and tags
- **Router**: Single endpoint that handles all MCP method routing

### Search Capabilities

- **Text Matching**: Simple contains/match queries on title and content
- **Filtering**: By category, tags, author
- **Pagination**: Configurable result limits and pagination

## Features

### MCP Tools

- **search_documents**: Search for documents with various filters
  - Query text matching
  - Category filtering
  - Tag filtering
  - Author filtering
  - Result limiting

### MCP Resources

- **rag://documents**: All documents
- **rag://documents/category/{category}**: Documents by category
- **rag://documents/tag/{tag}**: Documents by tag
- **rag://categories**: Available categories
- **rag://tags**: Available tags

### Document Schema

```json
{
  "title": "string (max 200 chars)",
  "content": "string (max 50000 chars)",
  "category": "string (max 100 chars)",
  "tags": ["string array (max 20 items)"],
  "author": "string (max 100 chars)",
  "enabled": "boolean",
  "summary": "string (max 500 chars)"
}
```

### RAG Configuration Schema

```json
{
  "instance": "string (VTEX instance identifier)",
  "enabled": "boolean",
  "description": "string (max 500 chars)",
  "searchSettings": {
    "defaultLimit": "number (1-100, default: 20)",
    "maxLimit": "number (1-100, default: 100)",
    "enableTextSearch": "boolean (default: true)",
    "enableCategoryFilter": "boolean (default: true)",
    "enableTagFilter": "boolean (default: true)",
    "enableAuthorFilter": "boolean (default: true)"
  },
  "allowedCategories": ["string array (empty = all allowed)"],
  "allowedTags": ["string array (empty = all allowed)"]
}
```

## Usage

### For AI Agents

1. **Initialize MCP Connection**:

   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "initialize",
     "params": {
       "protocolVersion": "2024-11-05",
       "capabilities": {},
       "clientInfo": {
         "name": "My AI Agent",
         "version": "1.0.0"
       }
     }
   }
   ```

2. **List Available Tools**:

   ```json
   {
     "jsonrpc": "2.0",
     "id": 2,
     "method": "tools/list"
   }
   ```

3. **Search Documents**:

   ```json
   {
     "jsonrpc": "2.0",
     "id": 3,
     "method": "tools/call",
     "params": {
       "name": "search_documents",
       "arguments": {
         "query": "product pricing",
         "category": "Business",
         "limit": 10
       }
     }
   }
   ```

4. **Access Resources**:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 4,
     "method": "resources/read",
     "params": {
       "uri": "rag://documents/category/Product"
     }
   }
   ```

### For Developers

#### Adding Documents

Documents are managed directly in MasterData v2 through the VTEX admin interface or API:

```bash
# Example: Add a document via MasterData API
curl -X POST \
  "https://{{account}}.vtexcommercestable.com.br/api/dataentities/vtex_rag_documents/documents" \
  -H "Content-Type: application/json" \
  -H "X-VTEX-API-AppKey: {{appKey}}" \
  -H "X-VTEX-API-AppToken: {{appToken}}" \
  -d '{
    "title": "Product Pricing Guide",
    "content": "This document explains our pricing strategy...",
    "category": "Business",
    "tags": ["pricing", "products", "strategy"],
    "author": "Business Team",
    "enabled": true,
    "summary": "Comprehensive guide to product pricing"
  }'
```

#### Configuring RAG Settings

Configure instance-specific settings via MasterData v2:

```bash
# Example: Configure RAG settings for an instance
curl -X POST \
  "https://{{account}}.vtexcommercestable.com.br/api/dataentities/vtex_rag_configs/documents" \
  -H "Content-Type: application/json" \
  -H "X-VTEX-API-AppKey: {{appKey}}" \
  -H "X-VTEX-API-AppToken: {{appToken}}" \
  -d '{
    "instance": "myinstance",
    "enabled": true,
    "description": "Production RAG configuration",
    "searchSettings": {
      "defaultLimit": 10,
      "maxLimit": 50,
      "enableTextSearch": true,
      "enableCategoryFilter": true,
      "enableTagFilter": true,
      "enableAuthorFilter": false
    },
    "allowedCategories": ["Product", "Business"],
    "allowedTags": ["pricing", "strategy"]
  }'
```

#### Service Endpoints

- `POST /_v/rag_server/v1/mcp/tools/list` - List available tools
- `POST /_v/rag_server/v1/mcp/tools/call` - Execute tools
- `POST /_v/rag_server/v1/mcp/resources/list` - List available resources
- `POST /_v/rag_server/v1/mcp/resources/read` - Read specific resources
- `POST /_v/rag_server/v1/mcp/:instance` - Generic MCP router

## Configuration

### MasterData Schemas

The service uses two data entities:

**vtex_rag_documents**:

- **Schema**: `documents`
- **Security**: Read-only access (`allowGetAll: true`)
- **Indexing**: Immediate indexing on key fields

**vtex_rag_configs**:

- **Schema**: `configs`
- **Security**: Read-only access (`allowGetAll: true`)
- **Indexing**: Immediate indexing on instance and enabled fields

### Service Settings

Configure logging and other settings through the VTEX IO app settings:

- **Logging Type**: Test/Development or Production
- **Log Levels**: Error, Warning, Info, Debug

## Development

### Local Development

1. Install dependencies: `npm install`
2. Link the app: `vtex link`
3. Test endpoints using the MCP protocol

### Testing

Use the MCP protocol to test the service:

1. Send handshake request
2. Initialize the connection
3. List tools and resources
4. Execute search operations

### Monitoring

All operations are logged to MasterData for monitoring and debugging:

- Request/response logging
- Error tracking
- Performance metrics

## Examples

### Search for Product Documentation

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_documents",
    "arguments": {
      "query": "API integration",
      "category": "Technical",
      "tags": ["api", "integration"],
      "limit": 5
    }
  }
}
```

### Get All Categories

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "rag://categories"
  }
}
```

### Access Documents by Tag

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "rag://documents/tag/pricing"
  }
}
```

## Support

For issues and questions:

1. Check the logs in MasterData (`vtex_rag_logs`)
2. Review the MCP protocol responses for error details
3. Verify document schema and indexing
4. Test with simple queries first

## Version History

- **v1.0.0**: Initial implementation with basic document search
- Basic text matching
- MCP protocol support
- MasterData v2 integration
- Caching layer
