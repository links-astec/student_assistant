// Database types for Supabase

// Row types for each table
export interface ChatSessionRow {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatStateRow {
  session_id: string;
  state_jsonb: ChatState;
  updated_at: string;
}

export interface IssueNodeRow {
  id: string;
  key: string;
  parent_key: string | null;
  title: string;
  description: string | null;
  keywords: string[];
  sort_order: number;
}

export interface IssueVariantRow {
  id: string;
  key: string;
  issue_node_key: string;
  title: string;
  keywords: string[];
  requires_contact: boolean;
  source_url: string | null;
}

export interface ContactRow {
  id: string;
  issue_key: string;
  department_name: string;
  emails: string[];
  phones: string[];
  hours_text: string | null;
  links: string[];
}

export interface QuestionNodeRow {
  id: string;
  issue_key: string;
  order_index: number;
  question_text: string;
  type: "single" | "text";
  options: QuestionOption[] | null;
  slot_key: string | null;
}

export interface SlotDefinitionRow {
  id: string;
  slot_key: string;
  label: string;
  required: boolean;
  input_hint: string | null;
  validation_regex: string | null;
}

export interface EmailTemplateRow {
  id: string;
  issue_key: string;
  subject_template: string;
  body_template_5w1h: string;
}

// Chat state stored in JSONB
export interface ChatState {
  phase: "initial" | "student_info" | "subcategory_select" | "questioning" | "confirming" | "complete";
  selectedTopCategoryKey: string | null;
  selectedSubcategoryKey: string | null;
  studentInfo: {
    fullName: string | null;
    studentId: string | null;
    programme: string | null;
  };
  originalMessage: string | null;
  candidateIssues: CandidateIssue[];
  selectedIssueKey: string | null;
  currentQuestionIndex: number;
  collectedSlots: Record<string, string>;
  messages: ChatMessage[];
  clientIp?: string;  // IP address for filtering chat history by user
}

export interface CandidateIssue {
  key: string;
  title: string;
  score: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

// API types
export interface ChatRequest {
  actionType: "start" | "selectCategory" | "submitStudentInfo" | "selectSubcategory" | "message" | "answer" | "confirm";
  sessionId?: string;
  categoryKey?: string;
  studentInfo?: {
    fullName: string;
    studentId: string;
    programme: string;
  };
  subcategoryKey?: string;
  userMessage?: string;
  answer?: {
    type: "quickReply" | "text";
    value: string;
  };
  confirmed?: boolean;
}

export interface ChatResponse {
  sessionId: string;
  botMessages: {
    role: "assistant";
    content: string;
    confirmationNeeded?: boolean;
    confirmationOptions?: { id: string; label: string; value: string }[];
    emailGenerated?: boolean;
    emailContent?: string;
    followupQuestions?: string[];
    requiresContext?: boolean;
  }[];
  studentInfoRequest?: {
    fields: ["fullName", "studentId", "programme"];
  };
  subcategoryOptions?: {
    id: string;
    key: string;
    title: string;
    description: string | null;
  }[];
  quickReplies?: { id: string; label: string; value: string }[];
  slotRequest?: {
    slotKeys: string[];
    hints: Record<string, string>;
  };
  state?: {
    selectedTopCategoryKey?: string;
    phase?: string;
    messageCount?: number;
  };
  result?: {
    issueKey: string;
    summary: string;
    slots: Record<string, string>;
    studentInfo: {
      fullName: string;
      studentId: string;
      programme: string;
    };
    sourceUrls: string[];
    contact: {
      departmentName: string;
      emails: string[];
      phones: string[];
      hoursText: string;
      links: string[];
    };
    emailDraft: {
      subject: string;
      body: string;
    };
  };
}

// Taxonomy types for bootstrap
export interface TaxonomyNode {
  key: string;
  title: string;
  children: TaxonomyNode[];
  variants: { key: string; title: string }[];
}

// Category type for category picker
export interface Category {
  key: string;
  title: string;
  description: string | null;
}
