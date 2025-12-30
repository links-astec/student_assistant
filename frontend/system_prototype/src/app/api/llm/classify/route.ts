// POST /api/llm/classify - LLM classification via backend RAG system
// Connects to the Coventry Student Assistant backend

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Backend API URL (runs on port 3001)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface ClassifyRequest {
  text: string;
}

interface ClassifyResponse {
  candidates: {
    key: string;
    title: string;
    score: number;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ClassifyRequest = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    // Call the backend search endpoint for classification
    const searchResponse = await fetch(`${BACKEND_URL}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text, limit: 5 }),
    });

    if (!searchResponse.ok) {
      throw new Error("Backend search failed");
    }

    const searchData = await searchResponse.json();
    const results = searchData.data?.results || [];

    // Convert search results to classification candidates
    const candidates = results.map((r: any, index: number) => ({
      key: r.category?.toLowerCase().replace(/\s+/g, "_") || `result_${index}`,
      title: r.title || r.category || "Unknown",
      score: r.relevanceScore || 0.5,
      category: r.category,
      url: r.url,
    }));

    const response: ClassifyResponse = { candidates };

    return NextResponse.json(response, {
      headers: {
        "X-LLM-Backend": "coventry-assistant",
        "X-LLM-Mode": "rag-search",
      },
    });
  } catch (error) {
    console.error("LLM classify error:", error);
    
    // Fallback to stub response
    return NextResponse.json({
      candidates: [
        {
          key: "general_inquiry",
          title: "General Inquiry",
          score: 0.5,
        },
      ],
    }, {
      headers: {
        "X-LLM-Stub": "true",
        "X-LLM-Error": "Backend unavailable, using fallback",
      },
    });
  }
}
