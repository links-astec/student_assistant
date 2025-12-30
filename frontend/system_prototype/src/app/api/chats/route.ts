// /api/chats - List and manage chat history
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
}

interface ChatStateJsonb {
  phase: string;
  messages: { role: string; content: string; timestamp: string }[];
  studentInfo?: {
    fullName?: string | null;
    studentId?: string | null;
    programme?: string | null;
  };
  selectedTopCategoryKey?: string | null;
  selectedIssueKey?: string | null;
  clientIp?: string;
}

interface ChatSummary {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  studentName: string;
  studentId: string;
  category: string;
  issueKey: string;
  phase: string;
  messageCount: number;
  lastMessage: string;
}

// GET - List chat sessions for current user (by IP)
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    console.log("[Chats API] Fetching chats for IP:", clientIp);
    
    let supabase;
    try {
      supabase = createSupabaseClient();
    } catch (err) {
      console.error("[Chats API] Failed to create Supabase client:", err);
      return NextResponse.json({ error: "Database connection error", chats: [] }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("chat_state")
      .select("session_id, state_jsonb, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[Chats API] Error fetching chats:", error);
      return NextResponse.json({ error: "Failed to fetch chats", chats: [] }, { status: 500 });
    }

    if (!data) {
      console.log("[Chats API] No data returned from Supabase");
      return NextResponse.json({ success: true, chats: [], total: 0 });
    }

    // Filter STRICTLY by client IP - only show user's own chats
    const chats: ChatSummary[] = [];
    for (const row of data) {
      try {
        const state = row.state_jsonb as ChatStateJsonb;
        if (!state) continue;
        
        // STRICT: Only show chats that match this user's IP
        if (state.clientIp !== clientIp) continue;
        
        const messages = state.messages || [];
        const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
        
        chats.push({
          sessionId: row.session_id,
          createdAt: messages[0]?.timestamp || row.updated_at,
          updatedAt: row.updated_at,
          studentName: state.studentInfo?.fullName || "Anonymous",
          studentId: state.studentInfo?.studentId || "",
          category: state.selectedTopCategoryKey?.replace(/_/g, " ") || "Not selected",
          issueKey: state.selectedIssueKey?.replace(/_/g, " ") || "",
          phase: state.phase || "initial",
          messageCount: messages.length,
          lastMessage: lastUserMessage?.content?.slice(0, 100) || "No messages",
        });
      } catch (parseErr) {
        console.error("[Chats API] Error parsing chat state:", parseErr);
        continue;
      }
    }

    console.log(`[Chats API] Found ${chats.length} chats for IP ${clientIp}`);
    
    return NextResponse.json({
      success: true,
      chats,
      total: chats.length,
    });
  } catch (err) {
    console.error("[Chats API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a specific chat session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const supabase = createSupabaseClient();

    // Delete from chat_state
    const { error: stateError } = await supabase
      .from("chat_state")
      .delete()
      .eq("session_id", sessionId);

    if (stateError) {
      console.error("[Chats API] Error deleting chat state:", stateError);
    }

    // Also try to delete from chat_sessions if it exists
    const { error: sessionError } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (sessionError) {
      console.error("[Chats API] Error deleting chat session:", sessionError);
    }

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (err) {
    console.error("[Chats API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
