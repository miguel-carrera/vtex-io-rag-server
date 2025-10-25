import { json } from 'co-body'

import type { MCPRequest, MCPResponse, MCPToolsListResponse, MCPTool } from '../types/mcp-protocol'
import type { RAGConfig } from '../types/rag-config'
import { logToMasterData } from '../utils/logging'
import { getValidMethodsForEndpoint } from '../utils/mcpUtils'

/**
 * MCP Tools/List endpoint
 * POST /_v/rag_server/v1/mcp/tools/list
 */
export async function mcpToolsList(ctx: Context, next: () => Promise<void>) {
  let requestBody: MCPRequest | null = null

  try {
    const { req } = ctx

    requestBody =
      ((ctx.state as any)?.mcpRequest as MCPRequest | undefined) ||
      ((await json(req)) as MCPRequest)

    // Check RAG configuration
    const ragConfig: RAGConfig | undefined = (ctx.state as any)?.body?.ragConfig
    if (!ragConfig || !ragConfig.enabled) {
      ctx.status = 403
      ctx.body = {
        jsonrpc: '2.0',
        id: requestBody?.id || null,
        error: {
          code: -32000,
          message: ragConfig
            ? 'RAG server is disabled for this instance'
            : 'RAG server not found',
        },
      }
      return
    }

    // Validate JSON-RPC request
    if (
      !requestBody ||
      requestBody.jsonrpc !== '2.0' ||
      requestBody.id === undefined ||
      requestBody.id === null
    ) {
      ctx.status = 400
      ctx.body = {
        jsonrpc: '2.0',
        id: requestBody?.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request',
        },
      }
      return
    }

    // Validate method - accept both 'tools/list' and 'mcp/tools/list'
    const validMethods = getValidMethodsForEndpoint('tools/list')

    if (!validMethods.includes(requestBody.method as any)) {
      ctx.status = 400
      ctx.body = {
        jsonrpc: '2.0',
        id: requestBody.id,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      }
      return
    }

    // Use the already loaded RAG configuration

    // Create MCP tools array
    const tools: MCPTool[] = []

    // Add document search tool with configuration-aware schema
    const searchSettings = ragConfig?.searchSettings
    const defaultLimit = searchSettings?.defaultLimit || 20
    const maxLimit = searchSettings?.maxLimit || 100

    const searchToolProperties: Record<string, any> = {}

    // Add query property if text search is enabled
    if (searchSettings?.enableTextSearch !== false) {
      searchToolProperties.query = {
        type: 'string',
        description: 'Search query to match against document title and content',
      }
    }

    // Add category property if category filtering is enabled
    if (searchSettings?.enableCategoryFilter !== false) {
      searchToolProperties.category = {
        type: 'string',
        description: 'Filter documents by category (e.g., Product, Business, Technical, FAQ)',
      }
    }

    // Add tags property if tag filtering is enabled
    if (searchSettings?.enableTagFilter !== false) {
      searchToolProperties.tags = {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Filter documents by tags',
      }
    }

    // Add author property if author filtering is enabled
    if (searchSettings?.enableAuthorFilter !== false) {
      searchToolProperties.author = {
        type: 'string',
        description: 'Filter documents by author',
      }
    }

    // Always add limit property
    searchToolProperties.limit = {
      type: 'number',
      description: `Maximum number of results to return (default: ${defaultLimit}, max: ${maxLimit})`,
      minimum: 1,
      maximum: maxLimit,
      default: defaultLimit,
    }

    const searchTool: MCPTool = {
      name: 'search_documents',
      description: 'Search for documents in the knowledge base using text matching',
      inputSchema: {
        type: 'object',
        properties: searchToolProperties,
        required: [],
      },
    }

    tools.push(searchTool)

    const response: MCPToolsListResponse = {
      tools,
    }

    const mcpResponse: MCPResponse = {
      jsonrpc: '2.0',
      id: requestBody.id,
      result: response,
    }

    ctx.status = 200
    ctx.body = mcpResponse

    // Log the request for monitoring
    await logToMasterData(ctx, 'mcpToolsList', 'middleware', 'info', {
      data: {
        toolsCount: tools.length,
        tools: tools.map(t => t.name),
      },
      message: 'MCP tools list retrieved successfully',
    })

    return next()
  } catch (error) {
    await logToMasterData(ctx, 'mcpToolsList', 'middleware', 'error', {
      error,
      message: 'Failed to retrieve MCP tools list',
    })

    ctx.status = 500
    ctx.body = {
      jsonrpc: '2.0',
      id: requestBody?.id || null,
      error: {
        code: -32603,
        message: 'Internal error',
      },
    }
  }
}
