import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/connection';
import { redisClient } from '../database/redis';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    tournamentId?: string;
  };
}

// JWT 토큰 검증 미들웨어
export async function authMiddleware(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided or invalid format.' 
      });
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // 토큰 블랙리스트 확인
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked.' });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tournaments: {
          where: {
            tournament: {
              status: 'ACTIVE'
            }
          },
          include: {
            tournament: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    // 현재 활성 토너먼트 정보 추가
    const activeTournament = user.tournaments[0];
    
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: activeTournament?.role || 'FIELD_MEMBER',
      tournamentId: activeTournament?.tournamentId
    };

    // 마지막 로그인 시간 업데이트 (비동기)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(error => {
      logger.error('Failed to update last login:', error);
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired.' });
    }
    
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// 역할 기반 접근 제어
export function roleMiddleware(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
}

// 관리자 권한 확인
export const adminOnly = roleMiddleware('ADMIN', 'FIELD_DIRECTOR');

// 현장 스태프 권한 확인
export const fieldStaffOnly = roleMiddleware(
  'ADMIN', 
  'FIELD_DIRECTOR', 
  'FIELD_MEMBER'
);

// 토너먼트 참가자 확인
export async function tournamentMemberMiddleware(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    const tournamentId = req.params.tournamentId || req.user?.tournamentId;
    
    if (!tournamentId) {
      return res.status(400).json({ error: 'Tournament ID is required.' });
    }

    if (!req.user?.tournamentId || req.user.tournamentId !== tournamentId) {
      return res.status(403).json({ 
        error: 'Access denied. Not a member of this tournament.' 
      });
    }

    next();
  } catch (error) {
    logger.error('Tournament member middleware error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// 리프레시 토큰 검증
export async function refreshTokenMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required.' });
    }

    // 리프레시 토큰 검증
    const decoded = jwt.verify(
      refreshToken, 
      process.env.REFRESH_TOKEN_SECRET!
    ) as any;

    // Redis에서 저장된 리프레시 토큰 확인
    const storedToken = await redisClient.get(`refresh:${decoded.userId}`);
    if (storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid user.' });
    }

    req.body.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Refresh token expired.' });
    }
    
    logger.error('Refresh token middleware error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}