-- CampusFlow Seed Data
-- MVP: Top-level categories + Enrolment > ID Card scenarios

-- ============================================
-- Slot Definitions (global)
-- ============================================

INSERT INTO slot_definitions (slot_key, label, required, input_hint, validation_regex) VALUES
  ('student_name', 'Full Name', true, 'Enter your full name as registered', NULL),
  ('student_id', 'Student ID', true, 'Enter your student ID (e.g., 20231234)', '^\d{8}$'),
  ('programme_or_year', 'Programme & Year', true, 'e.g., Computer Science, Year 2', NULL),
  ('urgency_or_deadline', 'Urgency/Deadline', true, 'When do you need this resolved?', NULL),
  ('specific_question', 'Additional Details', false, 'Any other details we should know?', NULL);

-- ============================================
-- Top-Level Categories (Root Issue Nodes)
-- ============================================

INSERT INTO issue_nodes (key, parent_key, title, description, keywords, sort_order) VALUES
  ('after_graduation', NULL, 'After Graduation', 'Post-graduation services and alumni support', ARRAY['graduation', 'alumni', 'graduate', 'after graduation'], 1),
  ('campus_facilities', NULL, 'Campus Facilities', 'Libraries, buildings, parking, and campus access', ARRAY['library', 'building', 'parking', 'facilities', 'access', 'campus'], 2),
  ('digital_information', NULL, 'Digital Information', 'IT systems, portal access, email, and digital services', ARRAY['it', 'portal', 'email', 'password', 'login', 'digital', 'system'], 3),
  ('enrolment', NULL, 'Enrolment', 'Student registration and enrolment matters', ARRAY['enrolment', 'enrollment', 'registration', 'register', 'sign up'], 4),
  ('exams_results', NULL, 'Exams and Results', 'Examination schedules, results, and grade queries', ARRAY['exam', 'test', 'result', 'grade', 'mark', 'score'], 5),
  ('finance', NULL, 'Finance', 'Tuition fees, payments, and financial aid', ARRAY['fee', 'payment', 'finance', 'tuition', 'scholarship', 'bursary', 'money'], 6),
  ('international_students', NULL, 'International Students', 'Visa, immigration, and international student support', ARRAY['visa', 'international', 'immigration', 'passport', 'overseas'], 7),
  ('campus_life_services', NULL, 'Services for campus life', 'Clubs, societies, sports, and campus activities', ARRAY['club', 'society', 'sport', 'activity', 'event', 'campus life'], 8),
  ('study_support', NULL, 'Services for study support', 'Academic support, tutoring, and study resources', ARRAY['tutor', 'study', 'academic', 'support', 'help', 'learning'], 9),
  ('student_id_cards', NULL, 'Student ID Cards', 'Student identification cards and related services', ARRAY['id', 'card', 'student card', 'identification', 'id card', 'student id'], 10),
  ('student_wellbeing', NULL, 'Student Wellbeing', 'Health, counseling, and wellbeing services', ARRAY['health', 'wellbeing', 'counseling', 'mental health', 'wellness', 'medical'], 11),
  ('timetables_attendance', NULL, 'Timetables and Attendance', 'Class schedules and attendance tracking', ARRAY['timetable', 'schedule', 'attendance', 'class', 'lecture', 'time'], 12),
  ('student_records', NULL, 'Your Student Records', 'Transcripts, certificates, and student records', ARRAY['transcript', 'certificate', 'record', 'document', 'verification'], 13),
  ('student_journey', NULL, 'Your student journey', 'General guidance through your student experience', ARRAY['journey', 'pathway', 'guidance', 'general', 'help'], 14);

-- ============================================
-- Second Level - Student ID Cards subcategories
-- ============================================

INSERT INTO issue_nodes (key, parent_key, title, description, keywords, sort_order) VALUES
  ('id_card', 'student_id_cards', 'Student ID Card', 'Issues related to student identification cards',
   ARRAY['id', 'card', 'student card', 'identification', 'id card', 'student id'], 1);

-- ============================================
-- Issue Variants (Leaf Nodes / Diagnoses)
-- ============================================

-- ID Card Pickup
INSERT INTO issue_variants (key, issue_node_key, title, keywords, requires_contact) VALUES
  ('id_card_pickup', 'id_card', 'ID Card Pickup Location',
   ARRAY['pickup', 'collect', 'where', 'location', 'get', 'new card', 'first card', 'collect card'], true);

-- ID Card Replacement (Lost)
INSERT INTO issue_variants (key, issue_node_key, title, keywords, requires_contact) VALUES
  ('id_card_replacement_lost', 'id_card', 'ID Card Replacement (Lost/Stolen)',
   ARRAY['lost', 'stolen', 'missing', 'replace', 'replacement', 'new', 'lost card', 'stolen card'], true);

-- ============================================
-- Contacts
-- ============================================

-- Contact for ID Card Pickup
INSERT INTO contacts (issue_key, department_name, emails, phones, hours_text, links) VALUES
  ('id_card_pickup',
   'Student Services - ID Card Office',
   ARRAY['idcard@university.edu', 'studentservices@university.edu'],
   ARRAY['+1-555-123-4567'],
   'Monday-Friday: 9:00 AM - 5:00 PM (Closed on public holidays)',
   ARRAY['https://university.edu/student-services/id-card', 'https://university.edu/campus-map']);

-- Contact for ID Card Replacement
INSERT INTO contacts (issue_key, department_name, emails, phones, hours_text, links) VALUES
  ('id_card_replacement_lost',
   'Student Services - ID Card Office',
   ARRAY['idcard@university.edu', 'studentservices@university.edu'],
   ARRAY['+1-555-123-4567'],
   'Monday-Friday: 9:00 AM - 5:00 PM (Closed on public holidays)',
   ARRAY['https://university.edu/student-services/id-card/replacement', 'https://university.edu/forms/id-replacement']);

-- ============================================
-- Question Nodes for ID Card Pickup
-- ============================================

INSERT INTO question_nodes (issue_key, order_index, question_text, type, options, slot_key) VALUES
  ('id_card_pickup', 1,
   'Is this your first ID card, or are you picking up a replacement?',
   'single',
   '[{"id": "first", "label": "First ID card (new student)", "value": "first_card"}, {"id": "replacement", "label": "Picking up a replacement", "value": "replacement_pickup"}]'::jsonb,
   NULL);

INSERT INTO question_nodes (issue_key, order_index, question_text, type, options, slot_key) VALUES
  ('id_card_pickup', 2,
   'Have you completed your online registration and photo submission?',
   'single',
   '[{"id": "yes", "label": "Yes, all completed", "value": "registration_complete"}, {"id": "no", "label": "No, not yet", "value": "registration_incomplete"}, {"id": "unsure", "label": "I''m not sure", "value": "registration_unsure"}]'::jsonb,
   NULL);

INSERT INTO question_nodes (issue_key, order_index, question_text, type, options, slot_key) VALUES
  ('id_card_pickup', 3,
   'When do you need the ID card by?',
   'single',
   '[{"id": "urgent", "label": "Urgently (within 1-2 days)", "value": "urgent"}, {"id": "week", "label": "Within a week", "value": "within_week"}, {"id": "flexible", "label": "No rush, flexible", "value": "flexible"}]'::jsonb,
   'urgency_or_deadline');

-- ============================================
-- Question Nodes for ID Card Replacement (Lost)
-- ============================================

INSERT INTO question_nodes (issue_key, order_index, question_text, type, options, slot_key) VALUES
  ('id_card_replacement_lost', 1,
   'Was your ID card lost or stolen?',
   'single',
   '[{"id": "lost", "label": "Lost", "value": "lost"}, {"id": "stolen", "label": "Stolen", "value": "stolen"}, {"id": "damaged", "label": "Damaged/Unusable", "value": "damaged"}]'::jsonb,
   NULL);

INSERT INTO question_nodes (issue_key, order_index, question_text, type, options, slot_key) VALUES
  ('id_card_replacement_lost', 2,
   'Have you reported the loss/theft to campus security?',
   'single',
   '[{"id": "yes", "label": "Yes, already reported", "value": "reported"}, {"id": "no", "label": "No, not yet", "value": "not_reported"}]'::jsonb,
   NULL);

INSERT INTO question_nodes (issue_key, order_index, question_text, type, options, slot_key) VALUES
  ('id_card_replacement_lost', 3,
   'How urgently do you need the replacement?',
   'single',
   '[{"id": "urgent", "label": "Urgently (need building access)", "value": "urgent"}, {"id": "soon", "label": "Within a few days", "value": "soon"}, {"id": "flexible", "label": "Whenever convenient", "value": "flexible"}]'::jsonb,
   'urgency_or_deadline');

-- ============================================
-- Email Templates (5W1H Format)
-- ============================================

-- Template for ID Card Pickup
INSERT INTO email_templates (issue_key, subject_template, body_template_5w1h) VALUES
  ('id_card_pickup',
   'Student ID Card Pickup Request - {{student_id}}',
   'Dear Student Services Team,

**WHO:** I am {{student_name}}, Student ID: {{student_id}}, enrolled in {{programme_or_year}}.

**WHAT:** I am writing to inquire about picking up my student ID card.

**WHEN:** I need the card by: {{urgency_or_deadline}}.

**WHERE:** Please let me know the pickup location and any required documents I should bring.

**WHY:** I need the ID card for campus access and student services.

**HOW:** Please advise on the pickup process, required documents, and office hours.

Thank you for your assistance.

Best regards,
{{student_name}}
Student ID: {{student_id}}');

-- Template for ID Card Replacement (Lost)
INSERT INTO email_templates (issue_key, subject_template, body_template_5w1h) VALUES
  ('id_card_replacement_lost',
   'Student ID Card Replacement Request - {{student_id}}',
   'Dear Student Services Team,

**WHO:** I am {{student_name}}, Student ID: {{student_id}}, enrolled in {{programme_or_year}}.

**WHAT:** I am requesting a replacement for my lost/stolen student ID card.

**WHEN:** I need the replacement by: {{urgency_or_deadline}}.

**WHERE:** My previous card was lost/stolen. I have reported this to campus security.

**WHY:** I require a new ID card for campus building access and student services.

**HOW:** Please advise on:
1. The replacement fee and payment method
2. Required documents for the replacement
3. Expected processing time
4. Pickup location

Thank you for your prompt assistance.

Best regards,
{{student_name}}
Student ID: {{student_id}}');
