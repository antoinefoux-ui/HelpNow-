import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Authenticate JWT token middleware
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

/**
 * Optional authentication - continues even without token
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    req.user = decoded;
  } catch (error) {
    // Continue without user info if token is invalid
  }

  next();
};

/**
 * Check if user is a helper
 */
export const requireHelper = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const { pool } = require('../config/database');
    const result = await pool.query(
      'SELECT is_helper FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_helper) {
      return res.status(403).json({
        success: false,
        error: 'Helper access required',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is verified
 */
export const requireVerified = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    const { pool } = require('../config/database');
    const result = await pool.query(
      'SELECT verified FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].verified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
