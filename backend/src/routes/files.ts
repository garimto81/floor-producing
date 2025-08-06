import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { param, query, validationResult } from 'express-validator';
import { prisma } from '@/database/connection';
import { logger, loggerHelpers } from '@/utils/logger';
import { AuthenticatedRequest, tournamentMemberMiddleware } from '@/middleware/auth';
import { catchAsync, CustomError } from '@/middleware/errorHandler';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 모든 라우트에 토너먼트 멤버 확인 미들웨어 적용
router.use(tournamentMemberMiddleware);

// 업로드 디렉토리 확인/생성
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정 (로컬 파일 시스템)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadDir, 'files');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 허용된 파일 타입
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10 // 최대 10개 파일
  }
});

// 단일 파일 업로드
router.post('/upload', upload.single('file'), catchAsync(async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    throw new CustomError('No file uploaded', 400);
  }

  const { messageId } = req.body;
  const userId = req.user!.id;

  // 메시지 ID가 제공된 경우 메시지 존재 확인
  if (messageId) {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: userId },
          { recipientId: userId },
          { recipientId: null, type: 'BROADCAST' }
        ]
      }
    });

    if (!message) {
      // 업로드된 파일 삭제
      fs.unlinkSync(req.file.path);
      throw new CustomError('Message not found or access denied', 404);
    }
  }

  // 파일 정보를 데이터베이스에 저장
  const fileRecord = await prisma.file.create({
    data: {
      messageId: messageId || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/api/files/${req.file.filename}`,
      uploadedBy: userId
    }
  });

  loggerHelpers.logUserActivity(userId, 'file_upload', {
    fileId: fileRecord.id,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
    messageId
  });

  res.status(201).json({
    message: 'File uploaded successfully',
    file: {
      id: fileRecord.id,
      filename: fileRecord.filename,
      originalName: fileRecord.originalName,
      mimetype: fileRecord.mimetype,
      size: fileRecord.size,
      url: fileRecord.url,
      createdAt: fileRecord.createdAt
    }
  });
}));

// 다중 파일 업로드
router.post('/upload-multiple', upload.array('files', 10), catchAsync(async (req: AuthenticatedRequest, res) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    throw new CustomError('No files uploaded', 400);
  }

  const { messageId } = req.body;
  const userId = req.user!.id;

  // 메시지 ID가 제공된 경우 메시지 존재 확인
  if (messageId) {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: userId },
          { recipientId: userId },
          { recipientId: null, type: 'BROADCAST' }
        ]
      }
    });

    if (!message) {
      // 업로드된 파일들 삭제
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      throw new CustomError('Message not found or access denied', 404);
    }
  }

  // 모든 파일 정보를 데이터베이스에 저장
  const fileRecords = await Promise.all(
    files.map(file => 
      prisma.file.create({
        data: {
          messageId: messageId || null,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/api/files/${file.filename}`,
          uploadedBy: userId
        }
      })
    )
  );

  loggerHelpers.logUserActivity(userId, 'multiple_file_upload', {
    fileCount: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    messageId,
    fileIds: fileRecords.map(f => f.id)
  });

  res.status(201).json({
    message: 'Files uploaded successfully',
    files: fileRecords.map(record => ({
      id: record.id,
      filename: record.filename,
      originalName: record.originalName,
      mimetype: record.mimetype,
      size: record.size,
      url: record.url,
      createdAt: record.createdAt
    }))
  });
}));

// 파일 다운로드
router.get('/:filename', catchAsync(async (req: AuthenticatedRequest, res) => {
  const { filename } = req.params;
  const userId = req.user!.id;

  // 파일 정보 조회
  const fileRecord = await prisma.file.findFirst({
    where: { filename },
    include: {
      message: {
        select: {
          id: true,
          senderId: true,
          recipientId: true,
          type: true
        }
      }
    }
  });

  if (!fileRecord) {
    throw new CustomError('File not found', 404);
  }

  // 파일 접근 권한 확인
  if (fileRecord.message) {
    const message = fileRecord.message;
    const hasAccess = 
      message.senderId === userId ||
      message.recipientId === userId ||
      (message.recipientId === null && message.type === 'BROADCAST');

    if (!hasAccess) {
      throw new CustomError('Access denied', 403);
    }
  }

  const filePath = path.join(uploadDir, 'files', filename);

  // 파일 존재 확인
  if (!fs.existsSync(filePath)) {
    throw new CustomError('File not found on disk', 404);
  }

  // 파일 정보 헤더 설정
  res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
  res.setHeader('Content-Type', fileRecord.mimetype);
  res.setHeader('Content-Length', fileRecord.size.toString());

  loggerHelpers.logUserActivity(userId, 'file_download', {
    fileId: fileRecord.id,
    filename: fileRecord.originalName,
    size: fileRecord.size
  });

  // 파일 스트림으로 전송
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}));

// 파일 정보 조회
router.get('/info/:fileId', [
  param('fileId').isUUID()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { fileId } = req.params;
  const userId = req.user!.id;

  const fileRecord = await prisma.file.findFirst({
    where: { id: fileId },
    include: {
      message: {
        select: {
          id: true,
          senderId: true,
          recipientId: true,
          type: true,
          subject: true,
          createdAt: true
        }
      }
    }
  });

  if (!fileRecord) {
    throw new CustomError('File not found', 404);
  }

  // 파일 접근 권한 확인
  if (fileRecord.message) {
    const message = fileRecord.message;
    const hasAccess = 
      message.senderId === userId ||
      message.recipientId === userId ||
      (message.recipientId === null && message.type === 'BROADCAST');

    if (!hasAccess) {
      throw new CustomError('Access denied', 403);
    }
  }

  res.json({
    file: {
      id: fileRecord.id,
      filename: fileRecord.filename,
      originalName: fileRecord.originalName,
      mimetype: fileRecord.mimetype,
      size: fileRecord.size,
      url: fileRecord.url,
      createdAt: fileRecord.createdAt,
      message: fileRecord.message
    }
  });
}));

// 파일 목록 조회
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('mimetype').optional().isString(),
  query('messageId').optional().isUUID()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20, mimetype, messageId } = req.query;
  const userId = req.user!.id;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const whereClause: any = {
    OR: [
      { uploadedBy: userId },
      {
        message: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
            { recipientId: null, type: 'BROADCAST' }
          ]
        }
      }
    ]
  };

  if (mimetype) {
    whereClause.mimetype = { contains: mimetype as string };
  }

  if (messageId) {
    whereClause.messageId = messageId;
  }

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where: whereClause,
      include: {
        message: {
          select: {
            id: true,
            subject: true,
            type: true,
            createdAt: true
          }
        }
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.file.count({ where: whereClause })
  ]);

  res.json({
    files,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// 파일 삭제
router.delete('/:fileId', [
  param('fileId').isUUID()
], catchAsync(async (req: AuthenticatedRequest, res) => {
  const { fileId } = req.params;
  const userId = req.user!.id;

  const fileRecord = await prisma.file.findFirst({
    where: { id: fileId },
    include: {
      message: {
        select: {
          senderId: true
        }
      }
    }
  });

  if (!fileRecord) {
    throw new CustomError('File not found', 404);
  }

  // 파일 삭제 권한 확인 (업로더나 메시지 발송자만)
  const canDelete = 
    fileRecord.uploadedBy === userId ||
    fileRecord.message?.senderId === userId ||
    ['ADMIN', 'FIELD_DIRECTOR'].includes(req.user!.role);

  if (!canDelete) {
    throw new CustomError('Access denied', 403);
  }

  // 물리적 파일 삭제
  const filePath = path.join(uploadDir, 'files', fileRecord.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // 데이터베이스에서 파일 레코드 삭제
  await prisma.file.delete({
    where: { id: fileId }
  });

  loggerHelpers.logUserActivity(userId, 'file_delete', {
    fileId,
    filename: fileRecord.originalName,
    size: fileRecord.size
  });

  res.json({
    message: 'File deleted successfully'
  });
}));

// 파일 타입별 통계
router.get('/stats/overview', catchAsync(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  // 사용자가 접근 가능한 파일들의 통계
  const whereClause = {
    OR: [
      { uploadedBy: userId },
      {
        message: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
            { recipientId: null, type: 'BROADCAST' }
          ]
        }
      }
    ]
  };

  const [
    totalFiles,
    totalSize,
    filesByType,
    recentFiles
  ] = await Promise.all([
    prisma.file.count({ where: whereClause }),
    
    prisma.file.aggregate({
      where: whereClause,
      _sum: { size: true }
    }),
    
    prisma.file.groupBy({
      by: ['mimetype'],
      where: whereClause,
      _count: { mimetype: true },
      _sum: { size: true }
    }),
    
    prisma.file.findMany({
      where: whereClause,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        mimetype: true,
        size: true,
        createdAt: true
      }
    })
  ]);

  // 파일 타입별 분류
  const typeCategories = filesByType.reduce((acc, item) => {
    let category = 'other';
    
    if (item.mimetype.startsWith('image/')) category = 'images';
    else if (item.mimetype.startsWith('video/')) category = 'videos';
    else if (item.mimetype.startsWith('audio/')) category = 'audio';
    else if (item.mimetype.includes('pdf')) category = 'documents';
    else if (item.mimetype.includes('word') || item.mimetype.includes('excel')) category = 'documents';

    if (!acc[category]) {
      acc[category] = { count: 0, size: 0 };
    }
    
    acc[category].count += item._count.mimetype;
    acc[category].size += item._sum.size || 0;
    
    return acc;
  }, {} as Record<string, { count: number; size: number }>);

  res.json({
    stats: {
      total: {
        files: totalFiles,
        size: totalSize._sum.size || 0
      },
      byCategory: typeCategories,
      byMimetype: filesByType.map(item => ({
        mimetype: item.mimetype,
        count: item._count.mimetype,
        size: item._sum.size || 0
      })),
      recent: recentFiles
    }
  });
}));

export default router;