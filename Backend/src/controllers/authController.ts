import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { redisClient } from '../config/redis';
import { emailService } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Helper: safely set Redis value (won't crash if Redis is down)
const redisSet = async (key: string, ttl: number, value: string): Promise<void> => {
  try {
    if (redisClient.isReady) {
      await redisClient.setEx(key, ttl, value);
    }
  } catch {
    // Redis unavailable - continue without caching
  }
};

// Helper: safely get Redis value
const redisGet = async (key: string): Promise<string | null> => {
  try {
    if (redisClient.isReady) {
      return await redisClient.get(key);
    }
  } catch {
    // Redis unavailable
  }
  return null;
};

// Helper: safely delete Redis value
const redisDel = async (key: string): Promise<void> => {
  try {
    if (redisClient.isReady) {
      await redisClient.del(key);
    }
  } catch {
    // Redis unavailable
  }
};

class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();

    try {
      const {
        email,
        phone,
        password,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        language,
      } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password, firstName, lastName',
        });
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
        return;
      }

      // Password validation
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters',
        });
        return;
      }

      await client.query('BEGIN');

      // Check if user exists (only by email if phone is optional)
      const checkQuery = phone
        ? 'SELECT id FROM users WHERE email = $1 OR phone = $2'
        : 'SELECT id FROM users WHERE email = $1';
      const checkParams = phone ? [email, phone] : [email];
      const userCheck = await client.query(checkQuery, checkParams);

      if (userCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        res.status(409).json({
          success: false,
          error: 'User with this email or phone already exists',
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (
          email, phone, first_name, last_name,
          date_of_birth, gender, language, password_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, phone, first_name, last_name,
                  date_of_birth, gender, language, is_helper,
                  rating, total_helps, verified, created_at`,
        [email, phone || null, firstName, lastName, dateOfBirth || null, gender || null, language || 'en', hashedPassword]
      );

      const user = userResult.rows[0];
      await client.query('COMMIT');

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Store refresh token in Redis (optional - won't crash if unavailable)
      await redisSet(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

      delete user.password_hash;

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password required',
        });
        return;
      }

      const result = await pool.query(
        `SELECT id, email, phone, first_name, last_name,
                date_of_birth, gender, language, is_helper,
                rating, total_helps, verified, password_hash
         FROM users
         WHERE email = $1 AND is_active = true`,
        [email]
      );

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      const user = result.rows[0];

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Store refresh token (optional)
      await redisSet(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

      await pool.query(
        'UPDATE users SET updated_at = NOW() WHERE id = $1',
        [user.id]
      );

      delete user.password_hash;

      res.json({
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token required',
        });
        return;
      }

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

      // Check Redis if available (skip check if Redis is down)
      const storedToken = await redisGet(`refresh_token:${decoded.userId}`);
      if (storedToken !== null && storedToken !== refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        });
        return;
      }

      const result = await pool.query(
        'SELECT id, email FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const user = result.rows[0];

      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: { accessToken: newAccessToken },
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ success: false, error: 'Invalid token' });
        return;
      }
      next(error);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ success: false, error: 'Email required' });
        return;
      }

      const result = await pool.query(
        'SELECT id, email, first_name FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
        return;
      }

      const user = result.rows[0];

      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Store reset token (optional)
      await redisSet(`password_reset:${user.id}`, 3600, resetToken);

      await emailService.sendPasswordResetEmail(user.email, resetToken);

      res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();

    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ success: false, error: 'Token and new password required' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      // Verify token in Redis only if Redis is available
      const storedToken = await redisGet(`password_reset:${decoded.userId}`);
      if (storedToken !== null && storedToken !== token) {
        res.status(401).json({ success: false, error: 'Invalid or expired reset token' });
        return;
      }

      await client.query('BEGIN');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, decoded.userId]
      );
      await client.query('COMMIT');

      await redisDel(`password_reset:${decoded.userId}`);
      await redisDel(`refresh_token:${decoded.userId}`);

      res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
        return;
      }
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ success: false, error: 'Verification token required' });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      await pool.query(
        'UPDATE users SET verified = true, updated_at = NOW() WHERE id = $1',
        [decoded.userId]
      );

      res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
        return;
      }
      next(error);
    }
  }

  /**
   * Logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (userId) {
        await redisDel(`refresh_token:${userId}`);
      }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
