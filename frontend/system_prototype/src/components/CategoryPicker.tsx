"use client";

import type { Category } from "@/lib/supabase/types";

interface CategoryPickerProps {
  categories: Category[];
  onSelect: (categoryKey: string) => void;
  isLoading?: boolean;
}

export function CategoryPicker({ categories, onSelect, isLoading }: CategoryPickerProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          What can we help you with?
        </h2>
        <p className="text-gray-600">
          Select a category to get started, or choose &quot;Not sure&quot; if you need general help
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => onSelect(category.key)}
            disabled={isLoading}
            className={`
              p-4 rounded-xl text-left transition-all duration-200
              border-2 border-gray-200
              ${
                isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-primary-500 hover:bg-primary-50 hover:shadow-md active:scale-[0.98]"
              }
            `}
          >
            <div className="font-medium text-gray-900">{category.title}</div>
            {category.description && (
              <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                {category.description}
              </div>
            )}
          </button>
        ))}

        {/* Not Sure Option */}
        <button
          onClick={() => onSelect("not_sure")}
          disabled={isLoading}
          className={`
            p-4 rounded-xl text-left transition-all duration-200
            border-2 border-gray-300 bg-gray-50
            ${
              isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-gray-400 hover:bg-gray-100 hover:shadow-md active:scale-[0.98]"
            }
          `}
        >
          <div className="font-medium text-gray-700">Not sure</div>
          <div className="text-sm text-gray-500 mt-1">
            I&apos;ll describe my issue and you can help me find the right category
          </div>
        </button>
      </div>
    </div>
  );
}
