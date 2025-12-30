import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // LLM Provider: "ollama" (free), "openai" (paid), or "llamacpp" (fastest)
  LLM_PROVIDER: z.enum(['ollama', 'openai', 'llamacpp']).default('ollama'),
  
  // Ollama Configuration (FREE - runs locally)
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.2'),
  OLLAMA_EMBEDDING_MODEL: z.string().default('nomic-embed-text'),
  
  // Llama.cpp Configuration (FASTEST - direct C++)
  LLAMACPP_URL: z.string().default('http://localhost:8080'),
  
  // OpenAI Configuration (PAID - optional)
  OPENAI_API_KEY: z.string().optional(),
  
  // Supabase Configuration (optional)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parseEnv = (): EnvConfig => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    // Return defaults for development
    return {
      PORT: process.env.PORT || '3000',
      NODE_ENV: 'development',
      LLM_PROVIDER: 'ollama',
      OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.2',
      OLLAMA_EMBEDDING_MODEL: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
      LLAMACPP_URL: process.env.LLAMACPP_URL || 'http://localhost:8080',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    };
  }
};

export const config = parseEnv();
