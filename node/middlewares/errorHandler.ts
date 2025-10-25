import { logToMasterData } from '../utils/logging'

// Error handling middleware
export async function errorHandler(ctx: Context, next: () => Promise<any>) {
  try {
    await next()
  } catch (error) {
    await logToMasterData(ctx, 'errorHandler', 'middleware', 'error', {
      error,
      message: 'Unhandled error in middleware chain',
    })

    // Set default error response
    ctx.status = ctx.status || 500
    ctx.body = ctx.body || {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    }
  }
}
