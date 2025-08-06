import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '@/database/connection';
import { cache } from '@/database/redis';
import { logger, loggerHelpers, emergencyLogger } from '@/utils/logger';
import { AuthenticatedRequest, tournamentMemberMiddleware, roleMiddleware } from '@/middleware/auth';
import { catchAsync, CustomError } from '@/middleware/errorHandler';

const router = express.Router();

// 모든 라우트에 토너먼트 멤버 확인 미들웨어 적용
router.use(tournamentMemberMiddleware);

// 긴급 상황 목록 조회
router.get('/', [
  query('status').optional().isIn(['ACTIVE', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
  query('type').optional().isIn(['TECHNICAL', 'EQUIPMENT', 'NETWORK', 'PERSONNEL', 'SAFETY', 'OTHER']),
  query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { status, type, severity, page = 1, limit = 20 } = req.query;
  const tournamentId = req.user!.tournamentId!;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const whereClause: any = { tournamentId };

  if (status) whereClause.status = status;
  if (type) whereClause.type = type;
  if (severity) whereClause.severity = severity;

  const [emergencies, total] = await Promise.all([
    prisma.emergency.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      },
      skip,
      take,
      orderBy: [
        { status: 'asc' }, // ACTIVE가 먼저
        { severity: 'desc' }, // 심각도 높은 순
        { createdAt: 'desc' }
      ]
    }),
    prisma.emergency.count({ where: whereClause })
  ]);

  res.json({
    emergencies,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// 활성 긴급 상황 조회
router.get('/active', catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;

  const cacheKey = `active_emergencies:${tournamentId}`;
  let activeEmergencies = await cache.get(cacheKey);

  if (!activeEmergencies) {
    activeEmergencies = await prisma.emergency.findMany({
      where: {
        tournamentId,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // 1분간 캐시 (활성 상황이므로 짧게)
    await cache.set(cacheKey, activeEmergencies, 60);
  }

  // 심각도별 통계
  const severityStats = activeEmergencies.reduce((acc: Record<string, number>, emergency: any) => {
    acc[emergency.severity] = (acc[emergency.severity] || 0) + 1;
    return acc;
  }, {});

  res.json({
    emergencies: activeEmergencies,
    count: activeEmergencies.length,
    severityStats
  });
}));

// 긴급 상황 생성
router.post('/', [
  body('type').isIn(['TECHNICAL', 'EQUIPMENT', 'NETWORK', 'PERSONNEL', 'SAFETY', 'OTHER']),
  body('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  body('title').isString().isLength({ min: 1, max: 200 }),
  body('description').isString().isLength({ min: 10, max: 1000 })
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { type, severity = 'MEDIUM', title, description } = req.body;
  const userId = req.user!.id;
  const tournamentId = req.user!.tournamentId!;

  const emergency = await prisma.emergency.create({
    data: {
      tournamentId,
      userId,
      type,
      severity,
      title,
      description,
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true
        }
      }
    }
  });

  // 캐시 무효화
  await cache.del(`active_emergencies:${tournamentId}`);

  // Socket.IO를 통한 긴급 알림 브로드캐스트
  const io = req.app.get('io');
  if (io) {
    io.to(`tournament:${tournamentId}`).emit('emergencyAlert', {
      ...emergency,
      action: 'created',
      timestamp: new Date().toISOString()
    });
  }

  // 긴급 상황 로깅
  emergencyLogger.error('New Emergency Created', {
    emergencyId: emergency.id,
    type,
    severity,
    title,
    userId,
    tournamentId,
    timestamp: new Date().toISOString()
  });

  loggerHelpers.logBusinessEvent('emergency_created', {
    emergencyId: emergency.id,
    type,
    severity,
    createdBy: userId,
    tournamentId
  });

  // 심각도가 HIGH 이상인 경우 프로덕션 모드를 자동으로 EMERGENCY로 변경
  if (['HIGH', 'CRITICAL'].includes(severity)) {
    await prisma.productionStatus.upsert({
      where: { tournamentId },
      create: {
        tournamentId,
        mode: 'EMERGENCY',
        currentIssues: title
      },
      update: {
        mode: 'EMERGENCY',
        currentIssues: title
      }
    });

    // 프로덕션 모드 변경 알림
    if (io) {
      io.to(`tournament:${tournamentId}`).emit('productionModeChanged', {
        mode: 'EMERGENCY',
        reason: `Auto-activated due to ${severity} emergency: ${title}`,
        emergencyId: emergency.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  res.status(201).json({
    message: 'Emergency created successfully',
    emergency
  });
}));

// 긴급 상황 업데이트
router.put('/:emergencyId', [
  param('emergencyId').isUUID(),
  body('status').optional().isIn(['ACTIVE', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
  body('title').optional().isString().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().isLength({ min: 10, max: 1000 }),
  body('resolution').optional().isString().isLength({ max: 1000 })
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { emergencyId } = req.params;
  const { status, title, description, resolution } = req.body;
  const userId = req.user!.id;
  const tournamentId = req.user!.tournamentId!;

  const emergency = await prisma.emergency.findFirst({
    where: {
      id: emergencyId,
      tournamentId
    }
  });

  if (!emergency) {
    throw new CustomError('Emergency not found', 404);
  }

  // 긴급 상황 생성자나 현장 총괄만 업데이트 가능
  if (emergency.userId !== userId && !['FIELD_DIRECTOR', 'ADMIN'].includes(req.user!.role)) {
    throw new CustomError('Access denied', 403);
  }

  const updateData: any = {};
  if (status) updateData.status = status;
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (resolution) updateData.resolution = resolution;

  // 상태가 RESOLVED로 변경되는 경우 해결 시간 기록
  if (status === 'RESOLVED' && emergency.status !== 'RESOLVED') {
    updateData.resolvedAt = new Date();
  }

  const updatedEmergency = await prisma.emergency.update({
    where: { id: emergencyId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true
        }
      }
    }
  });

  // 캐시 무효화
  await cache.del(`active_emergencies:${tournamentId}`);

  // Socket.IO 알림
  const io = req.app.get('io');
  if (io) {
    io.to(`tournament:${tournamentId}`).emit('emergencyUpdated', {
      ...updatedEmergency,
      action: 'updated',
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });
  }

  // 긴급 상황 해결 시 특별 로깅
  if (status === 'RESOLVED') {
    emergencyLogger.error('Emergency Resolved', {
      emergencyId,
      title: emergency.title,
      resolvedBy: userId,
      duration: emergency.createdAt 
        ? Date.now() - emergency.createdAt.getTime()
        : null,
      resolution,
      tournamentId
    });

    loggerHelpers.logBusinessEvent('emergency_resolved', {
      emergencyId,
      resolvedBy: userId,
      duration: emergency.createdAt 
        ? Date.now() - emergency.createdAt.getTime()
        : null,
      tournamentId
    });

    // 활성 긴급 상황이 모두 해결되었는지 확인
    const activeEmergenciesCount = await prisma.emergency.count({
      where: {
        tournamentId,
        status: { in: ['ACTIVE', 'IN_PROGRESS'] },
        id: { not: emergencyId }
      }
    });

    // 모든 긴급 상황이 해결되면 프로덕션 모드를 NORMAL로 변경
    if (activeEmergenciesCount === 0) {
      await prisma.productionStatus.upsert({
        where: { tournamentId },
        create: {
          tournamentId,
          mode: 'NORMAL',
          currentIssues: null
        },
        update: {
          mode: 'NORMAL',
          currentIssues: null
        }
      });

      if (io) {
        io.to(`tournament:${tournamentId}`).emit('productionModeChanged', {
          mode: 'NORMAL',
          reason: 'All emergencies resolved',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  res.json({
    message: 'Emergency updated successfully',
    emergency: updatedEmergency
  });
}));

// 긴급 상황 삭제 (관리자만)
router.delete('/:emergencyId', [
  param('emergencyId').isUUID()
], roleMiddleware('ADMIN', 'FIELD_DIRECTOR'), catchAsync(async (req: AuthenticatedRequest, res) => {
  const { emergencyId } = req.params;
  const userId = req.user!.id;
  const tournamentId = req.user!.tournamentId!;

  const emergency = await prisma.emergency.findFirst({
    where: {
      id: emergencyId,
      tournamentId
    }
  });

  if (!emergency) {
    throw new CustomError('Emergency not found', 404);
  }

  await prisma.emergency.delete({
    where: { id: emergencyId }
  });

  // 캐시 무효화
  await cache.del(`active_emergencies:${tournamentId}`);

  emergencyLogger.error('Emergency Deleted', {
    emergencyId,
    title: emergency.title,
    deletedBy: userId,
    tournamentId
  });

  res.json({
    message: 'Emergency deleted successfully'
  });
}));

// 긴급 상황 통계 조회
router.get('/stats/overview', [
  query('days').optional().isInt({ min: 1, max: 90 })
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;
  const days = parseInt(req.query.days as string) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const cacheKey = `emergency_stats:${tournamentId}:${days}days`;
  let stats = await cache.get(cacheKey);

  if (!stats) {
    // 기간별 긴급 상황 수
    const [
      totalEmergencies,
      activeEmergencies,
      resolvedEmergencies,
      emergenciesByType,
      emergenciesBySeverity,
      emergenciesByStatus,
      averageResolutionTime
    ] = await Promise.all([
      // 전체 긴급 상황 수
      prisma.emergency.count({
        where: {
          tournamentId,
          createdAt: { gte: startDate }
        }
      }),

      // 현재 활성 긴급 상황
      prisma.emergency.count({
        where: {
          tournamentId,
          status: { in: ['ACTIVE', 'IN_PROGRESS'] }
        }
      }),

      // 해결된 긴급 상황
      prisma.emergency.count({
        where: {
          tournamentId,
          status: 'RESOLVED',
          createdAt: { gte: startDate }
        }
      }),

      // 타입별 분류
      prisma.emergency.groupBy({
        by: ['type'],
        where: {
          tournamentId,
          createdAt: { gte: startDate }
        },
        _count: { type: true }
      }),

      // 심각도별 분류
      prisma.emergency.groupBy({
        by: ['severity'],
        where: {
          tournamentId,
          createdAt: { gte: startDate }
        },
        _count: { severity: true }
      }),

      // 상태별 분류
      prisma.emergency.groupBy({
        by: ['status'],
        where: {
          tournamentId,
          createdAt: { gte: startDate }
        },
        _count: { status: true }
      }),

      // 평균 해결 시간 계산
      prisma.emergency.findMany({
        where: {
          tournamentId,
          status: 'RESOLVED',
          resolvedAt: { not: null },
          createdAt: { gte: startDate }
        },
        select: {
          createdAt: true,
          resolvedAt: true
        }
      })
    ]);

    // 평균 해결 시간 계산 (분 단위)
    const resolutionTimes = averageResolutionTime
      .filter(e => e.resolvedAt)
      .map(e => (e.resolvedAt!.getTime() - e.createdAt.getTime()) / (1000 * 60));

    const avgResolutionTime = resolutionTimes.length > 0
      ? Math.round(resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length)
      : 0;

    stats = {
      period: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        days
      },
      totals: {
        total: totalEmergencies,
        active: activeEmergencies,
        resolved: resolvedEmergencies,
        cancelled: totalEmergencies - activeEmergencies - resolvedEmergencies
      },
      distributions: {
        byType: emergenciesByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: emergenciesBySeverity.reduce((acc, item) => {
          acc[item.severity] = item._count.severity;
          return acc;
        }, {} as Record<string, number>),
        byStatus: emergenciesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>)
      },
      metrics: {
        averageResolutionTimeMinutes: avgResolutionTime,
        resolutionRate: totalEmergencies > 0 
          ? Math.round((resolvedEmergencies / totalEmergencies) * 100) 
          : 0
      }
    };

    // 10분간 캐시
    await cache.set(cacheKey, stats, 600);
  }

  res.json({ stats });
}));

// 긴급 상황 히스토리 조회
router.get('/history', [
  query('days').optional().isInt({ min: 1, max: 90 }),
  query('status').optional().isIn(['RESOLVED', 'CANCELLED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { days = 30, status, page = 1, limit = 20 } = req.query;
  const tournamentId = req.user!.tournamentId!;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const whereClause: any = {
    tournamentId,
    createdAt: { gte: startDate },
    status: { in: ['RESOLVED', 'CANCELLED'] }
  };

  if (status) {
    whereClause.status = status;
  }

  const [emergencies, total] = await Promise.all([
    prisma.emergency.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      },
      skip,
      take,
      orderBy: { resolvedAt: 'desc' }
    }),
    prisma.emergency.count({ where: whereClause })
  ]);

  // 해결 시간 계산
  const emergenciesWithDuration = emergencies.map(emergency => {
    const duration = emergency.resolvedAt
      ? emergency.resolvedAt.getTime() - emergency.createdAt.getTime()
      : null;

    return {
      ...emergency,
      durationMinutes: duration ? Math.round(duration / (1000 * 60)) : null
    };
  });

  res.json({
    emergencies: emergenciesWithDuration,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    },
    period: {
      startDate: startDate.toISOString(),
      days: Number(days)
    }
  });
}));

export default router;