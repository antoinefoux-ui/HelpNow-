import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Too many Redis reconnection attempts');
        return new Error('Redis reconnection failed');
      }
      return retries * 100;
    },
  },
});

redisClient.on('error', (err) => {
  // In dev, only log short message - don't spam the console
  if (isProduction) {
    console.error('Redis Client Error:', err);
  }
});

redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('ready', () => console.log('✅ Redis connected'));
redisClient.on('reconnecting', () => console.log('Redis client reconnecting...'));

// Call this in server.ts to connect Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    if (isProduction) {
      // In production, Redis is required - crash loudly
      console.error('❌ Redis connection error:', error);
      throw error;
    } else {
      // In development, Redis is optional - keep server running
      console.log('⚠️  Redis unavailable - running without cache (dev mode)');
    }
  }
};

export { redisClient };
