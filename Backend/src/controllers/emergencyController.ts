import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { io } from '../server';
import { redisClient } from '../config/redis';

class EmergencyController {
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

      await client.query('BEGIN');

      // Create emergency request
      const emergencyResult = await client.query(
        `INSERT INTO emergency_requests (
          seeker_id, seeker_info, type, location, address, description, 
          voice_note_url, status, created_at
        ) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          seekerId,
          JSON.stringify(seekerInfo),
          type,
          location.longitude,
          location.latitude,
          address,
          description,
          voiceNoteUrl,
          'pending',
        ]
      );

      const emergency = emergencyResult.rows[0];

      // Find nearby helpers (within 5km by default)
      const helpersResult = await client.query(
        `SELECT u.id, u.first_name, u.last_name, u.phone, hp.response_radius,
          ST_Distance(
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            (SELECT last_location FROM helper_locations WHERE user_id = u.id ORDER BY updated_at DESC LIMIT 1)
          ) as distance
        FROM users u
        INNER JOIN helper_profiles hp ON u.id = hp.user_id
        WHERE hp.is_available = true
          AND hp.verification_status = 'verified'
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            (SELECT last_location FROM helper_locations WHERE user_id = u.id ORDER BY updated_at DESC LIMIT 1),
            COALESCE(hp.response_radius, 5000)
          )
        ORDER BY distance
        LIMIT 20`,
        [location.longitude, location.latitude]
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
        3600, // 1 hour
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

      // Try to get from cache first
      const c
