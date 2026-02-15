import { Request, Response, NextFunction } from 'express';
import pool from '../config/database'; // Adjust import path as needed

class EmergencyController {
  /**
   * Upload voice note
   */
  async uploadVoiceNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;
      
      if (!file) {
        res.status(400).json({
          success: false,
          error: 'Voice note file is required',
        });
        return;
      }
      
      // DECLARE voiceNoteUrl BEFORE USING IT
      const voiceNoteUrl = `https://storage.helpnow.com/emergencies/${id}/voice-${Date.now()}.m4a`;
      
      // Complete your database query here
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
    } catch (error) {
      next(error);
    }
  }
}

export default new EmergencyController();
