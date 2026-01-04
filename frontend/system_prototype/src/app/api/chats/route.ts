// /api/chats - List and manage chat history
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient, createSupabaseServiceClient } from "@/lib/supabase/client";

function getClientIdentifier(request: NextRequest): string {
  // Priority 1: Device ID from client (for local dev and session isolation)
  const deviceId = request.headers.get("x-device-id");
  if (deviceId && deviceId !== "unknown") {
    return deviceId;
  }
  
  // Priority 2: Real IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp;
  
  if (ip && ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1") {
    return `ip:${ip}`;
  }
  
  // Fallback: unknown (but this means all sessions are shared)
  return "unknown";
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

// GET - List chat sessions for current user (by device ID or IP)
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    console.log("[Chats API] Fetching chats for client:", clientId);
    
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

    // Filter by client identifier - only show user's own chats
    const chats: ChatSummary[] = [];
    for (const row of data) {
      try {
        const state = row.state_jsonb as ChatStateJsonb;
        if (!state) continue;
        
        // Filter by client ID
        const storedClientId = state.clientIp; // This field stores device ID or IP
        
        // Skip if stored ID exists and doesn't match current client
        if (storedClientId && storedClientId !== "unknown" && storedClientId !== clientId) {
          continue;
        }
        
        // If both are "unknown", allow it (fallback for migration/testing)
        // This means in the worst case, local dev without device IDs will share sessions
        
        const messages = state.messages || [];
        const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
        
        chats.push({
          sessionId: row.session_id,
          createdAt: messages[0]?.timestamp || row.updated_at,
          updatedAt: row.updated_at,
          studentName: state.studentInfo?.fullName || "Anonymous",
          studentId: state.studentInfo?.studentId || "",
          category: typeof state.selectedTopCategoryKey === "string" 
            ? state.selectedTopCategoryKey.replace(/_/g, " ") 
            : "Not selected",
          issueKey: typeof state.selectedIssueKey === "string"
            ? state.selectedIssueKey.replace(/_/g, " ")
            : "",
          phase: state.phase || "initial",
          messageCount: messages.length,
          lastMessage: lastUserMessage?.content?.slice(0, 100) || "No messages",
        });
      } catch (parseErr) {
        console.error("[Chats API] Error parsing chat state:", parseErr);
        continue;
      }
    }

    console.log(`[Chats API] Found ${chats.length} chats for client ${clientId}`);
    
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
    const clientId = getClientIdentifier(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    console.log(`[Chats DELETE] Deleting session: ${sessionId} for client: ${clientId}`);
    
    // Use service role client for delete operations (bypasses RLS)
    let supabase;
    try {
      supabase = createSupabaseServiceClient();
      console.log("[Chats DELETE] Using service role client");
    } catch (err) {
      console.log("[Chats DELETE] Service role not available, using anon client");
      supabase = createSupabaseClient();
    }

    // Check if THIS specific session exists
    const { data: existingState, error: checkError } = await supabase
      .from("chat_state")
      .select("session_id, state_jsonb")
      .eq("session_id", sessionId);
    
    console.log(`[Chats DELETE] Session ${sessionId} exists:`, existingState, checkError);

    // First, verify the session belongs to this user (by IP)
    const { data: chatState, error: fetchError } = await supabase
      .from("chat_state")
      .select("state_jsonb")
      .eq("session_id", sessionId)
      .single();

    if (fetchError || !chatState) {
      console.error(`[Chats DELETE] Session not found:`, fetchError);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check ownership (client ID must match)
    const state = chatState.state_jsonb as ChatStateJsonb;
    const storedClientId = state?.clientIp; // This field stores device ID or IP
    
    // Allow deletion if:
    // 1. Both IDs are unknown (fallback)
    // 2. IDs match
    // 3. Session has no stored ID (backward compatibility)
    if (storedClientId && storedClientId !== "unknown" && storedClientId !== clientId) {
      console.error(`[Chats DELETE] Client ID mismatch: ${storedClientId} vs ${clientId}`);
      return NextResponse.json({ error: "Unauthorized - this chat belongs to another device" }, { status: 403 });
    }

    // Delete from chat_state
    console.log(`[Chats DELETE] Attempting to delete from chat_state where session_id = ${sessionId}`);
    const { data: deletedState, error: stateError } = await supabase
      .from("chat_state")
      .delete()
      .eq("session_id", sessionId)
      .select();

    const stateCount = deletedState?.length || 0;
    console.log(`[Chats DELETE] chat_state delete result: count=${stateCount}, error=${stateError?.message || 'none'}`);

    if (stateError) {
      console.error(`[Chats DELETE] Error deleting chat_state:`, stateError);
      return NextResponse.json(
        { error: "Failed to delete chat state", details: stateError.message },
        { status: 500 }
      );
    }

    // Delete from chat_sessions
    console.log(`[Chats DELETE] Attempting to delete from chat_sessions where id = ${sessionId}`);
    const { data: deletedSession, error: sessionError } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId)
      .select();

    const sessionCount = deletedSession?.length || 0;
    console.log(`[Chats DELETE] chat_sessions delete result: count=${sessionCount}, error=${sessionError?.message || 'none'}`);

    if (sessionError) {
      console.error(`[Chats DELETE] Error deleting chat_sessions:`, sessionError);
      return NextResponse.json(
        { error: "Failed to delete chat session", details: sessionError.message },
        { status: 500 }
      );
    }

    console.log(`[Chats DELETE] Successfully deleted: ${stateCount} state + ${sessionCount} sessions`);

    return NextResponse.json({ 
      success: true, 
      message: "Chat deleted successfully",
      deleted: {
        chat_state: stateCount || 0,
        chat_sessions: sessionCount || 0
      }
    });
  } catch (err) {
    console.error("[Chats DELETE] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) }, 
      { status: 500 }
    );
  }
}
