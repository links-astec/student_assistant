"use client";

import { useState } from "react";

interface EmailDraftCardProps {
  subject: string;
  body: string;
}

export function EmailDraftCard({ subject, body }: EmailDraftCardProps) {
  const [editedSubject, setEditedSubject] = useState(subject);
  const [editedBody, setEditedBody] = useState(body);
  const [copied, setCopied] = useState<"subject" | "body" | "all" | null>(null);

  const copyToClipboard = async (text: string, type: "subject" | "body" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyAll = () => {
    const fullEmail = `Subject: ${editedSubject}\n\n${editedBody}`;
    copyToClipboard(fullEmail, "all");
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-amber-600"
            >
              <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-amber-800">Email Draft (5W1H)</h3>
        </div>
        <button
          onClick={copyAll}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-200
            ${
              copied === "all"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }
          `}
        >
          {copied === "all" ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                  clipRule="evenodd"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375z"
                  clipRule="evenodd"
                />
              </svg>
              Copy All
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {/* Subject */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-amber-700">Subject</label>
            <button
              onClick={() => copyToClipboard(editedSubject, "subject")}
              className="text-xs text-amber-600 hover:text-amber-800"
            >
              {copied === "subject" ? "Copied!" : "Copy"}
            </button>
          </div>
          <input
            type="text"
            value={editedSubject}
            onChange={(e) => setEditedSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                       text-sm"
          />
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-amber-700">Body</label>
            <button
              onClick={() => copyToClipboard(editedBody, "body")}
              className="text-xs text-amber-600 hover:text-amber-800"
            >
              {copied === "body" ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                       text-sm font-mono resize-y"
          />
        </div>
      </div>

      <p className="text-xs text-amber-600 mt-3">
        You can edit this draft before copying. Placeholders in [brackets] should be filled in.
      </p>
    </div>
  );
}
