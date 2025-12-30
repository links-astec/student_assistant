// /api/email/subcategories/[category]/route.ts
// Get subcategories for a specific email category

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface RouteParams {
  params: { category: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { category } = params;

    const response = await fetch(
      `${BACKEND_URL}/api/email/subcategories/${encodeURIComponent(category)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Category not found", subcategories: [] },
          { status: 404 }
        );
      }
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      category,
      ...data,
    });
  } catch (error) {
    console.error("[Email Subcategories] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 }
    );
  }
}
