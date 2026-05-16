import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest, ApiResponse, UserRole } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Signs a JWT token with user payload.
 * Expiry defaults to 7 days if JWT_EXPIRES_IN not set.
 */
const signToken = (id: string, role: UserRole, email: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');

  const expiresIn = (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d';

  const payload = { id, role, email };
  const options: jwt.SignOptions = { expiresIn, algorithm: 'HS256' };

  return jwt.sign(payload, secret, options);
};

/**
 * Builds the safe user object to return in responses (no password).
 */
const buildUserResponse = (user: { _id: unknown; name: string; email: string; role: UserRole }) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ── Validation Rules ──────────────────────────────────────────────────────────

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'sales']).withMessage('Role must be admin or sales'),
];

export const loginValidation = [
  body('email')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json<ApiResponse>({
        success: false,
        message: 'An account with this email already exists.',
      });
      return;
    }

    // Create user (password hashed by pre-save hook in User model)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'sales',
    });

    // Issue JWT
    const token = signToken(user._id.toString(), user.role, user.email);

    res.status(201).json<ApiResponse>({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user — traditional JWT flow
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Flow:
 *  1. Extract email + password from body
 *  2. Find user by email (include password field which is select:false)
 *  3. Verify user exists
 *  4. Compare plaintext password against bcrypt hash
 *  5. Sign a JWT with user's id, role, email
 *  6. Return token + safe user object
 */
export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Step 1: Extract credentials
    const { email, password } = req.body as { email: string; password: string };

    // Step 2: Find user by email — include password (select: false by default)
    const user = await User.findOne({ email }).select('+password');

    // Step 3: Check user exists (use a generic message to prevent email enumeration)
    if (!user) {
      res.status(401).json<ApiResponse>({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Step 4: Compare password using bcrypt
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json<ApiResponse>({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Step 5: Sign JWT token
    const token = signToken(user._id.toString(), user.role, user.email);

    // Step 6: Return token + user (password excluded from buildUserResponse)
    res.status(200).json<ApiResponse>({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires valid JWT)
 *
 * Note: req.user is populated by the authenticate middleware
 *       which already verified the JWT before this runs.
 */
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // req.user.id comes from the verified JWT payload
    const user = await User.findById(req.user?.id).select('-password');

    if (!user) {
      res.status(404).json<ApiResponse>({
        success: false,
        message: 'User account not found. It may have been deleted.',
      });
      return;
    }

    res.status(200).json<ApiResponse>({
      success: true,
      message: 'Profile fetched successfully.',
      data: {
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    next(error);
  }
};
