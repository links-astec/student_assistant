import { v4 as uuidv4 } from 'uuid';
import { config, generateOllamaChat, generateLlamaCppChat, generateGroqChat } from '../config';
import { ChatMessage, ChatRequest, ChatResponse, Conversation } from '../types';
import { searchDocuments } from './knowledgeService';
import * as analytics from './analyticsService';
import * as problemClassifier from './problemClassificationService';
import * as emailTemplate from './emailTemplateService';
import * as contactDirectory from './contactDirectoryService';


// In-memory conversation store (use Supabase in production)
const conversations = new Map<string, Conversation>();

const SYSTEM_PROMPT = `You are a helpful Coventry University student assistant.

IMPORTANT: Keep answers SHORT. Maximum 2 sentences. Be direct.

You help with: student cards, accommodation, fees, courses, support services.

Format: Direct answer + 1 link if relevant.

Example: "You can get your student card from the Student Hub. It gives access to facilities. More info: https://www.coventry.ac.uk/student-cards"`;

/**
 * Build context from search results - focused and concise
 */
function buildContext(searchResults: Array<{ document: any; score: number; category: string }>): string {
  if (searchResults.length === 0) {
    return 'No specific info found. Give general helpful advice and suggest contacting Student Support.';
  }
  
  // Filter to only high-relevance results (above 20% relevance)
  const relevantResults = searchResults.filter(result => result.score > 0.2);
  
  if (relevantResults.length === 0) {
    return 'No highly relevant info found. Give general helpful advice and suggest contacting Student Support.';
  }
  
  // Use top 2 most relevant results for better focus
  const contextParts = relevantResults.slice(0, 2).map((result) => {
    // Keep concise content (300 chars max)
    const shortContent = result.document.content.length > 300 
      ? result.document.content.substring(0, 300) + '...'
      : result.document.content;
    return `**${result.document.title}**
${shortContent}
More info: ${result.document.url}`;
  });
  
  return contextParts.join('\n\n---\n\n');
}

/**
 * Get or create a conversation
 */
function getConversation(conversationId?: string): Conversation {
  if (conversationId && conversations.has(conversationId)) {
    return conversations.get(conversationId)!;
  }
  
  const newConversation: Conversation = {
    id: conversationId || uuidv4(),
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  conversations.set(newConversation.id, newConversation);
  return newConversation;
}

/**
 * Generate chat response using configured provider with streaming support
 */
async function generateChatResponse(messages: ChatMessage[], stream: boolean = false): Promise<string | (() => AsyncGenerator<string, void, unknown>)> {
  console.log(`[DEBUG] Using LLM provider: ${config.LLM_PROVIDER}`);
  
  if (config.LLM_PROVIDER === 'groq') {
    // Use Groq (FREE + FAST)
    console.log('[DEBUG] Using Groq for chat');
    return generateGroqChat(
      messages.map(m => ({ role: m.role, content: m.content })),
      { temperature: 0.3, maxTokens: 150, stream }
    );
  }

  if (config.LLM_PROVIDER === 'ollama') {
    // Use Ollama (FREE)
    console.log('[DEBUG] Using Ollama for chat');
    return generateOllamaChat(
      messages.map(m => ({ role: m.role, content: m.content })),
      { temperature: 0.3, maxTokens: 150, stream }
    );
  }

  if (config.LLM_PROVIDER === 'llamacpp') {
    // Use llama.cpp (FASTEST)
    console.log('[DEBUG] Using llama.cpp for chat');
    return generateLlamaCppChat(
      messages.map(m => ({ role: m.role, content: m.content })),
      { temperature: 0.3, maxTokens: 150, stream }
    );
  }

  // Only Groq, Ollama, and Llama.cpp are supported
  throw new Error(`Unsupported LLM provider: ${config.LLM_PROVIDER}. Only 'groq', 'ollama', and 'llamacpp' are supported.`);
}

/**
 * Process a chat request and generate a response
 */
export async function processChat(request: ChatRequest, stream: boolean = false): Promise<ChatResponse | (() => AsyncGenerator<string, void, unknown>)> {
  const { message, conversationId, userId } = request;
  const startTime = Date.now();
  
  console.log(`[Chat] Processing message: "${message.substring(0, 50)}..." (stream: ${stream})`);
  
  // Get or create conversation
  const conversation = getConversation(conversationId);
  if (userId) {
    conversation.userId = userId;
  }
  
  // Create or get session in analytics (only for new conversations)
  if (!conversationId) {
    const sessionStart = Date.now();
    await analytics.createSession({
      id: conversation.id,
      userId: userId,
    });
    console.log(`[Chat] Session creation: ${Date.now() - sessionStart}ms`);
  }
  
  // Log user message
  const logStart = Date.now();
  await analytics.logMessage({
    sessionId: conversation.id,
    role: 'user',
    content: message,
    classifiedIntent: detectIntent(message),
  });
  console.log(`[Chat] User message logging: ${Date.now() - logStart}ms`);
  
  // Search for relevant documents (3 for better focus and speed)
  const searchStart = Date.now();
  const searchResults = await searchDocuments(message, 3, false);
  const searchTime = Date.now() - searchStart;
  console.log(`[Chat] Document search: ${searchTime}ms (${searchResults.length} results)`);
  
  const context = buildContext(searchResults);
  
  // Log search quality for debugging
  if (searchResults.length > 0) {
    console.log(`[Search] Query: "${message.substring(0, 50)}..." -> Top result: "${searchResults[0].document.title}" (${Math.round(searchResults[0].score * 100)}%)`);
  }
  
  // Calculate average confidence score
  const avgConfidence = searchResults.length > 0
    ? searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length
    : 0;
  
  // Build messages array - optimized for speed and clarity
  const systemContent = `${SYSTEM_PROMPT}

Relevant information:
${context}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...conversation.messages.slice(-4), // Reduced to last 4 messages for speed
    { role: 'user', content: message },
  ];
  
  // Generate response using configured provider (Ollama or OpenAI)
  const llmStart = Date.now();
  const assistantMessage = await generateChatResponse(messages, stream);
  const llmTime = Date.now() - llmStart;
  console.log(`[Chat] LLM generation: ${llmTime}ms`);
  
  // If streaming, return the generator immediately
  if (stream && typeof assistantMessage === 'function') {
    return assistantMessage;
  }
  
  // Non-streaming response processing
  const responseMessage = typeof assistantMessage === 'string' ? assistantMessage : '';
  const responseTime = Date.now() - startTime;
  
  // Log assistant response
  const sources = searchResults.map(r => ({
    title: r.document.title,
    url: r.document.url,
    category: r.category,
  }));
  
  const logResponseStart = Date.now();
  await analytics.logMessage({
    sessionId: conversation.id,
    role: 'assistant',
    content: responseMessage,
    sourcesUsed: sources,
    confidenceScore: avgConfidence,
    responseTimeMs: responseTime,
  });
  console.log(`[Chat] Response logging: ${Date.now() - logResponseStart}ms`);
  
  // Use advanced problem classification
  const classifyStart = Date.now();
  const classification = await problemClassifier.classifyProblem(message);
  console.log(`[Chat] Problem classification: ${Date.now() - classifyStart}ms`);
  
  // Log classification to analytics
  await analytics.classifyProblem(conversation.id, {
    category: classification.category,
    subcategory: classification.subcategory,
    specific: classification.specificIssue || message.slice(0, 100),
  });
  
  // Get relevant contact info
  const contact = contactDirectory.getQuickContact(classification.category);
  
  // Update conversation
  conversation.messages.push(
    { role: 'user', content: message },
    { role: 'assistant', content: responseMessage }
  );
  conversation.updatedAt = new Date().toISOString();

  console.log(`[Chat] Total processing time: ${responseTime}ms (search: ${searchTime}ms, LLM: ${llmTime}ms)`);
  
  return {
    message: responseMessage,
    conversationId: conversation.id,
    sources,
    classification,
    contact,
  };
}

/**
 * Simple intent detection from message
 */
function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('?') || lowerMessage.startsWith('how') || 
      lowerMessage.startsWith('what') || lowerMessage.startsWith('where') ||
      lowerMessage.startsWith('when') || lowerMessage.startsWith('who') ||
      lowerMessage.startsWith('can') || lowerMessage.startsWith('do')) {
    return 'question';
  }
  
  if (lowerMessage.includes('problem') || lowerMessage.includes('issue') ||
      lowerMessage.includes('not working') || lowerMessage.includes('broken') ||
      lowerMessage.includes('complaint') || lowerMessage.includes('unhappy')) {
    return 'complaint';
  }
  
  if (lowerMessage.includes('please') || lowerMessage.includes('need') ||
      lowerMessage.includes('want') || lowerMessage.includes('request') ||
      lowerMessage.includes('help me')) {
    return 'request';
  }
  
  if (lowerMessage.includes('thank') || lowerMessage.includes('great') ||
      lowerMessage.includes('helpful') || lowerMessage.includes('good')) {
    return 'feedback';
  }
  
  return 'general';
}

/**
 * Get conversation history
 */
export function getConversationHistory(conversationId: string): Conversation | null {
  return conversations.get(conversationId) || null;
}

/**
 * Clear a conversation
 */
export function clearConversation(conversationId: string): boolean {
  return conversations.delete(conversationId);
}

/**
 * Save conversation to Supabase (for persistence)
 */
export async function saveConversationToSupabase(conversation: Conversation): Promise<void> {
  // Only save if Supabase is configured
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    return;
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    
    const { error } = await supabase
      .from('conversations')
      .upsert({
        id: conversation.id,
        user_id: conversation.userId,
        messages: conversation.messages,
        created_at: conversation.createdAt,
        updated_at: conversation.updatedAt,
      });
    
    if (error) {
      console.error('Error saving conversation:', error);
    }
  } catch (err) {
    console.error('Supabase not configured:', err);
  }
}
