// LLM-based Email Drafter
// Connects to the Coventry Student Assistant backend for 5W1H email generation

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IEmailDrafter, EmailDraft, StudentInfo } from "../interfaces";
import { TemplateEmailDrafter } from "../rule-based/email-drafter";

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export class LLMEmailDrafter implements IEmailDrafter {
  private fallback: TemplateEmailDrafter;

  constructor(supabase: SupabaseClient) {
    this.fallback = new TemplateEmailDrafter(supabase);
  }

  async draft(
    issueKey: string,
    slots: Record<string, string>,
    studentInfo?: StudentInfo
  ): Promise<EmailDraft> {
    try {
      console.log("[LLM Email Drafter] Calling backend for 5W1H email...");
      console.log("[LLM Email Drafter] Slots received:", slots);

      // Build the message from slots - prioritize actual user descriptions
      // Look for: original_problem, description, what, specific_question, then fallback to issueKey
      const problemDescription = 
        slots.original_problem ||       // Original user message from chat
        slots.description ||            // User's detailed description
        slots.what ||                   // 5W1H What slot
        slots.specific_question ||      // Legacy specific question
        slots.problem_details ||        // Alternative detail slot
        issueKey.replace(/_/g, " ");    // Fallback to issue key

      // Build additional context from all slots for better email generation
      const additionalContext = {
        when: slots.when || slots.urgency_or_deadline || slots.urgency || "",
        where: slots.where || "",
        why: slots.why || "",
        how: slots.tried || slots.details || "",
      };

      console.log("[LLM Email Drafter] Problem description:", problemDescription);
      console.log("[LLM Email Drafter] Additional context:", additionalContext);

      // Call the backend email generation endpoint
      const response = await fetch(`${BACKEND_URL}/api/email/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studentInfo?.fullName || slots.student_name || "Student",
          studentId: studentInfo?.studentId || slots.student_id || "",
          course: studentInfo?.programme || slots.programme_or_year || "",
          message: problemDescription,
          additionalContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend email generation failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.template) {
        console.log("[LLM Email Drafter] Successfully generated 5W1H email");
        return {
          subject: data.template.subject,
          body: data.template.body,
          to: data.template.to,
          department: data.template.department,
        };
      }

      throw new Error("Invalid response from backend");
    } catch (error) {
      console.error("[LLM Email Drafter] Error calling backend:", error);
      console.log("[LLM Email Drafter] Falling back to template drafter");
      return this.fallback.draft(issueKey, slots, studentInfo);
    }
  }
}
