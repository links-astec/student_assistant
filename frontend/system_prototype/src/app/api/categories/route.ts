// GET /api/categories - Returns primary and secondary category groups
// Cached for performance

import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/supabase/types";

export const runtime = "edge";

// Cache for 5 minutes
export const revalidate = 300;

// Fixed mapping of primary vs secondary categories (must match DB keys exactly)
const PRIMARY_KEYS = [
  "digital_information",
  "enrolment",
  "exams_results",
  "finance",
  "international_students",
  "student_id_cards",
  "timetables_attendance",
];

const SECONDARY_KEYS = [
  "after_graduation",
  "campus_facilities",
  "campus_life_services",
  "student_wellbeing",
  "study_support",
  "student_records",
  "student_journey",
];

export async function GET() {
  try {
    const supabase = createSupabaseClient();

    // Fetch top-level categories (where parent_key is null)
    const { data: nodes, error } = await supabase
      .from("issue_nodes")
      .select("key, title, description, sort_order")
      .is("parent_key", null)
      .order("sort_order");

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    const allCategories: Category[] = (nodes || []).map((node) => ({
      key: node.key,
      title: node.title,
      description: node.description,
    }));

    // Split into primary and secondary based on keys
    const primary = PRIMARY_KEYS.map((key) =>
      allCategories.find((cat) => cat.key === key)
    ).filter((cat): cat is Category => cat !== undefined);

    const secondary = SECONDARY_KEYS.map((key) =>
      allCategories.find((cat) => cat.key === key)
    ).filter((cat): cat is Category => cat !== undefined);

    // Warn about missing categories in development
    if (process.env.NODE_ENV === "development") {
      const missingPrimary = PRIMARY_KEYS.filter(
        (key) => !allCategories.find((cat) => cat.key === key)
      );
      const missingSecondary = SECONDARY_KEYS.filter(
        (key) => !allCategories.find((cat) => cat.key === key)
      );

      if (missingPrimary.length > 0) {
        console.warn("[Categories API] Missing primary categories:", missingPrimary);
      }
      if (missingSecondary.length > 0) {
        console.warn("[Categories API] Missing secondary categories:", missingSecondary);
      }
    }

    return NextResponse.json({
      primary,
      secondary,
      all: allCategories,
    });
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
