import { Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { AuthRequest, UserRole } from '../types';

interface JwtPayload {
  id: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}

// ── Traditional JWT Authentication Middleware ─────────────────────────────────
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  // Step 1: Check Authorization header exists
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Authorization header missing. Please provide a Bearer token.',
    });
    return;
  }

  // Step 2: Validate Bearer scheme format
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Invalid authorization scheme. Use: Bearer <token>',
    });
    return;
  }

  // Step 3: Extract the raw token string
  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    res.status(401).json({
      success: false,
      message: 'Token is empty. Please provide a valid JWT.',
    });
    return;
  }

  // Step 4: Load signing secret from environment
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({
      success: false,
      message: 'Internal server error: JWT secret not configured.',
    });
    return;
  }

  // Step 5: Verify signature + expiry using jwt.verify
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Step 6: Confirm payload has required fields (sanity check)
    if (!decoded.id || !decoded.role || !decoded.email) {
      res.status(401).json({
        success: false,
        message: 'Token payload is invalid or incomplete.',
      });
      return;
    }

    // Step 7: Attach decoded user to request for downstream handlers
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();

  } catch (err) {
    // Step 8: Handle specific JWT errors with clear messages
    if (err instanceof TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        expiredAt: err.expiredAt,
      });
      return;
    }

    if (err instanceof NotBeforeError) {
      res.status(401).json({
        success: false,
        message: 'Token is not yet valid.',
        date: err.date,
      });
      return;
    }

    if (err instanceof JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token. Signature verification failed.',
      });
      return;
    }

    // Unexpected error
    res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.',
    });
  }
};

// ── Role-Based Access Control ─────────────────────────────────────────────────
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): [${roles.join(', ')}]. Your role: '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
};
