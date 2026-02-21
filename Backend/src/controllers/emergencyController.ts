// ─── ADD TO EmergencyController ──────────────────────────────────────────────
// Allows updating category (type) on an existing emergency.
// Called when user taps a help type card after the request is created.

async updateEmergency(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Emergency not found or cannot be updated',
      });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}


// ─── ADD TO your emergency routes file ───────────────────────────────────────
// (wherever your other emergency routes are defined)

router.put('/:id', authenticate, emergencyController.updateEmergency);
// Note: this must be placed BEFORE any routes with more specific path segments
// like /:id/cancel, /:id/accept etc., or Express may misroute them.
// Since Express matches in order, /:id will only catch exact two-segment paths.
