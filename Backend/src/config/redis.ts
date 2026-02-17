import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    // In dev: don't retry at all. In prod: retry up to 10 times.
    reconnectStrategy: isProduction
      ? (retries) => {
          if (retries > 10) return new Error('Redis reconnection failed');
          return retries * 100;
        }
      : false, // false = disable reconnection entirely in dev
  },
});

redisClient.on('error', () => {
  // Silently ignore in dev - server keeps running
  if (isProduction) {
    console.error('❌ Redis Client Error');
  }
});

redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('ready', () => console.log('✅ Redis connected'));

export const connectRedis = async (): Promise<void> => {
  if (!isProduction) {
    // In dev, try once - if it fails, move on silently
    try {
      await redisClient.connect();
      console.log('✅ Redis connected');
    } catch {
      console.log('⚠️  Redis unavailable - running without cache (dev mode)');
    }
    return;
  }

  // In production, Redis is required
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    throw error;
  }
};

export { redisClient };
