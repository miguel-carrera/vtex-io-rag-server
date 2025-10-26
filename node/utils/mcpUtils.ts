import type { MCPMethod } from '../types/mcp-protocol'

/**
 * Get valid methods for a given endpoint
 */
export function getValidMethodsForEndpoint(endpoint: string): MCPMethod[] {
  const methodMap: Record<string, MCPMethod[]> = {
    'tools/list': ['tools/list', 'mcp/tools/list'],
    'tools/call': ['tools/call', 'mcp/tools/call'],
    'resources/list': ['resources/list', 'mcp/resources/list'],
    'resources/read': ['resources/read', 'mcp/resources/read'],
    initialize: ['initialize', 'mcp/initialize'],
    handshake: ['handshake', 'mcp/handshake'],
    'notifications/initialized': [
      'notifications/initialized',
      'mcp/notifications/initialized',
    ],
  }

  return methodMap[endpoint] || []
}

/**
 * Sanitize tool names to be valid identifiers
 */
export function sanitizeToolName(name: string): string {
  return name.replace(/[^A-Za-z0-9_:-]/g, '_')
}

/**
 * Build search query for MasterData
 */
export function buildSearchQuery(params: {
  query?: string
  category?: string
  documentTags?: string[]
  author?: string
}): string {
  const conditions: string[] = ['enabled=true']

  if (params.query) {
    // Simple text search in title and content
    const searchTerm = params.query.replace(/"/g, '\\"')
    conditions.push(
      `(title contains "${searchTerm}" OR content contains "${searchTerm}")`
    )
  }

  if (params.category) {
    conditions.push(`category="${params.category}"`)
  }

  if (params.documentTags && params.documentTags.length > 0) {
    const tagConditions = params.documentTags.map(
      (tag) => `documentTags contains "${tag}"`
    )
    conditions.push(`(${tagConditions.join(' OR ')})`)
  }

  if (params.author) {
    conditions.push(`author="${params.author}"`)
  }

  return conditions.join(' AND ')
}

/**
 * Format document for MCP response
 */
export function formatDocumentForMCP(doc: any) {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    category: doc.category,
    documentTags: doc.documentTags || [],
    author: doc.author,
    summary: doc.summary,
  }
}
