/**
 * Email Template Service
 * Generates structured email drafts using the 5W1H principle
 * 
 * 5W1H:
 * - Who: Student info (name, ID, course)
 * - What: The specific problem/request
 * - When: When the issue occurred/deadline
 * - Where: Location/system involved
 * - Why: Reason for contact/impact
 * - How: What has been tried/what is requested
 */

import { ProblemClassification } from './problemClassificationService';
import * as analytics from './analyticsService';

export interface StudentInfo {
  name: string;
  studentId: string;
  email?: string;
  course?: string;
  yearOfStudy?: string;
}

export interface FiveWOneH {
  who: string;      // Student info
  what: string;     // The problem
  when: string;     // Timeline
  where: string;    // Location/system
  why: string;      // Impact/reason
  how: string;      // What's needed
}

export interface EmailTemplate {
  to: string;
  subject: string;
  body: string;
  fiveWOneH: FiveWOneH;
  templateType: 'inquiry' | 'complaint' | 'request' | 'follow_up';
  department: string;
}

// Email templates for different scenarios - written naturally from student's first-person perspective
const EMAIL_TEMPLATES = {
  inquiry: {
    subject: 'Question about {specificIssue}',
    greeting: 'Hi {department} Team,',
    opening: 'I hope this email finds you well. I have a question about {what} and was hoping you could help.',
    closing: 'I\'d really appreciate any help or guidance you can provide.',
    signoff: 'Thanks so much!',
  },
  complaint: {
    subject: 'Help needed: {specificIssue}',
    greeting: 'Hi {department} Team,',
    opening: 'I\'m reaching out because I\'m having an issue with {what} and could really use some help.',
    closing: 'I\'d be so grateful if you could look into this for me.',
    signoff: 'Thank you for your help!',
  },
  request: {
    subject: 'Request: {specificIssue}',
    greeting: 'Hi {department} Team,',
    opening: 'I hope you\'re doing well! I\'m writing because I need some help with {what}.',
    closing: 'It would mean a lot if you could assist me with this.',
    signoff: 'Thanks in advance!',
  },
  follow_up: {
    subject: 'Following up: {specificIssue}',
    greeting: 'Hi {department} Team,',
    opening: 'I\'m just following up on my previous message about {what}.',
    closing: 'I\'d really appreciate an update when you get a chance.',
    signoff: 'Thanks again!',
  },
};

// Department email mapping
const DEPARTMENT_EMAILS: Record<string, string> = {
  'Accommodation Office': 'accommodation@coventry.ac.uk',
  'Finance Office': 'finance@coventry.ac.uk',
  'Academic Support Team': 'academicsupport@coventry.ac.uk',
  'International Student Support': 'international@coventry.ac.uk',
  'Wellbeing Team': 'wellbeing@coventry.ac.uk',
  'Careers Service': 'careers@coventry.ac.uk',
  'Registry': 'registry@coventry.ac.uk',
  'Student Support': 'studentsupport@coventry.ac.uk',
  'IT Services': 'itservices@coventry.ac.uk',
  'Library Services': 'library@coventry.ac.uk',
};

/**
 * Generate 5W1H structure from problem and student info
 */
export function generate5W1H(
  student: StudentInfo,
  classification: ProblemClassification,
  additionalContext?: {
    when?: string;
    where?: string;
    why?: string;
    how?: string;
  }
): FiveWOneH {
  // Extract more specific information from the classification
  const specificIssue = classification.specificIssue || classification.subcategory || classification.category;
  const department = classification.suggestedDepartment || 'Student Support';

  return {
    who: `${student.name} (Student ID: ${student.studentId}${student.course ? `, studying ${student.course}` : ''}${student.yearOfStudy ? ` in Year ${student.yearOfStudy}` : ''})`,
    what: specificIssue,
    when: additionalContext?.when || 'Recently',
    where: additionalContext?.where || `the ${department} department`,
    why: additionalContext?.why || 'This is affecting my ability to continue with my studies effectively',
    how: additionalContext?.how || 'I would appreciate your guidance and assistance in resolving this matter',
  };
}

/**
 * Determine the best template type based on the message
 */
export function determineTemplateType(
  message: string,
  classification: ProblemClassification
): 'inquiry' | 'complaint' | 'request' | 'follow_up' {
  const lowerMsg = message.toLowerCase();
  
  // Check for complaint indicators
  if (lowerMsg.includes('problem') || lowerMsg.includes('issue') || 
      lowerMsg.includes('not working') || lowerMsg.includes('broken') ||
      lowerMsg.includes('complaint') || lowerMsg.includes('wrong') ||
      lowerMsg.includes('error') || lowerMsg.includes('failed')) {
    return 'complaint';
  }
  
  // Check for request indicators
  if (lowerMsg.includes('request') || lowerMsg.includes('please') ||
      lowerMsg.includes('need') || lowerMsg.includes('want') ||
      lowerMsg.includes('can i') || lowerMsg.includes('could you') ||
      lowerMsg.includes('help me')) {
    return 'request';
  }
  
  // Check for follow-up indicators
  if (lowerMsg.includes('follow') || lowerMsg.includes('update') ||
      lowerMsg.includes('status') || lowerMsg.includes('previous') ||
      lowerMsg.includes('still waiting') || lowerMsg.includes('no response')) {
    return 'follow_up';
  }
  
  // Default to inquiry
  return 'inquiry';
}

/**
 * Generate a complete email template
 */
export function generateEmailTemplate(
  student: StudentInfo,
  classification: ProblemClassification,
  userMessage: string,
  additionalContext?: {
    when?: string;
    where?: string;
    why?: string;
    how?: string;
  }
): EmailTemplate {
  const templateType = determineTemplateType(userMessage, classification);
  const template = EMAIL_TEMPLATES[templateType];
  const fiveWOneH = generate5W1H(student, classification, additionalContext);
  
  const department = classification.suggestedDepartment || 'Student Support';
  const email = DEPARTMENT_EMAILS[department] || 'studentsupport@coventry.ac.uk';
  
  // Build subject - prioritize actual user message over classification if it's more descriptive
  // Take first 50 chars of user message as a better subject if classification looks generic
  let subjectIssue = classification.specificIssue || classification.subcategory || 'my inquiry';
  
  // If the userMessage is more specific, use it for the subject
  if (userMessage && userMessage.length > 10) {
    // Clean up the user message for subject line
    const cleanedMessage = userMessage
      .replace(/['"]/g, '')              // Remove quotes
      .replace(/\s+/g, ' ')              // Normalize whitespace
      .trim();
    
    // Use first 60 chars of user message if it's more descriptive
    if (cleanedMessage.length > 5) {
      subjectIssue = cleanedMessage.length > 60 
        ? cleanedMessage.slice(0, 57) + '...'
        : cleanedMessage;
    }
  }
  
  const subject = template.subject.replace('{specificIssue}', subjectIssue);
  
  // Build body - completely natural, like a real student wrote it
  const studentIntro = student.course 
    ? `I'm ${student.name}, currently studying ${student.course}${student.yearOfStudy ? ` in Year ${student.yearOfStudy}` : ''}.`
    : `I'm ${student.name}, a student at Coventry University.`;
  
  // Use the user's actual message for issue description, falling back to classification
  const issueDescription = userMessage && userMessage.length > 5
    ? userMessage
    : `a ${fiveWOneH.what.toLowerCase()} matter`;
  
  // Build more natural time context
  const timeContext = fiveWOneH.when === 'Recently'
    ? "I've been dealing with this recently"
    : fiveWOneH.when === 'Currently experiencing this issue'
    ? "I'm currently experiencing this issue"
    : `This started ${fiveWOneH.when.toLowerCase()}`;
  
  // Build more natural impact description
  const impact = fiveWOneH.why === 'This matter requires attention for my studies to proceed smoothly'
    ? "and it's starting to affect my studies"
    : fiveWOneH.why === 'This is affecting my ability to continue with my studies effectively'
    ? "and it's affecting my ability to continue with my studies effectively"
    : `and ${fiveWOneH.why.toLowerCase()}`;
  
  // Build more natural request
  const whatNeeded = fiveWOneH.how === 'I would appreciate your guidance on how to resolve this'
    ? "I'd really appreciate any help or guidance you can offer."
    : fiveWOneH.how === 'I would appreciate your guidance and assistance in resolving this matter'
    ? "I'd really appreciate your guidance and assistance in resolving this matter."
    : fiveWOneH.how;
  
  const body = `${template.greeting.replace('{department}', department)}

${template.opening.replace('{what}', issueDescription)}

${studentIntro} My student ID is ${student.studentId}.

${timeContext}, ${impact}. ${whatNeeded}

${template.closing}

${template.signoff}
${student.name}${student.email ? `\n${student.email}` : ''}`;

  return {
    to: email,
    subject,
    body,
    fiveWOneH,
    templateType,
    department,
  };
}

/**
 * Generate a simple email template with minimal info (just name and student ID)
 */
export function generateSimpleEmailTemplate(
  name: string,
  studentId: string,
  classification: ProblemClassification,
  userMessage: string
): EmailTemplate {
  return generateEmailTemplate(
    { name, studentId },
    classification,
    userMessage
  );
}

/**
 * Save email template to database
 */
export async function saveEmailTemplate(
  sessionId: string,
  template: EmailTemplate
): Promise<string | null> {
  return analytics.saveEmailTemplate({
    sessionId,
    templateType: template.templateType,
    recipientDepartment: template.department,
    recipientEmail: template.to,
    subject: template.subject,
    body: template.body,
    fiveWOneH: template.fiveWOneH,
    userVariables: {},
  });
}

/**
 * Format email for display (HTML-safe)
 */
export function formatEmailForDisplay(template: EmailTemplate): string {
  return `
📧 **Email Draft**

**To:** ${template.to}
**Subject:** ${template.subject}

---

${template.body}

---
*This email was auto-generated. Please review before sending.*
  `.trim();
}

/**
 * Get suggested department email
 */
export function getDepartmentEmail(department: string): string {
  return DEPARTMENT_EMAILS[department] || 'studentsupport@coventry.ac.uk';
}
