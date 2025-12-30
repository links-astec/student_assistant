// GET /api/bootstrap - Lightweight taxonomy snapshot for client UI
// Safe to cache for performance

import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { TaxonomyNode, IssueNodeRow, IssueVariantRow } from "@/lib/supabase/types";

export const runtime = "edge";

// Cache the bootstrap response for 5 minutes
export const revalidate = 300;

export async function GET() {
  try {
    const supabase = createSupabaseClient();

    // Fetch all issue nodes
    const { data: nodes, error: nodesError } = await supabase
      .from("issue_nodes")
      .select("key, parent_key, title, sort_order")
      .order("sort_order");

    if (nodesError) {
      console.error("Error fetching nodes:", nodesError);
      return NextResponse.json(
        { error: "Failed to fetch taxonomy" },
        { status: 500 }
      );
    }

    // Fetch all issue variants
    const { data: variants, error: variantsError } = await supabase
      .from("issue_variants")
      .select("key, issue_node_key, title");

    if (variantsError) {
      console.error("Error fetching variants:", variantsError);
      return NextResponse.json(
        { error: "Failed to fetch variants" },
        { status: 500 }
      );
    }

    // Build taxonomy tree
    const nodeMap = new Map<string, TaxonomyNode>();
    const rootNodes: TaxonomyNode[] = [];

    const typedNodes = (nodes || []) as IssueNodeRow[];
    const typedVariants = (variants || []) as IssueVariantRow[];

    // Create all nodes first
    for (const node of typedNodes) {
      nodeMap.set(node.key, {
        key: node.key,
        title: node.title,
        children: [],
        variants: [],
      });
    }

    // Attach variants to their parent nodes
    for (const variant of typedVariants) {
      const parentNode = nodeMap.get(variant.issue_node_key);
      if (parentNode) {
        parentNode.variants.push({
          key: variant.key,
          title: variant.title,
        });
      }
    }

    // Build the tree structure
    for (const node of typedNodes) {
      const taxonomyNode = nodeMap.get(node.key)!;
      if (node.parent_key) {
        const parent = nodeMap.get(node.parent_key);
        if (parent) {
          parent.children.push(taxonomyNode);
        }
      } else {
        rootNodes.push(taxonomyNode);
      }
    }

    return NextResponse.json({
      taxonomy: rootNodes,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Bootstrap API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
