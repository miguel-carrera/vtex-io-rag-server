import { json } from 'co-body'

import type { MCPRequest, MCPResponse, MCPHandshakeResponse } from '../types/mcp-protocol'
import { logToMasterData } from '../utils/logging'

/**
 * MCP Handshake endpoint
 * POST /_v/rag_server/v1/mcp/handshake
 */
export async function mcpHandshake(ctx: Context, next: () => Promise<void>) {
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

    // Extract handshake parameters
    const params = requestBody.params || {}
    const clientVersion = params.version || 'unknown'
    const clientCapabilities = params.capabilities || []

    // Check if client version is compatible
    const supportedVersions = ['1.0.0', '2024-11-05']
    const isVersionCompatible = supportedVersions.includes(clientVersion)

    // Define server capabilities
    const serverCapabilities = ['resources', 'tools', 'logging']

    // Create handshake response
    const response: MCPHandshakeResponse = {
      version: '1.0.0',
      capabilities: serverCapabilities,
      compatible: isVersionCompatible,
      serverInfo: {
        name: 'VTEX IO RAG Server',
        version: '1.0.0',
        description: 'Model Context Protocol server for document search and retrieval',
      },
    }

    const mcpResponse: MCPResponse = {
      jsonrpc: '2.0',
      id: requestBody.id,
      result: response,
    }

    ctx.status = 200
    ctx.body = mcpResponse

    // Log the handshake for monitoring
    await logToMasterData(ctx, 'mcpHandshake', 'middleware', 'info', {
      data: {
        clientVersion,
        clientCapabilities,
        isVersionCompatible,
        serverCapabilities,
      },
      message: 'MCP handshake completed',
    })

    return next()
  } catch (error) {
    await logToMasterData(ctx, 'mcpHandshake', 'middleware', 'error', {
      error,
      message: 'Failed to process MCP handshake',
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
