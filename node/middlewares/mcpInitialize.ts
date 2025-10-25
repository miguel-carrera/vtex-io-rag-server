import { json } from 'co-body'

import type { MCPRequest, MCPResponse, MCPInitializeResponse } from '../types/mcp-protocol'
import { logToMasterData } from '../utils/logging'

/**
 * MCP Initialize endpoint
 * POST /_v/rag_server/v1/mcp/initialize
 */
export async function mcpInitialize(ctx: Context, next: () => Promise<void>) {
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

    // Create initialize response
    const response: MCPInitializeResponse = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
      },
      serverInfo: {
        name: 'VTEX IO RAG Server',
        version: '1.0.0',
      },
    }

    const mcpResponse: MCPResponse = {
      jsonrpc: '2.0',
      id: requestBody.id,
      result: response,
    }

    ctx.status = 200
    ctx.body = mcpResponse

    // Log the request for monitoring
    await logToMasterData(ctx, 'mcpInitialize', 'middleware', 'info', {
      data: {
        clientInfo: requestBody.params?.clientInfo,
        protocolVersion: requestBody.params?.protocolVersion,
      },
      message: 'MCP client initialized successfully',
    })

    return next()
  } catch (error) {
    await logToMasterData(ctx, 'mcpInitialize', 'middleware', 'error', {
      error,
      message: 'Failed to initialize MCP client',
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
