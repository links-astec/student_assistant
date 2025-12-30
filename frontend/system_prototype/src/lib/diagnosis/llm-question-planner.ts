/**
 * LLM Question Planner
 *
 * This module provides category-specific questions with backend LLM enhancement.
 * Uses predefined questions for known categories and falls back to LLM for others.
 *
 * The planner ensures we have 2-4 follow-up questions to gather 5W1H information.
 */

import { QuestionOption } from "@/lib/supabase/types";

// Backend API URL for LLM calls
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export interface PlannedQuestion {
  questionText: string;
  type: "single" | "text";
  options?: QuestionOption[];
  slotKey?: string;
}

export interface QuestionPlannerResult {
  questions: PlannedQuestion[];
}

/**
 * Plans follow-up questions for an issue based on category/subcategory.
 * Uses predefined questions for known categories, with optional LLM enhancement.
 *
 * @param categoryKey - The top-level category key
 * @param subcategoryKey - The selected subcategory key (optional)
 * @returns Promise with array of planned questions
 */
export async function planQuestionsForIssue(
  categoryKey: string,
  subcategoryKey: string | null
): Promise<QuestionPlannerResult> {
  // Deterministic fallback questions by category
  const fallbackQuestions: Record<string, PlannedQuestion[]> = {
    student_id_cards: [
      {
        questionText: "What specifically is the issue with your student ID card?",
        type: "single",
        options: [
          { id: "1", label: "Lost or stolen", value: "lost_or_stolen" },
          { id: "2", label: "Damaged or not working", value: "damaged" },
          { id: "3", label: "Never received", value: "not_received" },
          { id: "4", label: "Need replacement", value: "replacement" },
        ],
        slotKey: "what",
      },
      {
        questionText: "When did this issue occur or when did you first notice it?",
        type: "text",
        slotKey: "when",
      },
      {
        questionText: "Where were you when this happened? (e.g., on campus, at home, etc.)",
        type: "text",
        slotKey: "where",
      },
    ],
    enrolment: [
      {
        questionText: "What is the specific enrolment issue you're experiencing?",
        type: "single",
        options: [
          { id: "1", label: "Cannot enroll in a course", value: "cannot_enroll" },
          { id: "2", label: "Enrolment verification needed", value: "verification" },
          { id: "3", label: "Course is full", value: "course_full" },
          { id: "4", label: "Prerequisites issue", value: "prerequisites" },
        ],
        slotKey: "what",
      },
      {
        questionText: "Which course or courses are affected? (Please provide course codes if possible)",
        type: "text",
        slotKey: "which_courses",
      },
      {
        questionText: "When do you need this resolved by? (e.g., before semester starts, ASAP, etc.)",
        type: "text",
        slotKey: "when",
      },
    ],
    academic_records: [
      {
        questionText: "What type of academic record do you need?",
        type: "single",
        options: [
          { id: "1", label: "Official transcript", value: "transcript" },
          { id: "2", label: "Grade report", value: "grade_report" },
          { id: "3", label: "Degree certificate", value: "degree_certificate" },
          { id: "4", label: "Course completion letter", value: "completion_letter" },
        ],
        slotKey: "what",
      },
      {
        questionText: "What is the purpose of this request? (e.g., job application, further study, etc.)",
        type: "text",
        slotKey: "why",
      },
      {
        questionText: "When do you need this document by?",
        type: "text",
        slotKey: "when",
      },
    ],
    finance_fees: [
      {
        questionText: "What is your finance or fees question about?",
        type: "single",
        options: [
          { id: "1", label: "Payment issue", value: "payment_issue" },
          { id: "2", label: "Fee waiver or reduction", value: "fee_waiver" },
          { id: "3", label: "Financial aid", value: "financial_aid" },
          { id: "4", label: "Refund inquiry", value: "refund" },
        ],
        slotKey: "what",
      },
      {
        questionText: "Please describe the specific situation or what you've already tried:",
        type: "text",
        slotKey: "description",
      },
      {
        questionText: "How urgent is this matter? (e.g., payment deadline approaching, etc.)",
        type: "text",
        slotKey: "urgency",
      },
    ],
    accommodation: [
      {
        questionText: "What type of accommodation issue are you facing?",
        type: "single",
        options: [
          { id: "1", label: "Application or booking", value: "application" },
          { id: "2", label: "Maintenance issue", value: "maintenance" },
          { id: "3", label: "Roommate issue", value: "roommate" },
          { id: "4", label: "Contract or payment", value: "contract_payment" },
        ],
        slotKey: "what",
      },
      {
        questionText: "Where is your accommodation located? (e.g., building name, room number if applicable)",
        type: "text",
        slotKey: "where",
      },
      {
        questionText: "When did this issue start or when do you need assistance?",
        type: "text",
        slotKey: "when",
      },
    ],
    library: [
      {
        questionText: "What library service do you need help with?",
        type: "single",
        options: [
          { id: "1", label: "Book loan or return", value: "book_loan" },
          { id: "2", label: "Access to resources", value: "access" },
          { id: "3", label: "Study space booking", value: "study_space" },
          { id: "4", label: "Research assistance", value: "research" },
        ],
        slotKey: "what",
      },
      {
        questionText: "Please provide more details about your request:",
        type: "text",
        slotKey: "details",
      },
    ],
    it_support: [
      {
        questionText: "What IT issue are you experiencing?",
        type: "single",
        options: [
          { id: "1", label: "Login or password problem", value: "login_password" },
          { id: "2", label: "Email issue", value: "email" },
          { id: "3", label: "Software access", value: "software" },
          { id: "4", label: "Network or WiFi", value: "network" },
        ],
        slotKey: "what",
      },
      {
        questionText: "When did you first encounter this problem?",
        type: "text",
        slotKey: "when",
      },
      {
        questionText: "What have you already tried to fix it?",
        type: "text",
        slotKey: "tried",
      },
    ],
  };

  // Default questions if category not found
  const defaultQuestions: PlannedQuestion[] = [
    {
      questionText: "What is the main issue you're experiencing?",
      type: "text",
      slotKey: "what",
    },
    {
      questionText: "When did this issue occur?",
      type: "text",
      slotKey: "when",
    },
    {
      questionText: "Please provide any additional details that might help us assist you:",
      type: "text",
      slotKey: "additional_details",
    },
  ];

  // Return category-specific questions or defaults
  const questions = fallbackQuestions[categoryKey] || defaultQuestions;

  return { questions };
}

/**
 * Utility to convert planned questions to the format expected by question_nodes
 * This helps maintain consistency between DB-driven and LLM-planned questions.
 */
export function convertPlannedQuestionsToQuestionNodes(
  questions: PlannedQuestion[],
  issueKey: string
) {
  return questions.map((q, index) => ({
    id: `llm-planned-${index}`,
    issue_key: issueKey,
    order_index: index,
    question_text: q.questionText,
    type: q.type,
    options: q.options || null,
    slot_key: q.slotKey || null,
  }));
}
