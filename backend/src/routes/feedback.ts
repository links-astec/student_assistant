import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as analytics from '../services/analyticsService';

const router = Router();

// Request validation schemas
const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
  helpful: z.boolean(),
  rating: z.number().min(1).max(5).optional(),
  feedbackType: z.enum(['helpful', 'not_helpful', 'incorrect', 'incomplete']).optional(),
  comments: z.string().max(1000).optional(),
});

const userInfoSchema = z.object({
  sessionId: z.string().uuid(),
  userName: z.string().max(100).optional(),
  studentId: z.string().max(20).optional(),
  userId: z.string().max(100).optional(),
});

/**
 * POST /api/feedback
 * Submit feedback for a chat session or message
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = feedbackSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }
    
    const { sessionId, messageId, helpful, rating, feedbackType, comments } = validation.data;
    
    const success = await analytics.recordFeedback({
      sessionId,
      messageId,
      helpful,
      rating,
      feedbackType,
      comments,
    });
    
    if (success) {
      res.json({
        success: true,
        message: 'Feedback recorded. Thank you!',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to record feedback',
      });
    }
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback',
    });
  }
});

/**
 * POST /api/feedback/user-info
 * Update user information for a session
 */
router.post('/user-info', async (req: Request, res: Response) => {
  try {
    const validation = userInfoSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }
    
    const { sessionId, userName, studentId, userId } = validation.data;
    
    const success = await analytics.updateSessionUserInfo(sessionId, {
      userName,
      studentId,
      userId,
    });
    
    if (success) {
      res.json({
        success: true,
        message: 'User information updated',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update user information',
      });
    }
  } catch (error) {
    console.error('User info update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user information',
    });
  }
});

/**
 * POST /api/feedback/resolve
 * Mark a session as resolved
 */
router.post('/resolve', async (req: Request, res: Response) => {
  try {
    const { sessionId, resolutionType } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required',
      });
    }
    
    const validTypes = ['email_sent', 'info_provided', 'escalated', 'self_resolved'];
    const type = validTypes.includes(resolutionType) ? resolutionType : 'info_provided';
    
    const success = await analytics.resolveSession(sessionId, type);
    
    if (success) {
      res.json({
        success: true,
        message: 'Session marked as resolved',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to resolve session',
      });
    }
  } catch (error) {
    console.error('Resolve session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve session',
    });
  }
});

/**
 * GET /api/feedback/session/:sessionId
 * Get session summary (for debugging/admin)
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const summary = await analytics.getSessionSummary(sessionId);
    
    if (summary) {
      res.json({
        success: true,
        data: summary,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
    });
  }
});

export default router;
