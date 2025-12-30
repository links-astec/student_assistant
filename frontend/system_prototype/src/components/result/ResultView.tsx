"use client";

import { DiagnosisSummaryCard } from "./DiagnosisSummaryCard";
import { ContactCard } from "./ContactCard";
import { EmailDraftCard } from "./EmailDraftCard";

interface ResultViewProps {
  result: {
    issueKey: string;
    summary: string;
    slots: Record<string, string>;
    studentInfo: {
      fullName: string;
      studentId: string;
      programme: string;
    };
    sourceUrls: string[];
    contact: {
      departmentName: string;
      emails: string[];
      phones: string[];
      hoursText: string;
      links: string[];
    };
    emailDraft: {
      subject: string;
      body: string;
    };
  };
  onReset: () => void;
  onContinueChat?: () => void;
}

export function ResultView({ result, onReset, onContinueChat }: ResultViewProps) {
  // Merge source URLs into contact links if they're not already there
  const allLinks = [
    ...result.contact.links,
    ...result.sourceUrls.filter(url => !result.contact.links.includes(url))
  ];

  // Show contact card if we have ANY contact info: emails, phones, OR links
  const hasContactInfo =
    result.contact.emails.length > 0 ||
    result.contact.phones.length > 0 ||
    allLinks.length > 0;

  return (
    <div className="p-4 space-y-4 overflow-y-auto chat-scrollbar">
      <DiagnosisSummaryCard
        issueKey={result.issueKey}
        summary={result.summary}
        slots={result.slots}
        studentInfo={result.studentInfo}
        sourceUrls={result.sourceUrls}
      />

      {hasContactInfo && (
        <ContactCard
          departmentName={result.contact.departmentName}
          emails={result.contact.emails}
          phones={result.contact.phones}
          hoursText={result.contact.hoursText}
          links={allLinks}
        />
      )}

      <EmailDraftCard
        subject={result.emailDraft.subject}
        body={result.emailDraft.body}
      />

      <div className="pt-4 space-y-3">
        {onContinueChat && (
          <button
            onClick={onContinueChat}
            className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium
                       hover:bg-blue-600 transition-colors duration-200 shadow-sm"
          >
            💬 Continue Chatting
          </button>
        )}
        <button
          onClick={onReset}
          className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium
                     hover:bg-gray-200 transition-colors duration-200"
        >
          🔄 Start New Enquiry
        </button>
      </div>
    </div>
  );
}
