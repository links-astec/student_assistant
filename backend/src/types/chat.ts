export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  userId?: string;
  studentName?: string;
  studentId?: string;
}

export interface ProblemClassification {
  category: string;
  subcategory: string;
  specificIssue: string | null;
  confidence: number;
  suggestedDepartment: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface QuickContact {
  email: string;
  phone: string;
  department: string;
  actionText: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  sources: Array<{
    title: string;
    url: string;
    category: string;
  }>;
  classification?: ProblemClassification;
  contact?: QuickContact;
}

export interface Conversation {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
