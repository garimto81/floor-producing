import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '@/database/connection';
import { cache } from '@/database/redis';
import { logger, loggerHelpers } from '@/utils/logger';
import { AuthenticatedRequest, tournamentMemberMiddleware } from '@/middleware/auth';
import { catchAsync, CustomError } from '@/middleware/errorHandler';

const router = express.Router();

// 모든 라우트에 토너먼트 멤버 확인 미들웨어 적용
router.use(tournamentMemberMiddleware);

// 체크리스트 템플릿 목록 조회
router.get('/templates', catchAsync(async (req: AuthenticatedRequest, res) => {
  const { timeSlot, category } = req.query;
  const tournamentId = req.user!.tournamentId!;

  const whereClause: any = {
    tournamentId,
    isActive: true
  };

  if (timeSlot) {
    whereClause.timeSlot = timeSlot;
  }

  if (category) {
    whereClause.category = category;
  }

  const templates = await prisma.checklistTemplate.findMany({
    where: whereClause,
    include: {
      items: {
        orderBy: { order: 'asc' }
      },
      _count: {
        select: {
          items: true
        }
      }
    },
    orderBy: [
      { timeSlot: 'asc' },
      { priority: 'desc' },
      { name: 'asc' }
    ]
  });

  res.json({ templates });
}));

// 사용자별 체크리스트 진행상황 조회
router.get('/my-progress', [
  query('date').optional().isISO8601()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const tournamentId = req.user!.tournamentId!;
  const date = req.query.date ? new Date(req.query.date as string) : new Date();
  
  // 날짜를 한국 시간 기준으로 설정
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  // 활성 체크리스트 템플릿 조회
  const templates = await prisma.checklistTemplate.findMany({
    where: {
      tournamentId,
      isActive: true
    },
    include: {
      items: {
        orderBy: { order: 'asc' }
      }
    }
  });

  // 사용자의 완료 상태 조회
  const userProgress = await prisma.userChecklistItem.findMany({
    where: {
      userId,
      date: {
        gte: date,
        lt: nextDay
      },
      template: {
        tournamentId
      }
    }
  });

  // 진행률 계산
  const progressByTemplate = templates.map(template => {
    const templateProgress = userProgress.filter(p => p.templateId === template.id);
    const totalItems = template.items.length;
    const completedItems = templateProgress.filter(p => p.isChecked).length;

    return {
      templateId: template.id,
      templateName: template.name,
      timeSlot: template.timeSlot,
      category: template.category,
      priority: template.priority,
      totalItems,
      completedItems,
      progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      items: template.items.map(item => ({
        ...item,
        isChecked: templateProgress.find(p => p.itemId === item.id)?.isChecked || false,
        checkedAt: templateProgress.find(p => p.itemId === item.id)?.checkedAt,
        notes: templateProgress.find(p => p.itemId === item.id)?.notes
      }))
    };
  });

  // 전체 진행률
  const totalItems = progressByTemplate.reduce((sum, t) => sum + t.totalItems, 0);
  const totalCompleted = progressByTemplate.reduce((sum, t) => sum + t.completedItems, 0);
  const overallProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  res.json({
    date: date.toISOString().split('T')[0],
    overallProgress,
    totalItems,
    totalCompleted,
    templates: progressByTemplate
  });
}));

// 체크리스트 항목 토글
router.patch('/items/:itemId/toggle', [
  param('itemId').isUUID(),
  body('isChecked').isBoolean(),
  body('notes').optional().isString().isLength({ max: 500 }),
  body('date').optional().isISO8601()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { itemId } = req.params;
  const { isChecked, notes } = req.body;
  const userId = req.user!.id;
  const date = req.body.date ? new Date(req.body.date) : new Date();
  date.setHours(0, 0, 0, 0);

  // 체크리스트 아이템 존재 확인
  const item = await prisma.checklistItem.findFirst({
    where: {
      id: itemId,
      template: {
        tournamentId: req.user!.tournamentId!,
        isActive: true
      }
    },
    include: {
      template: true
    }
  });

  if (!item) {
    throw new CustomError('Checklist item not found', 404);
  }

  // 사용자 체크리스트 항목 업데이트 또는 생성
  const userChecklistItem = await prisma.userChecklistItem.upsert({
    where: {
      userId_itemId_date: {
        userId,
        itemId,
        date
      }
    },
    create: {
      userId,
      templateId: item.templateId,
      itemId,
      isChecked,
      checkedAt: isChecked ? new Date() : null,
      notes: notes || null,
      date
    },
    update: {
      isChecked,
      checkedAt: isChecked ? new Date() : null,
      notes: notes || null
    }
  });

  // 캐시 무효화
  const cacheKey = `checklist_progress:${userId}:${date.toISOString().split('T')[0]}`;
  await cache.del(cacheKey);

  // Socket.IO를 통한 실시간 알림
  const io = req.app.get('io');
  if (io) {
    io.to(`tournament:${req.user!.tournamentId!}`).emit('checklistUpdated', {
      userId,
      itemId,
      templateId: item.templateId,
      isChecked,
      timestamp: new Date().toISOString()
    });
  }

  loggerHelpers.logUserActivity(userId, 'toggle_checklist_item', {
    itemId,
    itemTitle: item.title,
    templateId: item.templateId,
    templateName: item.template.name,
    isChecked,
    date: date.toISOString().split('T')[0]
  });

  res.json({
    message: 'Checklist item updated successfully',
    item: {
      ...userChecklistItem,
      title: item.title,
      description: item.description
    }
  });
}));

// 팀 전체 진행률 조회 (현장 총괄만)
router.get('/team-progress', [
  query('date').optional().isISO8601()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  if (!['FIELD_DIRECTOR', 'ADMIN'].includes(req.user!.role)) {
    throw new CustomError('Access denied. Field Director role required.', 403);
  }

  const tournamentId = req.user!.tournamentId!;
  const date = req.query.date ? new Date(req.query.date as string) : new Date();
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  // 토너먼트 참가자 목록
  const tournamentUsers = await prisma.tournamentUser.findMany({
    where: { tournamentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          avatar: true
        }
      }
    }
  });

  // 전체 체크리스트 아이템 수
  const totalItems = await prisma.checklistItem.count({
    where: {
      template: {
        tournamentId,
        isActive: true
      }
    }
  });

  // 각 사용자별 진행률 계산
  const userProgress = await Promise.all(
    tournamentUsers.map(async (tournamentUser) => {
      const userId = tournamentUser.userId;
      
      const completedItems = await prisma.userChecklistItem.count({
        where: {
          userId,
          isChecked: true,
          date: {
            gte: date,
            lt: nextDay
          },
          template: {
            tournamentId
          }
        }
      });

      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        user: tournamentUser.user,
        role: tournamentUser.role,
        totalItems,
        completedItems,
        progress
      };
    })
  );

  // 전체 팀 평균 진행률
  const totalProgress = userProgress.reduce((sum, user) => sum + user.progress, 0);
  const averageProgress = userProgress.length > 0 
    ? Math.round(totalProgress / userProgress.length) 
    : 0;

  res.json({
    date: date.toISOString().split('T')[0],
    averageProgress,
    totalUsers: userProgress.length,
    userProgress: userProgress.sort((a, b) => b.progress - a.progress)
  });
}));

// 체크리스트 템플릿별 완료율 통계
router.get('/stats/templates', [
  query('date').optional().isISO8601(),
  query('timeSlot').optional().isIn(['MORNING', 'PRODUCTION', 'EVENING'])
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;
  const date = req.query.date ? new Date(req.query.date as string) : new Date();
  const { timeSlot } = req.query;
  
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  const cacheKey = `template_stats:${tournamentId}:${date.toISOString().split('T')[0]}:${timeSlot || 'all'}`;
  let stats = await cache.get(cacheKey);

  if (!stats) {
    const whereClause: any = {
      tournamentId,
      isActive: true
    };

    if (timeSlot) {
      whereClause.timeSlot = timeSlot;
    }

    const templates = await prisma.checklistTemplate.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            userItems: {
              where: {
                date: {
                  gte: date,
                  lt: nextDay
                }
              }
            }
          }
        }
      }
    });

    // 토너먼트 참가자 수
    const totalUsers = await prisma.tournamentUser.count({
      where: { tournamentId }
    });

    stats = templates.map(template => {
      const templateStats = template.items.map(item => {
        const totalAssignments = totalUsers;
        const completedAssignments = item.userItems.filter(ui => ui.isChecked).length;
        const completionRate = totalAssignments > 0 
          ? Math.round((completedAssignments / totalAssignments) * 100) 
          : 0;

        return {
          itemId: item.id,
          title: item.title,
          totalAssignments,
          completedAssignments,
          completionRate
        };
      });

      const totalAssignments = templateStats.reduce((sum, item) => sum + item.totalAssignments, 0);
      const completedAssignments = templateStats.reduce((sum, item) => sum + item.completedAssignments, 0);
      const overallCompletionRate = totalAssignments > 0 
        ? Math.round((completedAssignments / totalAssignments) * 100) 
        : 0;

      return {
        templateId: template.id,
        name: template.name,
        timeSlot: template.timeSlot,
        category: template.category,
        priority: template.priority,
        overallCompletionRate,
        totalItems: template.items.length,
        items: templateStats
      };
    });

    // 10분간 캐시
    await cache.set(cacheKey, stats, 600);
  }

  res.json({
    date: date.toISOString().split('T')[0],
    timeSlot: timeSlot || 'all',
    templates: stats
  });
}));

// 미완료 체크리스트 알림 조회
router.get('/pending-items', [
  query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  query('timeSlot').optional().isIn(['MORNING', 'PRODUCTION', 'EVENING'])
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const tournamentId = req.user!.tournamentId!;
  const { priority, timeSlot } = req.query;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const whereClause: any = {
    template: {
      tournamentId,
      isActive: true
    }
  };

  if (priority) {
    whereClause.template.priority = priority;
  }

  if (timeSlot) {
    whereClause.template.timeSlot = timeSlot;
  }

  // 모든 활성 체크리스트 아이템 조회
  const allItems = await prisma.checklistItem.findMany({
    where: whereClause,
    include: {
      template: {
        select: {
          id: true,
          name: true,
          timeSlot: true,
          priority: true
        }
      }
    }
  });

  // 사용자의 완료 상태 조회
  const userItems = await prisma.userChecklistItem.findMany({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow
      },
      template: {
        tournamentId
      }
    }
  });

  // 미완료 아이템 필터링
  const pendingItems = allItems.filter(item => {
    const userItem = userItems.find(ui => ui.itemId === item.id);
    return !userItem || !userItem.isChecked;
  }).map(item => ({
    ...item,
    template: item.template
  }));

  // 우선순위별 그룹화
  const groupedByPriority = pendingItems.reduce((acc, item) => {
    const priority = item.template.priority;
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  res.json({
    date: today.toISOString().split('T')[0],
    totalPending: pendingItems.length,
    byPriority: groupedByPriority,
    items: pendingItems.sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.template.priority] - priorityOrder[a.template.priority];
    })
  });
}));

export default router;