import Redis from 'redis';
import { logger } from '../utils/logger';

// Redis 클라이언트 설정
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retry_delayOnFailover: 100,
  retry_delayOnClusterDown: 300,
  retry_maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Redis 이벤트 핸들러
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error', err);
});

redisClient.on('end', () => {
  logger.info('Redis client disconnected');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

// Redis 연결 초기화
export async function initializeRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    
    // 연결 테스트
    await redisClient.ping();
    logger.info('Redis connection established successfully');

    // Redis 정보 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      const info = await redisClient.info();
      const lines = info.split('\n');
      const redisVersion = lines.find(line => line.startsWith('redis_version:'))?.split(':')[1];
      const usedMemory = lines.find(line => line.startsWith('used_memory_human:'))?.split(':')[1];
      
      logger.info('Redis server info', {
        version: redisVersion?.trim(),
        memory: usedMemory?.trim()
      });
    }

    return true;
  } catch (error) {
    logger.warn('Redis connection failed, running without Redis cache', error);
    return false;
  }
}

// Redis 연결 해제
export async function disconnectRedis() {
  try {
    if (redisClient.isOpen) {
      await redisClient.disconnect();
      logger.info('Redis connection closed successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis', error);
    throw error;
  }
}

// Redis 헬스 체크
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed', error);
    return false;
  }
}

// 캐시 헬퍼 함수들
export const cache = {
  // 값 설정 (TTL 포함)
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!redisClient.isOpen) {
        logger.debug('Redis not connected, skipping cache set');
        return;
      }
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await redisClient.setEx(key, ttl, serializedValue);
      } else {
        await redisClient.set(key, serializedValue);
      }
    } catch (error) {
      logger.error('Redis SET error', { key, error });
      // 에러를 throw하지 않고 로그만 기록 (캐시 실패가 앱을 중단시키지 않도록)
    }
  },

  // 값 조회
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!redisClient.isOpen) {
        return null;
      }
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error', { key, error });
      return null;
    }
  },

  // 값 삭제
  async del(key: string): Promise<boolean> {
    try {
      const result = await redisClient.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis DEL error', { key, error });
      return false;
    }
  },

  // 키 존재 확인
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error });
      return false;
    }
  },

  // TTL 설정
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await redisClient.expire(key, ttl);
      return result > 0;
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, ttl, error });
      return false;
    }
  },

  // 패턴으로 키 검색
  async keys(pattern: string): Promise<string[]> {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error', { pattern, error });
      return [];
    }
  },

  // 해시 맵 작업
  async hSet(key: string, field: string, value: any): Promise<void> {
    try {
      await redisClient.hSet(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis HSET error', { key, field, error });
      throw error;
    }
  },

  async hGet<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await redisClient.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis HGET error', { key, field, error });
      return null;
    }
  },

  async hGetAll<T>(key: string): Promise<Record<string, T>> {
    try {
      const hash = await redisClient.hGetAll(key);
      const result: Record<string, T> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value as T;
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Redis HGETALL error', { key, error });
      return {};
    }
  },

  // 리스트 작업
  async lPush(key: string, ...values: any[]): Promise<number> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await redisClient.lPush(key, serializedValues);
    } catch (error) {
      logger.error('Redis LPUSH error', { key, error });
      return 0;
    }
  },

  async lRange<T>(key: string, start: number = 0, stop: number = -1): Promise<T[]> {
    try {
      const values = await redisClient.lRange(key, start, stop);
      return values.map(v => {
        try {
          return JSON.parse(v);
        } catch {
          return v as T;
        }
      });
    } catch (error) {
      logger.error('Redis LRANGE error', { key, start, stop, error });
      return [];
    }
  },

  // 세트 작업
  async sAdd(key: string, ...members: any[]): Promise<number> {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await redisClient.sAdd(key, serializedMembers);
    } catch (error) {
      logger.error('Redis SADD error', { key, error });
      return 0;
    }
  },

  async sMembers<T>(key: string): Promise<T[]> {
    try {
      const members = await redisClient.sMembers(key);
      return members.map(m => {
        try {
          return JSON.parse(m);
        } catch {
          return m as T;
        }
      });
    } catch (error) {
      logger.error('Redis SMEMBERS error', { key, error });
      return [];
    }
  }
};

// 세션 관리 함수들
export const session = {
  async create(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    await cache.set(`session:${sessionId}`, data, ttl);
  },

  async get<T>(sessionId: string): Promise<T | null> {
    return await cache.get<T>(`session:${sessionId}`);
  },

  async destroy(sessionId: string): Promise<boolean> {
    return await cache.del(`session:${sessionId}`);
  },

  async extend(sessionId: string, ttl: number = 3600): Promise<boolean> {
    return await cache.expire(`session:${sessionId}`, ttl);
  }
};

// Rate limiting 함수들
export const rateLimit = {
  async checkLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const now = Date.now();
      const window = Math.floor(now / windowMs);
      const redisKey = `rate_limit:${key}:${window}`;
      
      const current = await redisClient.incr(redisKey);
      
      if (current === 1) {
        await redisClient.expire(redisKey, Math.ceil(windowMs / 1000));
      }
      
      const remaining = Math.max(0, limit - current);
      const resetTime = (window + 1) * windowMs;
      
      return {
        allowed: current <= limit,
        remaining,
        resetTime
      };
    } catch (error) {
      logger.error('Rate limit check error', { key, error });
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs };
    }
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectRedis();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing Redis connection...');
  await disconnectRedis();
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing Redis connection...');
  await disconnectRedis();
});

export { redisClient };
export default redisClient;