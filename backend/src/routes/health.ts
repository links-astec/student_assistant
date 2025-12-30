import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'coventry-student-assistant',
    version: '1.0.0',
  });
});

/**
 * GET /api/health/ready
 * Readiness check (for kubernetes/container orchestration)
 */
router.get('/ready', (req: Request, res: Response) => {
  // Add checks for dependencies here (database, external services)
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

export default router;
