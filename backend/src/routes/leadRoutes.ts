import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  exportLeadsCSV,
  getLeadsStats,
  createLeadValidation,
  updateLeadValidation,
  getLeadsQueryValidation,
} from '../controllers/leadController';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All lead routes require authentication
router.use(authenticate);

// Export CSV and Stats (before /:id to avoid conflict)
router.get('/export/csv', exportLeadsCSV);
router.get('/stats', getLeadsStats);

// CRUD routes
router.get('/', getLeadsQueryValidation, validate, getLeads);
router.get('/:id', getLeadById);
router.post('/', createLeadValidation, validate, createLead);
router.put('/:id', updateLeadValidation, validate, updateLead);

// Admin only: delete
router.delete('/:id', authorizeRoles('admin'), deleteLead);

export default router;
