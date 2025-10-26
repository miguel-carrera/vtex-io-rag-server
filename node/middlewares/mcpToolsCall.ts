import { json } from 'co-body'

import type {
  MCPRequest,
  MCPResponse,
  MCPToolsCallRequest,
  MCPToolsCallResponse,
} from '../types/mcp-protocol'
import { MasterDataService } from '../services/masterDataService'
import { logToMasterData } from '../utils/logging'
import { getValidMethodsForEndpoint } from '../utils/mcpUtils'
import { mapHttpErrorToMCP } from '../utils/errorMapper'

/**
 * MCP Tools/Call endpoint
 * POST /_v/rag_server/v1/mcp/tools/call
 */
export async function mcpToolsCall(ctx: Context, next: () => Promise<void>) {
  let requestBody: MCPRequest | null = null

  try {
    const { req } = ctx

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

    // Validate method - accept both 'tools/call' and 'mcp/tools/call'
    const validMethods = getValidMethodsForEndpoint('tools/call')

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

    // Extract tool call parameters
    const params = requestBody.params as MCPToolsCallRequest
    if (!params || !params.name || !params.arguments) {
      ctx.status = 400
      ctx.body = {
        jsonrpc: '2.0',
        id: requestBody.id,
        error: {
          code: -32602,
          message: 'Invalid params: name and arguments are required',
        },
      }
      return
    }

    // Initialize MasterData service
    const masterDataService = new MasterDataService(ctx)

    let response: MCPToolsCallResponse

    // Handle different tool calls
    switch (params.name) {
      case 'search_documents': {
        const { query, category, documentTags, author, limit } =
          params.arguments

        // Validate limit
        const searchLimit = Math.min(limit || 20, 100)

        // Search documents
        const searchResult = await masterDataService.searchDocuments({
          query,
          category,
          documentTags,
          author,
          limit: searchLimit,
        })

        // Format results
        const formattedResults = searchResult.documents.map((doc) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          documentTags: doc.documentTags,
          author: doc.author,
          summary: doc.summary,
        }))

        response = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  results: formattedResults,
                  total: searchResult.total,
                  hasMore: searchResult.hasMore,
                  query: {
                    query,
                    category,
                    documentTags,
                    author,
                    limit: searchLimit,
                  },
                },
                null,
                2
              ),
            },
          ],
        }
        break
      }

      default:
        ctx.status = 400
        ctx.body = {
          jsonrpc: '2.0',
          id: requestBody.id,
          error: {
            code: -32601,
            message: `Unknown tool: ${params.name}`,
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
    await logToMasterData(ctx, 'mcpToolsCall', 'middleware', 'info', {
      data: {
        toolName: params.name,
        arguments: params.arguments,
        resultCount:
          params.name === 'search_documents'
            ? response.content[0]?.text
              ? JSON.parse(response.content[0].text).results?.length
              : 0
            : 0,
      },
      message: 'MCP tool call executed successfully',
    })

    return next()
  } catch (error) {
    await logToMasterData(ctx, 'mcpToolsCall', 'middleware', 'error', {
      error,
      message: 'Failed to execute MCP tool call',
    })

    const mcpError = mapHttpErrorToMCP(error)
    const httpStatusCode = mcpError.data?.httpStatusCode || 500

    ctx.status = httpStatusCode
    ctx.body = {
      jsonrpc: '2.0',
      id: requestBody?.id || null,
      error: {
        code: mcpError.code,
        message: mcpError.message,
        data: mcpError.data,
      },
    }
  }
}
