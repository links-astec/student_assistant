import { config, generateOllamaEmbedding } from '../config';

// Embedding dimensions for Ollama
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Generate embeddings for a single text
 * Uses Ollama for embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Use Ollama for embeddings
  return generateOllamaEmbedding(text);
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in smaller batches for stability
  const batchSize = 10;
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    for (const text of batch) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    }
  }
  
  return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
