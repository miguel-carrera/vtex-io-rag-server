import type {
  DocumentDocument,
  DocumentSearchParams,
  DocumentSearchResult,
} from '../types/document'
import type { RAGConfig } from '../types/rag-config'
import { logToMasterData } from '../utils/logging'
import { buildSearchQuery } from '../utils/mcpUtils'

export class MasterDataService {
  private readonly dataEntity = 'vtex_rag_documents'
  private readonly schema = 'documents'

  constructor(private ctx: Context) {}

  /**
   * Get RAG configuration for the current instance
   */
  private getRAGConfig(): RAGConfig | undefined {
    return (this.ctx.state as { body?: { ragConfig?: RAGConfig } })?.body
      ?.ragConfig
  }

  /**
   * Apply RAG configuration to search parameters
   */
  private applyRAGConfig(params: DocumentSearchParams): DocumentSearchParams {
    const ragConfig = this.getRAGConfig()
    if (!ragConfig) {
      return params
    }

    const { searchSettings, allowedCategories, allowedTags } = ragConfig

    // Apply search settings
    if (searchSettings) {
      // Apply default limit if not specified
      if (!params.limit && searchSettings.defaultLimit) {
        params.limit = Math.min(
          searchSettings.defaultLimit,
          searchSettings.maxLimit || 100
        )
      }

      // Apply max limit
      if (params.limit && searchSettings.maxLimit) {
        params.limit = Math.min(params.limit, searchSettings.maxLimit)
      }
    }

    // Apply allowed categories filter
    if (allowedCategories && allowedCategories.length > 0) {
      if (params.category && !allowedCategories.includes(params.category)) {
        // If requested category is not allowed, clear it
        params.category = undefined
      }
    }

    // Apply allowed tags filter
    if (allowedTags && allowedTags.length > 0 && params.documentTags) {
      params.documentTags = params.documentTags.filter((tag) =>
        allowedTags.includes(tag)
      )
    }

    return params
  }

  /**
   * Search documents with filters
   */
  public async searchDocuments(
    params: DocumentSearchParams
  ): Promise<DocumentSearchResult> {
    // Apply RAG configuration to search parameters
    const configuredParams = this.applyRAGConfig({ ...params })

    try {
      const whereClause = buildSearchQuery(configuredParams)
      const limit = Math.min(configuredParams.limit || 20, 100) // Max 100 results
      const offset = configuredParams.offset || 0

      const response = await this.ctx.clients.masterdata.searchDocuments({
        dataEntity: this.dataEntity,
        fields: [
          'id',
          'title',
          'content',
          'url',
          'category',
          'documentTags',
          'author',
          'enabled',
          'summary',
        ],
        where: whereClause,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          pageSize: limit,
        },
        schema: this.schema,
      })

      const documents: DocumentDocument[] = (
        response as Array<Record<string, unknown>>
      ).map((doc) => ({
        id: doc.id as string,
        title: doc.title as string,
        content: doc.content as string | undefined,
        url: doc.url as string | undefined,
        category: doc.category as string,
        documentTags: (doc.documentTags as string[]) || [],
        author: doc.author as string | undefined,
        enabled: Boolean(doc.enabled),
        summary: doc.summary as string | undefined,
      }))

      return {
        documents,
        total: documents.length,
        hasMore: documents.length === limit,
      }
    } catch (error) {
      await logToMasterData(
        this.ctx,
        'searchDocuments',
        'masterDataService',
        'error',
        error
      )
      throw new Error('Failed to search documents')
    }
  }

  /**
   * Get a specific document by ID
   */
  public async getDocumentById(id: string): Promise<DocumentDocument | null> {
    try {
      const response = await this.ctx.clients.masterdata.getDocument({
        dataEntity: this.dataEntity,
        id,
        fields: [
          'id',
          'title',
          'content',
          'url',
          'category',
          'documentTags',
          'author',
          'enabled',
          'summary',
        ],
      })

      if (!response) {
        return null
      }

      const doc = response as Record<string, unknown>
      const document: DocumentDocument = {
        id: doc.id as string,
        title: doc.title as string,
        content: doc.content as string | undefined,
        url: doc.url as string | undefined,
        category: doc.category as string,
        documentTags: (doc.documentTags as string[]) || [],
        author: doc.author as string | undefined,
        enabled: Boolean(doc.enabled),
        summary: doc.summary as string | undefined,
      }

      return document
    } catch (error) {
      await logToMasterData(
        this.ctx,
        'getDocumentById',
        'masterDataService',
        'error',
        error
      )
      throw new Error(`Failed to retrieve document with ID: ${id}`)
    }
  }

  /**
   * List all documents with pagination
   */
  public async listDocuments(
    page = 1,
    pageSize = 20
  ): Promise<DocumentSearchResult> {
    try {
      const response = await this.ctx.clients.masterdata.searchDocuments({
        dataEntity: this.dataEntity,
        fields: [
          'id',
          'title',
          'content',
          'url',
          'category',
          'documentTags',
          'author',
          'enabled',
          'summary',
        ],
        where: 'enabled=true',
        pagination: {
          page,
          pageSize,
        },
        schema: this.schema,
      })

      const documents: DocumentDocument[] = (
        response as Array<Record<string, unknown>>
      ).map((doc) => ({
        id: doc.id as string,
        title: doc.title as string,
        content: doc.content as string | undefined,
        url: doc.url as string | undefined,
        category: doc.category as string,
        documentTags: (doc.documentTags as string[]) || [],
        author: doc.author as string | undefined,
        enabled: Boolean(doc.enabled),
        summary: doc.summary as string | undefined,
      }))

      return {
        documents,
        total: documents.length,
        hasMore: documents.length === pageSize,
      }
    } catch (error) {
      await logToMasterData(
        this.ctx,
        'listDocuments',
        'masterDataService',
        'error',
        error
      )
      throw new Error('Failed to list documents')
    }
  }

  /**
   * Get all available categories
   */
  public async getCategories(): Promise<string[]> {
    try {
      const response = await this.ctx.clients.masterdata.searchDocuments({
        dataEntity: this.dataEntity,
        fields: ['category'],
        where: 'enabled=true',
        pagination: {
          page: 1,
          pageSize: 1000,
        },
        schema: this.schema,
      })

      const categories = Array.from(
        new Set(
          (response as Array<Record<string, unknown>>)
            .map((doc) => doc.category as string)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b))

      return categories
    } catch (error) {
      await logToMasterData(
        this.ctx,
        'getCategories',
        'masterDataService',
        'error',
        error
      )
      throw new Error('Failed to retrieve categories')
    }
  }

  /**
   * Get all available tags
   */
  public async getTags(): Promise<string[]> {
    try {
      const response = await this.ctx.clients.masterdata.searchDocuments({
        dataEntity: this.dataEntity,
        fields: ['tags'],
        where: 'enabled=true',
        pagination: {
          page: 1,
          pageSize: 1000,
        },
        schema: this.schema,
      })

      const allTags = (response as Array<Record<string, unknown>>)
        .flatMap((doc) => (doc.documentTags as string[]) || [])
        .filter(Boolean)

      const uniqueTags = Array.from(new Set(allTags)).sort((a, b) =>
        a.localeCompare(b)
      )

      return uniqueTags
    } catch (error) {
      await logToMasterData(
        this.ctx,
        'getTags',
        'masterDataService',
        'error',
        error
      )
      throw new Error('Failed to retrieve tags')
    }
  }
}
