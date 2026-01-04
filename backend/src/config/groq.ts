import Groq from 'groq-sdk';

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  console.warn('⚠️  GROQ_API_KEY not set. Get free API key at https://console.groq.com');
}

const groq = new Groq({
  apiKey: groqApiKey,
});

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export async function generateGroqChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: ChatOptions = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 150 } = options;

  try {
    const response = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768', // Free model (very fast)
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Groq response');
    }

    return content;
  } catch (error) {
    console.error('❌ Groq API Error:', error);
    throw error;
  }
}
