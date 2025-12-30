// /api/health/ready/route.ts
// Readiness check - backend services are ready

import { NextResponse } from "next/server";

export const runtime = "edge";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health/ready`, {
      // Short timeout for health checks
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Backend not ready: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      status: "ready",
      backend: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Health Ready] Backend check failed:", error);
    return NextResponse.json(
      {
        status: "degraded",
        backend: "unavailable",
        error: error instanceof Error ? error.message : "Backend connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
