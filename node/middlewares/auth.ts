import { logToMasterData } from '../utils/logging'

// Basic authentication middleware
export async function auth(ctx: Context, next: () => Promise<any>) {
  try {
    // For now, we'll allow all requests
    // In a production environment, you might want to add proper authentication
    // based on VTEX credentials, API keys, or other mechanisms
    
    const { req } = ctx
    const userAgent = req.headers['user-agent'] || 'unknown'
    
    // Log the request for monitoring
    await logToMasterData(ctx, 'auth', 'middleware', 'info', {
      data: {
        userAgent,
        url: req.url,
        method: req.method,
      },
      message: 'Request authenticated',
    })

    return next()
  } catch (error) {
    await logToMasterData(ctx, 'auth', 'middleware', 'error', {
      error,
      message: 'Authentication failed',
    })

    ctx.status = 401
    ctx.body = {
      error: 'Unauthorized',
      message: 'Authentication failed',
    }
  }
}
