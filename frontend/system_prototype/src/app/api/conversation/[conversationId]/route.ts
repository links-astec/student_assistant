// /api/conversation/[conversationId]/route.ts
// Manage conversation history via backend

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface RouteParams {
  params: { conversationId: string };
}

// GET conversation history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = params;

    const response = await fetch(`${BACKEND_URL}/api/chat/${conversationId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("[Conversation API] Error fetching history:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation history" },
      { status: 500 }
    );
  }
}

// DELETE (clear) conversation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = params;

    const response = await fetch(`${BACKEND_URL}/api/chat/${conversationId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Conversation cleared",
      ...data,
    });
  } catch (error) {
    console.error("[Conversation API] Error clearing:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation" },
      { status: 500 }
    );
  }
}
