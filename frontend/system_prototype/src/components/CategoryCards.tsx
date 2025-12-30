"use client";

import { useState } from "react";
import type { Category } from "@/lib/supabase/types";

interface CategoryCardsProps {
  primaryCategories: Category[];
  secondaryCategories: Category[];
  onSelect: (categoryKey: string, categoryTitle: string) => void;
  disabled?: boolean;
}

type ViewMode = "primary" | "secondary";

export function CategoryCards({
  primaryCategories,
  secondaryCategories,
  onSelect,
  disabled = false,
}: CategoryCardsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("primary");

  const handleCategoryClick = (categoryKey: string, categoryTitle: string) => {
    if (disabled) return;
    onSelect(categoryKey, categoryTitle);
  };

  const handleOthersClick = () => {
    if (disabled) return;
    setViewMode("secondary");
  };

  const handleBackClick = () => {
    if (disabled) return;
    setViewMode("primary");
  };

  const categories = viewMode === "primary" ? primaryCategories : secondaryCategories;

  return (
    <div className="px-6 py-8 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
          What can we help you with?
        </h2>
        <p className="text-base text-gray-500">
          {viewMode === "primary"
            ? "Choose a category below or start typing your question"
            : "Select from more categories, or go back"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => handleCategoryClick(category.key, category.title)}
            disabled={disabled}
            className={`
              group relative p-5 rounded-2xl text-left
              bg-white border border-gray-200/60
              shadow-sm hover:shadow-md
              transition-all duration-300 ease-out
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.02] hover:border-blue-300/50 active:scale-[0.98]"
              }
            `}
          >
            <div className="space-y-1.5">
              <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {category.title}
              </div>
              {category.description && (
                <div className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {category.description}
                </div>
              )}
            </div>

            {/* Subtle hover indicator */}
            <div className={`
              absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-blue-600/0
              ${disabled ? "" : "group-hover:from-blue-500/5 group-hover:to-blue-600/5"}
              transition-all duration-300 pointer-events-none
            `} />
          </button>
        ))}

        {/* Others or Back button */}
        {viewMode === "primary" ? (
          <button
            onClick={handleOthersClick}
            disabled={disabled}
            className={`
              group relative p-5 rounded-2xl text-left
              bg-gradient-to-br from-gray-50 to-gray-100
              border border-gray-200/60
              shadow-sm hover:shadow-md
              transition-all duration-300 ease-out
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.02] hover:from-gray-100 hover:to-gray-150 active:scale-[0.98]"
              }
            `}
          >
            <div className="space-y-1.5">
              <div className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-200 flex items-center gap-2">
                Others
                <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">
                See more categories
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={handleBackClick}
            disabled={disabled}
            className={`
              group relative p-5 rounded-2xl text-left
              bg-gradient-to-br from-gray-50 to-gray-100
              border border-gray-200/60
              shadow-sm hover:shadow-md
              transition-all duration-300 ease-out
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-[1.02] hover:from-gray-100 hover:to-gray-150 active:scale-[0.98]"
              }
            `}
          >
            <div className="space-y-1.5">
              <div className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-200 flex items-center gap-2">
                <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </div>
              <div className="text-sm text-gray-500 leading-relaxed">
                Return to main categories
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
