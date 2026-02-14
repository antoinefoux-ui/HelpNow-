import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { redisClient } from '../config/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response, next: NextFunction) {
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
      if (!email || !phone || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }

      // Password validation
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters',
        });
      }

      await client.query('BEGIN');

      // Check if user exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 OR phone = $2',
        [email, phone]
      );

      if (userCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: 'User with this email or phone already exists',
        });
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
        [email, phone, firstName, lastName, dateOfBirth, gender, language || 'en', hashedPassword]
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

      // Store refresh token in Redis
      await redisClient.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60, // 7 days
        refreshToken
      );

      // Remove password hash from response
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
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password required',
        });
      }

      // Get user with password
      const result = await pool.query(
        `SELECT id, email, phone, first_name, last_name, 
                date_of_birth, gender, language, is_helper, 
                rating, total_helps, verified, password_hash
         FROM users 
         WHERE email = $1 AND is_active = true`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

      const user = result.rows[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }

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

      // Store refresh token
      await redisClient.setEx(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60,
        refreshToken
      );

      // Update last login
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
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token required',
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

      // Check if token exists in Redis
      const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
      if (storedToken !== refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        });
      }

      // Get user
      const result = await pool.query(
        'SELECT id, email FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      const user = result.rows[0];

      // Generate new access token
      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      }
      next(error);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email required',
        });
      }

      // Check if user exists
      const result = await pool.query(
        'SELECT id, email, first_name FROM users WHERE email = $1',
        [email]
      );

      // Always return success to prevent email enumeration
      if (result.rows.length === 0) {
        return res.json({
          success: true,
          message: 'If the email exists, a reset link has been sent',
        });
      }

      const user = result.rows[0];

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Store reset token in Redis
      await redisClient.setEx(
        `password_reset:${user.id}`,
        3600, // 1 hour
        resetToken
      );

      // TODO: Send email with reset link
      // await sendPasswordResetEmail(user.email, resetToken);

      console.log(`Password reset token for ${user.email}: ${resetToken}`);

      res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    const client = await pool.connect();

    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Token and new password required',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters',
        });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      // Check if token exists in Redis
      const storedToken = await redisClient.get(`password_reset:${decoded.userId}`);
      if (storedToken !== token) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired reset token',
        });
      }

      await client.query('BEGIN');

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, decoded.userId]
      );

      await client.query('COMMIT');

      // Delete reset token
      await redisClient.del(`password_reset:${decoded.userId}`);

      // Invalidate all refresh tokens
      await redisClient.del(`refresh_token:${decoded.userId}`);

      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      }
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Verification token required',
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      await pool.query(
        'UPDATE users SET verified = true, updated_at = NOW() WHERE id = $1',
        [decoded.userId]
      );

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      }
      next(error);
    }
  }

  /**
   * Logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      // Delete refresh token from Redis
      await redisClient.del(`refresh_token:${userId}`);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
