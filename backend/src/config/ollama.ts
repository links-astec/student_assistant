/**
 * Ollama Service - FREE Local LLM
 * 
 * Uses Ollama to run models like Llama 3.2, Mistral, etc. locally
 * No API costs - completely free!
 */

import { config } from './env';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

const OLLAMA_BASE_URL = config.OLLAMA_BASE_URL;

/**
 * Check if Ollama is running
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List available Ollama models
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json() as { models?: Array<{ name: string }> };
    return data.models?.map((m) => m.name) || [];
  } catch {
    return [];
  }
}

/**
 * Generate embedding using Ollama (FREE)
 */
export async function generateOllamaEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.OLLAMA_EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama embedding error: ${error}`);
  }

  const data = await response.json() as OllamaEmbeddingResponse;
  return data.embedding;
}

/**
 * Generate chat completion using Ollama (FREE)
 * AGGRESSIVELY optimized for speed with streaming support
 */
export async function generateOllamaChat(
  messages: OllamaChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}
): Promise<string | (() => AsyncGenerator<string, void, unknown>)> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.OLLAMA_MODEL,
      messages,
      stream: options.stream ?? false,
      options: {
        temperature: options.temperature ?? 0.5, // Lower = faster, more focused
        num_predict: options.maxTokens ?? 300, // Short responses = fast
        num_ctx: 1024, // Smaller context = faster
        num_thread: 8, // Use more CPU threads
        num_gpu: 999, // Use all GPU layers if available
        top_k: 20, // Limit token choices = faster
        top_p: 0.8, // Nucleus sampling = faster
        repeat_penalty: 1.1, // Avoid repetition
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama chat error: ${error}`);
  }

  if (options.stream) {
    // Return async generator function for streaming
    return async function* () {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  yield data.message.content;
                }
                if (data.done) {
                  return;
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    };
  }

  // Non-streaming response
  const data = await response.json() as OllamaChatResponse;
  return data.message.content;
}

/**
 * Pull a model if not available
 */
export async function pullOllamaModel(modelName: string): Promise<void> {
  console.log(`📥 Pulling Ollama model: ${modelName}...`);
  
  const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: false }),
  });

  if (!response.ok) {
    throw new Error(`Failed to pull model: ${modelName}`);
  }
  
  console.log(`✅ Model ${modelName} ready!`);
}
