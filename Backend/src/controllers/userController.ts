import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { redisClient } from '../config/redis';

class UserController {
  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Try cache first
      const cached = await redisClient.get(`user:${id}`);
      if (cached) {
        res.json({
          success: true,
          data: JSON.parse(cached),
        });
        return;
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

      // Cache the result
      await redisClient.setEx(`user:${id}`, 300, JSON.stringify(user));

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        language,
      } = req.body;

      await client.query('BEGIN');

      // Build update query dynamically
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

      if (updates.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
        return;
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);

      await client.query('COMMIT');

      // Invalidate cache
      await redisClient.del(`user:${id}`);

      res.json({
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
   * Delete user account
   */
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();

    try {
      const { id } = req.params;

      await client.query('BEGIN');

      // Soft delete by setting is_active to false
      await client.query(
        `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');

      // Clear all user caches
      await redisClient.del(`user:${id}`);
      await redisClient.del(`refresh_token:${id}`);

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  /**
   * Upload profile photo
   */
  async uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // TODO: Implement file upload to OVH Object Storage
      // For now, return placeholder
      
      const photoUrl = `https://storage.helpnow.com/users/${id}/profile.jpg`;

      await pool.query(
        `UPDATE users SET profile_photo = $1, updated_at = NOW() WHERE id = $2`,
        [photoUrl, id]
      );

      await redisClient.del(`user:${id}`);

      res.json({
        success: true,
        data: { photoUrl },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add address
   */
  async addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const {
        label,
        street,
        city,
        state,
        zipCode,
        country,
        apartmentNumber,
        buildingCode,
        floorNumber,
        arrivalInstructions,
        latitude,
        longitude,
        isPrimary,
      } = req.body;

      await client.query('BEGIN');

      // If setting as primary, unset other primary addresses
      if (isPrimary) {
        await client.query(
          `UPDATE addresses SET is_primary = false WHERE user_id = $1`,
          [id]
        );
      }

      const result = await client.query(
        `INSERT INTO addresses (
          user_id, label, street, city, state, zip_code, country,
          apartment_number, building_code, floor_number, arrival_instructions,
          location, is_primary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
                  ST_SetSRID(ST_MakePoint($12, $13), 4326), $14)
        RETURNING *`,
        [
          id, label, street, city, state, zipCode, country,
          apartmentNumber, buildingCode, floorNumber, arrivalInstructions,
          longitude, latitude, isPrimary || false,
        ]
      );

      await client.query('COMMIT');
      await redisClient.del(`user:${id}`);

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
   * Update address
   */
  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, addressId } = req.params;
      const updates = req.body;

      // Build update query
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

      const query = `
        UPDATE addresses
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${valueIndex - 1} AND user_id = $${valueIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      await redisClient.del(`user:${id}`);

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, addressId } = req.params;

      await pool.query(
        `DELETE FROM addresses WHERE id = $1 AND user_id = $2`,
        [addressId, id]
      );

      await redisClient.del(`user:${id}`);

      res.json({
        success: true,
        message: 'Address deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, phone, relationship } = req.body;

      const result = await pool.query(
        `INSERT INTO emergency_contacts (user_id, name, phone, relationship)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, name, phone, relationship]
      );

      await redisClient.del(`user:${id}`);

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete emergency contact
   */
  async deleteEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, contactId } = req.params;

      await pool.query(
        `DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2`,
        [contactId, id]
      );

      await redisClient.del(`user:${id}`);

      res.json({
        success: true,
        message: 'Emergency contact deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
