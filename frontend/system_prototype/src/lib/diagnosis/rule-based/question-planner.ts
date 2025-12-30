// Rule-based Question Planner
// Walks through predefined question trees

import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionNodeRow } from "@/lib/supabase/types";
import type { IQuestionPlanner, Question } from "../interfaces";

export class RuleBasedQuestionPlanner implements IQuestionPlanner {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Resolve legacy issue keys to canonical Wayfinder keys
   */
  private async resolveIssueKey(issueKey: string): Promise<string> {
    const { data: alias } = await this.supabase
      .from("issue_key_aliases")
      .select("canonical_key")
      .eq("legacy_key", issueKey)
      .maybeSingle();

    if (alias) {
      console.log(`[QuestionPlanner] Resolved alias: ${issueKey} -> ${alias.canonical_key}`);
      return alias.canonical_key;
    }

    return issueKey;
  }

  async nextQuestion(
    issueKey: string,
    currentIndex: number
  ): Promise<Question | null> {
    // Resolve aliases first
    const resolvedKey = await this.resolveIssueKey(issueKey);

    // Fetch the next question in sequence
    const { data: question, error } = await this.supabase
      .from("question_nodes")
      .select("*")
      .eq("issue_key", resolvedKey)
      .eq("order_index", currentIndex + 1)
      .single();

    if (error || !question) {
      return null; // No more questions
    }

    const q = question as QuestionNodeRow;

    return {
      text: q.question_text,
      type: q.type as "single" | "text",
      options: q.options as Question["options"],
      slotKey: q.slot_key || undefined,
    };
  }

  async getTotalQuestions(issueKey: string): Promise<number> {
    // Resolve aliases first
    const resolvedKey = await this.resolveIssueKey(issueKey);

    const { count, error } = await this.supabase
      .from("question_nodes")
      .select("*", { count: "exact", head: true })
      .eq("issue_key", resolvedKey);

    if (error || count === null) {
      return 0;
    }

    return count;
  }
}
