export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  url: string;
  keywords: string[];
  category?: string;
}

export interface KnowledgeCategory {
  category: string;
  lastUpdated: string;
  source: string;
  documents: KnowledgeDocument[];
}

export interface EmbeddedDocument {
  id: string;
  title: string;
  content: string;
  url: string;
  keywords: string[];
  category: string;
  embedding: number[];
  createdAt: string;
}

export interface SearchResult {
  document: KnowledgeDocument;
  score: number;
  category: string;
}
