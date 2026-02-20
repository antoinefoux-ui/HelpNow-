import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { safeRedis } from '../config/redis';

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
      res.status(401).json({ success: false, error: 'Authentication required' });
      return null;
    }

    if (requesterId !== id) {
      res.status(403).json({ success: false, error: 'Not authorized to access this user resource' });
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
      if (!this.ensureOwner(req, res)) return;

      const cached = await safeRedis.get(`user:${id}`);
      if (cached) {
        res.json({ success: true, data: JSON.parse(cached) });
        return;
      }

      const userResult = await pool.query(
        `SELECT id, email, phone, first_name, last_name, profile_photo,
                date_of_birth, gender, is_helper, is_active, rating,
                total_helps, verified, language, created_at
         FROM users WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const user = userResult.rows[0];

      if (user.is_helper) {
        const helperResult = await pool.query(
          `SELECT * FROM helper_profiles WHERE user_id = $1`,
          [id]
        );
        if (helperResult.rows.length > 0) {
          user.helperProfile = helperResult.rows[0];
        }
      }

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

      const contactsResult = await pool.query(
        `SELECT * FROM emergency_contacts WHERE user_id = $1`,
        [id]
      );
      user.emergencyContacts = contactsResult.rows;

      const medicalResult = await pool.query(
        `SELECT * FROM medical_info WHERE user_id = $1`,
        [id]
      );
      if (medicalResult.rows.length > 0) {
        user.medicalInfo = medicalResult.rows[0];
      }

      await safeRedis.setEx(`user:${id}`, 300, JSON.stringify(user));

      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * Accepts: firstName, lastName, dateOfBirth, gender, language, isHelper, helperProfile
   * helperProfile fields accepted in both camelCase and snake_case
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      if (!this.ensureOwner(req, res)) return;

      const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        language,
        isHelper,
        helperProfile,
      } = req.body;

      await client.query('BEGIN');

      // Build users table update
      const updates: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      if (firstName !== undefined) { updates.push(`first_name = $${valueIndex++}`); values.push(firstName); }
      if (lastName !== undefined)  { updates.push(`last_name = $${valueIndex++}`);  values.push(lastName); }
      if (dateOfBirth !== undefined){ updates.push(`date_of_birth = $${valueIndex++}`); values.push(dateOfBirth); }
      if (gender !== undefined)    { updates.push(`gender = $${valueIndex++}`);      values.push(gender); }
      if (language !== undefined)  { updates.push(`language = $${valueIndex++}`);    values.push(language); }
      // FIX: accept isHelper field
      if (isHelper !== undefined)  { updates.push(`is_helper = $${valueIndex++}`);   values.push(isHelper); }

      let userResult;
      if (updates.length > 0) {
        updates.push(`updated_at = NOW()`);
        values.push(id);
        userResult = await client.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING *`,
          values
        );
      } else {
        userResult = await client.query(`SELECT * FROM users WHERE id = $1`, [id]);
      }

      // Update helper_profiles if helperProfile provided
      // FIX: handle both camelCase and snake_case from frontend
      if (helperProfile) {
        const helperUpdates: string[] = [];
        const helperValues: any[] = [];
        let helperIndex = 1;

        const isAvailable = helperProfile.isAvailable ?? helperProfile.is_available;
        const responseRadius = helperProfile.responseRadius ?? helperProfile.response_radius;
        const trainingLevel = helperProfile.trainingLevel ?? helperProfile.training_level;
        const verificationStatus = helperProfile.verificationStatus ?? helperProfile.verification_status;
        const languagesSpoken = helperProfile.languagesSpoken ?? helperProfile.languages_spoken;
        const situationsWillingToHelp = helperProfile.situationsWillingToHelp ?? helperProfile.situations_willing_to_help;

        if (isAvailable !== undefined)          { helperUpdates.push(`is_available = $${helperIndex++}`);           helperValues.push(isAvailable); }
        if (responseRadius !== undefined)        { helperUpdates.push(`response_radius = $${helperIndex++}`);        helperValues.push(responseRadius); }
        if (trainingLevel !== undefined)         { helperUpdates.push(`training_level = $${helperIndex++}`);         helperValues.push(trainingLevel); }
        if (verificationStatus !== undefined)    { helperUpdates.push(`verification_status = $${helperIndex++}`);    helperValues.push(verificationStatus); }
        if (languagesSpoken !== undefined)       { helperUpdates.push(`languages_spoken = $${helperIndex++}`);       helperValues.push(languagesSpoken); }
        if (situationsWillingToHelp !== undefined){ helperUpdates.push(`situations_willing_to_help = $${helperIndex++}`); helperValues.push(situationsWillingToHelp); }

        if (helperUpdates.length > 0) {
          helperUpdates.push(`updated_at = NOW()`);
          helperValues.push(id);
          await client.query(
            `UPDATE helper_profiles SET ${helperUpdates.join(', ')} WHERE user_id = $${helperIndex} RETURNING *`,
            helperValues
          );
        }
      }

      // Return 400 only if truly nothing was provided
      if (updates.length === 0 && !helperProfile && isHelper === undefined) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, error: 'No fields to update' });
        return;
      }

      await client.query('COMMIT');

      await safeRedis.del(`user:${id}`);

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

      res.json({ success: true, data: finalUser });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      if (!this.ensureOwner(req, res)) return;
      await client.query('BEGIN');
      await client.query(`UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`, [id]);
      await client.query('COMMIT');
      await safeRedis.del(`user:${id}`);
      await safeRedis.del(`refresh_token:${id}`);
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
      await safeRedis.del(`user:${id}`);
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
      await safeRedis.del(`user:${id}`);
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
      await safeRedis.del(`user:${id}`);
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
      await safeRedis.del(`user:${id}`);
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
      await safeRedis.del(`user:${id}`);
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
      await safeRedis.del(`user:${id}`);
      res.json({ success: true, message: 'Emergency contact deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
