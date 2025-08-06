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

// 팀 목록 조회
router.get('/', catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;
  
  // 캐시에서 먼저 확인
  const cacheKey = `teams:${tournamentId}`;
  let teams = await cache.get(cacheKey);

  if (!teams) {
    teams = await prisma.team.findMany({
      where: { tournamentId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // 5분간 캐시
    await cache.set(cacheKey, teams, 300);
  }

  loggerHelpers.logUserActivity(req.user!.id, 'view_teams', { 
    tournamentId,
    teamCount: teams.length 
  });

  res.json({ teams });
}));

// 특정 팀 조회
router.get('/:teamId', [
  param('teamId').isUUID()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Invalid team ID format', 400);
  }

  const { teamId } = req.params;
  const tournamentId = req.user!.tournamentId!;

  const team = await prisma.team.findFirst({
    where: { 
      id: teamId,
      tournamentId
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone: true,
              role: true,
              lastLogin: true
            }
          }
        },
        orderBy: { position: 'asc' }
      }
    }
  });

  if (!team) {
    throw new CustomError('Team not found', 404);
  }

  res.json({ team });
}));

// 팀원 상태 업데이트
router.patch('/members/:memberId/status', [
  param('memberId').isUUID(),
  body('status').isIn(['ACTIVE', 'BREAK', 'OFFLINE', 'EMERGENCY'])
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { memberId } = req.params;
  const { status } = req.body;
  const userId = req.user!.id;

  // 팀원 정보 확인 (권한 체크 포함)
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      id: memberId,
      team: {
        tournamentId: req.user!.tournamentId!
      }
    },
    include: {
      user: {
        select: { id: true, name: true }
      },
      team: {
        select: { id: true, name: true }
      }
    }
  });

  if (!teamMember) {
    throw new CustomError('Team member not found', 404);
  }

  // 본인이거나 현장 총괄만 다른 사람 상태 변경 가능
  if (teamMember.userId !== userId && req.user!.role !== 'FIELD_DIRECTOR') {
    throw new CustomError('Not authorized to update this member status', 403);
  }

  // 상태 업데이트
  const updatedMember = await prisma.teamMember.update({
    where: { id: memberId },
    data: { status },
    include: {
      user: {
        select: { id: true, name: true }
      }
    }
  });

  // 캐시 무효화
  await cache.del(`teams:${req.user!.tournamentId!}`);

  // Socket.IO를 통한 실시간 알림
  const io = req.app.get('io');
  if (io) {
    io.to(`tournament:${req.user!.tournamentId!}`).emit('teamMemberStatusChanged', {
      memberId,
      userId: teamMember.userId,
      status,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });
  }

  loggerHelpers.logUserActivity(userId, 'update_team_member_status', {
    memberId,
    targetUserId: teamMember.userId,
    oldStatus: teamMember.status,
    newStatus: status,
    teamId: teamMember.team.id
  });

  res.json({
    message: 'Team member status updated successfully',
    member: updatedMember
  });
}));

// 팀원 상태 통계 조회
router.get('/stats/members', catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;

  const cacheKey = `team_stats:${tournamentId}`;
  let stats = await cache.get(cacheKey);

  if (!stats) {
    const memberStats = await prisma.teamMember.groupBy({
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

    const totalMembers = await prisma.teamMember.count({
      where: {
        team: {
          tournamentId
        }
      }
    });

    stats = {
      total: totalMembers,
      byStatus: memberStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<string, number>)
    };

    // 1분간 캐시
    await cache.set(cacheKey, stats, 60);
  }

  res.json({ stats });
}));

// 온라인 팀원 목록 조회
router.get('/online/members', catchAsync(async (req: AuthenticatedRequest, res) => {
  const tournamentId = req.user!.tournamentId!;

  // Redis에서 온라인 사용자 확인
  const onlineKeys = await cache.keys('online:*');
  const onlineUserIds = [];

  for (const key of onlineKeys) {
    const userData = await cache.get(key);
    if (userData && userData.tournamentId === tournamentId) {
      onlineUserIds.push(userData.userId || key.split(':')[1]);
    }
  }

  // 온라인 팀원 정보 조회
  const onlineMembers = await prisma.teamMember.findMany({
    where: {
      userId: { in: onlineUserIds },
      team: { tournamentId }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true
        }
      },
      team: {
        select: {
          id: true,
          name: true,
          color: true
        }
      }
    }
  });

  res.json({
    onlineMembers,
    totalOnline: onlineMembers.length,
    lastUpdated: new Date().toISOString()
  });
}));

// 팀별 업무 진행률 조회
router.get('/:teamId/progress', [
  param('teamId').isUUID()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { teamId } = req.params;
  const tournamentId = req.user!.tournamentId!;

  // 팀 존재 확인
  const team = await prisma.team.findFirst({
    where: { id: teamId, tournamentId }
  });

  if (!team) {
    throw new CustomError('Team not found', 404);
  }

  // 팀원들의 체크리스트 진행률 계산
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: { id: true, name: true }
      }
    }
  });

  const memberIds = teamMembers.map(member => member.userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 체크리스트 진행률
  const checklistProgress = await Promise.all(
    memberIds.map(async (userId) => {
      const totalItems = await prisma.checklistItem.count({
        where: {
          template: {
            tournamentId,
            isActive: true
          }
        }
      });

      const completedItems = await prisma.userChecklistItem.count({
        where: {
          userId,
          isChecked: true,
          date: {
            gte: today
          },
          template: {
            tournamentId
          }
        }
      });

      const user = teamMembers.find(m => m.userId === userId)?.user;
      return {
        userId,
        userName: user?.name,
        totalItems,
        completedItems,
        progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
      };
    })
  );

  // 팀 전체 평균 진행률
  const totalProgress = checklistProgress.reduce((sum, member) => sum + member.progress, 0);
  const averageProgress = checklistProgress.length > 0 
    ? Math.round(totalProgress / checklistProgress.length) 
    : 0;

  res.json({
    team: {
      id: teamId,
      name: team.name
    },
    averageProgress,
    memberProgress: checklistProgress,
    lastUpdated: new Date().toISOString()
  });
}));

// 팀 검색 (이름, 역할로 검색)
router.get('/search', [
  query('q').optional().isLength({ min: 1, max: 50 }),
  query('status').optional().isIn(['ACTIVE', 'BREAK', 'OFFLINE', 'EMERGENCY']),
  query('role').optional().isString()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Invalid search parameters', 400);
  }

  const { q, status, role } = req.query;
  const tournamentId = req.user!.tournamentId!;

  const whereClause: any = {
    team: { tournamentId }
  };

  // 상태 필터
  if (status) {
    whereClause.status = status;
  }

  // 이름 또는 역할 검색
  if (q) {
    whereClause.OR = [
      {
        user: {
          name: {
            contains: q as string,
            mode: 'insensitive'
          }
        }
      },
      {
        position: {
          contains: q as string,
          mode: 'insensitive'
        }
      }
    ];
  }

  // 역할 필터
  if (role) {
    whereClause.user = {
      ...whereClause.user,
      role: role
    };
  }

  const searchResults = await prisma.teamMember.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          lastLogin: true
        }
      },
      team: {
        select: {
          id: true,
          name: true,
          color: true
        }
      }
    },
    take: 50, // 최대 50개 결과
    orderBy: [
      { status: 'asc' },
      { user: { name: 'asc' } }
    ]
  });

  loggerHelpers.logUserActivity(req.user!.id, 'search_team_members', {
    query: q,
    status,
    role,
    resultCount: searchResults.length
  });

  res.json({
    results: searchResults,
    totalFound: searchResults.length,
    query: { q, status, role }
  });
}));

export default router;