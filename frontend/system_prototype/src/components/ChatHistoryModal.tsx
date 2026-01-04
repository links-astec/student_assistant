"use client";

import { useState, useEffect } from "react";
import { getFetchOptions } from "@/lib/deviceId";

interface ChatSummary {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  studentName: string;
  studentId: string;
  category: string;
  issueKey: string;
  phase: string;
  messageCount: number;
  lastMessage: string;
}

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (sessionId: string) => void;
}


export default function ChatHistoryModal({
  isOpen,
  onClose,
  onSelectChat,
}: ChatHistoryModalProps) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const fetchChats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/chats", getFetchOptions());
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch chats");
      }
      const data = await response.json();
      console.log("[ChatHistory] Loaded chats:", data);
      setChats(data.chats || []);
      setVisibleCount(10); // Reset visible count on fetch
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[ChatHistory] Error loading chats:", errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;

    setDeletingId(sessionId);
    try {
      const response = await fetch(`/api/chats?sessionId=${sessionId}`, getFetchOptions({
        method: "DELETE",
      }));
      const responseData = await response.text().catch(() => "");
      console.log(`[ChatHistory] Delete response status: ${response.status}`, responseData);
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status} ${responseData}`);
      }
      
      // If this was the current session, clear it from localStorage
      if (localStorage.getItem("chatSessionId") === sessionId) {
        localStorage.removeItem("chatSessionId");
        // If user deleted current session, reload page to start fresh
        window.location.href = '/';
        return;
      }
      
      console.log(`[ChatHistory] Deleted chat: ${sessionId}`);
      
      // Refresh the list immediately after successful deletion
      await fetchChats();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[ChatHistory] Delete error:", errorMsg);
      alert(`Failed to delete chat: ${errorMsg}`);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case "complete":
        return "✅";
      case "confirming":
        return "⏳";
      case "questions":
        return "💬";
      default:
        return "🆕";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "confirming":
        return "bg-yellow-100 text-yellow-800";
      case "questions":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chat History</h2>
              <p className="text-sm text-gray-500">{chats.length} conversations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>{error}</p>
              <button
                onClick={fetchChats}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">📭</span>
              <p>No chat history found</p>
              <p className="text-sm mt-2">Start a new conversation to see it here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {chats.slice(0, visibleCount).map((chat) => (
                <div
                  key={chat.sessionId}
                  onClick={() => onSelectChat(chat.sessionId)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  {/* Status Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getPhaseColor(
                      chat.phase
                    )}`}
                  >
                    <span>{getPhaseIcon(chat.phase)}</span>
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {chat.studentName}
                      </span>
                      {chat.studentId && (
                        <span className="text-xs text-gray-400">
                          #{chat.studentId}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {chat.category !== "Not selected"
                        ? chat.category
                        : chat.lastMessage}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{chat.messageCount} messages</span>
                      <span>•</span>
                      <span>{formatDate(chat.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(chat.sessionId, e)}
                    disabled={deletingId === chat.sessionId}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-full transition-all text-red-500 hover:text-red-600"
                    title="Delete chat"
                  >
                    {deletingId === chat.sessionId ? (
                      <div className="w-5 h-5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Arrow */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-gray-300 group-hover:text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              ))}
              {visibleCount < chats.length && (
                <div className="flex justify-center py-4">
                  <button
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    onClick={() => setVisibleCount((c) => c + 10)}
                  >
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
