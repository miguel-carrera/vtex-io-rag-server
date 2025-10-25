import type { MCPError } from '../types/mcp-protocol'

/**
 * Map HTTP errors to MCP error codes
 */
export function mapHttpErrorToMCP(error: any): MCPError {
  // Default to internal server error
  let code = -32603
  let message = 'Internal error'
  let data: any = undefined

  if (error && typeof error === 'object') {
    // Handle HTTP status codes
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode
      data = { httpStatusCode: status }

      switch (status) {
        case 400:
          code = -32600
          message = 'Invalid Request'
          break
        case 401:
          code = -32001
          message = 'Unauthorized'
          break
        case 403:
          code = -32000
          message = 'Forbidden'
          break
        case 404:
          code = -32601
          message = 'Method not found'
          break
        case 422:
          code = -32602
          message = 'Invalid params'
          break
        case 429:
          code = -32002
          message = 'Too many requests'
          break
        case 500:
          code = -32603
          message = 'Internal error'
          break
        case 502:
        case 503:
        case 504:
          code = -32603
          message = 'Service unavailable'
          break
        default:
          code = -32603
          message = error.message || 'Internal error'
      }
    } else if (error.message) {
      message = error.message
    }

    // Add additional error details if available
    if (error.details) {
      data = { ...data, details: error.details }
    }
  }

  return {
    code,
    message,
    data,
  }
}
