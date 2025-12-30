"use client";

import { useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex animate-slideUp ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[75%] rounded-[20px] px-5 py-3 shadow-sm ${
              message.role === "user"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md"
                : "bg-white text-gray-900 rounded-bl-md border border-gray-100"
            }`}
          >
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {formatMessage(message.content)}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start animate-fadeIn">
          <div className="bg-white border border-gray-100 rounded-[20px] rounded-bl-md px-5 py-3.5 shadow-sm">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <div
                className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

// Format message content (handle markdown-like syntax)
function formatMessage(content: string): React.ReactNode {
  // Simple markdown: **bold**
  const parts = content.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
