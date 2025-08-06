import express from 'express';
import { param, body, query, validationResult } from 'express-validator';
import { prisma } from '@/database/connection';
import { cache } from '@/database/redis';
import { logger, loggerHelpers } from '@/utils/logger';
import { AuthenticatedRequest, roleMiddleware } from '@/middleware/auth';
import { catchAsync, CustomError } from '@/middleware/errorHandler';

const router = express.Router();

// 사용자 목록 조회 (관리자만)
router.get('/', roleMiddleware('ADMIN', 'FIELD_DIRECTOR'), catchAsync(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, search, role, isActive } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ];
  }
  
  if (role) {
    whereClause.role = role;
  }
  
  if (isActive !== undefined) {
    whereClause.isActive = isActive === 'true';
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where: whereClause })
  ]);

  res.json({
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// 특정 사용자 조회
router.get('/:userId', [
  param('userId').isUUID()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;

  // 본인이거나 관리자만 조회 가능
  if (userId !== currentUserId && !['ADMIN', 'FIELD_DIRECTOR'].includes(req.user!.role)) {
    throw new CustomError('Access denied', 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      phone: true,
      timezone: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      tournaments: {
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              location: true,
              status: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.json({ user });
}));

// 사용자 정보 수정
router.put('/:userId', [
  param('userId').isUUID(),
  body('name').optional().isLength({ min: 2, max: 50 }).trim(),
  body('phone').optional().isMobilePhone('any'),
  body('timezone').optional().isString(),
  body('avatar').optional().isURL()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { userId } = req.params;
  const currentUserId = req.user!.id;
  const { name, phone, timezone, avatar } = req.body;

  // 본인이거나 관리자만 수정 가능
  if (userId !== currentUserId && !['ADMIN', 'FIELD_DIRECTOR'].includes(req.user!.role)) {
    throw new CustomError('Access denied', 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(timezone && { timezone }),
      ...(avatar && { avatar })
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      phone: true,
      timezone: true,
      isActive: true,
      updatedAt: true
    }
  });

  loggerHelpers.logUserActivity(currentUserId, 'update_user_profile', {
    targetUserId: userId,
    updatedFields: Object.keys({ name, phone, timezone, avatar }).filter(key => 
      req.body[key] !== undefined
    )
  });

  res.json({
    message: 'User updated successfully',
    user: updatedUser
  });
}));

// 사용자 비활성화/활성화 (관리자만)
router.patch('/:userId/status', [
  param('userId').isUUID(),
  body('isActive').isBoolean()
], roleMiddleware('ADMIN', 'FIELD_DIRECTOR'), catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { userId } = req.params;
  const { isActive } = req.body;
  const currentUserId = req.user!.id;

  if (userId === currentUserId) {
    throw new CustomError('Cannot change your own status', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true
    }
  });

  loggerHelpers.logUserActivity(currentUserId, isActive ? 'activate_user' : 'deactivate_user', {
    targetUserId: userId,
    targetUserName: user.name
  });

  res.json({
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    user: updatedUser
  });
}));

// 사용자 삭제 (관리자만)
router.delete('/:userId', [
  param('userId').isUUID()
], roleMiddleware('ADMIN'), catchAsync(async (req: AuthenticatedRequest, res) => {
  const { userId } = req.params;
  const currentUserId = req.user!.id;

  if (userId === currentUserId) {
    throw new CustomError('Cannot delete your own account', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // 사용자 삭제 (관련 데이터는 Cascade로 처리됨)
  await prisma.user.delete({
    where: { id: userId }
  });

  loggerHelpers.logUserActivity(currentUserId, 'delete_user', {
    targetUserId: userId,
    targetUserName: user.name,
    targetUserEmail: user.email
  });

  res.json({
    message: 'User deleted successfully'
  });
}));

// 사용자 통계 (관리자만)
router.get('/stats/overview', roleMiddleware('ADMIN', 'FIELD_DIRECTOR'), catchAsync(async (req: AuthenticatedRequest, res) => {
  const cacheKey = 'user_stats_overview';
  let stats = await cache.get(cacheKey);

  if (!stats) {
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentLogins
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24시간 이내
          }
        }
      })
    ]);

    stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      recentLogins,
      byRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>)
    };

    // 5분간 캐시
    await cache.set(cacheKey, stats, 300);
  }

  res.json({ stats });
}));

export default router;