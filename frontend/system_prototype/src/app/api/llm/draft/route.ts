// POST /api/llm/draft - LLM email drafting via backend
// Connects to the Coventry Student Assistant backend email generator

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Backend API URL (runs on port 3001)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

interface DraftRequest {
  issueKey: string;
  slots: Record<string, string>;
  message?: string;
}

interface DraftResponse {
  subject: string;
  body: string;
  to?: string;
  department?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DraftRequest = await request.json();
    const { issueKey, slots, message } = body;

    if (!issueKey) {
      return NextResponse.json(
        { error: "issueKey is required" },
        { status: 400 }
      );
    }

    const studentName = slots.student_name || slots.fullName || "[Student Name]";
    const studentId = slots.student_id || slots.studentId || "[Student ID]";
    const course = slots.programme_or_year || slots.programme || "";
    const problemMessage = message || slots.specific_question || issueKey;

    // Call the backend email generate endpoint
    const emailResponse = await fetch(`${BACKEND_URL}/api/email/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: studentName,
        studentId: studentId,
        course: course,
        message: problemMessage,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error("Backend email generation failed");
    }

    const emailData = await emailResponse.json();

    if (emailData.success && emailData.template) {
      const response: DraftResponse = {
        subject: emailData.template.subject,
        body: emailData.template.body,
        to: emailData.template.to,
        department: emailData.template.department,
      };

      return NextResponse.json(response, {
        headers: {
          "X-LLM-Backend": "coventry-assistant",
          "X-LLM-Mode": "5w1h-template",
        },
      });
    }

    throw new Error("Invalid response from backend");
  } catch (error) {
    console.error("LLM draft error:", error);
    
    // Fallback to basic template
    const { slots } = await request.json().catch(() => ({ slots: {} }));
    const studentName = slots?.student_name || "[Student Name]";
    const studentId = slots?.student_id || "[Student ID]";

    return NextResponse.json({
      subject: `Student Inquiry - ${studentId}`,
      body: `Dear Student Services Team,

I am writing to request assistance with my query.

**Student Information:**
Name: ${studentName}
Student ID: ${studentId}

I would appreciate your guidance on this matter.

Thank you for your assistance.

Best regards,
${studentName}`,
    }, {
      headers: {
        "X-LLM-Stub": "true",
        "X-LLM-Error": "Backend unavailable, using fallback template",
      },
    });
  }
}
