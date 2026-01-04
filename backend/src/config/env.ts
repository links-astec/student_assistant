import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // LLM Provider: "groq" (free/fast), "ollama" (local), or "llamacpp" (fastest)
  LLM_PROVIDER: z.enum(['groq', 'ollama', 'llamacpp']).default('groq'),
  
  // Ollama Configuration (FREE - runs locally or via service)
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:0.5b'),
  OLLAMA_EMBEDDING_MODEL: z.string().default('nomic-embed-text'),
  
  // GROQ API (FREE - cloud based, no setup needed)
  GROQ_API_KEY: z.string().optional(),
  
  // Llama.cpp Configuration (FASTEST - direct C++)
  LLAMACPP_URL: z.string().default('http://localhost:8080'),
  
  // Supabase Configuration (optional)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parseEnv = (): EnvConfig => {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    // Return defaults for development (force ollama)
    return {
      PORT: process.env.PORT || '3000',
      NODE_ENV: 'development',
      LLM_PROVIDER: 'groq',
      OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'qwen:7b',
      OLLAMA_EMBEDDING_MODEL: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
      LLAMACPP_URL: process.env.LLAMACPP_URL || 'http://localhost:8080',
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    };
  }
};

export const config = parseEnv();
