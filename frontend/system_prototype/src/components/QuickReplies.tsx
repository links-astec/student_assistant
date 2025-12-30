"use client";

interface QuickReply {
  id: string;
  label: string;
  value: string;
}

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  disabled?: boolean;
}

export function QuickReplies({ replies, onSelect, disabled }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5 px-4 py-4 bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
      {replies.map((reply) => (
        <button
          key={reply.id}
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className={`
            px-5 py-2.5 rounded-full text-sm font-medium
            transition-all duration-200
            shadow-sm
            ${
              disabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-blue-600 border border-blue-200/60 hover:bg-blue-50 hover:border-blue-300/60 hover:shadow active:scale-95"
            }
          `}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}
