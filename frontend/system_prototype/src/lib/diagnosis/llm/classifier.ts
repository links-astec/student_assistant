// LLM-based Issue Classifier
// Connects to the Coventry Student Assistant backend for RAG-based classification

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IIssueClassifier, ClassifiedCandidate } from "../interfaces";
import { RuleBasedClassifier } from "../rule-based/classifier";

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export class LLMClassifier implements IIssueClassifier {
  private fallback: RuleBasedClassifier;
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.fallback = new RuleBasedClassifier(supabase);
  }

  async classify(
    text: string,
    categoryKey?: string | null,
    subcategoryKey?: string | null
  ): Promise<ClassifiedCandidate[]> {
    try {
      console.log("[LLM Classifier] Calling backend RAG system...");
      
      // Call the backend search endpoint for RAG-based classification
      const response = await fetch(`${BACKEND_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, limit: 5 }),
      });

      if (!response.ok) {
        throw new Error(`Backend search failed: ${response.status}`);
      }

      const data = await response.json();
      const results = data.data?.results || [];

      if (results.length === 0) {
        console.log("[LLM Classifier] No RAG results, falling back to rule-based");
        return this.fallback.classify(text, categoryKey, subcategoryKey);
      }

      // Map backend results to ClassifiedCandidate format
      // Also try to match with issue_variants in database
      const candidates: ClassifiedCandidate[] = [];
      
      for (const result of results) {
        // Try to find matching issue variant in database
        const { data: variants } = await this.supabase
          .from("issue_variants")
          .select("key, title")
          .or(`title.ilike.%${result.title?.split(" ")[0] || ""}%,keywords.cs.{${result.category?.toLowerCase() || ""}}`)
          .limit(1);

        if (variants && variants.length > 0) {
          candidates.push({
            key: variants[0].key,
            title: variants[0].title,
            score: result.relevanceScore || 0.7,
          });
        } else {
          // Create a dynamic key from the category
          const key = result.category?.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "general";
          candidates.push({
            key: key,
            title: result.title || result.category || "General Inquiry",
            score: result.relevanceScore || 0.5,
          });
        }
      }

      // Remove duplicates by key
      const uniqueCandidates = candidates.filter(
        (c, i, arr) => arr.findIndex((x) => x.key === c.key) === i
      );

      console.log(`[LLM Classifier] Found ${uniqueCandidates.length} candidates from RAG`);
      
      if (uniqueCandidates.length === 0) {
        return this.fallback.classify(text, categoryKey, subcategoryKey);
      }

      return uniqueCandidates;
    } catch (error) {
      console.error("[LLM Classifier] Error calling backend:", error);
      console.log("[LLM Classifier] Falling back to rule-based classifier");
      return this.fallback.classify(text, categoryKey, subcategoryKey);
    }
  }
}
