import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Prisma 클라이언트 초기화
const prisma = new PrismaClient();

// JWT 시크릿 설정
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { query, method } = req;
  const path = Array.isArray(query.path) ? query.path.join('/') : query.path || '';

  try {
    // 라우팅 처리
    if (method === 'GET' && path === 'health') {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'WSOP Field Director Pro Backend is running on Vercel!',
        environment: process.env.NODE_ENV || 'production'
      });
    }

    if (method === 'GET' && (path === '' || path === 'index')) {
      return res.status(200).json({
        name: 'WSOP Field Director Pro - Backend API',
        version: '1.0.0',
        status: 'running',
        platform: 'Vercel Serverless',
        endpoints: {
          health: '/api/health',
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          profile: 'GET /api/auth/profile',
          users: 'GET /api/users'
        }
      });
    }

    if (method === 'POST' && path === 'auth/register') {
      const { email, password, name, role = 'FIELD_MEMBER' } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      // 이메일 중복 확인
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 12);

      // 사용자 생성
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, role },
        select: { id: true, email: true, name: true, role: true, createdAt: true }
      });

      return res.status(201).json({
        message: 'User registered successfully',
        user
      });
    }

    if (method === 'POST' && path === 'auth/login') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // 사용자 조회
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // JWT 토큰 생성
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // 마지막 로그인 시간 업데이트
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      });
    }

    if (method === 'GET' && path === 'db-status') {
      const userCount = await prisma.user.count();
      return res.status(200).json({
        status: 'connected',
        database: 'Prisma with PostgreSQL',
        userCount,
        timestamp: new Date().toISOString()
      });
    }

    // 404 - 라우트를 찾을 수 없음
    return res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${method} /api/${path}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Unknown error occurred'
    });
  }
}