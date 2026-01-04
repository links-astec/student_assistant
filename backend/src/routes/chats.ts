import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

/**
 * GET /api/chats
 * Get all chat sessions with summary information
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Database not configured',
      });
    }

    // Get all chat sessions from the database
    const { data: sessions, error } = await supabaseAdmin
      .from('chat_state')
      .select('session_id, state_jsonb, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100); // Limit to prevent too many results

    if (error) {
      console.error('Error fetching chats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch chat history',
      });
    }

    // Transform the data into the expected format
    const chats = (sessions || []).map(session => {
      const state = session.state_jsonb || {};
      const messages = state.messages || [];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

      return {
        sessionId: session.session_id,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        studentName: state.studentInfo?.fullName || 'Unknown',
        studentId: state.studentInfo?.studentId || 'Unknown',
        category: state.category || state.primaryCategory || 'General',
        issueKey: state.selectedTopCategoryKey || 'general',
        phase: state.phase || 'initial',
        messageCount: messages.length,
        lastMessage: lastMessage?.content || 'No messages yet',
      };
    });

    res.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error('Error in /api/chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load chat history',
    });
  }
});

export default router;