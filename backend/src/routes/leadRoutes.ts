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

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: Lead management endpoints
 */

/**
 * @swagger
 * /api/leads/export/csv:
 *   get:
 *     summary: Export leads as CSV
 *     tags: [Leads]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export/csv', exportLeadsCSV);

/**
 * @swagger
 * /api/leads/stats:
 *   get:
 *     summary: Get leads statistics
 *     tags: [Leads]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead statistics
 */
router.get('/stats', getLeadsStats);

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: Get all leads with pagination and filters
 *     tags: [Leads]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of leads
 */
router.get('/', getLeadsQueryValidation, validate, getLeads);

/**
 * @swagger
 * /api/leads/{id}:
 *   get:
 *     summary: Get a single lead by ID
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead found
 */
router.get('/:id', getLeadById);

/**
 * @swagger
 * /api/leads:
 *   post:
 *     summary: Create a new lead
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               status:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lead created successfully
 */
router.post('/', createLeadValidation, validate, createLead);

/**
 * @swagger
 * /api/leads/{id}:
 *   put:
 *     summary: Update an existing lead
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               status:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead updated successfully
 */
router.put('/:id', updateLeadValidation, validate, updateLead);

/**
 * @swagger
 * /api/leads/{id}:
 *   delete:
 *     summary: Delete a lead (Admin only)
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead deleted successfully
 */
router.delete('/:id', authorizeRoles('admin'), deleteLead);

export default router;
