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

// 메시지 목록 조회
router.get('/messages', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['GENERAL', 'BROADCAST', 'EMERGENCY', 'TEMPLATE']),
  query('unreadOnly').optional().isBoolean()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, type, unreadOnly } = req.query;
  const userId = req.user!.id;
  
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const whereClause: any = {
    OR: [
      { recipientId: userId },
      { recipientId: null, type: 'BROADCAST' }
    ]
  };

  if (type) {
    whereClause.type = type;
  }

  if (unreadOnly === 'true') {
    whereClause.isRead = false;
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        },
        files: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            url: true,
            size: true
          }
        }
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.message.count({ where: whereClause })
  ]);

  res.json({
    messages,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// 메시지 전송
router.post('/messages', [
  body('recipientId').optional().isUUID(),
  body('type').optional().isIn(['GENERAL', 'BROADCAST', 'EMERGENCY']),
  body('subject').optional().isString().isLength({ max: 200 }),
  body('content').isString().isLength({ min: 1, max: 2000 }),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { recipientId, type = 'GENERAL', subject, content, priority = 'MEDIUM' } = req.body;
  const senderId = req.user!.id;
  const tournamentId = req.user!.tournamentId!;

  // 수신자 확인 (개별 메시지인 경우)
  if (recipientId) {
    const recipient = await prisma.user.findFirst({
      where: {
        id: recipientId,
        tournaments: {
          some: {
            tournamentId
          }
        }
      }
    });

    if (!recipient) {
      throw new CustomError('Recipient not found in this tournament', 404);
    }
  }

  // 브로드캐스트 메시지는 현장 총괄만 전송 가능
  if (type === 'BROADCAST' && !['FIELD_DIRECTOR', 'ADMIN'].includes(req.user!.role)) {
    throw new CustomError('Only field directors can send broadcast messages', 403);
  }

  // 긴급 메시지는 긴급 상황이 있을 때만 전송 가능
  if (type === 'EMERGENCY') {
    const activeEmergency = await prisma.emergency.findFirst({
      where: {
        tournamentId,
        status: 'ACTIVE'
      }
    });

    if (!activeEmergency && !['FIELD_DIRECTOR', 'ADMIN'].includes(req.user!.role)) {
      throw new CustomError('Emergency messages can only be sent when there is an active emergency', 403);
    }
  }

  const message = await prisma.message.create({
    data: {
      senderId,
      recipientId,
      type,
      subject,
      content,
      priority
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true
        }
      }
    }
  });

  // Socket.IO를 통한 실시간 메시지 전송
  const io = req.app.get('io');
  if (io) {
    if (recipientId) {
      // 개별 메시지
      io.to(`user:${recipientId}`).emit('newMessage', message);
    } else if (type === 'BROADCAST') {
      // 브로드캐스트 메시지
      io.to(`tournament:${tournamentId}`).emit('newMessage', message);
    }
  }

  loggerHelpers.logUserActivity(senderId, 'send_message', {
    messageId: message.id,
    recipientId,
    type,
    priority,
    isBroadcast: !recipientId
  });

  res.status(201).json({
    message: 'Message sent successfully',
    data: message
  });
}));

// 메시지 읽음 처리
router.patch('/messages/:messageId/read', [
  param('messageId').isUUID()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { messageId } = req.params;
  const userId = req.user!.id;

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      OR: [
        { recipientId: userId },
        { recipientId: null, type: 'BROADCAST' }
      ]
    }
  });

  if (!message) {
    throw new CustomError('Message not found', 404);
  }

  if (!message.isRead) {
    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true }
    });
  }

  res.json({ message: 'Message marked as read' });
}));

// 메시지 템플릿 목록 조회
router.get('/templates', [
  query('category').optional().isString(),
  query('search').optional().isString()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { category, search } = req.query;

  const whereClause: any = {
    isTemplate: true
  };

  if (category) {
    whereClause.category = category;
  }

  if (search) {
    whereClause.OR = [
      { subject: { contains: search as string, mode: 'insensitive' } },
      { content: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const templates = await prisma.message.findMany({
    where: whereClause,
    select: {
      id: true,
      subject: true,
      content: true,
      category: true,
      priority: true,
      createdAt: true
    },
    orderBy: [
      { category: 'asc' },
      { subject: 'asc' }
    ]
  });

  // 카테고리별 그룹화
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, any[]>);

  res.json({
    templates,
    groupedByCategory: groupedTemplates,
    categories: Object.keys(groupedTemplates)
  });
}));

// 메시지 템플릿 생성
router.post('/templates', [
  body('subject').isString().isLength({ min: 1, max: 200 }),
  body('content').isString().isLength({ min: 1, max: 2000 }),
  body('category').optional().isString().isLength({ max: 50 }),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { subject, content, category, priority = 'MEDIUM' } = req.body;
  const senderId = req.user!.id;

  const template = await prisma.message.create({
    data: {
      senderId,
      subject,
      content,
      category,
      priority,
      isTemplate: true
    }
  });

  loggerHelpers.logUserActivity(senderId, 'create_message_template', {
    templateId: template.id,
    category,
    priority
  });

  res.status(201).json({
    message: 'Template created successfully',
    template
  });
}));

// 연락처 목록 조회
router.get('/contacts', [
  query('role').optional().isString(),
  query('search').optional().isString()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { role, search } = req.query;
  const tournamentId = req.user!.tournamentId!;

  const whereClause: any = {
    tournamentId,
    user: {
      isActive: true
    }
  };

  if (role) {
    whereClause.role = role;
  }

  if (search) {
    whereClause.user.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const contacts = await prisma.tournamentUser.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          phone: true,
          lastLogin: true
        }
      }
    },
    orderBy: { user: { name: 'asc' } }
  });

  // 온라인 상태 확인
  const onlineUserIds = [];
  const onlineKeys = await cache.keys('online:*');
  for (const key of onlineKeys) {
    const userData = await cache.get(key);
    if (userData && userData.tournamentId === tournamentId) {
      onlineUserIds.push(userData.userId || key.split(':')[1]);
    }
  }

  const contactsWithStatus = contacts.map(contact => ({
    ...contact,
    isOnline: onlineUserIds.includes(contact.user.id)
  }));

  // 역할별 그룹화
  const groupedByRole = contactsWithStatus.reduce((acc, contact) => {
    const role = contact.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(contact);
    return acc;
  }, {} as Record<string, any[]>);

  res.json({
    contacts: contactsWithStatus,
    groupedByRole,
    onlineCount: contactsWithStatus.filter(c => c.isOnline).length,
    totalCount: contactsWithStatus.length
  });
}));

// 빠른 연락처 조회 (자주 연락하는 사람들)
router.get('/contacts/frequent', catchAsync(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user!.id;
  const tournamentId = req.user!.tournamentId!;

  // 최근 30일 내 메시지를 주고받은 상대방 조회
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const frequentContacts = await prisma.message.groupBy({
    by: ['recipientId'],
    where: {
      senderId,
      recipientId: { not: null },
      createdAt: { gte: thirtyDaysAgo }
    },
    _count: {
      recipientId: true
    },
    orderBy: {
      _count: {
        recipientId: 'desc'
      }
    },
    take: 10
  });

  // 사용자 정보 조회
  const userIds = frequentContacts.map(fc => fc.recipientId).filter(Boolean) as string[];
  
  if (userIds.length === 0) {
    return res.json({ contacts: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      tournaments: {
        some: { tournamentId }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true
    }
  });

  // 온라인 상태 확인
  const onlineKeys = await cache.keys('online:*');
  const onlineUserIds = [];
  for (const key of onlineKeys) {
    const userData = await cache.get(key);
    if (userData && userData.tournamentId === tournamentId) {
      onlineUserIds.push(userData.userId || key.split(':')[1]);
    }
  }

  const contactsWithFrequency = users.map(user => {
    const frequency = frequentContacts.find(fc => fc.recipientId === user.id)?._count.recipientId || 0;
    return {
      ...user,
      messageCount: frequency,
      isOnline: onlineUserIds.includes(user.id)
    };
  }).sort((a, b) => b.messageCount - a.messageCount);

  res.json({
    contacts: contactsWithFrequency,
    period: '30 days'
  });
}));

// 읽지 않은 메시지 수 조회
router.get('/unread-count', catchAsync(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const unreadCount = await prisma.message.count({
    where: {
      OR: [
        { recipientId: userId },
        { recipientId: null, type: 'BROADCAST' }
      ],
      isRead: false
    }
  });

  // 타입별 읽지 않은 메시지 수
  const unreadByType = await prisma.message.groupBy({
    by: ['type'],
    where: {
      OR: [
        { recipientId: userId },
        { recipientId: null, type: 'BROADCAST' }
      ],
      isRead: false
    },
    _count: {
      type: true
    }
  });

  const unreadStats = unreadByType.reduce((acc, item) => {
    acc[item.type] = item._count.type;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    total: unreadCount,
    byType: unreadStats
  });
}));

export default router;