"use client";

interface Subcategory {
  id: string;
  key: string;
  title: string;
  description: string | null;
}

interface SubcategoryPickerProps {
  subcategories: Subcategory[];
  onSelect: (key: string, title: string) => void;
  isLoading?: boolean;
}

export function SubcategoryPicker({
  subcategories,
  onSelect,
  isLoading = false,
}: SubcategoryPickerProps) {
  const handleSubcategoryClick = (key: string, title: string) => {
    if (isLoading) return;
    onSelect(key, title);
  };

  const handleSkip = () => {
    if (isLoading) return;
    onSelect("", "General"); // Empty key means no subcategory filter
  };

  return (
    <div className="px-6 py-8 space-y-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Which specific area?
        </h2>
        <p className="text-sm text-gray-500">
          Select a more specific topic, or skip to continue
        </p>
      </div>

      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subcategories.map((subcategory) => (
          <button
            key={subcategory.id}
            onClick={() =>
              handleSubcategoryClick(subcategory.key, subcategory.title)
            }
            disabled={isLoading}
            className={`
              p-6 text-left rounded-xl border-2 transition-all duration-200
              ${
                isLoading
                  ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-blue-400 hover:shadow-md active:scale-98"
              }
            `}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {subcategory.title}
            </h3>
            {subcategory.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {subcategory.description}
              </p>
            )}
          </button>
        ))}

        {/* Skip button */}
        <button
          onClick={handleSkip}
          disabled={isLoading}
          className={`
            p-6 text-left rounded-xl border-2 transition-all duration-200
            ${
              isLoading
                ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                : "border-gray-300 border-dashed bg-gray-50 hover:border-gray-400 hover:bg-gray-100 active:scale-98"
            }
          `}
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Skip this step
          </h3>
          <p className="text-sm text-gray-500">
            I&apos;m not sure or my issue doesn&apos;t fit these categories
          </p>
        </button>
      </div>
    </div>
  );
}
