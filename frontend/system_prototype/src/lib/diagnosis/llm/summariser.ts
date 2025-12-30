// LLM-based Summariser
// Connects to the Coventry Student Assistant backend for intelligent summaries

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ISummariser } from "../interfaces";
import { SimpleSummariser } from "../rule-based/summariser";

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export class LLMSummariser implements ISummariser {
  private fallback: SimpleSummariser;

  constructor(supabase: SupabaseClient) {
    this.fallback = new SimpleSummariser(supabase);
  }

  async summarise(
    issueKey: string,
    slots: Record<string, string>,
    answers: string[]
  ): Promise<string> {
    try {
      console.log("[LLM Summariser] Calling backend for intelligent summary...");

      // Build context from issue and answers
      const context = `Issue: ${issueKey.replace(/_/g, " ")}\nAnswers provided: ${answers.join(", ")}\nDetails: ${JSON.stringify(slots)}`;

      // Call the backend chat endpoint for a summary
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Please provide a brief summary of this student's issue and next steps: ${context}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend chat failed: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.data?.message || data.message;

      if (summary) {
        console.log("[LLM Summariser] Successfully generated summary");
        return summary;
      }

      throw new Error("No summary in response");
    } catch (error) {
      console.error("[LLM Summariser] Error calling backend:", error);
      console.log("[LLM Summariser] Falling back to simple summariser");
      return this.fallback.summarise(issueKey, slots, answers);
    }
  }
}
