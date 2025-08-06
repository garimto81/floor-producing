import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '@/utils/logger';
import { redisClient } from '@/database/redis';
import { prisma } from '@/database/connection';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tournamentId?: string;
  userRole?: string;
}

interface SocketData {
  userId: string;
  tournamentId: string;
  userRole: string;
  lastActivity: Date;
}

// 연결된 사용자 관리
const connectedUsers = new Map<string, SocketData>();

export function setupSocketHandlers(io: Server) {
  // JWT 인증 미들웨어
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // 사용자 정보 조회
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          tournaments: {
            include: {
              tournament: true
            }
          }
        }
      });

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      // 현재 활성 토너먼트 찾기
      const activeTournament = user.tournaments.find(
        tu => tu.tournament.status === 'ACTIVE'
      );

      if (!activeTournament) {
        return next(new Error('No active tournament found'));
      }

      socket.userId = user.id;
      socket.tournamentId = activeTournament.tournamentId;
      socket.userRole = activeTournament.role;

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // 연결 처리
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const tournamentId = socket.tournamentId!;
    const userRole = socket.userRole!;

    logger.info(`User ${userId} connected to tournament ${tournamentId}`);

    // 토너먼트 룸에 참가
    await socket.join(`tournament:${tournamentId}`);
    await socket.join(`user:${userId}`);

    // 연결된 사용자 목록에 추가
    connectedUsers.set(socket.id, {
      userId,
      tournamentId,
      userRole,
      lastActivity: new Date()
    });

    // Redis에 사용자 온라인 상태 저장
    await redisClient.setex(`online:${userId}`, 300, JSON.stringify({
      socketId: socket.id,
      tournamentId,
      lastSeen: new Date().toISOString()
    }));

    // 다른 사용자들에게 온라인 상태 알림
    socket.to(`tournament:${tournamentId}`).emit('userOnline', {
      userId,
      timestamp: new Date().toISOString()
    });

    // 현재 온라인 사용자 목록 전송
    const onlineUsers = await getOnlineUsers(tournamentId);
    socket.emit('onlineUsers', onlineUsers);

    // 실시간 이벤트 핸들러들
    handleProductionEvents(socket);
    handleChecklistEvents(socket);
    handleTeamEvents(socket);
    handleCommunicationEvents(socket);
    handleEmergencyEvents(socket);

    // 연결 해제 처리
    socket.on('disconnect', async () => {
      logger.info(`User ${userId} disconnected from tournament ${tournamentId}`);

      // 연결된 사용자 목록에서 제거
      connectedUsers.delete(socket.id);

      // Redis에서 온라인 상태 제거
      await redisClient.del(`online:${userId}`);

      // 다른 사용자들에게 오프라인 상태 알림
      socket.to(`tournament:${tournamentId}`).emit('userOffline', {
        userId,
        timestamp: new Date().toISOString()
      });
    });

    // 활동 감지 (heartbeat)
    socket.on('heartbeat', async () => {
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        userData.lastActivity = new Date();
        await redisClient.setex(`online:${userId}`, 300, JSON.stringify({
          socketId: socket.id,
          tournamentId,
          lastSeen: new Date().toISOString()
        }));
      }
    });
  });

  // 주기적으로 비활성 연결 정리
  setInterval(async () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const [socketId, userData] of connectedUsers.entries()) {
      if (userData.lastActivity < fiveMinutesAgo) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect();
        }
        connectedUsers.delete(socketId);
      }
    }
  }, 60000); // 1분마다 정리
}

// 프로덕션 관련 이벤트
function handleProductionEvents(socket: AuthenticatedSocket) {
  const tournamentId = socket.tournamentId!;

  socket.on('productionStatusUpdate', async (data) => {
    try {
      // 프로덕션 상태 업데이트
      await prisma.productionStatus.upsert({
        where: { tournamentId },
        create: {
          tournamentId,
          ...data
        },
        update: data
      });

      // 모든 사용자에게 브로드캐스트
      socket.to(`tournament:${tournamentId}`).emit('productionStatusChanged', {
        ...data,
        timestamp: new Date().toISOString()
      });

      logger.info(`Production status updated for tournament ${tournamentId}:`, data);
    } catch (error) {
      logger.error('Error updating production status:', error);
      socket.emit('error', { message: 'Failed to update production status' });
    }
  });
}

// 체크리스트 관련 이벤트
function handleChecklistEvents(socket: AuthenticatedSocket) {
  const userId = socket.userId!;
  const tournamentId = socket.tournamentId!;

  socket.on('checklistItemToggle', async (data) => {
    try {
      const { itemId, isChecked, date } = data;

      await prisma.userChecklistItem.upsert({
        where: {
          userId_itemId_date: {
            userId,
            itemId,
            date: new Date(date)
          }
        },
        create: {
          userId,
          templateId: data.templateId,
          itemId,
          isChecked,
          checkedAt: isChecked ? new Date() : null,
          date: new Date(date)
        },
        update: {
          isChecked,
          checkedAt: isChecked ? new Date() : null
        }
      });

      // 팀원들에게 체크리스트 업데이트 알림
      socket.to(`tournament:${tournamentId}`).emit('checklistUpdated', {
        userId,
        itemId,
        isChecked,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error updating checklist item:', error);
      socket.emit('error', { message: 'Failed to update checklist item' });
    }
  });
}

// 팀 관련 이벤트
function handleTeamEvents(socket: AuthenticatedSocket) {
  const userId = socket.userId!;
  const tournamentId = socket.tournamentId!;

  socket.on('teamMemberStatusUpdate', async (data) => {
    try {
      const { status } = data;

      await prisma.teamMember.updateMany({
        where: { userId },
        data: { status }
      });

      // 팀원 상태 변경 알림
      socket.to(`tournament:${tournamentId}`).emit('teamMemberStatusChanged', {
        userId,
        status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error updating team member status:', error);
      socket.emit('error', { message: 'Failed to update team member status' });
    }
  });
}

// 커뮤니케이션 관련 이벤트
function handleCommunicationEvents(socket: AuthenticatedSocket) {
  const userId = socket.userId!;

  socket.on('sendMessage', async (data) => {
    try {
      const { recipientId, content, type, priority } = data;

      const message = await prisma.message.create({
        data: {
          senderId: userId,
          recipientId,
          content,
          type: type || 'GENERAL',
          priority: priority || 'MEDIUM'
        },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true }
          }
        }
      });

      // 수신자에게 메시지 전송
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit('newMessage', message);
      } else {
        // 전체 브로드캐스트
        socket.broadcast.emit('newMessage', message);
      }

    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
}

// 긴급 상황 관련 이벤트
function handleEmergencyEvents(socket: AuthenticatedSocket) {
  const userId = socket.userId!;
  const tournamentId = socket.tournamentId!;

  socket.on('emergencyAlert', async (data) => {
    try {
      const { type, severity, title, description } = data;

      const emergency = await prisma.emergency.create({
        data: {
          tournamentId,
          userId,
          type,
          severity: severity || 'HIGH',
          title,
          description
        },
        include: {
          user: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      // 모든 사용자에게 긴급 알림 브로드캐스트
      socket.to(`tournament:${tournamentId}`).emit('emergencyAlert', {
        ...emergency,
        timestamp: new Date().toISOString()
      });

      logger.warn(`Emergency alert created by user ${userId}:`, emergency);

    } catch (error) {
      logger.error('Error creating emergency alert:', error);
      socket.emit('error', { message: 'Failed to create emergency alert' });
    }
  });
}

// 온라인 사용자 목록 조회
async function getOnlineUsers(tournamentId: string): Promise<string[]> {
  const keys = await redisClient.keys('online:*');
  const onlineUsers: string[] = [];

  for (const key of keys) {
    const data = await redisClient.get(key);
    if (data) {
      const userData = JSON.parse(data);
      if (userData.tournamentId === tournamentId) {
        onlineUsers.push(userData.socketId.split(':')[1]); // userId 추출
      }
    }
  }

  return onlineUsers;
}