// /api/tracking/route.ts
// Real-time session tracking API

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Backend URL configuration
// Development: http://localhost:3000
// Production: Set NEXT_PUBLIC_BACKEND_URL in environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// POST - Register/update session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get client IP from headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0] || "unknown";
    
    const response = await fetch(`${BACKEND_URL}/api/tracking/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": clientIp,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Tracking API] Error:", error);
    return NextResponse.json(
      { error: "Failed to track session" },
      { status: 500 }
    );
  }
}

// GET - Get active sessions or stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "active";
    
    const endpoint = type === "stats" ? "stats" : "active";
    
    const response = await fetch(`${BACKEND_URL}/api/tracking/${endpoint}`);
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Tracking API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking data" },
      { status: 500 }
    );
  }
}
