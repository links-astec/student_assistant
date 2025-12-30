// /api/email/categories/route.ts
// Get email contact categories from backend

import { NextResponse } from "next/server";

export const runtime = "edge";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/email/categories`);

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("[Email Categories] Error:", error);
    
    // Return fallback categories
    return NextResponse.json({
      success: true,
      categories: [
        "Student Support",
        "Finance",
        "Accommodation",
        "Academic",
        "IT Services",
        "Library",
        "International Office",
        "Careers",
        "Wellbeing",
      ],
      fallback: true,
    });
  }
}
