import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { logger, requestLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { initializeDatabase } from './database/connection';
import { initializeRedis } from './database/redis';
import { setupSocketHandlers } from './sockets/socketHandler';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import teamRoutes from './routes/teams';
import checklistRoutes from './routes/checklists';
import productionRoutes from './routes/production';
import communicationRoutes from './routes/communication';
import emergencyRoutes from './routes/emergency';
import fileRoutes from './routes/files';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:19006",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 기본 미들웨어
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:19006",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // IP당 최대 요청 수
  message: {
    error: 'Too many requests from this IP, please try again later'
  }
});
app.use('/api/', limiter);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/teams', authMiddleware, teamRoutes);
app.use('/api/checklists', authMiddleware, checklistRoutes);
app.use('/api/production', authMiddleware, productionRoutes);
app.use('/api/communication', authMiddleware, communicationRoutes);
app.use('/api/emergency', authMiddleware, emergencyRoutes);
app.use('/api/files', authMiddleware, fileRoutes);

// Socket.IO 설정
app.set('io', io);
setupSocketHandlers(io);

// 에러 핸들링
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 데이터베이스 연결
    await initializeDatabase();
    logger.info('Database connected successfully');

    // Redis 연결 (선택사항)
    const redisConnected = await initializeRedis();
    if (redisConnected) {
      logger.info('Redis connected successfully');
    } else {
      logger.info('Running without Redis cache');
    }

    // 서버 시작
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 WSOP Field Director Pro Backend`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();