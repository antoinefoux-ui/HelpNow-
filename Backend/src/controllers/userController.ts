import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { redisClient } from '../config/redis';

type RequestWithUser = Request & { user?: { userId?: string } };

class UserController {
  constructor() {
    this.getUserById = this.getUserById.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.uploadPhoto = this.uploadPhoto.bind(this);
    this.addAddress = this.addAddress.bind(this);
    this.updateAddress = this.updateAddress.bind(this);
    this.deleteAddress = this.deleteAddress.bind(this);
    this.addEmergencyContact = this.addEmergencyContact.bind(this);
    this.deleteEmergencyContact = this.deleteEmergencyContact.bind(this);
  }

  private getRequesterId(req: Request): string | undefined {
    return (req as RequestWithUser).user?.userId;
  }

  private ensureOwner(req: Request, res: Response): string | null {
    const requesterId = this.getRequesterId(req);
    const { id } = req.params;

    if (!requesterId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return null;
    }

    if (requesterId !== id) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access this user resource',
      });
      return null;
    }

    return requesterId;
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!this.ensureOwner(req, res)) {
        return;
      }

      // Try cache first (Redis optional)
      try {
        const cached = await redisClient.get(`user:${id}`);
        if (cached) {
          res.json({
            success: true,
            data: JSON.parse(cached),
          });
          return;
        }
      } catch (e) {
        // Redis down, continue without cache
      }

      // Get user from database
      const userResult = await pool.query(
        `SELECT id, email, phone, first_name, last_name, profile_photo,
                date_of_birth, gender, is_helper, is_active, rating, 
                total_helps, verified, language, created_at
         FROM users WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const user = userResult.rows[0];

      // Get helper profile if exists
      if (user.is_helper) {
        const helperResult = await pool.query(
          `SELECT * FROM helper_profiles WHERE user_id = $1`,
          [id]
        );
        if (helperResult.rows.length > 0) {
          user.helperProfile = helperResult.rows[0];
        }
      }

      // Get addresses
      const addressResult = await pool.query(
        `SELECT id, label, street, city, state, zip_code, country,
                apartment_number, building_code, floor_number,
                arrival_instructions, is_primary,
                ST_X(location::geometry) as longitude,
                ST_Y(location::geometry) as latitude
         FROM addresses WHERE user_id = $1`,
        [id]
      );
      user.addresses = addressResult.rows;

      // Get emergency contacts
      const contactsResult = await pool.query(
        `SELECT * FROM emergency_contacts WHERE user_id = $1`,
        [id]
      );
      user.emergencyContacts = contactsResult.rows;

      // Get medical info
      const medicalResult = await pool.query(
        `SELECT * FROM medical_info WHERE user_id = $1`,
        [id]
      );
      if (medicalResult.rows.length > 0) {
        user.medicalInfo = medicalResult.rows[0];
      }

      // Cache the result (Redis optional)
      try {
        await redisClient.setEx(`user:${id}`, 300, JSON.stringify(user));
      } catch (e) {
        // Redis down, continue without cache
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile - ENHANCED with helperProfile support
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      if (!this.ensureOwner(req, res)) {
        return;
      }

      const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        language,
        helperProfile,
      } = req.body;

      await client.query('BEGIN');

      // Build update query dynamically for users table
      const updates: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      if (firstName) {
        updates.push(`first_name = $${valueIndex++}`);
        values.push(firstName);
      }
      if (lastName) {
        updates.push(`last_name = $${valueIndex++}`);
        values.push(lastName);
      }
      if (dateOfBirth) {
        updates.push(`date_of_birth = $${valueIndex++}`);
        values.push(dateOfBirth);
      }
      if (gender) {
        updates.push(`gender = $${valueIndex++}`);
        values.push(gender);
      }
      if (language) {
        updates.push(`language = $${valueIndex++}`);
        values.push(language);
      }

      // Update users table if there are changes
      let userResult;
      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
          UPDATE users 
          SET ${updates.join(', ')}
          WHERE id = $${valueIndex}
          RETURNING *
        `;

        userResult = await client.query(query, values);
      } else {
        // Just fetch the user if no basic fields changed
        userResult = await client.query(
          `SELECT * FROM users WHERE id = $1`,
          [id]
        );
      }

      // Update helper profile if provided
      if (helperProfile) {
        const helperUpdates: string[] = [];
        const helperValues: any[] = [];
        let helperIndex = 1;

        if (helperProfile.isAvailable !== undefined) {
          helperUpdates.push(`is_available = $${helperIndex++}`);
          helperValues.push(helperProfile.isAvailable);
        }
        if (helperProfile.responseRadius !== undefined) {
          helperUpdates.push(`response_radius = $${helperIndex++}`);
          helperValues.push(helperProfile.responseRadius);
        }
        if (helperProfile.trainingLevel !== undefined) {
          helperUpdates.push(`training_level = $${helperIndex++}`);
          helperValues.push(helperProfile.trainingLevel);
        }
        if (helperProfile.verificationStatus !== undefined) {
          helperUpdates.push(`verification_status = $${helperIndex++}`);
          helperValues.push(helperProfile.verificationStatus);
        }

        if (helperUpdates.length > 0) {
          helperUpdates.push(`updated_at = NOW()`);
          helperValues.push(id);

          const helperQuery = `
            UPDATE helper_profiles 
            SET ${helperUpdates.join(', ')}
            WHERE user_id = $${helperIndex}
            RETURNING *
          `;

          await client.query(helperQuery, helperValues);
        }
      }

      // Check if there were any updates
      if (updates.length === 0 && !helperProfile) {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
        return;
      }

      await client.query('COMMIT');

      // Invalidate cache (Redis optional)
      try {
        await redisClient.del(`user:${id}`);
      } catch (e) {
        // Redis down, continue
      }

      // Return updated user with helper profile
      const finalUser = userResult.rows[0];
      
      if (finalUser.is_helper) {
        const helperResult = await pool.query(
          `SELECT * FROM helper_profiles WHERE user_id = $1`,
          [id]
        );
        if (helperResult.rows.length > 0) {
          finalUser.helperProfile = helperResult.rows[0];
        }
      }

      res.json({
        success: true,
        data: finalUser,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  // ... rest of the methods remain the same ...
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      if (!this.ensureOwner(req, res)) return;
      await client.query('BEGIN');
      await client.query(`UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`, [id]);
      await client.query('COMMIT');
      try { await redisClient.del(`user:${id}`); await redisClient.del(`refresh_token:${id}`); } catch (e) {}
      res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  async uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: 'Profile photo file is required' });
        return;
      }
      const photoUrl = `https://storage.helpnow.com/users/${id}/profile-${Date.now()}.jpg`;
      await pool.query(`UPDATE users SET profile_photo = $1, updated_at = NOW() WHERE id = $2`, [photoUrl, id]);
      try { await redisClient.del(`user:${id}`); } catch (e) {}
      res.json({ success: true, data: { photoUrl } });
    } catch (error) {
      next(error);
    }
  }

  async addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      if (!this.ensureOwner(req, res)) return;
      const { label, street, city, state, zipCode, country, apartmentNumber, buildingCode, floorNumber, arrivalInstructions, latitude, longitude, isPrimary } = req.body;
      await client.query('BEGIN');
      if (isPrimary) await client.query(`UPDATE addresses SET is_primary = false WHERE user_id = $1`, [id]);
      const result = await client.query(
        `INSERT INTO addresses (user_id, label, street, city, state, zip_code, country, apartment_number, building_code, floor_number, arrival_instructions, location, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ST_SetSRID(ST_MakePoint($12, $13), 4326), $14) RETURNING *`,
        [id, label, street, city, state, zipCode, country, apartmentNumber, buildingCode, floorNumber, arrivalInstructions, longitude, latitude, isPrimary || false]
      );
      await client.query('COMMIT');
      try { await redisClient.del(`user:${id}`); } catch (e) {}
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, addressId } = req.params;
      if (!this.ensureOwner(req, res)) return;
      const updates = req.body;
      const updateFields: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;
      Object.keys(updates).forEach(key => {
        if (key === 'latitude' || key === 'longitude') return;
        updateFields.push(`${key} = $${valueIndex++}`);
        values.push(updates[key]);
      });
      if (updates.latitude && updates.longitude) {
        updateFields.push(`location = ST_SetSRID(ST_MakePoint($${valueIndex}, $${valueIndex + 1}), 4326)`);
        values.push(updates.longitude, updates.latitude);
        valueIndex += 2;
      }
      values.push(addressId, id);
      const query = `UPDATE addresses SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${valueIndex - 1} AND user_id = $${valueIndex} RETURNING *`;
      const result = await pool.query(query, values);
      try { await redisClient.del(`user:${id}`); } catch (e) {}
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, addressId } = req.params;
      if (!this.ensureOwner(req, res)) return;
      await pool.query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2`, [addressId, id]);
      try { await redisClient.del(`user:${id}`); } catch (e) {}
      res.json({ success: true, message: 'Address deleted' });
    } catch (error) {
      next(error);
    }
  }

  async addEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!this.ensureOwner(req, res)) return;
      const { name, phone, relationship } = req.body;
      const result = await pool.query(
        `INSERT INTO emergency_contacts (user_id, name, phone, relationship) VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, name, phone, relationship]
      );
      try { await redisClient.del(`user:${id}`); } catch (e) {}
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }

  async deleteEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, contactId } = req.params;
      if (!this.ensureOwner(req, res)) return;
      await pool.query(`DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2`, [contactId, id]);
      try { await redisClient.del(`user:${id}`); } catch (e) {}
      res.json({ success: true, message: 'Emergency contact deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
