"use client";

import { useState } from "react";

interface SlotFormProps {
  slotKeys: string[];
  hints: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void;
  disabled?: boolean;
}

const slotLabels: Record<string, string> = {
  student_name: "Full Name",
  student_id: "Student ID",
  programme_or_year: "Programme & Year",
  urgency_or_deadline: "Urgency/Deadline",
  specific_question: "Additional Details",
};

export function SlotForm({ slotKeys, hints, onSubmit, disabled }: SlotFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  if (!slotKeys || slotKeys.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 space-y-4">
      {slotKeys.map((key) => (
        <div key={key}>
          <label
            htmlFor={key}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {slotLabels[key] || key}
          </label>
          <input
            type="text"
            id={key}
            value={values[key] || ""}
            onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            placeholder={hints[key] || `Enter ${slotLabels[key] || key}`}
            disabled={disabled}
            className={`
              w-full px-4 py-2 rounded-lg border
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              ${disabled ? "bg-gray-50 text-gray-400" : "border-gray-300"}
            `}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={disabled || slotKeys.some((key) => !values[key])}
        className={`
          w-full py-2 rounded-lg font-medium transition-all duration-200
          ${
            disabled || slotKeys.some((key) => !values[key])
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98]"
          }
        `}
      >
        Submit
      </button>
    </form>
  );
}
