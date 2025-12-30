"use client";

import { useState, useRef, useEffect } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled,
  placeholder = "Describe your issue...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-5 bg-white/70 backdrop-blur-xl border-t border-gray-200/50"
    >
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full resize-none rounded-2xl border-0 px-5 py-3.5
              bg-gray-100 text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white
              transition-all duration-200
              shadow-sm
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            style={{ minHeight: "48px" }}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={`
            flex items-center justify-center
            w-12 h-12 rounded-full
            transition-all duration-200 shadow-sm
            ${
              disabled || !message.trim()
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-md hover:scale-105 active:scale-95"
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2.5 text-center">
        Press Enter to send · Shift+Enter for new line
      </p>
    </form>
  );
}
