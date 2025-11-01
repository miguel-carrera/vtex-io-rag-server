/**
 * RAG Configuration interface for MasterData v2
 */
export interface RAGConfig {
  /** VTEX instance identifier (e.g., myaccount, myaccountvtexio) */
  instance: string
  /** Whether this RAG server configuration is active */
  enabled: boolean
  /** Human-readable description of this RAG server configuration */
  description?: string
  /** Search configuration settings */
  searchSettings?: SearchSettings
  /** List of allowed categories (empty means all categories are allowed) */
  allowedCategories?: string[]
  /** List of allowed tags (empty means all tags are allowed) */
  allowedTags?: string[]
}

/**
 * Search configuration settings
 */
export interface SearchSettings {
  /** Default number of results to return (1-100) */
  defaultLimit?: number
  /** Maximum number of results allowed (1-100) */
  maxLimit?: number
  /** Enable text search in title and content */
  enableTextSearch?: boolean
  /** Enable category filtering */
  enableCategoryFilter?: boolean
  /** Enable tag filtering */
  enableTagFilter?: boolean
  /** Enable author filtering */
  enableAuthorFilter?: boolean
}

/**
 * RAG Configuration response from MasterData
 */
export interface RAGConfigResponse {
  /** Document ID from MasterData */
  id: string
  /** Configuration data */
  data: RAGConfig
  /** Document metadata */
  metadata?: {
    createdIn: string
    updatedIn: string
    createdBy: string
    updatedBy: string
  }
}

/**
 * Default RAG Configuration
 */
export const DEFAULT_RAG_CONFIG: RAGConfig = {
  instance: '',
  enabled: true,
  description: '',
  searchSettings: {
    defaultLimit: 20,
    maxLimit: 100,
    enableTextSearch: true,
    enableCategoryFilter: true,
    enableTagFilter: true,
    enableAuthorFilter: true,
  },
  allowedCategories: [],
  allowedTags: [],
}
