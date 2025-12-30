// POST /api/rag/chat - Connect to backend RAG chat system
// Proxies requests to the Coventry Student Assistant backend

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Backend API URL (runs on port 3001)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface RagChatRequest {
  message: string;
  conversationId?: string;
  studentName?: string;
  studentId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RagChatRequest = await request.json();
    const { message, conversationId, studentName, studentId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // Call the backend chat endpoint
    const chatResponse = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversationId,
        studentName,
        studentId,
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`Backend chat failed: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();

    return NextResponse.json({
      success: true,
      message: chatData.data?.message || chatData.message,
      conversationId: chatData.data?.conversationId || chatData.conversationId,
      sources: chatData.data?.sources || chatData.sources || [],
      classification: chatData.data?.classification || chatData.classification,
      contact: chatData.data?.contact || chatData.contact,
    });
  } catch (error) {
    console.error("RAG chat error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to connect to chat backend. Please try again.",
        message: "I'm sorry, I'm having trouble connecting to my knowledge base. Please try again in a moment."
      },
      { status: 503 }
    );
  }
}
