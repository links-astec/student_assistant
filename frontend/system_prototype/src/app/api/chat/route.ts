import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/client";

// Backend URL configuration
// Development: http://localhost:3000
// Production: Set NEXT_PUBLIC_BACKEND_URL in environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

function getClientIdentifier(request: NextRequest): string {
  // Priority 1: Device ID from client (for local dev and session isolation)
  const deviceId = request.headers.get("x-device-id");
  if (deviceId && deviceId !== "unknown") {
    return deviceId;
  }
  
  // Priority 2: Real IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp;
  
  if (ip && ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1") {
    return `ip:${ip}`;
  }
  
  // Fallback: unknown (but this means all sessions are shared)
  return "unknown";
}

interface ChatRequest {
  actionType?: string; // For compatibility with frontend page.tsx
  sessionId?: string;
  userMessage?: string;
  message?: string;
  conversationId?: string;
  categoryKey?: string;
  categoryTitle?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const supabase = createSupabaseClient();
    const clientId = getClientIdentifier(request);

    // Determine input fields
    const userMessage = body.userMessage || body.message;
    let sessionId = body.sessionId || body.conversationId;
    const actionType = body.actionType || "message";

    console.log(`[Chat] Request: actionType=${actionType}, sessionId=${sessionId}, hasMessage=${!!userMessage}, clientId=${clientId}`);

    // If no sessionId and actionType is "start", check for existing session for THIS user
    if (!sessionId && actionType === "start") {
      // Try to find an existing recent session for this specific client
      const { data: allSessions } = await supabase
        .from("chat_state")
        .select("session_id, state_jsonb, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);

      // Filter by client ID and recent time
      if (allSessions && allSessions.length > 0) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const userSession = allSessions.find((session) => {
          const state = (session as any).state_jsonb || {};
          const lastUpdated = new Date(session.updated_at);
          return state.clientIp === clientId && lastUpdated > oneHourAgo;
        });

        if (userSession) {
          sessionId = userSession.session_id;
          console.log(`[Chat] Reusing existing session ${sessionId} for client ${clientId}`);
        }
      }
    }

    // If still no sessionId, create a new session
    if (!sessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({})
        .select("id")
        .single();

      if (sessionError || !newSession) {
        console.error("[Chat] Failed to create session:", sessionError);
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500 }
        );
      }

      sessionId = (newSession as any).id;
      console.log(`[Chat] Created new session: ${sessionId} for client ${clientId}`);

      // Initialize empty chat state
      const { error: insertError } = await supabase.from("chat_state").insert({
        session_id: sessionId,
        state_jsonb: {
          phase: "initial",
          messages: [],
          selectedTopCategoryKey: null,
          selectedSubcategoryKey: null,
          studentInfo: { fullName: null, studentId: null, programme: null },
          originalMessage: null,
          candidateIssues: [],
          selectedIssueKey: null,
          currentQuestionIndex: 0,
          collectedSlots: {},
          clientIp: clientId,
        },
      });
      
      if (insertError) {
        console.error("[Chat] Failed to insert chat state:", insertError);
      }
    }

    // Handle start action (just return session ID and greeting)
    if (actionType === "start" && !userMessage) {
      console.log(`[Chat] Returning greeting for session ${sessionId}`);
      
      // Save the greeting message to the state
      const supabase = createSupabaseClient();
      const greetingMessage = "Hi there! I'm the Coventry Student Assistant. How can I help you today?";
      
      await supabase
        .from("chat_state")
        .update({
          state_jsonb: {
            phase: "initial",
            messages: [
              {
                role: "assistant",
                content: greetingMessage,
                timestamp: new Date().toISOString(),
              },
            ],
            selectedTopCategoryKey: null,
            selectedSubcategoryKey: null,
            studentInfo: { fullName: null, studentId: null, programme: null },
            originalMessage: null,
            candidateIssues: [],
            selectedIssueKey: null,
            currentQuestionIndex: 0,
            collectedSlots: {},
            clientIp: clientId,
          },
        })
        .eq("session_id", sessionId);
      
      return NextResponse.json({
        sessionId,
        botMessages: [
          {
            role: "assistant",
            content: greetingMessage,
          },
        ],
      });
    }

    // Handle category selection action
    if (actionType === "selectCategory" && body.categoryKey) {
      console.log(`[Chat] Category selected: ${body.categoryKey} for session ${sessionId}`);
      
      const supabase = createSupabaseClient();
      
      // Generate follow-up questions and response first
      const followupQuestions = generateFollowupQuestions(body.categoryKey);
      const categoryDisplay = body.categoryTitle || body.categoryKey.replace(/_/g, ' ');
      const botResponse = `Great! I'll help you with ${categoryDisplay}. Let me ask a few questions to better understand your situation:\n\n${followupQuestions.map(q => `• ${q}`).join('\n')}`;
      
      // Update session state with selected category
      const { data: stateData } = await supabase
        .from("chat_state")
        .select("state_jsonb")
        .eq("session_id", sessionId)
        .single();

      if (stateData) {
        const state = (stateData as any).state_jsonb || {};
        
        // Update state with category selection AND bot response
        await supabase
          .from("chat_state")
          .update({
            state_jsonb: {
              ...state,
              selectedTopCategoryKey: body.categoryKey,
              phase: "asking_followup",
              messages: [
                ...(state.messages || []),
                { 
                  role: "user", 
                  content: `I need help with: ${body.categoryTitle || body.categoryKey}`, 
                  timestamp: new Date().toISOString() 
                },
                {
                  role: "assistant",
                  content: botResponse,
                  timestamp: new Date().toISOString(),
                },
              ],
            },
          })
          .eq("session_id", sessionId);
      }
      
      return NextResponse.json({
        sessionId,
        state: {
          selectedTopCategoryKey: body.categoryKey,
          phase: "asking_followup",
        },
        botMessages: [
          {
            role: "assistant",
            content: botResponse,
            followupQuestions,
            requiresContext: true,
          },
        ],
      });
    }

    // Handle confirmation action (user confirmed or rejected the identified issue)
    if (actionType === "confirmation" && userMessage) {
      console.log(`[Chat] Confirmation received: ${userMessage} for session ${sessionId}`);
      
      const { data: stateData } = await supabase
        .from("chat_state")
        .select("state_jsonb")
        .eq("session_id", sessionId)
        .single();

      if (stateData) {
        const state = (stateData as any).state_jsonb || {};
        
        if (userMessage.toLowerCase().includes("yes")) {
          // User confirmed - now proceed to email generation
          console.log(`[Chat] Generating email for category: ${state.selectedTopCategoryKey}`);
          
          // Build the message from conversation history
          const conversationText = (state.messages || [])
            .filter((m: any) => m.role === "user")
            .map((m: any) => m.content)
            .join("\\n");
          
          const emailResponse = await fetch(`${BACKEND_URL}/api/email/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: state.studentInfo?.fullName || "Student",
              studentId: state.studentInfo?.studentId || "Unknown",
              email: state.studentInfo?.email || "",
              course: state.studentInfo?.programme || "",
              yearOfStudy: "",
              message: conversationText || `I need help with ${state.selectedTopCategoryKey}`,
              sessionId: sessionId,
              additionalContext: {
                category: state.selectedTopCategoryKey,
                issue: state.selectedIssueKey,
              }
            }),
          });

          console.log(`[Chat] Email generation response status: ${emailResponse.status}`);
          let emailContent = "Unable to generate email";
          let emailGenerated = false;

          if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            console.log(`[Chat] Email data:`, emailData);
            // Backend returns formattedEmail which is the display-ready email
            emailContent = emailData.formattedEmail || emailData.template?.body || emailData.data?.emailContent || emailData.emailContent || emailContent;
            emailGenerated = true;
          } else {
            const errorText = await emailResponse.text();
            console.error(`[Chat] Email generation failed:`, errorText);
            emailContent = `Email generation failed. Please contact support with your issue about ${state.selectedTopCategoryKey}.`;
          }

          const emailDraftMessage = `Perfect! Here's the email draft:\n\n${emailContent}\n\nYou can copy this and send it to the appropriate department.`;

          // Update state to completion phase
          await supabase
            .from("chat_state")
            .update({
              state_jsonb: {
                ...state,
                phase: "completed",
                emailGenerated,
                emailContent,
                messages: [
                  ...(state.messages || []),
                  { 
                    role: "user", 
                    content: userMessage, 
                    timestamp: new Date().toISOString() 
                  },
                  {
                    role: "assistant",
                    content: emailDraftMessage,
                    timestamp: new Date().toISOString(),
                  },
                ],
              },
            })
            .eq("session_id", sessionId);

          return NextResponse.json({
            sessionId,
            botMessages: [
              {
                role: "assistant",
                content: emailDraftMessage,
                emailGenerated: true,
                emailContent,
              },
            ],
            state: { phase: "completed" },
          });
        } else {
          // User wants to clarify - continue conversation
          const clarifyMessage = "No problem! Let me ask more questions to better understand your situation. What additional details can you provide?";
          
          await supabase
            .from("chat_state")
            .update({
              state_jsonb: {
                ...state,
                phase: "asking_followup",
                messages: [
                  ...(state.messages || []),
                  { 
                    role: "user", 
                    content: userMessage, 
                    timestamp: new Date().toISOString() 
                  },
                  {
                    role: "assistant",
                    content: clarifyMessage,
                    timestamp: new Date().toISOString(),
                  },
                ],
              },
            })
            .eq("session_id", sessionId);

          return NextResponse.json({
            sessionId,
            botMessages: [
              {
                role: "assistant",
                content: clarifyMessage,
              },
            ],
            state: { phase: "asking_followup" },
          });
        }
      }

      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Handle message action (forward to backend)
    if (userMessage) {
      console.log(`[Chat] Forwarding message to backend: "${userMessage.substring(0, 50)}..."`);
      
      // First, get current state to include conversation context
      const { data: stateData } = await supabase
        .from("chat_state")
        .select("state_jsonb")
        .eq("session_id", sessionId)
        .single();

      const state = (stateData as any).state_jsonb || {};
      const messages = state.messages || [];
      const selectedCategory = state.selectedTopCategoryKey;
      
      // Build conversation context for backend
      const conversationContext = messages
        .slice(-10) // Last 10 messages for context
        .map((msg: any) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      const backendResponse = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId: sessionId,
          stream: false,
          context: conversationContext,
          category: selectedCategory,
        }),
      });

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error("[Chat] Backend error:", backendResponse.status, errorText);
        return NextResponse.json({
          sessionId,
          botMessages: [
            {
              role: "assistant",
              content: "I'm having trouble understanding. Could you try asking your question in a different way?",
            },
          ],
        });
      }

      const backendData = await backendResponse.json();
      const aiResponse = backendData.data?.message || backendData.message || "No response";
      const classification = backendData.data?.classification || "general";
      const sources = backendData.data?.sources || [];
      
      console.log(`[Chat] Got backend response: "${aiResponse.substring(0, 50)}..." (classification: ${classification})`);

      // Check if this response warrants a confirmation (issue identified)
      const shouldShowConfirmation = selectedCategory && classification !== "general" && aiResponse.length > 50;

      // Save message to session state with metadata
      if (sessionId) {
        const updatedMessages = [
          ...messages,
          { role: "user", content: userMessage, timestamp: new Date().toISOString() },
          { 
            role: "assistant", 
            content: aiResponse, 
            timestamp: new Date().toISOString(),
            classification,
            sources,
          }
        ];

        const newState = {
          ...state,
          messages: updatedMessages,
          originalMessage: userMessage,
          phase: shouldShowConfirmation ? "confirming" : "asking_followup",
        };

        if (classification && classification !== "general") {
          newState.selectedIssueKey = classification;
        }

        const { error: updateError } = await supabase
          .from("chat_state")
          .update({ state_jsonb: newState })
          .eq("session_id", sessionId);

        if (updateError) {
          console.error("[Chat] Error saving state:", updateError);
        }
      }

      // Build response with conditional confirmation
      const botMessage: any = {
        role: "assistant",
        content: aiResponse,
        classification,
        sources,
      };

      // Only show confirmation if category was selected and issue was identified
      if (shouldShowConfirmation) {
        botMessage.confirmationNeeded = true;
        botMessage.confirmationOptions = [
          { id: "yes", label: "Yes, that's correct", value: "yes" },
          { id: "no", label: "No, let me clarify", value: "no" },
        ];
      }

      return NextResponse.json({
        sessionId,
        botMessages: [botMessage],
        state: {
          phase: shouldShowConfirmation ? "confirming" : "asking_followup",
          messageCount: messages.length + 1,
        },
      });
    }

    return NextResponse.json(
      { error: "No message provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Chat] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to generate follow-up questions based on category
function generateFollowupQuestions(categoryKey: string): string[] {
  const questionMap: Record<string, string[]> = {
    course_enrollment: [
      "What course or programme are you trying to enroll in?",
      "Are you having trouble with the enrollment system or do you have questions about the application process?",
      "What is your student ID or email address?",
    ],
    course_change: [
      "Which course are you currently enrolled in?",
      "What course do you want to change to?",
      "What is your reason for changing courses?",
    ],
    academic_support: [
      "What subject or module are you having difficulty with?",
      "Have you attended the relevant module sessions?",
      "What specific topics do you need help with?",
    ],
    accommodation: [
      "Are you looking for on-campus or off-campus accommodation?",
      "What is your budget range?",
      "Do you have any specific location preferences?",
    ],
    fees_payment: [
      "What is your query related to? (tuition fees, payment plan, refund, etc.)",
      "Have you already set up a payment plan?",
      "When do you need this resolved?",
    ],
    attendance_issue: [
      "Which module or course is this related to?",
      "How many sessions have you missed?",
      "What is the reason for your absence?",
    ],
    graduation: [
      "When are you expecting to graduate?",
      "Have you completed all your modules?",
      "Do you have any outstanding academic requirements?",
    ],
    career_support: [
      "What type of career support do you need? (CV, interview prep, job search, etc.)",
      "What field or industry are you interested in?",
      "Are you looking for internship or graduate positions?",
    ],
  };

  return questionMap[categoryKey] || [
    "Could you provide more details about your situation?",
    "What have you already tried?",
    "When do you need this resolved?",
  ];
}



