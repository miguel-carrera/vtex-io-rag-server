import type { MCPError } from '../types/mcp-protocol'

/**
 * Map HTTP errors to MCP error codes
 */
export function mapHttpErrorToMCP(error: unknown): MCPError {
  // Default to internal server error
  let code = -32603
  let message = 'Internal error'
  let data: any

  if (error && typeof error === 'object') {
    // Type guard for error object with status/statusCode
    const errorObj = error as {
      status?: number
      statusCode?: number
      message?: string
      details?: unknown
    }

    // Handle HTTP status codes
    if (errorObj.status || errorObj.statusCode) {
      const status = errorObj.status || errorObj.statusCode
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
          message = errorObj.message || 'Internal error'
      }
    } else if (errorObj.message) {
      message = errorObj.message
    }

    // Add additional error details if available
    if (errorObj.details) {
      data = { ...data, details: errorObj.details }
    }
  }

  return {
    code,
    message,
    data,
  }
}
