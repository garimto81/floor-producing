import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '@/database/connection';
import { redisClient } from '@/database/redis';
import { logger } from '@/utils/logger';
import { refreshTokenMiddleware, AuthenticatedRequest } from '@/middleware/auth';

const router = express.Router();

// JWT 토큰 생성
function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
}

// 회원가입
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').isLength({ min: 2, max: 50 }).trim(),
  body('phone').optional().isMobilePhone('any'),
  body('role').optional().isIn(['FIELD_DIRECTOR', 'FIELD_MEMBER', 'HQ_MANAGER', 'TECHNICAL_SUPPORT'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password, name, phone, role = 'FIELD_MEMBER' } = req.body;

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // 비밀번호 해싱
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true
      }
    });

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// 로그인
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
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
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 토큰 생성
    const { accessToken, refreshToken } = generateTokens(user.id);

    // 리프레시 토큰을 Redis에 저장
    await redisClient.setex(
      `refresh:${user.id}`, 
      30 * 24 * 60 * 60, // 30일
      refreshToken
    );

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // 현재 활성 토너먼트 정보
    const activeTournament = user.tournaments[0];

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        tournament: activeTournament ? {
          id: activeTournament.tournament.id,
          name: activeTournament.tournament.name,
          role: activeTournament.role
        } : null
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// 토큰 갱신
router.post('/refresh', refreshTokenMiddleware, async (req, res) => {
  try {
    const user = req.body.user;

    // 새 토큰 생성
    const { accessToken, refreshToken } = generateTokens(user.id);

    // 새 리프레시 토큰을 Redis에 저장
    await redisClient.setex(
      `refresh:${user.id}`, 
      30 * 24 * 60 * 60,
      refreshToken
    );

    res.json({
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed.' });
  }
});

// 로그아웃
router.post('/logout', async (req: AuthenticatedRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7); // "Bearer " 제거

    if (token) {
      // 토큰을 블랙리스트에 추가
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redisClient.setex(`blacklist:${token}`, ttl, 'true');
        }
      }
    }

    // 리프레시 토큰 제거
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any;
        await redisClient.del(`refresh:${decoded.userId}`);
      } catch (error) {
        // 리프레시 토큰이 유효하지 않아도 로그아웃은 성공
      }
    }

    res.json({ message: 'Logout successful' });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed.' });
  }
});

// 비밀번호 변경
router.post('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // 새 비밀번호 해싱
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    logger.info(`Password changed for user: ${user.email}`);

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// 프로필 조회
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
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
          where: {
            tournament: {
              status: 'ACTIVE'
            }
          },
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
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile.' });
  }
});

export default router;