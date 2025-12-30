/**
 * Llama.cpp Service - FASTEST Local LLM
 *
 * Direct C++ implementation - no Python overhead
 * Extremely fast inference, minimal latency
 */

import { config } from './env';

interface LlamaCppCompletionRequest {
  prompt: string;
  n_predict?: number;
  temperature?: number;
  stop?: string[];
  stream?: boolean;
}

interface LlamaCppCompletionResponse {
  content: string;
  model: string;
  prompt_eval_count?: number;
  eval_count?: number;
  stopped_eos?: boolean;
  stopped_limit?: boolean;
  stopped_word?: boolean;
  stopping_word?: string;
  tokens_cached?: number;
  tokens_evaluated?: number;
  tokens_predicted?: number;
  truncated?: boolean;
}

const LLAMACPP_BASE_URL = config.LLAMACPP_URL || 'http://localhost:8080';

/**
 * Check if llama.cpp server is running
 */
export async function checkLlamaCppHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${LLAMACPP_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate chat completion using llama.cpp (FASTEST)
 */
export async function generateLlamaCppChat(
  messages: Array<{ role: string; content: string }>,
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}
): Promise<string | (() => AsyncGenerator<string, void, unknown>)> {

  console.log('[DEBUG] llama.cpp called with messages:', messages.length, 'stream:', options.stream);
  
  // Convert chat messages to phi-2 chat format
  const chatMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  const request = {
    messages: chatMessages,
    max_tokens: options.maxTokens || 150,
    temperature: options.temperature || 0.3,
    stream: options.stream || false
  };

  console.log('[DEBUG] llama.cpp request:', JSON.stringify(request, null, 2));

  if (options.stream) {
    // Return streaming generator
    return async function* () {
      const response = await fetch(`${LLAMACPP_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`llama.cpp error: ${response.status}`);
      }

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
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  yield data.content;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    };
  } else {
    // Non-streaming response
    const response = await fetch(`${LLAMACPP_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`llama.cpp error: ${error}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content.trim();
  }
}

/**
 * Generate embedding using llama.cpp (if supported)
 */
export async function generateLlamaCppEmbedding(text: string): Promise<number[]> {
  // llama.cpp doesn't have built-in embeddings, return empty array
  // You might need to use a separate embedding model
  console.warn('llama.cpp embeddings not implemented - using fallback');
  return [];
}