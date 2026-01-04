// /api/health - Health check endpoint
// Returns the health status of the application

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    // Check if backend is responding
    const backendResponse = await fetch(`${BACKEND_URL}/api/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // Short timeout for health checks
      signal: AbortSignal.timeout(5000),
    });

    if (!backendResponse.ok) {
      console.error("[Health] Backend health check failed:", backendResponse.status);
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "Backend is not responding",
          frontend: "healthy",
          backend: "unhealthy",
        },
        { status: 503 }
      );
    }

    const backendHealth = await backendResponse.json();

    return NextResponse.json({
      status: "healthy",
      frontend: "healthy",
      backend: "healthy",
      backendUrl: BACKEND_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Health] Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        message: "Health check failed",
        frontend: "healthy",
        backend: "unhealthy",
        error: String(error),
      },
      { status: 503 }
    );
  }
}
