import { config, generateOllamaEmbedding } from '../config';

// Conditionally import OpenAI only if needed
let openai: any = null;
const MODELS = { EMBEDDING: 'text-embedding-3-small' };

if (config.LLM_PROVIDER === 'openai' && config.OPENAI_API_KEY) {
  import('openai').then((OpenAI) => {
    openai = new OpenAI.default({ apiKey: config.OPENAI_API_KEY });
  });
}

// Embedding dimensions vary by model
export const EMBEDDING_DIMENSIONS = config.OLLAMA_EMBEDDING_MODEL ? 768 : 1536;

/**
 * Generate embeddings for a single text
 * Uses Ollama for embeddings (since llama.cpp doesn't support them)
 * Falls back to OpenAI if configured
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Use Ollama for embeddings (works with any chat provider)
  if (config.OLLAMA_EMBEDDING_MODEL) {
    return generateOllamaEmbedding(text);
  }
  
  // Fallback to OpenAI
  if (!openai) {
    throw new Error('OpenAI client not initialized. Check your API key.');
  }
  
  const response = await openai.embeddings.create({
    model: MODELS.EMBEDDING,
    input: text,
  });
  
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in smaller batches for stability
  const batchSize = config.LLM_PROVIDER === 'ollama' ? 10 : 100;
  
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
