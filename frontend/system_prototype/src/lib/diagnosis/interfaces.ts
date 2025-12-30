// Diagnosis Engine Interfaces
// These interfaces allow swapping between rule-based and LLM implementations

import type { QuestionOption } from "@/lib/supabase/types";

// Candidate issue returned by classifier
export interface ClassifiedCandidate {
  key: string;
  title: string;
  score: number; // 0-1 confidence score
}

// Question to ask the user
export interface Question {
  text: string;
  type: "single" | "text";
  options?: QuestionOption[];
  slotKey?: string;
}

// Email draft output
export interface EmailDraft {
  subject: string;
  body: string;
  to?: string;
  department?: string;
  templateType?: string;
}

// Interface for classifying user's initial message
export interface IIssueClassifier {
  classify(
    text: string,
    categoryKey?: string | null,
    subcategoryKey?: string | null
  ): Promise<ClassifiedCandidate[]>;
}

// Interface for determining next question
export interface IQuestionPlanner {
  nextQuestion(
    issueKey: string,
    currentIndex: number
  ): Promise<Question | null>;
  getTotalQuestions(issueKey: string): Promise<number>;
}

// Student information for email drafts
export interface StudentInfo {
  fullName: string;
  studentId: string;
  programme: string;
}

// Interface for generating email drafts
export interface IEmailDrafter {
  draft(
    issueKey: string,
    slots: Record<string, string>,
    studentInfo?: StudentInfo
  ): Promise<EmailDraft>;
}

// Interface for summarizing the issue
export interface ISummariser {
  summarise(
    issueKey: string,
    slots: Record<string, string>,
    answers: string[]
  ): Promise<string>;
}

// Contact information
export interface ContactInfo {
  departmentName: string;
  emails: string[];
  phones: string[];
  hoursText: string;
  links: string[];
}

// Interface for retrieving contact info
export interface IContactProvider {
  getContact(issueKey: string): Promise<ContactInfo | null>;
}

// Factory function type for creating diagnosis engine
export type DiagnosisEngineMode = "rule" | "llm";

export interface DiagnosisEngine {
  classifier: IIssueClassifier;
  questionPlanner: IQuestionPlanner;
  emailDrafter: IEmailDrafter;
  summariser: ISummariser;
  contactProvider: IContactProvider;
}
