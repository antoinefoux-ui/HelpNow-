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

    await pool
