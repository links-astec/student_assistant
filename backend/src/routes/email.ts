import { Router, Request, Response } from 'express';
import * as emailTemplateService from '../services/emailTemplateService';
import * as problemClassifier from '../services/problemClassificationService';
import * as contactDirectory from '../services/contactDirectoryService';

const router = Router();

/**
 * POST /api/email/generate
 * Generate an email template based on problem classification
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      studentId, 
      email,
      course,
      yearOfStudy,
      message, 
      sessionId,
      additionalContext 
    } = req.body;

    if (!name || !studentId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, studentId, message' 
      });
    }

    // Classify the problem
    const classification = await problemClassifier.classifyProblem(message);

    // Generate email template
    const template = emailTemplateService.generateEmailTemplate(
      { name, studentId, email, course, yearOfStudy },
      classification,
      message,
      additionalContext
    );

    // Save to database if session provided
    if (sessionId) {
      await emailTemplateService.saveEmailTemplate(sessionId, template);
    }

    res.json({
      success: true,
      template: {
        to: template.to,
        subject: template.subject,
        body: template.body,
        department: template.department,
        templateType: template.templateType,
      },
      classification: {
        category: classification.category,
        subcategory: classification.subcategory,
        specificIssue: classification.specificIssue,
        urgencyLevel: classification.urgencyLevel,
      },
      formattedEmail: emailTemplateService.formatEmailForDisplay(template),
    });
  } catch (error: any) {
    console.error('Error generating email template:', error);
    res.status(500).json({ error: 'Failed to generate email template' });
  }
});

/**
 * GET /api/email/contacts
 * Get all department contacts
 */
router.get('/contacts', (req: Request, res: Response) => {
  try {
    const contacts = contactDirectory.getAllContacts();
    res.json({
      success: true,
      contacts,
    });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * GET /api/email/contacts/search
 * Search contacts by keyword
 */
router.get('/contacts/search', (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Missing search query parameter: q' });
    }

    const contacts = contactDirectory.searchContacts(q);
    res.json({
      success: true,
      query: q,
      results: contacts,
      count: contacts.length,
    });
  } catch (error: any) {
    console.error('Error searching contacts:', error);
    res.status(500).json({ error: 'Failed to search contacts' });
  }
});

/**
 * GET /api/email/contacts/:category
 * Get contact for specific category
 */
router.get('/contacts/category/:category', (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const contact = contactDirectory.getContactByCategory(category);
    
    if (!contact) {
      return res.status(404).json({ 
        error: 'Contact not found for category',
        availableCategories: problemClassifier.getCategories(),
      });
    }

    res.json({
      success: true,
      contact,
      formatted: contactDirectory.formatContactForDisplay(contact),
    });
  } catch (error: any) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

/**
 * GET /api/email/emergency
 * Get emergency contacts
 */
router.get('/emergency', (req: Request, res: Response) => {
  try {
    const contacts = contactDirectory.getEmergencyContacts();
    res.json({
      success: true,
      contacts,
      formatted: contactDirectory.formatEmergencyContacts(),
    });
  } catch (error: any) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ error: 'Failed to fetch emergency contacts' });
  }
});

/**
 * GET /api/email/categories
 * Get all problem categories for dropdown
 */
router.get('/categories', (req: Request, res: Response) => {
  try {
    const categories = problemClassifier.getCategories();
    res.json({
      success: true,
      categories,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/email/subcategories/:category
 * Get subcategories for a specific category
 */
router.get('/subcategories/:category', (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const subcategories = problemClassifier.getSubcategories(category);
    
    if (subcategories.length === 0) {
      return res.status(404).json({ 
        error: 'Category not found',
        availableCategories: problemClassifier.getCategories(),
      });
    }

    res.json({
      success: true,
      category,
      subcategories,
    });
  } catch (error: any) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

export default router;
