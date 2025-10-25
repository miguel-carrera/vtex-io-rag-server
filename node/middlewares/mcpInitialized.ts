import { json } from 'co-body'

import type { MCPRequest } from '../types/mcp-protocol'
import type { RAGConfig } from '../types/rag-config'
import { logToMasterData } from '../utils/logging'
import { getValidMethodsForEndpoint } from '../utils/mcpUtils'

/**
 * MCP Initialized notification endpoint
 * POST /_v/rag_server/v1/mcp/notifications/initialized
 */
export async function mcpInitialized(ctx: Context, next: () => Promise<void>) {
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
    if (!requestBody || requestBody.jsonrpc !== '2.0') {
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

    // Validate method - accept both 'notifications/initialized' and 'mcp/notifications/initialized'
    const validMethods = getValidMethodsForEndpoint('notifications/initialized')

    if (!validMethods.includes(requestBody.method as any)) {
      ctx.status = 400
      ctx.body = {
        jsonrpc: '2.0',
        id: requestBody?.id || null,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      }
      return
    }

    // For notifications, we don't send a response body
    ctx.status = 200

    // Log the initialization notification for monitoring
    await logToMasterData(ctx, 'mcpInitialized', 'middleware', 'info', {
      data: {
        notification: 'initialized',
        instance: ragConfig.instance,
      },
      message: 'MCP client sent initialized notification',
    })

    return next()
  } catch (error) {
    await logToMasterData(ctx, 'mcpInitialized', 'middleware', 'error', {
      error,
      message: 'Failed to process MCP initialized notification',
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
