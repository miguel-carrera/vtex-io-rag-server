// Document types for RAG system

export interface DocumentData {
  title: string
  content: string
  category: string
  tags?: string[]
  author?: string
  enabled: boolean
  summary?: string
}

export interface DocumentDocument extends DocumentData {
  id: string
}

export interface DocumentSearchParams {
  query?: string
  category?: string
  tags?: string[]
  author?: string
  limit?: number
  offset?: number
}

export interface DocumentSearchResult {
  documents: DocumentDocument[]
  total: number
  hasMore: boolean
}
