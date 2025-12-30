// POST /api/feedback - Log user feedback to backend analytics
// Connects to the Coventry Student Assistant backend for Supabase logging

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Backend API URL (runs on port 3001)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface FeedbackRequest {
  sessionId?: string;
  conversationId?: string;
  rating?: number;
  feedbackText?: string;
  issueResolved?: boolean;
  category?: string;
  issueType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { 
      sessionId, 
      conversationId, 
      rating, 
      feedbackText, 
      issueResolved,
      category,
      issueType 
    } = body;

    // Call the backend feedback endpoint
    const response = await fetch(`${BACKEND_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conversationId || sessionId,
        rating,
        feedbackText,
        wasHelpful: issueResolved,
        category,
        issueType,
      }),
    });

    if (!response.ok) {
      console.warn("Backend feedback logging failed:", response.status);
      // Don't fail the request - feedback is non-critical
    }

    const data = await response.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: "Feedback received",
      ...data,
    });
  } catch (error) {
    console.error("Feedback error:", error);
    // Return success anyway - feedback is non-critical
    return NextResponse.json({
      success: true,
      message: "Feedback received (offline mode)",
    });
  }
}

// POST /api/feedback/resolve - Mark issue as resolved
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, conversationId, resolved } = body;

    const response = await fetch(`${BACKEND_URL}/api/feedback/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conversationId || sessionId,
        resolved: resolved ?? true,
      }),
    });

    const data = await response.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: "Resolution status updated",
      ...data,
    });
  } catch (error) {
    console.error("Resolve error:", error);
    return NextResponse.json({
      success: true,
      message: "Status updated (offline mode)",
    });
  }
}
