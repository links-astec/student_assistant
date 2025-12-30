import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeCategory, KnowledgeDocument, EmbeddedDocument, SearchResult } from '../types';
import { generateEmbedding, cosineSimilarity } from './embeddingService';
import { supabaseAdmin } from '../config/supabase';

// In-memory store for local development/fallback
let localDocuments: EmbeddedDocument[] = [];

const KNOWLEDGE_BASE_PATH = path.join(__dirname, '../../data/knowledge_base');
const EMBEDDINGS_CACHE_PATH = path.join(__dirname, '../../data/embeddings_cache.json');

/**
 * Load all knowledge base documents from JSON files
 */
export function loadKnowledgeBase(): KnowledgeDocument[] {
  const documents: KnowledgeDocument[] = [];
  
  if (!fs.existsSync(KNOWLEDGE_BASE_PATH)) {
    console.warn('Knowledge base directory not found');
    return documents;
  }
  
  const files = fs.readdirSync(KNOWLEDGE_BASE_PATH);
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const filePath = path.join(KNOWLEDGE_BASE_PATH, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const category: KnowledgeCategory = JSON.parse(content);
    
    for (const doc of category.documents) {
      documents.push({
        ...doc,
        category: category.category,
      });
    }
  }
  
  console.log(`📚 Loaded ${documents.length} documents from knowledge base`);
  return documents;
}

/**
 * Create searchable text from document
 */
function createSearchableText(doc: KnowledgeDocument): string {
  return `${doc.title}\n${doc.content}\nKeywords: ${doc.keywords.join(', ')}`;
}

/**
 * Ingest documents into vector store (Supabase or local)
 */
export async function ingestDocuments(useSupabase: boolean = false): Promise<void> {
  const documents = loadKnowledgeBase();
  
  console.log('🔄 Generating embeddings for documents...');
  
  const embeddedDocs: EmbeddedDocument[] = [];
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const searchableText = createSearchableText(doc);
    const embedding = await generateEmbedding(searchableText);
    
    embeddedDocs.push({
      ...doc,
      category: doc.category || 'General',
      embedding,
      createdAt: new Date().toISOString(),
    });
    
    console.log(`  ✓ Embedded ${i + 1}/${documents.length}: ${doc.title}`);
  }
  
  if (useSupabase) {
    // Store in Supabase
    if (!supabaseAdmin) {
      throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    }
    
    console.log('📤 Uploading to Supabase...');
    
    // First, clear existing documents
    await supabaseAdmin.from('documents').delete().neq('id', '');
    
    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < embeddedDocs.length; i += batchSize) {
      const batch = embeddedDocs.slice(i, i + batchSize).map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        url: doc.url,
        keywords: doc.keywords,
        category: doc.category,
        embedding: doc.embedding,
        created_at: doc.createdAt,
      }));
      
      const { error } = await supabaseAdmin.from('documents').insert(batch);
      
      if (error) {
        console.error('Error inserting batch:', error);
      }
    }
    
    console.log('✅ Documents uploaded to Supabase');
  } else {
    // Store locally
    localDocuments = embeddedDocs;
    
    // Cache to file for persistence
    fs.writeFileSync(EMBEDDINGS_CACHE_PATH, JSON.stringify(embeddedDocs, null, 2));
    console.log('✅ Documents cached locally');
  }
}

/**
 * Load cached embeddings from file
 */
export function loadCachedEmbeddings(): boolean {
  if (fs.existsSync(EMBEDDINGS_CACHE_PATH)) {
    const content = fs.readFileSync(EMBEDDINGS_CACHE_PATH, 'utf-8');
    localDocuments = JSON.parse(content);
    console.log(`📂 Loaded ${localDocuments.length} cached embeddings`);
    return true;
  }
  return false;
}

/**
 * Calculate keyword match boost
 * Boosts score when query keywords appear in document keywords/title/content
 * Gives extra weight to important terms like fees, pay, accommodation, visa etc.
 */
function calculateKeywordBoost(query: string, doc: { title: string; content: string; keywords: string[] }): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const docText = `${doc.title} ${doc.content} ${doc.keywords.join(' ')}`.toLowerCase();
  const docKeywords = doc.keywords.join(' ').toLowerCase();
  const docTitle = doc.title.toLowerCase();
  
  // High-priority terms that should strongly influence matching
  const priorityTerms: Record<string, string[]> = {
    'fee': ['fee', 'fees', 'pay', 'payment', 'tuition', 'finance', 'money', 'cost'],
    'accommodation': ['accommodation', 'housing', 'halls', 'room', 'rent', 'living'],
    'visa': ['visa', 'immigration', 'international', 'tier 4', 'cas'],
    'academic': ['exam', 'assignment', 'deadline', 'extension', 'grade', 'marks'],
    'wellbeing': ['mental', 'health', 'counselling', 'stress', 'anxiety', 'support'],
  };
  
  let boost = 0;
  
  // Check for priority term matches
  for (const [category, terms] of Object.entries(priorityTerms)) {
    const queryHasTerm = terms.some(t => queryLower.includes(t));
    const docHasTerm = terms.some(t => docKeywords.includes(t) || docTitle.includes(t));
    
    if (queryHasTerm && docHasTerm) {
      boost += 0.25; // Strong boost for category match
      break;
    }
  }
  
  // Regular keyword matching
  let matchCount = 0;
  for (const word of queryWords) {
    if (docText.includes(word)) {
      matchCount++;
      // Extra boost if word appears in title or keywords
      if (docTitle.includes(word) || docKeywords.includes(word)) {
        matchCount++;
      }
    }
  }
  
  // Add keyword match boost (up to 0.25)
  boost += Math.min(0.25, matchCount * 0.05);
  
  return Math.min(0.5, boost); // Cap total boost at 0.5
}

/**
 * Search documents using semantic similarity + keyword boosting
 */
export async function searchDocuments(
  query: string,
  limit: number = 5,
  useSupabase: boolean = false
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  
  if (useSupabase) {
    // Use Supabase vector search with pgvector
    if (!supabaseAdmin) {
      throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    }
    
    const { data, error } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, // Lower threshold for better recall
      match_count: limit,
    });
    
    if (error) {
      console.error('Supabase search error:', error);
      throw error;
    }
    
    return (data || []).map((item: any) => ({
      document: {
        id: item.id,
        title: item.title,
        content: item.content,
        url: item.url,
        keywords: item.keywords,
      },
      score: item.similarity,
      category: item.category,
    }));
  } else {
    // Local search
    if (localDocuments.length === 0) {
      loadCachedEmbeddings();
    }
    
    const results = localDocuments.map(doc => {
      const semanticScore = cosineSimilarity(queryEmbedding, doc.embedding);
      const keywordBoost = calculateKeywordBoost(query, doc);
      
      return {
        document: {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          url: doc.url,
          keywords: doc.keywords,
        },
        score: Math.min(1, semanticScore + keywordBoost), // Combine scores
        category: doc.category,
      };
    });
    
    // Sort by score descending and return top results
    // Lower threshold to 0.3 to include more potentially relevant results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter(r => r.score > 0.3); // Lower threshold for better coverage
  }
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = new Set<string>();
  
  if (localDocuments.length === 0) {
    loadCachedEmbeddings();
  }
  
  for (const doc of localDocuments) {
    categories.add(doc.category);
  }
  
  return Array.from(categories);
}
