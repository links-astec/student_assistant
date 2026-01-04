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
      result = result.replace(placeholder, value || this.getDefaultValue(key));
    }

    // Replace any remaining placeholders with meaningful defaults
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => this.getDefaultValue(key));

    return result;
  }

  private getDefaultValue(key: string): string {
    const defaults: Record<string, string> = {
      // Student info defaults
      student_name: "Student",
      student_id: "Your Student ID",
      programme: "your programme",
      course: "your course",
      year: "your year of study",

      // Problem description defaults
      what: "the matter I'm contacting you about",
      description: "my inquiry",
      problem_details: "the issue I'm experiencing",
      specific_question: "my question",

      // Time/location defaults
      when: "recently",
      urgency: "as soon as possible",
      urgency_or_deadline: "as soon as possible",
      where: "Coventry University",
      location: "the university",

      // Reason defaults
      why: "it affects my studies",
      impact: "it affects my ability to study effectively",

      // Action defaults
      how: "I would appreciate your guidance",
      tried: "I haven't tried anything yet",
      details: "I need assistance with this matter",

      // Contact defaults
      contact_details: "my student email",
      phone: "my contact details if needed",
    };

    return defaults[key] || `[${key.replace(/_/g, ' ')}]`;
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

I am ${slots.student_name || "a student"}, Student ID: ${slots.student_id || "my student ID"}.`;

    const problem = slots.what || slots.description || slots.problem_details || "an issue I need assistance with";
    const when = slots.when || slots.urgency_or_deadline || "as soon as possible";
    const where = slots.where || "at Coventry University";
    const why = slots.why || "it affects my studies";
    const how = slots.how || slots.tried || "I would appreciate your guidance on how to resolve this";

    return `${intro}

I am writing regarding ${problem}.

When: ${when}
Where: ${where}
Why: ${why}
How: ${how}

I would be grateful for your assistance with this matter.

Best regards,
${studentInfo?.fullName || slots.student_name || "Student"}`;
  }
}
