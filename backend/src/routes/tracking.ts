import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory store for active sessions (for real-time tracking)
const activeSessions = new Map<string, {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  startTime: Date;
  lastActivity: Date;
  issueCategory?: string;
  issueStatus: 'active' | 'resolved' | 'pending';
  messageCount: number;
  studentName?: string;
  studentId?: string;
}>();

// Clean up stale sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [ip, session] of activeSessions) {
    // Remove sessions inactive for more than 30 minutes
    if (now.getTime() - session.lastActivity.getTime() > 30 * 60 * 1000) {
      activeSessions.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * POST /api/tracking/session - Register or update a session
 */
router.post('/session', (req: Request, res: Response) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const { sessionId, issueCategory, studentName, studentId } = req.body;

  const existing = activeSessions.get(ipAddress);
  
  if (existing) {
    // Update existing session
    existing.lastActivity = new Date();
    existing.messageCount++;
    if (issueCategory) existing.issueCategory = issueCategory;
    if (studentName) existing.studentName = studentName;
    if (studentId) existing.studentId = studentId;
    
    res.json({ success: true, session: existing });
  } else {
    // Create new session
    const newSession = {
      sessionId: sessionId || uuidv4(),
      ipAddress,
      userAgent,
      startTime: new Date(),
      lastActivity: new Date(),
      issueCategory,
      issueStatus: 'active' as const,
      messageCount: 1,
      studentName,
      studentId,
    };
    
    activeSessions.set(ipAddress, newSession);
    res.json({ success: true, session: newSession });
  }
});

/**
 * POST /api/tracking/resolve - Mark an issue as resolved
 */
router.post('/resolve', (req: Request, res: Response) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  
  const session = activeSessions.get(ipAddress);
  if (session) {
    session.issueStatus = 'resolved';
    session.lastActivity = new Date();
    res.json({ success: true, session });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

/**
 * GET /api/tracking/active - Get all active sessions (admin/dashboard)
 */
router.get('/active', (req: Request, res: Response) => {
  const sessions = Array.from(activeSessions.values()).map(s => ({
    ...s,
    // Mask IP for privacy (show only last segment)
    ipAddress: s.ipAddress.replace(/(\d+\.\d+\.\d+\.)(\d+)/, '$1***'),
    duration: Math.floor((new Date().getTime() - s.startTime.getTime()) / 1000 / 60), // minutes
  }));
  
  res.json({
    success: true,
    totalActive: sessions.filter(s => s.issueStatus === 'active').length,
    totalResolved: sessions.filter(s => s.issueStatus === 'resolved').length,
    sessions: sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()),
  });
});

/**
 * GET /api/tracking/stats - Get session statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  const stats = {
    currentlyActive: 0,
    resolvedToday: 0,
    totalMessagesToday: 0,
    topCategories: {} as Record<string, number>,
  };
  
  // Get data from Supabase chat_state table for accurate persistence
  if (supabaseAdmin) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all chat sessions from today
      const { data: sessions, error } = await supabaseAdmin
        .from('chat_state')
        .select('state_jsonb, updated_at')
        .gte('updated_at', today.toISOString());
      
      if (error) {
        console.error('[Tracking] Error fetching from chat_state:', error);
      } else if (sessions) {
        for (const session of sessions) {
          const state = session.state_jsonb;
          if (!state) continue;
          
          // Count messages
          if (state.messages && Array.isArray(state.messages)) {
            stats.totalMessagesToday += state.messages.length;
          }
          
          // Count by status - check if resolved
          const lastActivity = new Date(session.updated_at).getTime();
          const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
          
          if (state.issueResolved) {
            stats.resolvedToday++;
          } else if (lastActivity > thirtyMinutesAgo) {
            // Session is active if updated in the last 30 minutes and not resolved
            stats.currentlyActive++;
          }
          
          // Count categories
          const category = state.category || state.primaryCategory;
          if (category) {
            stats.topCategories[category] = (stats.topCategories[category] || 0) + 1;
          }
        }
      }
    } catch (err) {
      console.error('[Tracking] Error fetching stats:', err);
    }
  }
  
  // Also include any in-memory sessions (for very recent activity)
  const activeSess = Array.from(activeSessions.values());
  for (const session of activeSess) {
    if (session.issueCategory) {
      stats.topCategories[session.issueCategory] = (stats.topCategories[session.issueCategory] || 0) + 1;
    }
  }
  
  res.json({ success: true, stats });
});

export default router;
