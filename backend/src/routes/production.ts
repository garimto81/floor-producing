import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '@/database/connection';
import { cache } from '@/database/redis';
import { logger, loggerHelpers } from '@/utils/logger';
import { AuthenticatedRequest, tournamentMemberMiddleware, roleMiddleware } from '@/middleware/auth';
import { catchAsync, CustomError } from '@/middleware/errorHandler';

const router = express.Router();

// 모든 라우트에 토너먼트 멤버 확인 미들웨어 적용
router.use(tournamentMemberMiddleware);

// 현재 프로덕션 상태 조회
router.get('/status', catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;

  const cacheKey = `production_status:${tournamentId}`;
  let status = await cache.get(cacheKey);

  if (!status) {
    status = await prisma.productionStatus.findFirst({
      where: { tournamentId },
      orderBy: { updatedAt: 'desc' }
    });

    if (!status) {
      // 기본 상태 생성
      status = await prisma.productionStatus.create({
        data: {
          tournamentId,
          mode: 'NORMAL',
          featureTable: 'Not Set',
          streamQuality: 'HD',
          uploadSpeed: 0,
          teamStatus: {
            total: 0,
            active: 0,
            break: 0,
            offline: 0
          },
          currentIssues: null,
          nextSchedule: null
        }
      });
    }

    // 5분간 캐시
    await cache.set(cacheKey, status, 300);
  }

  res.json({ status });
}));

// 프로덕션 상태 업데이트 (현장 총괄 이상만)
router.put('/status', [
  body('mode').optional().isIn(['NORMAL', 'PRODUCTION', 'EMERGENCY']),
  body('featureTable').optional().isString().isLength({ max: 100 }),
  body('streamQuality').optional().isString().isLength({ max: 50 }),
  body('uploadSpeed').optional().isFloat({ min: 0 }),
  body('teamStatus').optional().isObject(),
  body('currentIssues').optional().isString().isLength({ max: 500 }),
  body('nextSchedule').optional().isISO8601()
], roleMiddleware('FIELD_DIRECTOR', 'ADMIN'), catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const tournamentId = req.user!.tournamentId!;
  const userId = req.user!.id;
  const updateData = req.body;

  // nextSchedule 처리
  if (updateData.nextSchedule) {
    updateData.nextSchedule = new Date(updateData.nextSchedule);
  }

  const updatedStatus = await prisma.productionStatus.upsert({
    where: { tournamentId },
    create: {
      tournamentId,
      ...updateData
    },
    update: updateData
  });

  // 캐시 무효화
  await cache.del(`production_status:${tournamentId}`);

  // Socket.IO를 통한 실시간 알림
  const io = req.app.get('io');
  if (io) {
    io.to(`tournament:${tournamentId}`).emit('productionStatusChanged', {
      ...updatedStatus,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });
  }

  loggerHelpers.logBusinessEvent('production_status_updated', {
    tournamentId,
    updatedBy: userId,
    mode: updateData.mode,
    changes: Object.keys(updateData)
  });

  // 긴급 모드 변경 시 특별 로깅
  if (updateData.mode === 'EMERGENCY') {
    loggerHelpers.logBusinessEvent('emergency_mode_activated', {
      tournamentId,
      activatedBy: userId,
      currentIssues: updateData.currentIssues
    });
  }

  res.json({
    message: 'Production status updated successfully',
    status: updatedStatus
  });
}));

// 프로덕션 모드 변경 (빠른 변경용)
router.patch('/mode', [
  body('mode').isIn(['NORMAL', 'PRODUCTION', 'EMERGENCY']),
  body('reason').optional().isString().isLength({ max: 200 })
], roleMiddleware('FIELD_DIRECTOR', 'ADMIN'), catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { mode, reason } = req.body;
  const tournamentId = req.user!.tournamentId!;
  const userId = req.user!.id;

  const updatedStatus = await prisma.productionStatus.upsert({
    where: { tournamentId },
    create: {
      tournamentId,
      mode,
      featureTable: 'Not Set',
      streamQuality: 'HD',
      uploadSpeed: 0
    },
    update: { 
      mode,
      ...(reason && { currentIssues: reason })
    }
  });

  // 캐시 무효화
  await cache.del(`production_status:${tournamentId}`);

  // Socket.IO 알림
  const io = req.app.get('io');
  if (io) {
    io.to(`tournament:${tournamentId}`).emit('productionModeChanged', {
      mode,
      reason,
      changedBy: userId,
      timestamp: new Date().toISOString()
    });
  }

  // 긴급 모드 활성화 시 긴급 이벤트 생성
  if (mode === 'EMERGENCY') {
    await prisma.emergency.create({
      data: {
        tournamentId,
        userId,
        type: 'OTHER',
        severity: 'HIGH',
        title: 'Emergency Mode Activated',
        description: reason || 'Emergency mode activated by field director',
        status: 'ACTIVE'
      }
    });

    loggerHelpers.logBusinessEvent('emergency_mode_activated', {
      tournamentId,
      activatedBy: userId,
      reason
    });
  }

  res.json({
    message: `Production mode changed to ${mode}`,
    status: updatedStatus
  });
}));

// 프로덕션 상태 히스토리 조회
router.get('/history', [
  query('days').optional().isInt({ min: 1, max: 30 }),
  query('mode').optional().isIn(['NORMAL', 'PRODUCTION', 'EMERGENCY'])
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;
  const days = parseInt(req.query.days as string) || 7;
  const { mode } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const whereClause: any = {
    tournamentId,
    updatedAt: {
      gte: startDate
    }
  };

  if (mode) {
    whereClause.mode = mode;
  }

  const history = await prisma.productionStatus.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    take: 100 // 최대 100개 기록
  });

  // 모드별 통계
  const modeStats = history.reduce((acc, record) => {
    const mode = record.mode;
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    history,
    period: {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      days
    },
    statistics: {
      totalRecords: history.length,
      modeDistribution: modeStats
    }
  });
}));

// 실시간 메트릭 조회
router.get('/metrics/realtime', catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;

  // 현재 프로덕션 상태
  const currentStatus = await prisma.productionStatus.findFirst({
    where: { tournamentId },
    orderBy: { updatedAt: 'desc' }
  });

  // 팀원 상태 통계
  const teamStats = await prisma.teamMember.groupBy({
    by: ['status'],
    where: {
      team: {
        tournamentId
      }
    },
    _count: {
      status: true
    }
  });

  // 온라인 사용자 수
  const onlineKeys = await cache.keys('online:*');
  let onlineCount = 0;
  for (const key of onlineKeys) {
    const userData = await cache.get(key);
    if (userData && userData.tournamentId === tournamentId) {
      onlineCount++;
    }
  }

  // 오늘 체크리스트 완료율
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [totalChecklistItems, completedChecklistItems] = await Promise.all([
    prisma.checklistItem.count({
      where: {
        template: {
          tournamentId,
          isActive: true
        }
      }
    }),
    prisma.userChecklistItem.count({
      where: {
        isChecked: true,
        date: {
          gte: today,
          lt: tomorrow
        },
        template: {
          tournamentId
        }
      }
    })
  ]);

  const checklistProgress = totalChecklistItems > 0 
    ? Math.round((completedChecklistItems / totalChecklistItems) * 100) 
    : 0;

  // 활성 긴급상황 수
  const activeEmergencies = await prisma.emergency.count({
    where: {
      tournamentId,
      status: 'ACTIVE'
    }
  });

  const metrics = {
    timestamp: new Date().toISOString(),
    productionMode: currentStatus?.mode || 'NORMAL',
    streamQuality: currentStatus?.streamQuality || 'Unknown',
    uploadSpeed: currentStatus?.uploadSpeed || 0,
    featureTable: currentStatus?.featureTable || 'Not Set',
    teamStatus: {
      total: teamStats.reduce((sum, stat) => sum + stat._count.status, 0),
      byStatus: teamStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<string, number>),
      online: onlineCount
    },
    checklistProgress: {
      overall: checklistProgress,
      total: totalChecklistItems,
      completed: completedChecklistItems
    },
    activeEmergencies,
    lastUpdate: currentStatus?.updatedAt?.toISOString()
  };

  // 실시간 메트릭 캐시 (30초)
  await cache.set(`realtime_metrics:${tournamentId}`, metrics, 30);

  res.json({ metrics });
}));

// 시스템 상태 체크
router.get('/health-check', catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;
  
  try {
    // 데이터베이스 연결 테스트
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Redis 연결 테스트
    const redisTest = await cache.get('health-check') !== undefined;
    
    // 현재 프로덕션 상태 조회
    const productionStatus = await prisma.productionStatus.findFirst({
      where: { tournamentId },
      select: { mode: true, updatedAt: true }
    });

    // 활성 긴급상황 확인
    const emergencies = await prisma.emergency.count({
      where: {
        tournamentId,
        status: 'ACTIVE'
      }
    });

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbTest ? 'connected' : 'disconnected',
        redis: redisTest ? 'connected' : 'disconnected',
        production: productionStatus ? 'active' : 'inactive'
      },
      production: {
        mode: productionStatus?.mode || 'UNKNOWN',
        lastUpdate: productionStatus?.updatedAt,
        activeEmergencies: emergencies
      },
      tournament: {
        id: tournamentId
      }
    };

    // 시스템에 문제가 있는 경우 상태 변경
    if (!dbTest || emergencies > 0) {
      health.status = 'warning';
    }

    res.json(health);

  } catch (error) {
    logger.error('Production health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'System health check failed'
    });
  }
}));

export default router;