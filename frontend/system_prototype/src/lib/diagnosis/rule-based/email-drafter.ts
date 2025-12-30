// Template-based Email Drafter
// Renders 5W1H templates with slot values

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailTemplateRow } from "@/lib/supabase/types";
import type { IEmailDrafter, EmailDraft, StudentInfo } from "../interfaces";

export class TemplateEmailDrafter implements IEmailDrafter {
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
      console.log(`[EmailDrafter] Resolved alias: ${issueKey} -> ${alias.canonical_key}`);
      return alias.canonical_key;
    }

    return issueKey;
  }

  async draft(
    issueKey: string,
    slots: Record<string, string>,
    studentInfo?: StudentInfo
  ): Promise<EmailDraft> {
    // Resolve aliases first
    const resolvedKey = await this.resolveIssueKey(issueKey);

    // Fetch the email template
    const { data: template, error } = await this.supabase
      .from("email_templates")
      .select("*")
      .eq("issue_key", resolvedKey)
      .single();

    if (error || !template) {
      // Return a generic template if none found
      return {
        subject: `Inquiry: ${issueKey}`,
        body: this.generateGenericEmail(slots, studentInfo),
      };
    }

    const t = template as EmailTemplateRow;

    // Replace placeholders in templates
    const subject = this.replacePlaceholders(t.subject_template, slots);
    let body = this.replacePlaceholders(t.body_template_5w1h, slots);

    // Prepend student info to body if provided
    if (studentInfo) {
      const studentIntro = this.generateStudentIntro(studentInfo);
      body = `${studentIntro}\n\n${body}`;
    }

    return { subject, body };
  }

  private replacePlaceholders(
    template: string,
    slots: Record<string, string>
  ): string {
    let result = template;

    // Replace {{key}} patterns with slot values
    for (const [key, value] of Object.entries(slots)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(placeholder, value || `[${key}]`);
    }

    // Replace any remaining placeholders with bracketed key names
    result = result.replace(/\{\{(\w+)\}\}/g, "[$1]");

    return result;
  }

  private generateStudentIntro(studentInfo: StudentInfo): string {
    return `Dear Team,

I am ${studentInfo.fullName}, Student ID: ${studentInfo.studentId}, from ${studentInfo.programme}.`;
  }

  private generateGenericEmail(
    slots: Record<string, string>,
    studentInfo?: StudentInfo
  ): string {
    const intro = studentInfo
      ? this.generateStudentIntro(studentInfo)
      : `Dear Team,

I am ${slots.student_name || "[Your Name]"}, Student ID: ${slots.student_id || "[Your Student ID]"}.`;

    return `${intro}

**WHAT:** I am writing regarding an inquiry.

**WHEN:** ${slots.urgency_or_deadline || "[Please specify timeline]"}

**WHERE:** [Location if applicable]

**WHY:** [Reason for inquiry]

**HOW:** Please advise on next steps.

Best regards,
${studentInfo?.fullName || slots.student_name || "[Your Name]"}`;
  }
}
