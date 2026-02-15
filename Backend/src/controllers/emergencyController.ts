import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { io } from '../server';
import { redisClient } from '../config/redis';
import { reverseGeocode } from '../utils/geoUtils';

// Add interface for authenticated requests
interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

class EmergencyController {
  private getRequesterId(req: Request): string | undefined {
    return (req as RequestWithUser).user?.userId;
  }
  
  /**
   * Create new emergency request
   */
  async createEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();
    
    try {
      const {
        seekerId,
        seekerInfo,
        type,
        location,
        address,
        description,
        voiceNoteUrl,
      } = req.body;

      // Validation
      if (!seekerId || !type || !location || !location.latitude || !location.longitude) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      const resolvedAddress = address || await reverseGeocode(location.latitude, location.longitude);

      await client.query('BEGIN');

      // Create emergency request (using lat/lng columns instead of PostGIS)
      const emergencyResult = await client.query(
        `INSERT INTO emergency_requests (
          seeker_id, seeker_info, type, latitude, longitude, address, description, 
          voice_note_url, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          seekerId,
          JSON.stringify(seekerInfo),
          type,
          location.latitude,
          location.longitude,
          resolvedAddress,
          description,
          voiceNoteUrl,
          'pending',
        ]
      );

      const emergency = emergencyResult.rows[0];

      // Find nearby helpers using Haversine formula
      const helpersResult = await client.query(
        `SELECT u.id, u.first_name, u.last_name, u.phone, hp.response_radius,
          (6371 * acos(
            cos(radians($1)) * cos(radians(hl.latitude)) *
            cos(radians(hl.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(hl.latitude))
          )) * 1000 as distance
        FROM users u
        INNER JOIN helper_profiles hp ON u.id = hp.user_id
        LEFT JOIN LATERAL (
          SELECT latitude, longitude
          FROM helper_locations
          WHERE user_id = u.id
          ORDER BY updated_at DESC
          LIMIT 1
        ) hl ON true
        WHERE hp.is_available = true
          AND hp.verification_status = 'verified'
          AND hl.latitude IS NOT NULL
          AND (6371 * acos(
            cos(radians($1)) * cos(radians(hl.latitude)) *
            cos(radians(hl.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(hl.latitude))
          )) * 1000 <= COALESCE(hp.response_radius, 5000)
        ORDER BY distance
        LIMIT 20`,
        [location.latitude, location.longitude]
      );

      const helpers = helpersResult.rows;
      const helperIds = helpers.map(h => h.id);

      // Update emergency with notified helpers
      await client.query(
        `UPDATE emergency_requests 
         SET helpers_notified = $1 
         WHERE id = $2`,
        [helperIds, emergency.id]
      );

      await client.query('COMMIT');

      // Emit socket event to nearby helpers
      helpers.forEach(helper => {
        io.to(`helper_${helper.id}`).emit('emergency:created', {
          requestId: emergency.id,
          type,
          location,
          distance: helper.distance,
          seekerInfo,
        });
      });

      // Cache emergency for quick access
      await redisClient.setEx(
        `emergency:${emergency.id}`,
        3600,
        JSON.stringify(emergency)
      );

      res.status(201).json({
        success: true,
        data: {
          ...emergency,
          helpersNotified: helperIds,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
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
   * Get emergency by ID
   */
  async getEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const cached = await redisClient.get(`emergency:${id}`);
      if (cached) {
        res.json({
          success: true,
          data: JSON.parse(cached),
        });
        return;
      }

      // Updated to use latitude/longitude columns
      const result = await pool.query(
        `SELECT 
          id, seeker_id, seeker_info, accepted_helper_id, type, 
          longitude, latitude,
          address, description, voice_note_url, status, 
          helpers_notified, rating, feedback, 
          created_at, accepted_at, resolved_at
        FROM emergency_requests 
        WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Emergency not found',
        });
        return;
      }

      const emergency = result.rows[0];

      if (emergency.accepted_helper_id) {
        const helperResult = await pool.query(
          `SELECT u.id, u.first_name, u.last_name, u.phone, u.profile_photo, u.rating,
            hp.training_level
          FROM users u
          INNER JOIN helper_profiles hp ON u.id = hp.user_id
          WHERE u.id = $1`,
          [emergency.accepted_helper_id]
        );

        if (helperResult.rows.length > 0) {
          const helper = helperResult.rows[0];
          emergency.acceptedHelperInfo = {
            name: `${helper.first_name} ${helper.last_name}`,
            phone: helper.phone,
            photo: helper.profile_photo,
            rating: helper.rating,
            trainingLevel: helper.training_level,
            eta: 0,
          };
        }
      }

      await redisClient.setEx(
        `emergency:${id}`,
        300,
        JSON.stringify(emergency)
      );

      res.json({
        success: true,
        data: emergency,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const requesterId = this.getRequesterId(req);

      if (!requesterId || requesterId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to access this emergency resource',
        });
        return;
      }

      const result = await pool.query(
        `SELECT * FROM emergency_requests 
        WHERE (seeker_id = $1 OR accepted_helper_id = $1)
          AND status IN ('pending', 'accepted', 'helper_en_route', 'helper_arrived')
        ORDER BY created_at DESC 
        LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No active emergency',
        });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  async getNearbyEmergencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude, radius = 5000 } = req.query;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          error: 'Latitude and longitude required',
        });
        return;
      }

      // Using Haversine formula
      const result = await pool.query(
        `SELECT 
          id, type, seeker_info, longitude, latitude,
          address, description, status, created_at,
          (6371 * acos(
            cos(radians($1)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(latitude))
          )) * 1000 as distance
        FROM emergency_requests 
        WHERE status = 'pending'
          AND (6371 * acos(
            cos(radians($1)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(latitude))
          )) * 1000 <= $3
        ORDER BY distance
        LIMIT 10`,
        [parseFloat(latitude as string), parseFloat(longitude as string), radius]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmergencyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = 20 } = req.query;
      const requesterId = this.getRequesterId(req);

      if (!requesterId || requesterId !== userId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to access this emergency resource',
        });
        return;
      }

      const result = await pool.query(
        `SELECT 
          id, seeker_id, seeker_info, accepted_helper_id, type,
          longitude, latitude,
          address, description, status, rating, feedback,
          created_at, accepted_at, resolved_at
        FROM emergency_requests 
        WHERE seeker_id = $1 OR accepted_helper_id = $1
        ORDER BY created_at DESC 
        LIMIT $2`,
        [userId, limit]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const { helperId } = req.body;

      await client.query('BEGIN');

      const checkResult = await client.query(
        `SELECT status FROM emergency_requests WHERE id = $1`,
        [id]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({
          success: false,
          error: 'Emergency not found',
        });
        return;
      }

      const { status } = checkResult.rows[0];

      if (status !== 'pending') {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          error: 'Emergency already accepted',
        });
        return;
      }

      await client.query(
        `UPDATE emergency_requests 
        SET accepted_helper_id = $1, status = 'accepted', accepted_at = NOW()
        WHERE id = $2`,
        [helperId, id]
      );

      await client.query('COMMIT');

      await redisClient.del(`emergency:${id}`);

      io.to(`emergency_${id}`).emit('emergency:accepted', {
        requestId: id,
        helperId,
      });

      res.json({
        success: true,
        message: 'Emergency accepted',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  async cancelEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await pool.query(
        `UPDATE emergency_requests 
        SET status = 'cancelled', resolved_at = NOW()
        WHERE id = $1`,
        [id]
      );

      await redisClient.del(`emergency:${id}`);

      io.to(`emergency_${id}`).emit('emergency:cancelled', { requestId: id });

      res.json({
        success: true,
        message: 'Emergency cancelled',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateHelperLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { helperId, location, eta } = req.body;

      await redisClient.setEx(
        `helper_location:${helperId}:${id}`,
        300,
        JSON.stringify({ location, eta, updatedAt: new Date() })
      );

      await pool.query(
        `UPDATE emergency_requests 
        SET status = 'helper_en_route'
        WHERE id = $1 AND status = 'accepted'`,
        [id]
      );

      io.to(`emergency_${id}`).emit('helper:location_update', {
        requestId: id,
        location,
        eta,
      });

      res.json({
        success: true,
        message: 'Location updated',
      });
    } catch (error) {
      next(error);
    }
  }

  async markHelperArrived(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await pool.query(
        `UPDATE emergency_requests 
        SET status = 'helper_arrived'
        WHERE id = $1`,
        [id]
      );

      await redisClient.del(`emergency:${id}`);

      io.to(`emergency_${id}`).emit('helper:arrived', { requestId: id });

      res.json({
        success: true,
        message: 'Marked as arrived',
      });
    } catch (error) {
      next(error);
    }
  }

  async resolveEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, feedback } = req.body;

      await pool.query(
        `UPDATE emergency_requests 
        SET status = 'resolved', rating = $1, feedback = $2, resolved_at = NOW()
        WHERE id = $3`,
        [rating, feedback, id]
      );

      if (rating) {
        await pool.query(
          `UPDATE users u
          SET rating = (
            SELECT AVG(rating)::numeric(3,2) 
            FROM emergency_requests 
            WHERE accepted_helper_id = (SELECT accepted_helper_id FROM emergency_requests WHERE id = $1)
              AND rating IS NOT NULL
          )
          FROM emergency_requests er
          WHERE er.id = $1 AND u.id = er.accepted_helper_id`,
          [id]
        );
      }

      await redisClient.del(`emergency:${id}`);

      io.to(`emergency_${id}`).emit('emergency:resolved', { requestId: id });

      res.json({
        success: true,
        message: 'Emergency resolved',
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadVoiceNote(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        message: 'Voice note upload endpoint',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const emergencyController = new EmergencyController();
