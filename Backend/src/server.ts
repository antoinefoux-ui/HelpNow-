import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import emergencyRoutes from './routes/emergencyRoutes';
import helperRoutes from './routes/helperRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Import socket handlers
import { initializeSocketHandlers } from './services/socketService';

// Import database
import { pool } from './config/database';
import { redisClient, connectRedis } from './config/redis';

// Load environment variables
dotenv.config();

const app: Application = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'HelpNow API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      emergencies: '/api/v1/emergencies',
      helpers: '/api/v1/helpers',
    },
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authenticateToken, userRoutes);
app.use('/api/v1/emergencies', authenticateToken, emergencyRoutes);
app.use('/api/v1/helpers', authenticateToken, helperRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

// Initialize socket handlers
initializeSocketHandlers(io);

// Start server and connect services
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  // 1. Connect PostgreSQL
  try {
    await pool.connect();
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit(1); // DB is required - crash if it fails
  }

  // 2. Connect Redis (optional in development)
  await connectRedis();

  // 3. Start HTTP server
  server.listen(PORT, () => {
    console.log(`🚀 HelpNow API Server running on port ${PORT}`);
    console.log(`📡 Socket.IO server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await pool.end();
    await redisClient.quit().catch(() => {}); // Don't crash if Redis wasn't connected
    process.exit(0);
  });
});

export { app, io };
