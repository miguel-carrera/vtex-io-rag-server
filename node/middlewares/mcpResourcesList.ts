import { json } from 'co-body'

import type {
  MCPRequest,
  MCPResponse,
  MCPResourcesListResponse,
} from '../types/mcp-protocol'
import { MasterDataService } from '../services/masterDataService'
import { logToMasterData } from '../utils/logging'
import { getValidMethodsForEndpoint } from '../utils/mcpUtils'

/**
 * MCP Resources/List endpoint
 * POST /_v/rag_server/v1/mcp/resources/list
 */
export async function mcpResourcesList(
  ctx: Context,
  next: () => Promise<void>
) {
  let requestBody: MCPRequest | null = null

  try {
    const { req } = ctx

    // Prefer request body passed by upstream router to avoid re-reading the stream
    requestBody =
      ((ctx.state as any)?.mcpRequest as MCPRequest | undefined) ||
      ((await json(req)) as MCPRequest)

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

    // Validate method - accept both 'resources/list' and 'mcp/resources/list'
    const validMethods = getValidMethodsForEndpoint('resources/list')

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

    // Initialize MasterData service
    const masterDataService = new MasterDataService(ctx)

    // Get available categories and tags for resource listing
    const [categories, tags] = await Promise.all([
      masterDataService.getCategories(),
      masterDataService.getTags(),
    ])

    // Create resource list
    const resources = [
      {
        uri: 'rag://documents',
        name: 'All Documents',
        description: 'Access to all documents in the knowledge base',
        mimeType: 'application/json',
      },
      {
        uri: 'rag://categories',
        name: 'Document Categories',
        description: 'List of available document categories',
        mimeType: 'application/json',
      },
      {
        uri: 'rag://tags',
        name: 'Document Tags',
        description: 'List of available document tags',
        mimeType: 'application/json',
      },
    ]

    // Add category-specific resources
    categories.forEach((category) => {
      resources.push({
        uri: `rag://documents/category/${encodeURIComponent(category)}`,
        name: `${category} Documents`,
        description: `Documents in the ${category} category`,
        mimeType: 'application/json',
      })
    })

    // Add tag-specific resources
    tags.slice(0, 10).forEach((tag) => {
      // Limit to first 10 tags to avoid too many resources
      resources.push({
        uri: `rag://documents/tag/${encodeURIComponent(tag)}`,
        name: `Documents tagged with ${tag}`,
        description: `Documents tagged with ${tag}`,
        mimeType: 'application/json',
      })
    })

    const response: MCPResourcesListResponse = {
      resources,
    }

    const mcpResponse: MCPResponse = {
      jsonrpc: '2.0',
      id: requestBody.id,
      result: response,
    }

    ctx.status = 200
    ctx.body = mcpResponse

    // Log the request for monitoring
    await logToMasterData(ctx, 'mcpResourcesList', 'middleware', 'info', {
      data: {
        resourcesCount: resources.length,
        categoriesCount: categories.length,
        tagsCount: tags.length,
      },
      message: 'MCP resources list retrieved successfully',
    })

    return next()
  } catch (error) {
    await logToMasterData(ctx, 'mcpResourcesList', 'middleware', 'error', {
      error,
      message: 'Failed to retrieve MCP resources list',
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
