// Rule-based Issue Classifier
// Uses keyword matching to classify user messages

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IssueVariantRow, IssueNodeRow } from "@/lib/supabase/types";
import type { IIssueClassifier, ClassifiedCandidate } from "../interfaces";

export class RuleBasedClassifier implements IIssueClassifier {
  constructor(private supabase: SupabaseClient) {}

  async classify(
    text: string,
    categoryKey?: string | null,
    subcategoryKey?: string | null
  ): Promise<ClassifiedCandidate[]> {
    // Normalize input text
    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/);

    // Fetch all issue variants with their keywords
    const { data: variants, error } = await this.supabase
      .from("issue_variants")
      .select("key, title, keywords, issue_node_key");

    if (error || !variants) {
      console.error("Error fetching variants:", error);
      return [];
    }

    // Filter to prefer Wayfinder-ingested keys over legacy seed keys
    const filteredVariants = this.filterPreferWayfinderKeys(variants as IssueVariantRow[]);

    // Fetch parent nodes for additional keyword context
    // Prioritize subcategoryKey over categoryKey for filtering
    let categoryDescendants: Set<string> = new Set();
    const filterKey = subcategoryKey || categoryKey;
    if (filterKey) {
      categoryDescendants = await this.getCategoryDescendants(filterKey);
      console.log(
        `[Classifier] Filtering to ${categoryDescendants.size} node(s) under ${filterKey}`
      );
    }

    const { data: nodes } = await this.supabase
      .from("issue_nodes")
      .select("key, keywords");

    const nodeKeywords: Record<string, string[]> = {};
    if (nodes) {
      for (const node of nodes as IssueNodeRow[]) {
        nodeKeywords[node.key] = node.keywords || [];
      }
    }

    // Score each variant
    const candidates: ClassifiedCandidate[] = [];

    for (const variant of filteredVariants) {
      // If category filter is active, skip variants outside the category
      if (categoryKey && categoryDescendants.size > 0) {
        if (!categoryDescendants.has(variant.issue_node_key)) {
          continue; // Skip this variant
        }
      }

      let score = 0;
      const variantKeywords = variant.keywords || [];
      const parentKeywords = nodeKeywords[variant.issue_node_key] || [];
      const allKeywords = [...variantKeywords, ...parentKeywords];

      // Count keyword matches
      for (const keyword of allKeywords) {
        const keywordLower = keyword.toLowerCase();
        // Exact word match
        if (words.includes(keywordLower)) {
          score += 2;
        }
        // Partial match (keyword contains or is contained)
        else if (
          normalizedText.includes(keywordLower) ||
          keywordLower.includes(normalizedText)
        ) {
          score += 1;
        }
        // Check if any word starts with the keyword
        else if (words.some((w) => w.startsWith(keywordLower.slice(0, 3)))) {
          score += 0.5;
        }
      }

      // Boost for title match
      const titleWords = variant.title.toLowerCase().split(/\s+/);
      for (const titleWord of titleWords) {
        if (words.includes(titleWord)) {
          score += 1.5;
        }
      }

      if (score > 0) {
        candidates.push({
          key: variant.key,
          title: variant.title,
          score: Math.min(score / 10, 1), // Normalize to 0-1
        });
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Return top candidates (max 3)
    return candidates.slice(0, 3);
  }

  /**
   * Filter variants to prefer Wayfinder-ingested keys over legacy seed keys
   * Legacy seed keys follow patterns like: id_card_pickup, id_card_replacement_lost
   * Wayfinder keys follow pattern: category__subcategory__title (contain __)
   */
  private filterPreferWayfinderKeys(variants: IssueVariantRow[]): IssueVariantRow[] {
    // Group variants by their issue_node_key to find duplicates in same category
    const nodeGroups: Record<string, IssueVariantRow[]> = {};

    for (const variant of variants) {
      const nodeKey = variant.issue_node_key;
      if (!nodeGroups[nodeKey]) {
        nodeGroups[nodeKey] = [];
      }
      nodeGroups[nodeKey].push(variant);
    }

    const result: IssueVariantRow[] = [];

    // For each group, check if there are both Wayfinder and legacy keys
    for (const nodeKey in nodeGroups) {
      const group = nodeGroups[nodeKey];

      // Separate Wayfinder keys (contain __) from legacy keys
      const wayfinderKeys = group.filter(v => v.key.includes('__'));
      const legacyKeys = group.filter(v => !v.key.includes('__'));

      // If Wayfinder keys exist in this group, exclude legacy keys
      if (wayfinderKeys.length > 0) {
        result.push(...wayfinderKeys);

        // Log when we're filtering out legacy keys
        if (legacyKeys.length > 0) {
          console.log(
            `[Classifier] Preferring ${wayfinderKeys.length} Wayfinder key(s) over ${legacyKeys.length} legacy key(s) in node ${nodeKey}`
          );
        }
      } else {
        // No Wayfinder keys, keep legacy keys
        result.push(...legacyKeys);
      }
    }

    return result;
  }

  // Helper method to get all descendant nodes of a category
  private async getCategoryDescendants(categoryKey: string): Promise<Set<string>> {
    const descendants = new Set<string>();
    descendants.add(categoryKey); // Include the category itself

    // Fetch all nodes
    const { data: allNodes } = await this.supabase
      .from("issue_nodes")
      .select("key, parent_key");

    if (!allNodes) return descendants;

    const nodes = allNodes as IssueNodeRow[];

    // Build a map of parent -> children
    const parentToChildren: Record<string, string[]> = {};
    for (const node of nodes) {
      if (node.parent_key) {
        if (!parentToChildren[node.parent_key]) {
          parentToChildren[node.parent_key] = [];
        }
        parentToChildren[node.parent_key].push(node.key);
      }
    }

    // Recursively add all descendants
    const addDescendants = (nodeKey: string) => {
      const children = parentToChildren[nodeKey] || [];
      for (const child of children) {
        descendants.add(child);
        addDescendants(child); // Recurse
      }
    };

    addDescendants(categoryKey);

    return descendants;
  }
}
