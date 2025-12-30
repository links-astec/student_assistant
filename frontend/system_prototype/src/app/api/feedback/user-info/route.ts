// /api/feedback/user-info/route.ts
// Update user info for analytics tracking

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface UserInfoRequest {
  conversationId: string;
  userEmail?: string;
  studentId?: string;
  course?: string;
  yearOfStudy?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: UserInfoRequest = await request.json();
    const { conversationId, userEmail, studentId, course, yearOfStudy } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Call the backend user-info endpoint
    const response = await fetch(`${BACKEND_URL}/api/feedback/user-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        userEmail,
        studentId,
        course,
        yearOfStudy,
      }),
    });

    if (!response.ok) {
      console.warn("Backend user-info update failed:", response.status);
    }

    const data = await response.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: "User info updated",
      ...data,
    });
  } catch (error) {
    console.error("[User Info API] Error:", error);
    return NextResponse.json({
      success: true,
      message: "User info received (offline mode)",
    });
  }
}
