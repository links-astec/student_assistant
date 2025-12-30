import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { searchDocuments, getCategories, loadCachedEmbeddings } from '../services/knowledgeService';

const router = Router();

// Request validation schema
const searchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(20).optional().default(5),
});

/**
 * POST /api/search
 * Search the knowledge base
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = searchRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }
    
    const { query, limit } = validation.data;
    const results = await searchDocuments(query, limit, false);
    
    res.json({
      success: true,
      data: {
        query,
        results: results.map(r => ({
          title: r.document.title,
          content: r.document.content,
          url: r.document.url,
          category: r.category,
          relevance: Math.round(r.score * 100),
        })),
        total: results.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search knowledge base',
    });
  }
});

/**
 * GET /api/search/categories
 * Get all knowledge base categories
 */
router.get('/categories', (req: Request, res: Response) => {
  try {
    const categories = getCategories();
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories',
    });
  }
});

/**
 * POST /api/search/reload
 * Reload knowledge base embeddings from cache
 */
router.post('/reload', (req: Request, res: Response) => {
  try {
    const loaded = loadCachedEmbeddings();
    
    res.json({
      success: true,
      loaded,
      message: loaded ? 'Embeddings reloaded successfully' : 'No cached embeddings found',
    });
  } catch (error) {
    console.error('Reload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reload embeddings',
    });
  }
});

export default router;
