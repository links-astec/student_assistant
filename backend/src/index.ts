import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { loadCachedEmbeddings } from './services/knowledgeService';

const app = express();

// Security middleware - disable for local testing
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for test page
}));

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for testing
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Coventry University Student Assistant API',
    version: '1.0.0',
    description: 'AI-powered assistant for student administrative queries',
    endpoints: {
      chat: '/api/chat',
      search: '/api/search',
      health: '/api/health',
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
app.use(errorHandler);

// Start server
const PORT = parseInt(config.PORT, 10);

const startServer = async () => {
  // Try to load cached embeddings on startup (skip in serverless environments)
  if (config.NODE_ENV !== 'production') {
    try {
      const loaded = loadCachedEmbeddings();
      if (loaded) {
        console.log('✅ Knowledge base loaded from cache');
      } else {
        console.log('⚠️  No cached embeddings found. Run "npm run ingest" to generate them.');
      }
    } catch (error) {
      console.error('Error loading embeddings:', error);
    }
  } else {
    console.log('ℹ️  Skipping embeddings load in production environment');
  }

  app.listen(PORT, () => {
    console.log(`
🚀 Coventry Student Assistant API is running!
   
   Local:      http://localhost:${PORT}
   Health:     http://localhost:${PORT}/api/health
   Chat:       POST http://localhost:${PORT}/api/chat
   Search:     POST http://localhost:${PORT}/api/search
   Test Page:  http://localhost:${PORT}/test
   
   LLM:        ${config.LLM_PROVIDER === 'groq' ? 'Groq (mixtral-8x7b)' : config.LLM_PROVIDER === 'llamacpp' ? 'Llama.cpp (phi-2)' : `Ollama (${config.OLLAMA_MODEL || 'llama3.2'})`} with 90 school documents
   Environment: ${config.NODE_ENV}
    `);
  });
};

// Start server only in development/local environment
if (config.NODE_ENV !== 'production') {
  startServer();
}

// For Vercel serverless functions, export the app directly
export default app;

// Also export as a serverless function
export const handler = app;
