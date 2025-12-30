// POST /api/llm/plan - LLM question planning via backend
// Uses the RAG system to generate dynamic follow-up questions

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Backend API URL (runs on port 3001)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface PlanRequest {
  issueKey: string;
  currentIndex: number;
  context?: string;
  previousAnswers?: string[];
}

interface PlanResponse {
  question: {
    text: string;
    type: "single" | "text";
    options?: { id: string; label: string; value: string }[];
    slotKey?: string;
  } | null;
}

// Define dynamic questions based on issue categories
const dynamicQuestionTemplates: Record<string, string[]> = {
  tuition_fees: [
    "What is your current fee status (home/international)?",
    "Have you already made any payments this academic year?",
    "Are you receiving any scholarships or bursaries?",
  ],
  accommodation: [
    "Are you currently living in university accommodation?",
    "What is the main issue you're experiencing?",
    "When did this issue first occur?",
  ],
  visa_immigration: [
    "What is your current visa status?",
    "When does your current visa expire?",
    "Have you already started the renewal process?",
  ],
  health_wellbeing: [
    "Is this related to physical health, mental health, or disability support?",
    "Have you already registered with university health services?",
    "How urgently do you need support?",
  ],
  academic_support: [
    "Which course or module is this related to?",
    "Have you already spoken with your tutor about this?",
    "What specific academic support do you need?",
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body: PlanRequest = await request.json();
    const { issueKey, currentIndex, context, previousAnswers } = body;

    if (!issueKey) {
      return NextResponse.json(
        { error: "issueKey is required" },
        { status: 400 }
      );
    }

    // Get category from issue key
    const category = issueKey.split("_").slice(0, 2).join("_");
    const questions = dynamicQuestionTemplates[category] || [];

    // If we have predefined questions, use them
    if (currentIndex < questions.length) {
      return NextResponse.json({
        question: {
          text: questions[currentIndex],
          type: "text",
          slotKey: `q${currentIndex + 1}_answer`,
        },
      }, {
        headers: {
          "X-LLM-Backend": "coventry-assistant",
          "X-LLM-Mode": "template-questions",
        },
      });
    }

    // After predefined questions, use the LLM to generate contextual questions
    if (currentIndex < 4) {
      try {
        // Call backend chat to generate a follow-up question
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `As a student support assistant, generate ONE follow-up question to better understand this student's issue about "${issueKey.replace(/_/g, " ")}". Context: ${context || "General inquiry"}. Previous answers: ${(previousAnswers || []).join(", ")}. Respond with ONLY the question, nothing else.`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const questionText = data.data?.message || data.message;

          if (questionText && !questionText.includes("I don't")) {
            return NextResponse.json({
              question: {
                text: questionText.replace(/^["']|["']$/g, "").trim(),
                type: "text",
                slotKey: `llm_q${currentIndex + 1}`,
              },
            }, {
              headers: {
                "X-LLM-Backend": "coventry-assistant",
                "X-LLM-Mode": "dynamic-question",
              },
            });
          }
        }
      } catch (llmError) {
        console.error("[LLM Plan] Error calling backend:", llmError);
      }
    }

    // No more questions
    return NextResponse.json({
      question: null,
    }, {
      headers: {
        "X-LLM-Backend": "coventry-assistant",
        "X-LLM-Mode": "complete",
      },
    });
  } catch (error) {
    console.error("LLM plan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
