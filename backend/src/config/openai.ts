import OpenAI from 'openai';
import { config } from './env';

// Only create OpenAI client if API key is provided
export const openai: OpenAI | null = config.OPENAI_API_KEY
  ? new OpenAI({ apiKey: config.OPENAI_API_KEY })
  : null;

// Model configuration
export const MODELS = {
  EMBEDDING: 'text-embedding-3-small',
  CHAT: 'gpt-4o-mini', // Cost-effective for student assistant
  CHAT_ADVANCED: 'gpt-4o', // For complex queries if needed
} as const;

// Embedding dimensions for text-embedding-3-small
export const EMBEDDING_DIMENSIONS = 1536;
