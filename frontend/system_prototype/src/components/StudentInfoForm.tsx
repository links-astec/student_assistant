"use client";

import { useState } from "react";

interface StudentInfoFormProps {
  onSubmit: (info: {
    fullName: string;
    studentId: string;
    programme: string;
  }) => void;
  isLoading?: boolean;
}

export function StudentInfoForm({
  onSubmit,
  isLoading = false,
}: StudentInfoFormProps) {
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [programme, setProgramme] = useState("");
  const [errors, setErrors] = useState<{
    fullName?: string;
    studentId?: string;
    programme?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: typeof errors = {};
    if (!fullName.trim()) {
      newErrors.fullName = "Please enter your full name";
    }
    if (!studentId.trim()) {
      newErrors.studentId = "Please enter your student ID";
    }
    if (!programme.trim()) {
      newErrors.programme = "Please enter your programme/department";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    onSubmit({
      fullName: fullName.trim(),
      studentId: studentId.trim(),
      programme: programme.trim(),
    });
  };

  return (
    <div className="px-6 py-8 animate-fadeIn">
      <div className="max-w-md mx-auto">
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Student Information
          </h2>
          <p className="text-sm text-gray-500">
            Please provide your details to help us assist you better
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.fullName
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 bg-white"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder="e.g., Jane Doe"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Student ID */}
          <div>
            <label
              htmlFor="studentId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Student ID
            </label>
            <input
              type="text"
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.studentId
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 bg-white"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder="e.g., S12345678"
            />
            {errors.studentId && (
              <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
            )}
          </div>

          {/* Programme/Department */}
          <div>
            <label
              htmlFor="programme"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Programme/Department
            </label>
            <input
              type="text"
              id="programme"
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.programme
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 bg-white"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder="e.g., Computer Science"
            />
            {errors.programme && (
              <p className="mt-1 text-sm text-red-600">{errors.programme}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {isLoading ? "Submitting..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
