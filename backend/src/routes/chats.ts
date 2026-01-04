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

/**
 * GET /api/chats/:sessionId
 * Get a specific chat session by ID
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    console.log(`[Chat API] GET /chats/:sessionId called with sessionId: ${sessionId}`);

    if (!supabaseAdmin) {
      console.error('[Chat API] supabaseAdmin not configured');
      return res.status(500).json({
        success: false,
        error: 'Database not configured',
      });
    }

    // Get the specific chat session from the database
    console.log(`[Chat API] Querying chat_state table for session_id=${sessionId}`);
    const { data: session, error } = await supabaseAdmin
      .from('chat_state')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error(`[Chat API] Error fetching chat for ${sessionId}:`, error);
      return res.status(404).json({
        success: false,
        error: 'Chat session not found',
      });
    }

    console.log(`[Chat API] Successfully fetched chat ${sessionId}`);

    const state = session.state_jsonb || {};
    
    res.json({
      success: true,
      session: {
        sessionId: session.session_id,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        state,
      },
    });
  } catch (error) {
    console.error('Error in /api/chats/:sessionId:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load chat session',
    });
  }
});

export default router;