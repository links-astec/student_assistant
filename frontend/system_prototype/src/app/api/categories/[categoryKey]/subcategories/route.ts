// GET /api/categories/[categoryKey]/subcategories
// Returns subcategories (children) of a given top-level category

import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";

export const runtime = "edge";

// Cache for 5 minutes
export const revalidate = 300;

interface RouteContext {
  params: {
    categoryKey: string;
  };
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { categoryKey } = context.params;

    if (!categoryKey) {
      return NextResponse.json(
        { error: "Category key is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    // Fetch subcategories (children of the specified category)
    const { data: subcategories, error } = await supabase
      .from("issue_nodes")
      .select("id, key, title, description")
      .eq("parent_key", categoryKey)
      .order("sort_order");

    if (error) {
      console.error("Error fetching subcategories:", error);
      return NextResponse.json(
        { error: "Failed to fetch subcategories" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subcategories: subcategories || [],
    });
  } catch (error) {
    console.error("Subcategories API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
