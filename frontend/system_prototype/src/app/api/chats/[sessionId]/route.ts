// /api/chats/[sessionId] - Get a specific chat session
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";

interface ChatStateJsonb {
  phase: string;
  messages: { role: string; content: string; timestamp: string }[];
  studentInfo?: {
    fullName?: string | null;
    studentId?: string | null;
    programme?: string | null;
  };
  selectedTopCategoryKey?: string | null;
  selectedSubcategoryKey?: string | null;
  selectedIssueKey?: string | null;
  collectedSlots?: Record<string, string>;
  originalMessage?: string | null;
}

// GET - Get a specific chat session
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    console.log(`[Chat API] Fetching session ${sessionId}`);
    const supabase = createSupabaseClient();

    // First, try to get from chat_state
    const { data, error } = await supabase
      .from("chat_state")
      .select("session_id, state_jsonb, updated_at")
      .eq("session_id", sessionId)
      .single();

    if (error) {
      console.error(`[Chat API] Supabase error for session ${sessionId}:`, error.message);
    }
    
    console.log(`[Chat API] Chat state query result:`, data ? "Found" : "Not found", error ? `Error: ${error.message}` : "");
    
    if (!data) {
      console.warn(`[Chat API] No chat_state found for session ${sessionId}`);
      
      // Return empty state instead of 404 - let the frontend start a new conversation
      console.log(`[Chat API] Returning empty state for missing session ${sessionId}`);
      return NextResponse.json({
        success: true,
        sessionId: sessionId,
        updatedAt: new Date().toISOString(),
        state: {
          phase: "initial",
          messages: [],
          studentInfo: { fullName: null, studentId: null, programme: null },
          selectedTopCategoryKey: null,
          selectedSubcategoryKey: null,
          selectedIssueKey: null,
          collectedSlots: {},
        },
        result: null,
      });
    }

    const state = data.state_jsonb as ChatStateJsonb;

    // If phase is complete, generate result data
    let result = null;
    if (state.phase === "complete" && state.selectedIssueKey) {
      // Fetch contact info
      const { data: contactData } = await supabase
        .from("contacts")
        .select("*")
        .eq("issue_key", state.selectedIssueKey)
        .single();

      // Fetch issue variant for source URL
      const { data: issueVariant } = await supabase
        .from("issue_variants")
        .select("source_url, title")
        .eq("key", state.selectedIssueKey)
        .single();

      result = {
        issueKey: state.selectedIssueKey,
        summary: `Your enquiry about ${issueVariant?.title || state.selectedIssueKey.replace(/_/g, " ")}`,
        slots: state.collectedSlots || {},
        studentInfo: state.studentInfo || { fullName: "", studentId: "", programme: "" },
        sourceUrls: issueVariant?.source_url ? [issueVariant.source_url] : [],
        contact: contactData ? {
          departmentName: contactData.department_name,
          emails: contactData.emails || [],
          phones: contactData.phones || [],
          hoursText: contactData.hours_text,
          links: contactData.links || [],
        } : {
          departmentName: "Student Services",
          emails: ["studentsupport@coventry.ac.uk"],
          phones: [],
          hoursText: "Monday - Friday: 9:00 AM - 5:00 PM",
          links: [],
        },
        emailDraft: null, // Email would need to be regenerated
      };
    }

    return NextResponse.json({
      success: true,
      sessionId: data.session_id,
      updatedAt: data.updated_at,
      state: {
        phase: state.phase,
        messages: state.messages || [],
        studentInfo: state.studentInfo,
        selectedTopCategoryKey: state.selectedTopCategoryKey,
        selectedSubcategoryKey: state.selectedSubcategoryKey,
        selectedIssueKey: state.selectedIssueKey,
        collectedSlots: state.collectedSlots,
      },
      result,
    });
  } catch (err) {
    console.error("[Chat API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
