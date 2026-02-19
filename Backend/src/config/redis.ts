import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: isProduction
      ? (retries) => {
          if (retries > 10) return new Error('Redis reconnection failed');
          return retries * 100;
        }
      : false,
  },
});

redisClient.on('error', () => {
  if (isProduction) {
    console.error('❌ Redis Client Error');
  }
});
redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('ready', () => console.log('✅ Redis connected'));

export const connectRedis = async (): Promise<void> => {
  if (!isProduction) {
    try {
      await redisClient.connect();
      console.log('✅ Redis connected');
    } catch {
      console.log('⚠️  Redis unavailable - running without cache (dev mode)');
    }
    return;
  }
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    throw error;
  }
};

// Safe wrappers — no-op silently when Redis is unavailable
const isRedisReady = () => redisClient.isReady;

export const safeRedis = {
  get: async (key: string): Promise<string | null> => {
    if (!isRedisReady()) return null;
    try { return await redisClient.get(key); } catch { return null; }
  },
  set: async (key: string, value: string): Promise<void> => {
    if (!isRedisReady()) return;
    try { await redisClient.set(key, value); } catch { }
  },
  setEx: async (key: string, ttl: number, value: string): Promise<void> => {
    if (!isRedisReady()) return;
    try { await redisClient.setEx(key, ttl, value); } catch { }
  },
  del: async (key: string): Promise<void> => {
    if (!isRedisReady()) return;
    try { await redisClient.del(key); } catch { }
  },
};

export { redisClient };
