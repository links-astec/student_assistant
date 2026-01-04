import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { processChat, getConversationHistory, clearConversation } from '../services/chatService';
import { ChatRequest } from '../types';

const router = Router();

// Request validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  userId: z.string().optional(),
  stream: z.boolean().optional().default(false),
  context: z.string().optional(),
  category: z.string().optional(),
});

/**
 * POST /api/chat
 * Send a message to the AI assistant
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = chatRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }
    
    const { stream, ...requestData } = validation.data;
    
    if (stream) {
      // Handle streaming response
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      try {
        const result = await processChat(requestData as ChatRequest, true) as (() => AsyncGenerator<string, void, unknown>);
        
        // Handle streaming response
        if (typeof result === 'function') {
          // Call the async generator function to get the generator
          const generator = result();
          for await (const chunk of generator) {
            res.write(chunk);
          }
        } else {
          // Fallback: if not streaming, write the full response
          res.write(typeof result === 'string' ? result : JSON.stringify(result));
        }
        
        res.end();
      } catch (error) {
        console.error('Streaming error:', error);
        res.write('Error generating response');
        res.end();
      }
    } else {
      // Handle regular response
      try {
        const response = await processChat(requestData as ChatRequest, false);
        
        res.json({
          success: true,
          data: response,
        });
      } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to process chat message',
        });
      }
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
    });
  }
});

/**
 * GET /api/chat/:conversationId
 * Get conversation history
 */
router.get('/:conversationId', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const conversation = getConversationHistory(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }
    
    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation',
    });
  }
});

/**
 * DELETE /api/chat/:conversationId
 * Clear a conversation
 */
router.delete('/:conversationId', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const deleted = clearConversation(conversationId);
    
    res.json({
      success: true,
      deleted,
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
    });
  }
});

export default router;
