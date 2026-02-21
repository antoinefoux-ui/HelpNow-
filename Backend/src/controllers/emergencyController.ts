import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

class EmergencyController {

async updateEmergency(req: Request, res: Response, next: NextFunction): Promise < void> {
      try {
        const { id } = req.params;
        const { category } = req.body;

        const result = await pool.query(
          `UPDATE emergencies
       SET category = $1, updated_at = NOW()
       WHERE id = $2 AND status IN ('pending', 'accepted')
       RETURNING *`,
          [category, id]
        );

        if(result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Emergency not found or cannot be updated',
      });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch(error) {
    next(error);
  }
}

  /**
   * Create new emergency request
   */
  async createEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { seekerId, type, location } = req.body;


      const result = await pool.query(
        `INSERT INTO emergencies (user_id, latitude, longitude, category, status, created_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW())
         RETURNING *`,
        [
          seekerId,
          location?.latitude,
          location?.longitude,
          type,
        ]
      );

       if(result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Emergency not found or cannot be created',
      });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch(error) {
    next(error);
  }
}

  /**
   * Get emergency request by ID
   */
  async getEmergency(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM emergencies WHERE id = $1`,
      [id]
    );

    if(result.rows.length === 0) {
  res.status(404).json({
    success: false,
    error: 'Emergency not found'
  });
  return;
}

res.status(200).json({
  success: true,
  data: result.rows[0]
});
    } catch (error) {
  next(error);
}
  }

  /**
   * Get active emergency for user
   */
  async getActiveEmergency(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT * FROM emergencies 
         WHERE user_id = $1 AND status IN ('pending', 'accepted', 'in_progress')
         ORDER BY created_at DESC
         LIMIT 1`,
      [userId]
    );

    if(!result.rows[0]) {
  res.status(404).json({
    success: false,
    error: 'No active emergency found'
  });
  return;
}

res.status(200).json({
  success: true,
  data: result.rows[0]
});
    } catch (error) {
  next(error);
}
  }

  /**
   * Get nearby emergency requests for helpers
   */
  async getNearbyEmergencies(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    // Using Haversine formula to find nearby emergencies
    const result = await pool.query(
      `SELECT *, 
         (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * 
         cos(radians(longitude) - radians($2)) + sin(radians($1)) * 
         sin(radians(latitude)))) AS distance
         FROM emergencies
         WHERE status = 'pending'
         HAVING distance < $3
         ORDER BY distance
         LIMIT 20`,
      [latitude, longitude, radius]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch(error) {
    next(error);
  }
}

  /**
   * Get emergency history for user
   */
  async getEmergencyHistory(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM emergencies
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch(error) {
    next(error);
  }
}

  /**
   * Helper accepts emergency request
   */
  async acceptEmergency(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { id } = req.params;
    const { helperId } = req.body;

    const result = await pool.query(
      `UPDATE emergencies
         SET status = 'accepted', helper_id = $1, accepted_at = NOW()
         WHERE id = $2 AND status = 'pending'
         RETURNING *`,
      [helperId, id]
    );

    if(result.rows.length === 0) {
  res.status(404).json({
    success: false,
    error: 'Emergency not found or already accepted'
  });
  return;
}

res.status(200).json({
  success: true,
  data: result.rows[0]
});
    } catch (error) {
  next(error);
}
  }

  /**
   * Cancel emergency request
   */
  async cancelEmergency(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE emergencies
         SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1
         WHERE id = $2 AND status IN ('pending', 'accepted')
         RETURNING *`,
      [reason, id]
    );

    if(result.rows.length === 0) {
  res.status(404).json({
    success: false,
    error: 'Emergency not found or cannot be cancelled'
  });
  return;
}

res.status(200).json({
  success: true,
  data: result.rows[0]
});
    } catch (error) {
  next(error);
}
  }

  /**
   * Update helper location and ETA
   */
  async updateHelperLocation(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { id } = req.params;
    const { latitude, longitude, eta } = req.body;

    const result = await pool.query(
      `UPDATE emergencies
         SET helper_latitude = $1, helper_longitude = $2, eta_minutes = $3, last_location_update = NOW()
         WHERE id = $4 AND status = 'accepted'
         RETURNING *`,
      [latitude, longitude, eta, id]
    );

    if(result.rows.length === 0) {
  res.status(404).json({
    success: false,
    error: 'Emergency not found or not in accepted state'
  });
  return;
}

res.status(200).json({
  success: true,
  data: result.rows[0]
});
    } catch (error) {
  next(error);
}
  }

  /**
   * Mark helper as arrived
   */
  async markHelperArrived(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE emergencies
         SET status = 'in_progress', arrived_at = NOW()
         WHERE id = $1 AND status = 'accepted'
         RETURNING *`,
      [id]
    );

    if(result.rows.length === 0) {
  res.status(404).json({
    success: false,
    error: 'Emergency not found or helper not accepted'
  });
  return;
}

res.status(200).json({
  success: true,
  data: result.rows[0]
});
    } catch (error) {
  next(error);
}
  }

  /**
   * Resolve emergency request
   */
  async resolveEmergency(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    const result = await pool.query(
      `UPDATE emergencies
         SET status = 'resolved', resolved_at = NOW(), resolution_notes = $1
         WHERE id = $2 AND status = 'in_progress'
         RETURNING *`,
      [resolutionNotes, id]
    );

    if(result.rows.length === 0) {
  res.status(404).json({
    success: false,
    error: 'Emergency not found or not in progress'
  });
  return;
}

res.status(200).json({
  success: true,
  data: result.rows[0]
});
    } catch (error) {
  next(error);
}
  }
  /**
   * Upload voice note
   */
  async uploadVoiceNote(req: Request, res: Response, next: NextFunction): Promise < void> {
  try {
    const { id } = req.params;
    const file = req.file;

    if(!file) {
      res.status(400).json({
        success: false,
        error: 'Voice note file is required',
      });
      return;
    }

      // TODO: Upload file to storage service (S3, CloudFlare R2, etc.)
      const voiceNoteUrl = `https://storage.helpnow.com/emergencies/${id}/voice-${Date.now()}.m4a`;

    await pool.query(
      'UPDATE emergencies SET voice_note_url = $1 WHERE id = $2',
      [voiceNoteUrl, id]
    );

    res.status(200).json({
      success: true,
      data: {
        voiceNoteUrl
      }
    });
  } catch(error) {
    next(error);
  }
}
}

// Export as default
export default new EmergencyController();
