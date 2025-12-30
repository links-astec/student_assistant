// /api/feedback/session/[sessionId]/route.ts
// Get feedback for a specific session

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface RouteParams {
  params: { sessionId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = params;

    const response = await fetch(
      `${BACKEND_URL}/api/feedback/session/${encodeURIComponent(sessionId)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Session not found", feedback: null },
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
    console.error("[Feedback Session] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session feedback" },
      { status: 500 }
    );
  }
}
