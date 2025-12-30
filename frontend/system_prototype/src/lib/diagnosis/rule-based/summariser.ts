// Simple Summariser
// Generates one-sentence summary from issue and slots

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IssueVariantRow } from "@/lib/supabase/types";
import type { ISummariser } from "../interfaces";

export class SimpleSummariser implements ISummariser {
  constructor(private supabase: SupabaseClient) {}

  async summarise(
    issueKey: string,
    slots: Record<string, string>,
    answers: string[]
  ): Promise<string> {
    // Fetch the issue variant title
    const { data: variant } = await this.supabase
      .from("issue_variants")
      .select("title")
      .eq("key", issueKey)
      .single();

    const v = variant as IssueVariantRow | null;
    const issueTitle = v?.title || issueKey;

    // Build context from answers
    const answerContext = answers.length > 0 ? ` (${answers.join(", ")})` : "";

    // Build urgency context
    const urgency = slots.urgency_or_deadline;
    const urgencyContext = urgency ? ` - ${urgency}` : "";

    return `You need help with: ${issueTitle}${answerContext}${urgencyContext}.`;
  }
}
