// POST /api/assistant - Direct connection to backend RAG chatbot
// This provides intelligent AI responses using Ollama + school knowledge base

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Backend API URL (Ollama + RAG system)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface AssistantRequest {
  message: string;
  conversationId?: string;
  studentInfo?: {
    fullName?: string;
    studentId?: string;
    programme?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AssistantRequest = await request.json();
    const { message, conversationId, studentInfo } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    console.log("[Assistant API] Calling backend RAG system...");

    // Call the backend chat endpoint
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversationId,
        userId: studentInfo?.studentId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Assistant API] Backend error:", errorText);
      throw new Error(`Backend chat failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the response
    const chatData = data.data || data;

    return NextResponse.json({
      success: true,
      message: chatData.message,
      conversationId: chatData.conversationId,
      sources: chatData.sources || [],
      classification: chatData.classification,
      contact: chatData.contact,
    });
  } catch (error) {
    console.error("[Assistant API] Error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to get response from AI assistant",
      message: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or select a category from the options above.",
    }, { status: 503 });
  }
}

// Also support GET for health check
export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    
    return NextResponse.json({
      frontend: "healthy",
      backend: data.status || "unknown",
      backendUrl: BACKEND_URL,
    });
  } catch (error) {
    return NextResponse.json({
      frontend: "healthy",
      backend: "unavailable",
      backendUrl: BACKEND_URL,
      error: String(error),
    });
  }
}
