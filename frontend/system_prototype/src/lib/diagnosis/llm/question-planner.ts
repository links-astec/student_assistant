// LLM-based Question Planner
// Connects to the backend for dynamic question generation

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IQuestionPlanner, Question } from "../interfaces";
import { RuleBasedQuestionPlanner } from "../rule-based/question-planner";

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export class LLMQuestionPlanner implements IQuestionPlanner {
  private fallback: RuleBasedQuestionPlanner;

  constructor(supabase: SupabaseClient) {
    this.fallback = new RuleBasedQuestionPlanner(supabase);
  }

  async nextQuestion(
    issueKey: string,
    currentIndex: number
  ): Promise<Question | null> {
    try {
      console.log("[LLM Question Planner] Calling backend for next question...");

      // Call the backend chat endpoint to generate a contextual question
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `As a student support assistant, generate ONE follow-up question (question ${currentIndex + 1}) to better understand this student's issue about "${issueKey.replace(/_/g, " ")}". Keep it concise and relevant. Respond with ONLY the question text, nothing else.`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend question generation failed: ${response.status}`);
      }

      const data = await response.json();
      const questionText = data.data?.message || data.message;

      if (questionText && questionText.length < 500) {
        console.log("[LLM Question Planner] Generated question from backend");
        return {
          text: questionText.replace(/^["']|["']$/g, "").trim(),
          type: "text",
          slotKey: `llm_q${currentIndex + 1}`,
        };
      }

      throw new Error("Invalid question response");
    } catch (error) {
      console.error("[LLM Question Planner] Error:", error);
      console.log("[LLM Question Planner] Falling back to rule-based planner");
      return this.fallback.nextQuestion(issueKey, currentIndex);
    }
  }

  async getTotalQuestions(issueKey: string): Promise<number> {
    // LLM mode uses dynamic questions, typically 2-4
    return 3;
  }
}
