import { Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { FilterQuery } from 'mongoose';
import Lead, { ILeadDocument } from '../models/Lead';
import { AuthRequest, ApiResponse, LeadStatus, LeadSource } from '../types';

// ── Validation rules ──────────────────────────────────────────────────────────
export const createLeadValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Lost'])
    .withMessage('Invalid status'),
  body('source')
    .isIn(['Website', 'Instagram', 'Referral'])
    .withMessage('Invalid source'),
];

export const updateLeadValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('status')
    .optional()
    .isIn(['New', 'Contacted', 'Qualified', 'Lost'])
    .withMessage('Invalid status'),
  body('source')
    .optional()
    .isIn(['Website', 'Instagram', 'Referral'])
    .withMessage('Invalid source'),
];

export const getLeadsQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
  query('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Lost']).withMessage('Invalid status filter'),
  query('source').optional().isIn(['Website', 'Instagram', 'Referral']).withMessage('Invalid source filter'),
  query('sort').optional().isIn(['latest', 'oldest']).withMessage('Sort must be latest or oldest'),
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildQuery = (queryParams: {
  status?: string;
  source?: string;
  search?: string;
}): FilterQuery<ILeadDocument> => {
  const filter: FilterQuery<ILeadDocument> = {};

  if (queryParams.status) filter.status = queryParams.status as LeadStatus;
  if (queryParams.source) filter.source = queryParams.source as LeadSource;

  if (queryParams.search) {
    const searchRegex = new RegExp(queryParams.search, 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  return filter;
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @desc    Get all leads with filters, search, sort, and pagination
 * @route   GET /api/leads
 * @access  Private
 */
export const getLeads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      source,
      search,
      sort = 'latest',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = buildQuery({ status, source, search });
    const sortOrder = sort === 'oldest' ? 1 : -1;

    const [leads, totalCount] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email role')
        .lean(),
      Lead.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json<ApiResponse>({
      success: true,
      message: 'Leads fetched successfully',
      data: leads,
      meta: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single lead by ID
 * @route   GET /api/leads/:id
 * @access  Private
 */
export const getLeadById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params['id'])
      .populate('createdBy', 'name email role')
      .lean();

    if (!lead) {
      res.status(404).json<ApiResponse>({ success: false, message: 'Lead not found' });
      return;
    }

    res.status(200).json<ApiResponse>({ success: true, message: 'Lead fetched', data: lead });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new lead
 * @route   POST /api/leads
 * @access  Private
 */
export const createLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, status, source } = req.body as {
      name: string;
      email: string;
      status?: LeadStatus;
      source: LeadSource;
    };

    const lead = await Lead.create({
      name,
      email,
      status: status || 'New',
      source,
      createdBy: req.user!.id,
    });

    const populatedLead = await lead.populate('createdBy', 'name email role');

    res.status(201).json<ApiResponse>({
      success: true,
      message: 'Lead created successfully',
      data: populatedLead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a lead
 * @route   PUT /api/leads/:id
 * @access  Private
 */
export const updateLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params['id']);

    if (!lead) {
      res.status(404).json<ApiResponse>({ success: false, message: 'Lead not found' });
      return;
    }

    // Sales users can only update leads they created
    if (req.user!.role === 'sales' && lead.createdBy.toString() !== req.user!.id) {
      res.status(403).json<ApiResponse>({
        success: false,
        message: 'Not authorized to update this lead',
      });
      return;
    }

    const updated = await Lead.findByIdAndUpdate(
      req.params['id'],
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    res.status(200).json<ApiResponse>({
      success: true,
      message: 'Lead updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a lead (Admin only)
 * @route   DELETE /api/leads/:id
 * @access  Private / Admin
 */
export const deleteLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params['id']);

    if (!lead) {
      res.status(404).json<ApiResponse>({ success: false, message: 'Lead not found' });
      return;
    }

    res.status(200).json<ApiResponse>({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export leads as CSV
 * @route   GET /api/leads/export/csv
 * @access  Private
 */
export const exportLeadsCSV = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, source, search, sort = 'latest' } = req.query as Record<string, string>;

    const filter = buildQuery({ status, source, search });
    const sortOrder = sort === 'oldest' ? 1 : -1;

    const leads = await Lead.find(filter)
      .sort({ createdAt: sortOrder })
      .populate('createdBy', 'name email')
      .lean();

    const headers = ['Name', 'Email', 'Status', 'Source', 'Created By', 'Created At'];
    const rows = leads.map((lead) => {
      const creator = lead.createdBy as { name: string; email: string } | null;
      return [
        `"${lead.name}"`,
        `"${lead.email}"`,
        `"${lead.status}"`,
        `"${lead.source}"`,
        `"${creator?.name ?? 'N/A'}"`,
        `"${new Date(lead.createdAt as Date | string).toISOString()}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads-export.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get leads stats (totals by status)
 * @route   GET /api/leads/stats
 * @access  Private
 */
export const getLeadsStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [statusCounts, total] = await Promise.all([
      Lead.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lead.countDocuments(),
    ]);

    const stats: Record<string, number> = {
      total,
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Lost: 0,
    };

    statusCounts.forEach((item) => {
      stats[item._id] = item.count;
    });

    res.status(200).json<ApiResponse>({
      success: true,
      message: 'Stats fetched successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
