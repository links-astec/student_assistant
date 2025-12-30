/**
 * Contact Directory Service
 * Provides direct contact information for all university departments
 * 
 * Key Features:
 * - Department contact lookup
 * - Phone numbers, emails, office locations
 * - Opening hours
 * - Specific contact for specific issues
 */

export interface ContactInfo {
  department: string;
  email: string;
  phone?: string;
  location?: string;
  openingHours?: string;
  website?: string;
  description?: string;
  urgentContact?: {
    phone: string;
    available: string;
  };
}

export interface SpecificContact {
  name: string;
  role: string;
  email: string;
  phone?: string;
  expertise: string[];
}

// Main department contacts
export const DEPARTMENT_CONTACTS: Record<string, ContactInfo> = {
  accommodation: {
    department: 'Accommodation Office',
    email: 'accommodation@coventry.ac.uk',
    phone: '+44 (0)24 7765 8686',
    location: 'TheHub, Ground Floor',
    openingHours: 'Monday-Friday: 9:00am - 5:00pm',
    website: 'https://www.coventry.ac.uk/life-on-campus/accommodation/',
    description: 'Help with university accommodation, room issues, contracts, and housing advice',
  },
  finance: {
    department: 'Finance Office',
    email: 'finance@coventry.ac.uk',
    phone: '+44 (0)24 7765 2020',
    location: 'TheHub, First Floor',
    openingHours: 'Monday-Friday: 9:00am - 4:30pm',
    website: 'https://www.coventry.ac.uk/study/finance/',
    description: 'Tuition fees, payments, refunds, and financial queries',
    urgentContact: {
      phone: '+44 (0)24 7765 2021',
      available: 'Emergencies only',
    },
  },
  academicSupport: {
    department: 'Academic Support Team',
    email: 'academicsupport@coventry.ac.uk',
    phone: '+44 (0)24 7765 7688',
    location: 'Lanchester Library, Level 2',
    openingHours: 'Monday-Friday: 9:00am - 5:00pm',
    website: 'https://www.coventry.ac.uk/study/student-support/',
    description: 'Academic writing, study skills, learning support, and academic concerns',
  },
  international: {
    department: 'International Student Support',
    email: 'international@coventry.ac.uk',
    phone: '+44 (0)24 7765 5700',
    location: 'TheHub, Ground Floor',
    openingHours: 'Monday-Friday: 9:00am - 5:00pm',
    website: 'https://www.coventry.ac.uk/international-students/',
    description: 'Visa advice, immigration support, and international student services',
    urgentContact: {
      phone: '+44 (0)24 7765 5701',
      available: 'Visa emergencies',
    },
  },
  wellbeing: {
    department: 'Wellbeing Team',
    email: 'wellbeing@coventry.ac.uk',
    phone: '+44 (0)24 7765 8029',
    location: 'TheHub, First Floor',
    openingHours: 'Monday-Friday: 9:00am - 5:00pm',
    website: 'https://www.coventry.ac.uk/study/student-support/health-and-wellbeing/',
    description: 'Mental health support, counselling, disability support, and wellbeing services',
    urgentContact: {
      phone: '116 123',
      available: '24/7 Samaritans crisis line',
    },
  },
  careers: {
    department: 'Careers Service',
    email: 'careers@coventry.ac.uk',
    phone: '+44 (0)24 7765 7688',
    location: 'TheHub, First Floor',
    openingHours: 'Monday-Friday: 9:00am - 5:00pm',
    website: 'https://www.coventry.ac.uk/study/student-support/careers/',
    description: 'Career advice, CV help, job applications, and employability support',
  },
  registry: {
    department: 'Registry',
    email: 'registry@coventry.ac.uk',
    phone: '+44 (0)24 7765 7688',
    location: 'TheHub, Ground Floor',
    openingHours: 'Monday-Friday: 9:00am - 4:30pm',
    website: 'https://www.coventry.ac.uk/study/student-support/',
    description: 'Student ID cards, enrollment, certificates, and official documents',
  },
  library: {
    department: 'Library Services',
    email: 'library@coventry.ac.uk',
    phone: '+44 (0)24 7765 7688',
    location: 'Lanchester Library',
    openingHours: '24/7 (term time), Monday-Friday: 8:00am - 9:00pm (vacation)',
    website: 'https://www.coventry.ac.uk/life-on-campus/library/',
    description: 'Library resources, book loans, study spaces, and research support',
  },
  itServices: {
    department: 'IT Services',
    email: 'itservices@coventry.ac.uk',
    phone: '+44 (0)24 7765 7999',
    location: 'TheHub or Online',
    openingHours: 'Monday-Friday: 8:00am - 6:00pm',
    website: 'https://www.coventry.ac.uk/study/student-support/it-services/',
    description: 'IT support, password resets, WiFi issues, and software help',
  },
  studentUnion: {
    department: "Students' Union",
    email: 'info@cusu.org',
    phone: '+44 (0)24 7765 8200',
    location: "Students' Union Building",
    openingHours: 'Monday-Friday: 9:00am - 5:00pm',
    website: 'https://www.cusu.org/',
    description: 'Student representation, societies, events, and student life',
  },
  admissions: {
    department: 'Admissions Office',
    email: 'admissions@coventry.ac.uk',
    phone: '+44 (0)24 7765 2222',
    location: 'TheHub, Ground Floor',
    openingHours: 'Monday-Friday: 9:00am - 5:00pm',
    website: 'https://www.coventry.ac.uk/study/how-to-apply/',
    description: 'Applications, offers, UCAS queries, and enrollment',
  },
};

// Map categories to contact keys
const CATEGORY_CONTACT_MAP: Record<string, string> = {
  'Accommodation': 'accommodation',
  'Fees & Finance': 'finance',
  'Academic Support': 'academicSupport',
  'International Students': 'international',
  'Health & Wellbeing': 'wellbeing',
  'Careers & Employability': 'careers',
  'Student ID & Registration': 'registry',
  'IT Services': 'itServices',
  'Library': 'library',
  'Student Union': 'studentUnion',
  'Admissions': 'admissions',
};

/**
 * Get contact info by department key
 */
export function getContactByKey(key: string): ContactInfo | null {
  return DEPARTMENT_CONTACTS[key] || null;
}

/**
 * Get contact info by category
 */
export function getContactByCategory(category: string): ContactInfo | null {
  const key = CATEGORY_CONTACT_MAP[category];
  if (!key) return null;
  return DEPARTMENT_CONTACTS[key];
}

/**
 * Get all contacts
 */
export function getAllContacts(): ContactInfo[] {
  return Object.values(DEPARTMENT_CONTACTS);
}

/**
 * Search contacts by keyword
 */
export function searchContacts(query: string): ContactInfo[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(DEPARTMENT_CONTACTS).filter(contact => 
    contact.department.toLowerCase().includes(lowerQuery) ||
    contact.description?.toLowerCase().includes(lowerQuery) ||
    contact.email.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Format contact info for display
 */
export function formatContactForDisplay(contact: ContactInfo): string {
  let output = `
📞 **${contact.department}**

📧 Email: ${contact.email}
${contact.phone ? `📱 Phone: ${contact.phone}` : ''}
${contact.location ? `📍 Location: ${contact.location}` : ''}
${contact.openingHours ? `🕒 Hours: ${contact.openingHours}` : ''}
${contact.website ? `🔗 Website: ${contact.website}` : ''}
`;

  if (contact.urgentContact) {
    output += `
⚠️ **Urgent Contact:**
📱 ${contact.urgentContact.phone} (${contact.urgentContact.available})
`;
  }

  return output.trim();
}

/**
 * Get emergency contacts
 */
export function getEmergencyContacts(): { name: string; phone: string; description: string }[] {
  return [
    {
      name: 'University Security',
      phone: '+44 (0)24 7765 8555',
      description: '24/7 campus security and emergencies',
    },
    {
      name: 'Emergency Services',
      phone: '999',
      description: 'Police, Fire, Ambulance',
    },
    {
      name: 'Samaritans',
      phone: '116 123',
      description: '24/7 emotional support helpline',
    },
    {
      name: 'NHS Non-Emergency',
      phone: '111',
      description: 'Medical advice when not life-threatening',
    },
    {
      name: 'Nightline',
      phone: '+44 (0)24 7765 8099',
      description: 'Student-run listening service (evenings)',
    },
  ];
}

/**
 * Format emergency contacts for display
 */
export function formatEmergencyContacts(): string {
  const contacts = getEmergencyContacts();
  let output = '🚨 **Emergency Contacts**\n\n';
  
  contacts.forEach(contact => {
    output += `**${contact.name}:** ${contact.phone}\n${contact.description}\n\n`;
  });
  
  return output.trim();
}

/**
 * Get quick contact based on problem type
 */
export function getQuickContact(category: string): {
  email: string;
  phone: string;
  department: string;
  actionText: string;
} {
  const contact = getContactByCategory(category);
  
  if (contact) {
    return {
      email: contact.email,
      phone: contact.phone || 'Not available',
      department: contact.department,
      actionText: `Contact ${contact.department} for help with this issue`,
    };
  }
  
  // Default to student support
  return {
    email: 'studentsupport@coventry.ac.uk',
    phone: '+44 (0)24 7765 7688',
    department: 'Student Support',
    actionText: 'Contact Student Support for general assistance',
  };
}
