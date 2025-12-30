"use client";

interface DiagnosisSummaryCardProps {
  issueKey: string;
  summary: string;
  slots: Record<string, string>;
  studentInfo: {
    fullName: string;
    studentId: string;
    programme: string;
  };
  sourceUrls: string[];
}

export function DiagnosisSummaryCard({
  issueKey,
  summary,
  slots,
  studentInfo,
  sourceUrls,
}: DiagnosisSummaryCardProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-green-600"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-green-800">Issue Diagnosed</h3>
      </div>

      <p className="text-green-900 mb-4">{summary}</p>

      {/* Student Information */}
      {studentInfo.fullName && (
        <div className="bg-white/50 rounded-lg p-3 mb-3">
          <h4 className="text-sm font-medium text-green-700 mb-2">
            Student Information
          </h4>
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="text-green-600 text-xs">Name</dt>
              <dd className="text-green-900">{studentInfo.fullName}</dd>
            </div>
            <div>
              <dt className="text-green-600 text-xs">Student ID</dt>
              <dd className="text-green-900">{studentInfo.studentId}</dd>
            </div>
            <div>
              <dt className="text-green-600 text-xs">Programme</dt>
              <dd className="text-green-900">{studentInfo.programme}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Collected Information */}
      {Object.keys(slots).length > 0 && (
        <div className="bg-white/50 rounded-lg p-3 mb-3">
          <h4 className="text-sm font-medium text-green-700 mb-2">
            Collected Information
          </h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(slots).map(([key, value]) => (
              <div key={key}>
                <dt className="text-green-600 text-xs">{formatSlotKey(key)}</dt>
                <dd className="text-green-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Source URLs */}
      {sourceUrls.length > 0 && (
        <div className="bg-white/50 rounded-lg p-3">
          <h4 className="text-sm font-medium text-green-700 mb-2">
            Reference Links
          </h4>
          <div className="space-y-1">
            {sourceUrls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-green-600 hover:text-green-800 hover:underline"
              >
                View on Wayfinder ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatSlotKey(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
