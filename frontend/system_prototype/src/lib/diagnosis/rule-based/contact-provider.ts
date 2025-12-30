// Contact Provider
// Retrieves contact information for issues

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContactRow } from "@/lib/supabase/types";
import type { IContactProvider, ContactInfo } from "../interfaces";

export class ContactProvider implements IContactProvider {
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
      console.log(`[ContactProvider] Resolved alias: ${issueKey} -> ${alias.canonical_key}`);
      return alias.canonical_key;
    }

    return issueKey;
  }

  /**
   * Check if an email is a placeholder
   */
  private isPlaceholderEmail(email: string): boolean {
    return (
      email.includes('university.edu') ||
      email.includes('@example.') ||
      email.includes('@placeholder.')
    );
  }

  /**
   * Check if a phone number is a placeholder
   */
  private isPlaceholderPhone(phone: string): boolean {
    return phone.includes('555');
  }

  /**
   * Filter out placeholder emails and phones from contact data
   */
  private filterPlaceholders(
    emails: string[],
    phones: string[]
  ): { emails: string[]; phones: string[] } {
    return {
      emails: emails.filter(email => !this.isPlaceholderEmail(email)),
      phones: phones.filter(phone => !this.isPlaceholderPhone(phone)),
    };
  }

  async getContact(issueKey: string): Promise<ContactInfo | null> {
    console.log(`[ContactProvider] Fetching contact for issue_key="${issueKey}"`);

    // Resolve aliases first
    const resolvedKey = await this.resolveIssueKey(issueKey);

    const { data: contact, error } = await this.supabase
      .from("contacts")
      .select("*")
      .eq("issue_key", resolvedKey)
      .single();

    if (error) {
      console.warn(`[ContactProvider] Query error for issue_key="${resolvedKey}": ${error.message}`, error.details, error.hint);
      return null;
    }

    if (!contact) {
      console.warn(`[ContactProvider] No contact found for issue_key="${resolvedKey}"`);
      return null;
    }

    const c = contact as ContactRow;
    console.log(`[ContactProvider] Found contact for "${resolvedKey}": ${c.department_name}, ${c.emails?.length || 0} emails, ${c.phones?.length || 0} phones`);

    // Filter out placeholder emails and phones
    const filtered = this.filterPlaceholders(c.emails || [], c.phones || []);

    // Log if placeholders were filtered out
    const originalCount = (c.emails?.length || 0) + (c.phones?.length || 0);
    const filteredCount = filtered.emails.length + filtered.phones.length;
    if (filteredCount < originalCount) {
      console.warn(
        `[ContactProvider] Filtered ${originalCount - filteredCount} placeholder contact(s) for ${resolvedKey}`
      );
    }

    return {
      departmentName: c.department_name,
      emails: filtered.emails,
      phones: filtered.phones,
      hoursText: c.hours_text || "",
      links: c.links || [],
    };
  }
}
