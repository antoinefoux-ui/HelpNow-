import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { redisClient } from '../config/redis';

class HelperController {
  /**
   * Setup helper profile
   */
  async setupHelperProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();

    try {
      const { userId } = req.params;
      const {
        trainingLevel,
        languagesSpoken,
        situationsWillingToHelp,
        responseRadius,
      } = req.body;

      if (!trainingLevel) {
        res.status(400).json({
          success: false,
          error: 'Training level is required',
        });
        return;
      }

      await client.query('BEGIN');

      // Update user to be a helper
      await client.query(
        `UPDATE users SET is_helper = true, updated_at = NOW() WHERE id = $1`,
        [userId]
      );

      // Create helper profile
      const result = await client.query(
        `INSERT INTO helper_profiles (
          user_id, training_level, languages_spoken, 
          situations_willing_to_help, response_radius,
          verification_status, is_available
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE SET
          training_level = EXCLUDED.training_level,
          languages_spoken = EXCLUDED.languages_spoken,
          situations_willing_to_help = EXCLUDED.situations_willing_to_help,
          response_radius = EXCLUDED.response_radius,
          updated_at = NOW()
        RETURNING *`,
        [
          userId,
          trainingLevel,
          languagesSpoken || ['en'],
          situationsWillingToHelp || [],
          responseRadius || 5000,
          'pending',
          false,
        ]
      );

      await client.query('COMMIT');
      await redisClient.del(`user:${userId}`);

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Update helper availability
   */
  async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { isAvailable, responseRadius } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      if (typeof isAvailable === 'boolean') {
        updates.push(`is_available = $${valueIndex++}`);
        values.push(isAvailable);
      }

      if (responseRadius !== undefined) {
        updates.push(`response_radius = $${valueIndex++}`);
        values.push(responseRadius);
      }

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
        return;
      }

      updates.push(`updated_at = NOW()`);
      values.push(userId);

      const query = `
        UPDATE helper_profiles
        SET ${updates.join(', ')}
        WHERE user_id = $${valueIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Helper profile not found',
        });
        return;
      }

      await redisClient.del(`user:${userId}`);

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add certification
   */
  async addCertification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { type, issuer, issueDate, expiryDate, documentUrl } = req.body;

      if (!type || !issuer) {
        res.status(400).json({
          success: false,
          error: 'Type and issuer are required',
        });
        return;
      }

      const result = await pool.query(
        `INSERT INTO certifications (
          user_id, type, issuer, issue_date, expiry_date, 
          document_url, verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [userId, type, issuer, issueDate, expiryDate, documentUrl, false]
      );

      await redisClient.del(`user:${userId}`);

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update certification
   */
  async updateCertification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, certId } = req.params;
      const updates = req.body;

      const updateFields: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      Object.keys(updates).forEach(key => {
        updateFields.push(`${key} = $${valueIndex++}`);
        values.push(updates[key]);
      });

      if (updateFields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
        return;
      }

      values.push(certId, userId);

      const query = `
        UPDATE certifications
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex - 1} AND user_id = $${valueIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      await redisClient.del(`user:${userId}`);

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete certification
   */
  async deleteCertification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, certId } = req.params;

      await pool.query(
        `DELETE FROM certifications WHERE id = $1 AND user_id = $2`,
        [certId, userId]
      );

      await redisClient.del(`user:${userId}`);

      res.json({
        success: true,
        message: 'Certification deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get helper statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      // Get total helps and average response time
      const statsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_helps,
          AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))) as avg_response_time,
          AVG(rating) as avg_rating,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as successful_helps
        FROM emergency_requests
        WHERE accepted_helper_id = $1`,
        [userId]
      );

      const stats = statsResult.rows[0];

      // Get recent helps
      const recentHelpsResult = await pool.query(
        `SELECT id, type, status, rating, created_at, resolved_at
        FROM emergency_requests
        WHERE accepted_helper_id = $1
        ORDER BY created_at DESC
        LIMIT 10`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          totalHelps: parseInt(stats.total_helps) || 0,
          averageResponseTime: parseInt(stats.avg_response_time) || 0,
          rating: parseFloat(stats.avg_rating) || 0,
          successfulHelps: parseInt(stats.successful_helps) || 0,
          recentHelps: recentHelpsResult.rows,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update helper current location
   */
  async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          error: 'Latitude and longitude required',
        });
        return;
      }

      // Store in helper_locations table
      await pool.query(
        `INSERT INTO helper_locations (user_id, last_location, updated_at)
        VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          last_location = EXCLUDED.last_location,
          updated_at = NOW()`,
        [userId, longitude, latitude]
      );

      // Also cache in Redis for faster access
      await redisClient.setEx(
        `helper_location:${userId}`,
        300, // 5 minutes
        JSON.stringify({ latitude, longitude, updatedAt: new Date() })
      );

      res.json({
        success: true,
        message: 'Location updated',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const helperController = new HelperController();
