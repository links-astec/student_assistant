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
 * Falls back to zero vector if Ollama is unavailable
 */
export async function generateOllamaEmbedding(text: string): Promise<number[]> {
  try {
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
      console.error(`[Ollama] Embedding request failed: ${error}`);
      throw new Error(`Ollama embedding error: ${error}`);
    }

    const data = await response.json() as OllamaEmbeddingResponse;
    return data.embedding;
  } catch (error) {
    console.error('[Ollama] Embedding generation failed, using zero vector:', error);
    // Return zero vector (768 dimensions to match nomic-embed-text)
    // This is a fallback - real search won't work but flow continues
    return Array(768).fill(0);
  }
}

/**
 * Generate chat completion using Ollama (FREE)
 * AGGRESSIVELY optimized for speed with streaming support
 * Falls back to simple responses if Ollama is unavailable
 */
export async function generateOllamaChat(
  messages: OllamaChatMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}
): Promise<string | (() => AsyncGenerator<string, void, unknown>)> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.OLLAMA_MODEL,
        messages,
        stream: options.stream ?? false,
        options: {
          temperature: options.temperature ?? 0.5,
          num_predict: options.maxTokens ?? 300,
          num_ctx: 1024,
          num_thread: 8,
          num_gpu: 999,
          top_k: 20,
          top_p: 0.8,
          repeat_penalty: 1.1,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Ollama] Request failed: ${error}`);
      throw new Error(`Ollama chat error: ${error}`);
    }

    if (options.stream) {
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
            buffer = lines.pop() || '';

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

    const data = await response.json() as OllamaChatResponse;
    return data.message.content;
  } catch (error) {
    console.error('[Ollama] Connection failed, using fallback response:', error);
    
    // Fallback: Extract user message and generate smart response
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const lower = userMessage.toLowerCase().trim();
    
    // Common greeting detection
    if (/^(hi|hey|hello|yo|what's up|sup)$/.test(lower)) {
      return "Hello! I'm the Coventry Student Assistant. What do you need help with today? I can assist with student cards, accommodation, fees, courses, and support services.";
    }
    
    // Student ID / Cards
    if (/(student|id|card|get.*student|obtain.*student)/.test(lower)) {
      return "You can get your student ID card from the Student Hub. Bring your passport or national ID, and you'll receive it immediately.";
    }
    
    // Accommodation / Housing
    if (/(accommodation|housing|accommodation|dorm|hall|where.*live|where.*stay)/.test(lower)) {
      return "Housing is managed by the Accommodation Office. They offer on-campus halls and off-campus options. Visit: https://www.coventry.ac.uk/accommodation";
    }
    
    // Fees / Payment / Financial
    if (/(fee|tuition|payment|pay|cost|price|money|financial|loan|fund)/.test(lower)) {
      return "Contact Student Finance for fee info and payment plans. You can check your balance online or visit the Finance Office. Email: studentfinance@coventry.ac.uk";
    }
    
    // Courses / Modules / Timetable / Classes
    if (/(course|module|class|timetable|schedule|lesson|lecture|seminar)/.test(lower)) {
      return "Check your online learning portal for module details and timetables. Contact your program leader for specific course questions.";
    }
    
    // Support / Help / Wellbeing / Mental Health / Counselling
    if (/(support|wellbeing|mental|health|counsell|stress|anxiety|help|difficult)/.test(lower)) {
      return "Student Support Services available 24/7. Call 024 7765 8888 or visit the Student Hub. Free counselling, disability support, and more.";
    }
    
    // Graduation / Degree / Results / Marks / Grades
    if (/(graduate|degree|result|grade|mark|exam|assessment|transcript)/.test(lower)) {
      return "Check your grades and results in your student portal. For degree verification or transcript requests, contact the Academic Registry.";
    }
    
    // Library / Books / Resources
    if (/(library|book|resource|database|access|login)/.test(lower)) {
      return "The Library offers physical and digital resources. You can borrow books, access databases, and book study spaces. Visit: https://www.coventry.ac.uk/library";
    }
    
    // Clubs / Sports / Societies / Social
    if (/(club|sport|society|join|activity|social|event)/.test(lower)) {
      return "Coventry University has 200+ student clubs and societies. Join one to meet people and develop skills. Visit the Student Hub to sign up.";
    }
    
    // Parking / Transport / Getting Around
    if (/(park|car|transport|bus|travel|commute|get.*campus)/.test(lower)) {
      return "Parking permits available from Campus Services. Public transport: Coventry has buses and trains. Bike storage also available.";
    }
    
    // Generic fallback for anything else - still helpful
    return "I can help with student cards, accommodation, fees, courses, counselling, and more. What's your question?";
  }
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
