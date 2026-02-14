import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface AuthSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

/**
 * Initialize Socket.IO handlers
 */
export const initializeSocketHandlers = (io: SocketServer) => {
  // Authentication middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
      };
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    /**
     * Helper goes online/offline
     */
    socket.on('helper:set_availability', async (data: { isAvailable: boolean }) => {
      try {
        const { isAvailable } = data;

        // Update database
        await pool.query(
          `UPDATE helper_profiles 
           SET is_available = $1, updated_at = NOW() 
           WHERE user_id = $2`,
          [isAvailable, socket.userId]
        );

        if (isAvailable) {
          socket.join('available_helpers');
          console.log(`Helper ${socket.userId} is now available`);
        } else {
          socket.leave('available_helpers');
          console.log(`Helper ${socket.userId} is now offline`);
        }

        socket.emit('helper:availability_updated', { isAvailable });
      } catch (error) {
        console.error('Error setting helper availability:', error);
        socket.emit('error', { message: 'Failed to update availability' });
      }
    });

    /**
     * Emergency created - notify nearby helpers
     */
    socket.on('emergency:create', async (data: {
      requestId: string;
      location: { latitude: number; longitude: number };
      type: string;
    }) => {
      try {
        const { requestId, location, type } = data;

        // Get nearby available helpers
        const helpersResult = await pool.query(
          `SELECT u.id
           FROM users u
           INNER JOIN helper_profiles hp ON u.id = hp.user_id
           INNER JOIN helper_locations hl ON u.id = hl.user_id
           WHERE hp.is_available = true
             AND hp.verification_status = 'verified'
             AND ST_DWithin(
               hl.last_location,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
               COALESCE(hp.response_radius, 5000)
             )`,
          [location.longitude, location.latitude]
        );

        // Notify each nearby helper
        helpersResult.rows.forEach((helper) => {
          io.to(`user_${helper.id}`).emit('emergency:new_request', {
            requestId,
            type,
            location,
          });
        });

        console.log(`Emergency ${requestId} notified to ${helpersResult.rows.length} helpers`);
      } catch (error) {
        console.error('Error notifying helpers:', error);
      }
    });

    /**
     * Helper accepts emergency
     */
    socket.on('emergency:accept', async (data: { requestId: string }) => {
      try {
        const { requestId } = data;

        // Join emergency room
        socket.join(`emergency_${requestId}`);

        // Notify seeker
        const requestResult = await pool.query(
          `SELECT seeker_id FROM emergency_requests WHERE id = $1`,
          [requestId]
        );

        if (requestResult.rows.length > 0) {
          const seekerId = requestResult.rows[0].seeker_id;
          io.to(`user_${seekerId}`).emit('emergency:helper_accepted', {
            requestId,
            helperId: socket.userId,
          });
        }

        console.log(`Helper ${socket.userId} accepted emergency ${requestId}`);
      } catch (error) {
        console.error('Error accepting emergency:', error);
        socket.emit('error', { message: 'Failed to accept emergency' });
      }
    });

    /**
     * Update helper location during active emergency
     */
    socket.on('emergency:update_location', async (data: {
      requestId: string;
      location: { latitude: number; longitude: number };
      eta: number;
    }) => {
      try {
        const { requestId, location, eta } = data;

        // Broadcast to emergency room (seeker sees this)
        io.to(`emergency_${requestId}`).emit('helper:location_update', {
          requestId,
          helperId: socket.userId,
          location,
          eta,
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    });

    /**
     * Helper arrived at location
     */
    socket.on('emergency:helper_arrived', async (data: { requestId: string }) => {
      try {
        const { requestId } = data;

        // Notify seeker
        io.to(`emergency_${requestId}`).emit('helper:arrived', {
          requestId,
          helperId: socket.userId,
        });

        console.log(`Helper ${socket.userId} arrived at emergency ${requestId}`);
      } catch (error) {
        console.error('Error marking arrival:', error);
      }
    });

    /**
     * Emergency resolved
     */
    socket.on('emergency:resolve', async (data: { requestId: string }) => {
      try {
        const { requestId } = data;

        // Notify both parties
        io.to(`emergency_${requestId}`).emit('emergency:resolved', {
          requestId,
        });

        console.log(`Emergency ${requestId} resolved`);
      } catch (error) {
        console.error('Error resolving emergency:', error);
      }
    });

    /**
     * Emergency cancelled
     */
    socket.on('emergency:cancel', async (data: { requestId: string }) => {
      try {
        const { requestId } = data;

        // Notify all parties
        io.to(`emergency_${requestId}`).emit('emergency:cancelled', {
          requestId,
        });

        console.log(`Emergency ${requestId} cancelled`);
      } catch (error) {
        console.error('Error cancelling emergency:', error);
      }
    });

    /**
     * Join emergency room (for seeker)
     */
    socket.on('emergency:join', (data: { requestId: string }) => {
      const { requestId } = data;
      socket.join(`emergency_${requestId}`);
      console.log(`User ${socket.userId} joined emergency ${requestId}`);
    });

    /**
     * Leave emergency room
     */
    socket.on('emergency:leave', (data: { requestId: string }) => {
      const { requestId } = data;
      socket.leave(`emergency_${requestId}`);
      console.log(`User ${socket.userId} left emergency ${requestId}`);
    });

    /**
     * Typing indicator (for future chat feature)
     */
    socket.on('chat:typing', (data: { requestId: string; isTyping: boolean }) => {
      const { requestId, isTyping } = data;
      socket.to(`emergency_${requestId}`).emit('chat:user_typing', {
        userId: socket.userId,
        isTyping,
      });
    });

    /**
     * Send chat message (for future chat feature)
     */
    socket.on('chat:send_message', (data: {
      requestId: string;
      message: string;
    }) => {
      const { requestId, message } = data;
      io.to(`emergency_${requestId}`).emit('chat:new_message', {
        requestId,
        userId: socket.userId,
        message,
        timestamp: new Date(),
      });
    });

    /**
     * Heartbeat to keep connection alive
     */
    socket.on('ping', () => {
      socket.emit('pong');
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);

      // If helper, mark as unavailable after disconnect
      try {
        await pool.query(
          `UPDATE helper_profiles 
           SET is_available = false, updated_at = NOW() 
           WHERE user_id = $1`,
          [socket.userId]
        );
      } catch (error) {
        console.error('Error updating helper availability on disconnect:', error);
      }
    });

    /**
     * Error handling
     */
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};
