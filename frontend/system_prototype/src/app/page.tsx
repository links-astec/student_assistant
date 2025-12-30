"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ChatWindow } from "@/components/ChatWindow";
import { QuickReplies } from "@/components/QuickReplies";
import { SlotForm } from "@/components/SlotForm";
import { MessageInput } from "@/components/MessageInput";
import { ResultView } from "@/components/result/ResultView";
import { CategoryCards } from "@/components/CategoryCards";
import { StudentInfoForm } from "@/components/StudentInfoForm";
import { SubcategoryPicker } from "@/components/SubcategoryPicker";
import { SetupScreen } from "@/components/SetupScreen";
import ChatHistoryModal from "@/components/ChatHistoryModal";
import { useRouter } from "next/navigation";
import type { ChatResponse, Category } from "@/lib/supabase/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type AppPhase = "loading" | "setup_required" | "ready";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [appPhase, setAppPhase] = useState<AppPhase>("loading");
  const [primaryCategories, setPrimaryCategories] = useState<Category[]>([]);
  const [secondaryCategories, setSecondaryCategories] = useState<Category[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<
    { id: string; label: string; value: string }[]
  >([]);
  const [slotRequest, setSlotRequest] = useState<{
    slotKeys: string[];
    hints: Record<string, string>;
  } | null>(null);
  const [studentInfoRequest, setStudentInfoRequest] = useState<{
    fields: ["fullName", "studentId", "programme"];
  } | null>(null);
  const [subcategoryOptions, setSubcategoryOptions] = useState<
    {
      id: string;
      key: string;
      title: string;
      description: string | null;
    }[]
  >([]);
  const [result, setResult] = useState<ChatResponse["result"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryCards, setShowCategoryCards] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const initialized = useRef(false);

  // Handle loading a chat from history
  const handleSelectChat = (selectedSessionId: string) => {
    setShowChatHistory(false);
    router.push(`/?session=${selectedSessionId}`);
  };

  // Track session with backend
  const trackSession = async (sid: string, category?: string, studentName?: string, studentId?: string) => {
    try {
      await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: sid, 
          issueCategory: category,
          studentName,
          studentId,
        }),
      });
    } catch (err) {
      console.warn("Session tracking failed:", err);
    }
  };

  // Check Supabase and load categories on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      checkSetupAndLoadCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load existing session from URL parameter
  const loadExistingSession = async (existingSessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch the chat state from Supabase via a new API
      const response = await fetch(`/api/chats/${existingSessionId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load chat");
      }

      const data = await response.json();
      
      if (data.success && data.state) {
        setSessionId(existingSessionId);
        
        // Restore messages
        if (data.state.messages && data.state.messages.length > 0) {
          setMessages(data.state.messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })));
        }

        // Restore result if phase is complete
        if (data.state.phase === "complete" && data.result) {
          setResult(data.result);
        }

        // Hide category cards if user has already interacted
        if (data.state.phase !== "initial") {
          setShowCategoryCards(false);
          setHasInteracted(true);
        }

        // Restore selected category
        if (data.state.selectedTopCategoryKey) {
          setSelectedCategory(data.state.selectedTopCategoryKey);
        }
      } else {
        // Session not found, start new
        await startChat();
      }
    } catch (err) {
      console.error("Failed to load existing session:", err);
      // Fall back to starting new chat
      await startChat();
    } finally {
      setIsLoading(false);
    }
  };

  const checkSetupAndLoadCategories = async () => {
    try {
      // Try to fetch categories to check if Supabase is configured
      const response = await fetch("/api/categories");

      if (!response.ok) {
        setAppPhase("setup_required");
        return;
      }

      const data = await response.json();
      setPrimaryCategories(data.primary || []);
      setSecondaryCategories(data.secondary || []);
      setAppPhase("ready");

      // Check if we have a session parameter to load
      const sessionParam = searchParams.get("session");
      if (sessionParam) {
        await loadExistingSession(sessionParam);
      } else {
        // Initialize new chat session
        await startChat();
      }
    } catch (err) {
      console.error("Setup check failed:", err);
      setAppPhase("setup_required");
    }
  };

  const startChat = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "start" }),
      });

      if (!response.ok) {
        throw new Error("Failed to start chat");
      }

      const data: ChatResponse = await response.json();
      setSessionId(data.sessionId);

      // Track session start
      trackSession(data.sessionId);

      // Add bot messages
      for (const msg of data.botMessages) {
        setMessages((prev) => [...prev, { role: "assistant", content: msg.content }]);
      }
    } catch (err) {
      setError("Failed to connect. Please refresh the page.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCategory = async (categoryKey: string, categoryTitle: string) => {
    if (!sessionId || isLoading) return;

    setHasInteracted(true);
    setShowCategoryCards(false);
    setSelectedCategory(categoryTitle);
    setIsLoading(true);
    setError(null);

    // Track category selection
    trackSession(sessionId, categoryTitle);

    // Add user message to UI immediately
    const userMessage = `Category: ${categoryTitle}`;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "selectCategory",
          sessionId,
          categoryKey,
        }),
      });

      if (!response.ok) throw new Error("Failed to select category");

      const data: ChatResponse = await response.json();
      handleResponse(data);
    } catch (err) {
      setError("Failed to select category. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(
    async (message: string) => {
      if (!sessionId || isLoading) return;

      // Mark as interacted and hide category cards
      setHasInteracted(true);
      setShowCategoryCards(false);

      // Add user message to UI
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setQuickReplies([]);
      setSlotRequest(null);
      setIsLoading(true);
      setError(null);

      try {
        // Call backend streaming chat API for faster AI responses
        const backendUrl = process.env.NODE_ENV === 'production' 
          ? '/api/chat' // In production, proxy through Next.js
          : 'http://localhost:3001/api/chat'; // In development, call backend directly

        const streamResponse = await fetch(backendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            conversationId: sessionId,
            stream: true,
          }),
        });

        if (streamResponse.ok && streamResponse.body) {
          // Handle streaming response from backend
          const reader = streamResponse.body.getReader();
          const decoder = new TextDecoder();
          let assistantMessage = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              assistantMessage += chunk;

              // Update the UI with the accumulating message
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === "assistant") {
                  lastMessage.content = assistantMessage;
                } else {
                  newMessages.push({ role: "assistant", content: assistantMessage });
                }
                return newMessages;
              });
            }
          } finally {
            reader.releaseLock();
          }

          // After streaming is complete, no need for additional API call
          // The streaming response has already updated the UI
          console.log("Streaming response complete");
        } else {
          // Fallback to original frontend logic if streaming fails
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actionType: "message",
              sessionId,
              userMessage: message,
            }),
          });

          if (!response.ok) throw new Error("Failed to send message");

          const data: ChatResponse = await response.json();
          handleResponse(data);
        }
      } catch (err) {
        setError("Failed to send message. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading]
  );

  const sendAnswer = useCallback(
    async (answer: { type: "quickReply" | "text"; value: string }) => {
      if (!sessionId || isLoading) return;

      // Add user answer to UI
      setMessages((prev) => [...prev, { role: "user", content: answer.value }]);
      setQuickReplies([]);
      setSlotRequest(null);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "answer",
            sessionId,
            answer,
          }),
        });

        if (!response.ok) throw new Error("Failed to send answer");

        const data: ChatResponse = await response.json();
        handleResponse(data);
      } catch (err) {
        setError("Failed to send answer. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading]
  );

  const sendConfirmation = useCallback(
    async (confirmed: boolean) => {
      if (!sessionId || isLoading) return;

      // Add user confirmation to UI
      setMessages((prev) => [
        ...prev,
        { role: "user", content: confirmed ? "Yes" : "No" },
      ]);
      setQuickReplies([]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "confirm",
            sessionId,
            confirmed,
          }),
        });

        if (!response.ok) throw new Error("Failed to send confirmation");

        const data: ChatResponse = await response.json();
        handleResponse(data);
      } catch (err) {
        setError("Failed to send confirmation. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading]
  );

  const handleResponse = (data: ChatResponse) => {
    // Add bot messages
    for (const msg of data.botMessages) {
      setMessages((prev) => [...prev, { role: "assistant", content: msg.content }]);
    }

    // Set student info request if present
    if (data.studentInfoRequest) {
      setStudentInfoRequest(data.studentInfoRequest);
    }

    // Set subcategory options if present
    if (data.subcategoryOptions) {
      setSubcategoryOptions(data.subcategoryOptions);
    }

    // Set quick replies if present
    if (data.quickReplies) {
      setQuickReplies(data.quickReplies);
    }

    // Set slot request if present
    if (data.slotRequest) {
      setSlotRequest(data.slotRequest);
    }

    // Set result if present and mark session as resolved
    if (data.result) {
      setResult(data.result);
      // Mark session as resolved in tracking
      if (sessionId) {
        fetch("/api/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            sessionId, 
            issueCategory: selectedCategory,
            studentName: data.result.studentInfo?.fullName,
            studentId: data.result.studentInfo?.studentId,
          }),
        }).catch(console.warn);
      }
    }
  };

  const handleQuickReply = (reply: { id: string; label: string; value: string }) => {
    // Check if this is a confirmation response
    if (reply.id === "yes" || reply.id === "no") {
      sendConfirmation(reply.id === "yes");
    } else {
      sendAnswer({ type: "quickReply", value: reply.label });
    }
  };

  const handleSlotSubmit = (values: Record<string, string>) => {
    const firstValue = Object.values(values)[0];
    if (firstValue) {
      sendAnswer({ type: "text", value: firstValue });
    }
  };

  const handleSubmitStudentInfo = useCallback(
    async (info: { fullName: string; studentId: string; programme: string }) => {
      if (!sessionId || isLoading) return;

      setStudentInfoRequest(null);
      setIsLoading(true);
      setError(null);

      // Add user info to messages for display
      const userMessage = `Name: ${info.fullName}, ID: ${info.studentId}, Programme: ${info.programme}`;
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "submitStudentInfo",
            sessionId,
            studentInfo: info,
          }),
        });

        if (!response.ok) throw new Error("Failed to submit student info");

        const data: ChatResponse = await response.json();
        handleResponse(data);
      } catch (err) {
        setError("Failed to submit student information. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading]
  );

  const handleSelectSubcategory = useCallback(
    async (key: string, title: string) => {
      if (!sessionId || isLoading) return;

      setSubcategoryOptions([]);
      setIsLoading(true);
      setError(null);

      // Add user selection to messages
      const userMessage = key ? `Subcategory: ${title}` : "Skipped subcategory selection";
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "selectSubcategory",
            sessionId,
            subcategoryKey: key || null,
          }),
        });

        if (!response.ok) throw new Error("Failed to select subcategory");

        const data: ChatResponse = await response.json();
        handleResponse(data);
      } catch (err) {
        setError("Failed to select subcategory. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading]
  );

  const handleReset = () => {
    setSessionId(null);
    setMessages([]);
    setQuickReplies([]);
    setSlotRequest(null);
    setStudentInfoRequest(null);
    setSubcategoryOptions([]);
    setResult(null);
    setError(null);
    setShowCategoryCards(true);
    setHasInteracted(false);
    startChat();
  };

  const handleContinueChat = () => {
    // Clear result but keep the session and messages
    setResult(null);
    // Add a message indicating continued chat
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Great! Is there anything else I can help you with? Feel free to ask another question or describe a new issue." },
    ]);
  };

  // Show setup screen if Supabase not configured
  if (appPhase === "setup_required") {
    return <SetupScreen />;
  }

  // Show loading state while checking setup
  if (appPhase === "loading") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto h-screen flex flex-col">
        {/* Header - Apple Style */}
        <header className="px-6 py-4 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="w-10" /> {/* Spacer for centering */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-5 h-5"
                >
                  <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                  <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Ask me</h1>
            </div>
            <a
              href="/dashboard"
              className="text-gray-500 hover:text-blue-600 transition-colors"
              title="View Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
              </svg>
            </a>
            <button
              onClick={() => setShowChatHistory(true)}
              className="text-gray-500 hover:text-purple-600 transition-colors"
              title="Chat History"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Main content area */}
        {result ? (
          <ResultView result={result} onReset={handleReset} onContinueChat={handleContinueChat} />
        ) : (
          <>
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto">
              <ChatWindow messages={messages} isLoading={isLoading} />

              {/* Category cards - shown inline, before user interaction */}
              {showCategoryCards && !hasInteracted && (
                <CategoryCards
                  primaryCategories={primaryCategories}
                  secondaryCategories={secondaryCategories}
                  onSelect={selectCategory}
                  disabled={isLoading}
                />
              )}
            </div>

            {/* Student info form */}
            {studentInfoRequest && (
              <StudentInfoForm
                onSubmit={handleSubmitStudentInfo}
                isLoading={isLoading}
              />
            )}

            {/* Subcategory picker */}
            {subcategoryOptions.length > 0 && (
              <SubcategoryPicker
                subcategories={subcategoryOptions}
                onSelect={handleSelectSubcategory}
                isLoading={isLoading}
              />
            )}

            {/* Quick replies */}
            {quickReplies.length > 0 && (
              <QuickReplies
                replies={quickReplies}
                onSelect={handleQuickReply}
                disabled={isLoading}
              />
            )}

            {/* Slot form */}
            {slotRequest && (
              <SlotForm
                slotKeys={slotRequest.slotKeys}
                hints={slotRequest.hints}
                onSubmit={handleSlotSubmit}
                disabled={isLoading}
              />
            )}

            {/* Message input - Hidden during student info and subcategory selection */}
            {!quickReplies.length &&
              !slotRequest &&
              !studentInfoRequest &&
              subcategoryOptions.length === 0 && (
                <MessageInput
                  onSend={sendMessage}
                  disabled={isLoading || !sessionId}
                  placeholder={
                    !sessionId ? "Connecting..." : "Describe your issue..."
                  }
                />
              )}
          </>
        )}
      </div>
      
      {/* Chat History Modal */}
      <ChatHistoryModal
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        onSelectChat={handleSelectChat}
      />
    </main>
  );
}
