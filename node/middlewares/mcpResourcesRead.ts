import { json } from 'co-body'

import type {
  MCPRequest,
  MCPResponse,
  MCPResourcesReadRequest,
  MCPResourcesReadResponse,
} from '../types/mcp-protocol'
import { MasterDataService } from '../services/masterDataService'
import { logToMasterData } from '../utils/logging'
import { getValidMethodsForEndpoint } from '../utils/mcpUtils'

/**
 * MCP Resources/Read endpoint
 * POST /_v/rag_server/v1/mcp/resources/read
 */
export async function mcpResourcesRead(
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

    // Validate method - accept both 'resources/read' and 'mcp/resources/read'
    const validMethods = getValidMethodsForEndpoint('resources/read')

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

    // Extract resource read parameters
    const params = requestBody.params as MCPResourcesReadRequest
    if (!params || !params.uri) {
      ctx.status = 400
      ctx.body = {
        jsonrpc: '2.0',
        id: requestBody.id,
        error: {
          code: -32602,
          message: 'Invalid params: uri is required',
        },
      }
      return
    }

    // Initialize MasterData service
    const masterDataService = new MasterDataService(ctx)

    let response: MCPResourcesReadResponse

    // Parse URI and handle different resource types
    const uri = params.uri
    const uriParts = uri.split('/')

    if (uri.startsWith('rag://documents/')) {
      if (uriParts.length === 3 && uriParts[2] === 'category') {
        // rag://documents/category/{category}
        const category = decodeURIComponent(uriParts[3])
        const searchResult = await masterDataService.searchDocuments({
          category,
          limit: 50,
        })

        response = {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  category,
                  documents: searchResult.documents,
                  total: searchResult.total,
                  hasMore: searchResult.hasMore,
                },
                null,
                2
              ),
            },
          ],
        }
      } else if (uriParts.length === 3 && uriParts[2] === 'tag') {
        // rag://documents/tag/{tag}
        const tag = decodeURIComponent(uriParts[3])
        const searchResult = await masterDataService.searchDocuments({
          documentTags: [tag],
          limit: 50,
        })

        response = {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  tag,
                  documents: searchResult.documents,
                  total: searchResult.total,
                  hasMore: searchResult.hasMore,
                },
                null,
                2
              ),
            },
          ],
        }
      } else if (uriParts.length === 2) {
        // rag://documents
        const searchResult = await masterDataService.listDocuments(1, 50)

        response = {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  documents: searchResult.documents,
                  total: searchResult.total,
                  hasMore: searchResult.hasMore,
                },
                null,
                2
              ),
            },
          ],
        }
      } else {
        ctx.status = 404
        ctx.body = {
          jsonrpc: '2.0',
          id: requestBody.id,
          error: {
            code: -32601,
            message: 'Resource not found',
          },
        }
        return
      }
    } else if (uri === 'rag://categories') {
      const categories = await masterDataService.getCategories()

      response = {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                categories,
                total: categories.length,
              },
              null,
              2
            ),
          },
        ],
      }
    } else if (uri === 'rag://tags') {
      const tags = await masterDataService.getTags()

      response = {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                tags,
                total: tags.length,
              },
              null,
              2
            ),
          },
        ],
      }
    } else {
      ctx.status = 404
      ctx.body = {
        jsonrpc: '2.0',
        id: requestBody.id,
        error: {
          code: -32601,
          message: 'Resource not found',
        },
      }
      return
    }

    const mcpResponse: MCPResponse = {
      jsonrpc: '2.0',
      id: requestBody.id,
      result: response,
    }

    ctx.status = 200
    ctx.body = mcpResponse

    // Log the request for monitoring
    await logToMasterData(ctx, 'mcpResourcesRead', 'middleware', 'info', {
      data: {
        uri,
        contentLength: response.contents[0]?.text?.length || 0,
      },
      message: 'MCP resource read successfully',
    })

    return next()
  } catch (error) {
    await logToMasterData(ctx, 'mcpResourcesRead', 'middleware', 'error', {
      error,
      message: 'Failed to read MCP resource',
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
