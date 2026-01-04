/**
 * Analytics Service
 * Logs all user interactions to Supabase for analysis
 */

import { supabaseAdmin } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface SessionData {
  id?: string;
  userId?: string;
  userName?: string;
  studentId?: string;
  language?: string;
  deviceInfo?: Record<string, any>;
  ipAddress?: string;
}

export interface MessageData {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sourcesUsed?: Array<{ title: string; url: string; category: string }>;
  confidenceScore?: number;
  classifiedIntent?: string;
  detectedEntities?: Record<string, any>;
  responseTimeMs?: number;
}

export interface ProblemClassification {
  category: string;        // e.g., "Accommodation"
  subcategory: string;     // e.g., "Fees and Payment"
  specific: string;        // e.g., "Payment deadline confusion"
  details?: Record<string, any>;
}

export interface EmailTemplateData {
  sessionId: string;
  templateType: string;
  recipientDepartment: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject: string;
  body: string;
  fiveWOneH: {
    who: string;
    what: string;
    when: string;
    where: string;
    why: string;
    how: string;
  };
  userVariables: Record<string, any>;
}

export interface FeedbackData {
  sessionId: string;
  messageId?: string;
  helpful: boolean;
  rating?: number;
  feedbackType?: string;
  comments?: string;
}

/**
 * Check if Supabase is configured and available
 */
export function isAnalyticsEnabled(): boolean {
  return supabaseAdmin !== null;
}

/**
 * Create a new chat session
 */
export async function createSession(data: SessionData = {}): Promise<string | null> {
  if (!supabaseAdmin) {
    console.log('[Analytics] Supabase not configured, skipping session creation');
    return data.id || uuidv4();
  }

  const sessionId = data.id || uuidv4();

  try {
    const { error } = await supabaseAdmin.from('chat_sessions').insert({
      id: sessionId,
      user_id: data.userId,
      user_name: data.userName,
      student_id: data.studentId,
      language: data.language || 'en',
      device_info: data.deviceInfo || {},
      ip_address: data.ipAddress,
      total_messages: 0,
    });

    if (error) {
      console.error('[Analytics] Error creating session:', error.message);
      return sessionId; // Return ID anyway for local tracking
    }

    console.log(`[Analytics] Session created: ${sessionId}`);
    return sessionId;
  } catch (err) {
    console.error('[Analytics] Exception creating session:', err);
    return sessionId;
  }
}

/**
 * Log a chat message
 */
export async function logMessage(data: MessageData): Promise<string | null> {
  if (!supabaseAdmin) {
    console.log('[Analytics] Supabase not configured, skipping message log');
    return uuidv4();
  }

  const messageId = uuidv4();

  try {
    // Insert message
    const { error: msgError } = await supabaseAdmin.from('chat_messages').insert({
      id: messageId,
      session_id: data.sessionId,
      role: data.role,
      content: data.content,
      sources_used: data.sourcesUsed || [],
      confidence_score: data.confidenceScore,
      classified_intent: data.classifiedIntent,
      detected_entities: data.detectedEntities || {},
      response_time_ms: data.responseTimeMs,
    });

    if (msgError) {
      // Silently fail analytics - not critical for app functionality
      return messageId;
    }

    // Update session message count (simple increment via update)
    try {
      const { data: session } = await supabaseAdmin
        .from('chat_sessions')
        .select('total_messages')
        .eq('id', data.sessionId)
        .single();
      
      if (session) {
        await supabaseAdmin
          .from('chat_sessions')
          .update({ 
            total_messages: (session.total_messages || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.sessionId);
      }
    } catch (updateErr) {
      // Silently fail analytics
    }

    console.log(`[Analytics] Message logged: ${messageId}`);
    return messageId;
  } catch (err) {
    // Silently fail analytics
    return messageId;
  }
}

/**
 * Update session with problem classification
 */
export async function classifyProblem(
  sessionId: string, 
  classification: ProblemClassification
): Promise<boolean> {
  if (!supabaseAdmin) {
    console.log('[Analytics] Supabase not configured, skipping classification');
    return true;
  }

  try {
    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .update({
        problem_category: classification.category,
        problem_subcategory: classification.subcategory,
        problem_specific: classification.specific,
        problem_details: classification.details || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      // Silently fail - analytics is non-critical
      return false;
    }

    console.log(`[Analytics] Problem classified for session ${sessionId}`);
    return true;
  } catch (err) {
    // Silently fail analytics
    return false;
  }
}

/**
 * Mark session as resolved
 */
export async function resolveSession(
  sessionId: string, 
  resolutionType: 'email_sent' | 'info_provided' | 'escalated' | 'self_resolved'
): Promise<boolean> {
  if (!supabaseAdmin) {
    return true;
  }

  try {
    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .update({
        resolved: true,
        resolution_type: resolutionType,
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('[Analytics] Error resolving session:', error.message);
      return false;
    }

    console.log(`[Analytics] Session resolved: ${sessionId} (${resolutionType})`);
    return true;
  } catch (err) {
    console.error('[Analytics] Exception resolving session:', err);
    return false;
  }
}

/**
 * Save generated email template
 */
export async function saveEmailTemplate(data: EmailTemplateData): Promise<string | null> {
  if (!supabaseAdmin) {
    return uuidv4();
  }

  const templateId = uuidv4();

  try {
    const { error } = await supabaseAdmin.from('email_templates').insert({
      id: templateId,
      session_id: data.sessionId,
      template_type: data.templateType,
      recipient_department: data.recipientDepartment,
      recipient_email: data.recipientEmail,
      recipient_phone: data.recipientPhone,
      subject: data.subject,
      body: data.body,
      five_w_one_h: data.fiveWOneH,
      user_variables: data.userVariables,
    });

    if (error) {
      // Silently fail - analytics is non-critical
      return templateId;
    }

    console.log(`[Analytics] Email template saved: ${templateId}`);
    return templateId;
  } catch (err) {
    // Silently fail - analytics is non-critical
    return templateId;
  }
}

/**
 * Record user feedback
 */
export async function recordFeedback(data: FeedbackData): Promise<boolean> {
  if (!supabaseAdmin) {
    return true;
  }

  try {
    const { error } = await supabaseAdmin.from('user_feedback').insert({
      session_id: data.sessionId,
      message_id: data.messageId,
      helpful: data.helpful,
      rating: data.rating,
      feedback_type: data.feedbackType,
      comments: data.comments,
    });

    if (error) {
      console.error('[Analytics] Error recording feedback:', error.message);
      return false;
    }

    console.log(`[Analytics] Feedback recorded for session ${data.sessionId}`);
    return true;
  } catch (err) {
    console.error('[Analytics] Exception recording feedback:', err);
    return false;
  }
}

/**
 * Get session analytics summary
 */
export async function getSessionSummary(sessionId: string): Promise<any> {
  if (!supabaseAdmin) {
    return null;
  }

  try {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return null;
    }

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    return {
      session,
      messages: messages || [],
      messageCount: messages?.length || 0,
    };
  } catch (err) {
    console.error('[Analytics] Exception getting session summary:', err);
    return null;
  }
}

/**
 * Update user info in session
 */
export async function updateSessionUserInfo(
  sessionId: string,
  userInfo: { userName?: string; studentId?: string; userId?: string }
): Promise<boolean> {
  if (!supabaseAdmin) {
    return true;
  }

  try {
    const updates: any = { updated_at: new Date().toISOString() };
    if (userInfo.userName) updates.user_name = userInfo.userName;
    if (userInfo.studentId) updates.student_id = userInfo.studentId;
    if (userInfo.userId) updates.user_id = userInfo.userId;

    const { error } = await supabaseAdmin
      .from('chat_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) {
      console.error('[Analytics] Error updating user info:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Analytics] Exception updating user info:', err);
    return false;
  }
}
