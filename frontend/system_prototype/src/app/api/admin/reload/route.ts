// /api/admin/reload/route.ts
// Admin endpoint to reload document embeddings
// This triggers a full re-embed of all documents

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const authHeader = request.headers.get("authorization");
    // if (!authHeader || !validateAdminToken(authHeader)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const response = await fetch(`${BACKEND_URL}/api/search/reload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Backend reload failed: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Document reload initiated",
      ...data,
    });
  } catch (error) {
    console.error("[Admin Reload] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate document reload" },
      { status: 500 }
    );
  }
}
