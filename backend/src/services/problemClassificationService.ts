/**
 * Problem Classification Service
 * Provides granular 3-level problem identification
 * 
 * Level 1: Category (e.g., "Accommodation")
 * Level 2: Subcategory (e.g., "Fees and Payment")
 * Level 3: Specific Issue (e.g., "Payment deadline confusion")
 */

import { config, generateOllamaChat } from '../config';

// Problem taxonomy - 3 levels of granularity
export const PROBLEM_TAXONOMY = {
  'Accommodation': {
    'Application & Booking': [
      'How to apply for accommodation',
      'Application deadline missed',
      'Cannot access booking portal',
      'Room preference not available',
      'Guarantee eligibility questions',
    ],
    'Fees & Payment': [
      'Payment deadline confusion',
      'Cannot pay online',
      'Refund request',
      'Instalment plan questions',
      'Fee amount incorrect',
    ],
    'Room & Facilities': [
      'Room change request',
      'Maintenance issue',
      'Internet not working',
      'Key/access card problem',
      'Noise complaint',
    ],
    'Contract & Moving': [
      'Contract length questions',
      'Early termination request',
      'Moving in date issues',
      'Moving out procedure',
      'Deposit return',
    ],
  },
  'Fees & Finance': {
    'Tuition Fees': [
      'Fee amount inquiry',
      'Payment methods',
      'Payment deadline',
      'Fee status check',
      'Instalment plan setup',
    ],
    'Scholarships & Bursaries': [
      'Eligibility check',
      'Application process',
      'Application status',
      'Award amount questions',
      'Scholarship not applied',
    ],
    'Student Loans': [
      'Loan application help',
      'Loan not received',
      'Loan amount incorrect',
      'Repayment questions',
      'SFE issues',
    ],
    'Refunds': [
      'Tuition refund request',
      'Refund status check',
      'Refund amount dispute',
      'Refund timeline',
    ],
  },
  'Academic Support': {
    'Tutoring & Help': [
      'Find academic tutor',
      'Book tutoring session',
      'Subject-specific help',
      'Study skills support',
      'sigma maths help',
    ],
    'Library Services': [
      'Library hours',
      'Book reservation',
      'Online resources access',
      'Study space booking',
      'Library card issue',
    ],
    'Writing Support': [
      'CAW appointment booking',
      'Essay feedback',
      'Referencing help',
      'Dissertation support',
      'Academic writing tips',
    ],
    'Exams & Assessment': [
      'Exam timetable',
      'Resit information',
      'Extenuating circumstances',
      'Grade inquiry',
      'Assessment deadline extension',
    ],
  },
  'International Students': {
    'Visa & Immigration': [
      'Visa application help',
      'Visa extension',
      'CAS letter request',
      'BRP collection',
      'Visa status check',
    ],
    'English Language': [
      'Pre-sessional course info',
      'English test requirements',
      'Language support services',
      'IELTS preparation',
    ],
    'Arrival & Orientation': [
      'Airport pickup',
      'Orientation schedule',
      'Registration process',
      'Welcome week info',
    ],
    'Working While Studying': [
      'Work hour limits',
      'NI number application',
      'Part-time job search',
      'Work rights questions',
    ],
  },
  'Health & Wellbeing': {
    'Mental Health': [
      'Counselling appointment',
      'Crisis support needed',
      'Anxiety/stress help',
      'Mental health resources',
    ],
    'Disability Support': [
      'Register disability',
      'Reasonable adjustments',
      'DSA application',
      'Accessibility issues',
    ],
    'Medical Services': [
      'GP registration',
      'Medical centre hours',
      'Vaccination info',
      'Sick note request',
    ],
    'General Wellbeing': [
      'Welfare advice',
      'Financial hardship',
      'Homesickness support',
      'Peer support groups',
    ],
  },
  'Careers & Employability': {
    'CV & Applications': [
      'CV review request',
      'Cover letter help',
      'Application advice',
      'LinkedIn profile review',
    ],
    'Placements': [
      'Find placement opportunity',
      'Placement requirements',
      'Placement credit questions',
      'Placement abroad',
    ],
    'Career Guidance': [
      'Career appointment booking',
      'Career options exploration',
      'Industry connections',
      'Graduate schemes info',
    ],
    'Skills Development': [
      'Workshop booking',
      'LinkedIn Learning access',
      'Employability skills',
      'Interview preparation',
    ],
  },
  'Student ID & Registration': {
    'ID Card': [
      'ID card not received',
      'ID card replacement',
      'ID card collection location',
      'Photo upload issue',
    ],
    'Enrolment': [
      'Enrolment process',
      'Enrolment deadline',
      'Cannot complete enrolment',
      'Document verification',
    ],
    'Course Changes': [
      'Change course request',
      'Add/drop module',
      'Intermission request',
      'Withdrawal process',
    ],
  },
};

export interface ProblemClassification {
  category: string;
  subcategory: string;
  specificIssue: string;
  confidence: number;
  suggestedDepartment: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Department mapping
const DEPARTMENT_MAP: Record<string, { name: string; email?: string; phone?: string }> = {
  'Accommodation': { 
    name: 'Accommodation Office', 
    email: 'accommodation@coventry.ac.uk',
  },
  'Fees & Finance': { 
    name: 'Finance Office', 
    email: 'finance@coventry.ac.uk',
  },
  'Academic Support': { 
    name: 'Academic Support Team',
    email: 'academicsupport@coventry.ac.uk',
  },
  'International Students': { 
    name: 'International Student Support',
    email: 'international@coventry.ac.uk',
  },
  'Health & Wellbeing': { 
    name: 'Wellbeing Team',
    email: 'wellbeing@coventry.ac.uk',
  },
  'Careers & Employability': { 
    name: 'Careers Service',
    email: 'careers@coventry.ac.uk',
  },
  'Student ID & Registration': { 
    name: 'Registry',
    email: 'registry@coventry.ac.uk',
  },
};

/**
 * Classify a problem with 3-level granularity using LLM
 */
export async function classifyProblem(
  userMessage: string,
  conversationHistory: string[] = []
): Promise<ProblemClassification> {
  
  // Build the taxonomy as a string for the LLM
  const taxonomyString = Object.entries(PROBLEM_TAXONOMY)
    .map(([cat, subs]) => {
      const subStr = Object.entries(subs)
        .map(([sub, issues]) => `    ${sub}: ${issues.join(', ')}`)
        .join('\n');
      return `${cat}:\n${subStr}`;
    })
    .join('\n\n');

  const prompt = `You are a problem classification system for Coventry University student support.

Analyze the student's message and classify their problem into exactly 3 levels:
1. Category (main topic)
2. Subcategory (specific area within the topic)
3. Specific Issue (the exact problem)

Also assess:
- Confidence (0.0 to 1.0)
- Urgency: "low", "medium", "high", or "critical"

Here is the problem taxonomy:

${taxonomyString}

Student's message: "${userMessage}"

${conversationHistory.length > 0 ? `Previous messages in conversation:\n${conversationHistory.slice(-3).join('\n')}` : ''}

Respond in this exact JSON format only, no other text:
{
  "category": "...",
  "subcategory": "...",
  "specificIssue": "...",
  "confidence": 0.0,
  "urgencyLevel": "low"
}`;

  try {
    const response = await generateOllamaChat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 300, stream: false }
    );

    // Ensure we got a string response (not streaming)
    if (typeof response !== 'string') {
      throw new Error('Expected string response from non-streaming chat');
    }

    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Add department info
      const dept = DEPARTMENT_MAP[parsed.category] || { name: 'Student Support' };
      
      return {
        category: parsed.category || 'General',
        subcategory: parsed.subcategory || 'General Inquiry',
        specificIssue: parsed.specificIssue || userMessage.slice(0, 50),
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        suggestedDepartment: dept.name,
        urgencyLevel: parsed.urgencyLevel || 'medium',
      };
    }
  } catch (error) {
    console.error('Problem classification error:', error);
  }

  // Fallback to keyword-based classification
  return fallbackClassification(userMessage);
}

/**
 * Fallback keyword-based classification when LLM fails
 */
function fallbackClassification(message: string): ProblemClassification {
  const lowerMsg = message.toLowerCase();
  
  // Simple keyword matching
  if (lowerMsg.includes('accommodation') || lowerMsg.includes('room') || lowerMsg.includes('hall')) {
    return {
      category: 'Accommodation',
      subcategory: 'General Inquiry',
      specificIssue: message.slice(0, 50),
      confidence: 0.6,
      suggestedDepartment: 'Accommodation Office',
      urgencyLevel: 'medium',
    };
  }
  
  if (lowerMsg.includes('fee') || lowerMsg.includes('pay') || lowerMsg.includes('money') || lowerMsg.includes('scholarship')) {
    return {
      category: 'Fees & Finance',
      subcategory: 'General Inquiry',
      specificIssue: message.slice(0, 50),
      confidence: 0.6,
      suggestedDepartment: 'Finance Office',
      urgencyLevel: 'medium',
    };
  }
  
  if (lowerMsg.includes('visa') || lowerMsg.includes('international') || lowerMsg.includes('cas')) {
    return {
      category: 'International Students',
      subcategory: 'Visa & Immigration',
      specificIssue: message.slice(0, 50),
      confidence: 0.6,
      suggestedDepartment: 'International Student Support',
      urgencyLevel: 'high',
    };
  }
  
  if (lowerMsg.includes('mental') || lowerMsg.includes('counsell') || lowerMsg.includes('wellbeing') || lowerMsg.includes('stress')) {
    return {
      category: 'Health & Wellbeing',
      subcategory: 'Mental Health',
      specificIssue: message.slice(0, 50),
      confidence: 0.6,
      suggestedDepartment: 'Wellbeing Team',
      urgencyLevel: lowerMsg.includes('crisis') || lowerMsg.includes('urgent') ? 'critical' : 'high',
    };
  }
  
  if (lowerMsg.includes('id card') || lowerMsg.includes('student card') || lowerMsg.includes('enrol')) {
    return {
      category: 'Student ID & Registration',
      subcategory: 'General Inquiry',
      specificIssue: message.slice(0, 50),
      confidence: 0.6,
      suggestedDepartment: 'Registry',
      urgencyLevel: 'medium',
    };
  }
  
  // Default
  return {
    category: 'General',
    subcategory: 'General Inquiry',
    specificIssue: message.slice(0, 50),
    confidence: 0.3,
    suggestedDepartment: 'Student Support',
    urgencyLevel: 'low',
  };
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return Object.keys(PROBLEM_TAXONOMY);
}

/**
 * Get subcategories for a category
 */
export function getSubcategories(category: string): string[] {
  const taxonomy = PROBLEM_TAXONOMY as Record<string, Record<string, string[]>>;
  return Object.keys(taxonomy[category] || {});
}

/**
 * Get specific issues for a subcategory
 */
export function getSpecificIssues(category: string, subcategory: string): string[] {
  const taxonomy = PROBLEM_TAXONOMY as Record<string, Record<string, string[]>>;
  return taxonomy[category]?.[subcategory] || [];
}

/**
 * Get department info for a category
 */
export function getDepartmentInfo(category: string) {
  return DEPARTMENT_MAP[category] || { name: 'Student Support' };
}
