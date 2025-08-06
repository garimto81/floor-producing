import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Prisma Client 인스턴스
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  errorFormat: 'pretty'
});

// 쿼리 로깅 설정
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Database Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      timestamp: e.timestamp
    });
  }
  
  // 느린 쿼리 경고 (1초 이상)
  if (e.duration > 1000) {
    logger.warn('Slow Database Query', {
      query: e.query,
      duration: `${e.duration}ms`
    });
  }
});

// 에러 로깅
prisma.$on('error', (e) => {
  logger.error('Database Error', e);
});

// 정보 로깅
prisma.$on('info', (e) => {
  logger.info('Database Info', e);
});

// 경고 로깅
prisma.$on('warn', (e) => {
  logger.warn('Database Warning', e);
});

// 데이터베이스 연결 초기화
export async function initializeDatabase() {
  try {
    // 연결 테스트
    await prisma.$connect();
    logger.info('Database connection established successfully');

    // 데이터베이스 상태 확인
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    logger.info('Database health check passed', { result });

    // 개발 환경에서 데이터베이스 스키마 확인
    if (process.env.NODE_ENV === 'development') {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      logger.info('Database tables found', { tables });
    }

    return true;
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }
}

// 데이터베이스 연결 해제
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error disconnecting from database', error);
    throw error;
  }
}

// 트랜잭션 헬퍼 함수
export async function executeTransaction<T>(
  operations: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    const result = await prisma.$transaction(operations);
    logger.info('Transaction completed successfully');
    return result;
  } catch (error) {
    logger.error('Transaction failed', error);
    throw error;
  }
}

// 데이터베이스 통계 조회
export async function getDatabaseStats() {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      LIMIT 10;
    `;
    
    return stats;
  } catch (error) {
    logger.error('Failed to get database stats', error);
    return null;
  }
}

// 연결 상태 확인
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing database connection...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connection...');
  await disconnectDatabase();
  process.exit(0);
});

export default prisma;