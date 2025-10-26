import type { RAGConfig } from '../types/rag-config'
import { logToMasterData } from '../utils/logging'

// Load initial app settings and state
export async function initialLoad(ctx: Context, next: () => Promise<any>) {
  const {
    clients: { apps, masterData },
  } = ctx

  // Get instance from URL parameters
  const { instance } = ctx.vtex.route.params
  const instanceValue = (instance as string) ?? 'default'

  // Load the app Settings
  const appId = process.env.VTEX_APP_ID as string
  const appSettings = await apps.getAppSettings(appId)

  // Load RAG configuration from MasterData v2
  let ragConfig: RAGConfig | undefined

  if (instanceValue) {
    try {
      const configResponse = await masterData.searchDocuments({
        dataEntity: 'vtex_rag_configs',
        fields: [
          'instance',
          'enabled',
          'description',
          'searchSettings',
          'allowedCategories',
          'allowedTags',
        ],
        where: `instance=${instanceValue} AND enabled=true`,
        pagination: {
          page: 1,
          pageSize: 1,
        },
        schema: 'configs',
      })

      if (configResponse.length > 0) {
        ragConfig = configResponse[0] as RAGConfig
      }
    } catch (error) {
      logToMasterData(ctx, 'initialLoad', instanceValue, 'error', error)
    }
  }

  // Set the state body for next middlewares
  ctx.state.body = {
    appSettings,
    instance: instanceValue,
    ragConfig,
  }

  return next()
}
