import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger, emergencyLogger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

// 커스텀 에러 클래스
export class CustomError extends Error implements AppError {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 에러 타입별 처리 함수들
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): CustomError {
  let message = 'Database operation failed';
  let statusCode = 500;

  switch (error.code) {
    case 'P2000':
      message = 'The provided value for the column is too long';
      statusCode = 400;
      break;
    case 'P2001':
      message = 'The record searched for does not exist';
      statusCode = 404;
      break;
    case 'P2002':
      const target = error.meta?.target as string[];
      message = `Unique constraint failed on field: ${target?.join(', ') || 'unknown'}`;
      statusCode = 409;
      break;
    case 'P2003':
      message = 'Foreign key constraint failed';
      statusCode = 400;
      break;
    case 'P2004':
      message = 'A constraint failed on the database';
      statusCode = 400;
      break;
    case 'P2005':
      message = 'The value stored in the database is invalid';
      statusCode = 500;
      break;
    case 'P2006':
      message = 'The provided value is not valid';
      statusCode = 400;
      break;
    case 'P2007':
      message = 'Data validation error';
      statusCode = 400;
      break;
    case 'P2008':
      message = 'Failed to parse the query';
      statusCode = 500;
      break;
    case 'P2009':
      message = 'Failed to validate the query';
      statusCode = 500;
      break;
    case 'P2010':
      message = 'Raw query failed';
      statusCode = 500;
      break;
    case 'P2011':
      message = 'Null constraint violation';
      statusCode = 400;
      break;
    case 'P2012':
      message = 'Missing a required value';
      statusCode = 400;
      break;
    case 'P2013':
      message = 'Missing the required argument';
      statusCode = 400;
      break;
    case 'P2014':
      message = 'The change you are trying to make would violate the required relation';
      statusCode = 400;
      break;
    case 'P2015':
      message = 'A related record could not be found';
      statusCode = 404;
      break;
    case 'P2016':
      message = 'Query interpretation error';
      statusCode = 500;
      break;
    case 'P2017':
      message = 'The records for relation are not connected';
      statusCode = 400;
      break;
    case 'P2018':
      message = 'The required connected records were not found';
      statusCode = 404;
      break;
    case 'P2019':
      message = 'Input error';
      statusCode = 400;
      break;
    case 'P2020':
      message = 'Value out of range for the type';
      statusCode = 400;
      break;
    case 'P2021':
      message = 'The table does not exist in the current database';
      statusCode = 500;
      break;
    case 'P2022':
      message = 'The column does not exist in the current database';
      statusCode = 500;
      break;
    case 'P2023':
      message = 'Inconsistent column data';
      statusCode = 500;
      break;
    case 'P2024':
      message = 'Timed out fetching a new connection from the connection pool';
      statusCode = 503;
      break;
    case 'P2025':
      message = 'An operation failed because it depends on one or more records that were required but not found';
      statusCode = 404;
      break;
    default:
      message = `Database error: ${error.message}`;
      statusCode = 500;
  }

  return new CustomError(message, statusCode);
}

function handleValidationError(error: any): CustomError {
  const errors = Object.values(error.errors).map((err: any) => err.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new CustomError(message, 400);
}

function handleJWTError(): CustomError {
  return new CustomError('Invalid token. Please log in again.', 401);
}

function handleJWTExpiredError(): CustomError {
  return new CustomError('Your token has expired. Please log in again.', 401);
}

function handleCastError(error: any): CustomError {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new CustomError(message, 400);
}

// 개발 환경 에러 응답
function sendErrorDev(err: AppError, req: Request, res: Response) {
  const errorResponse = {
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  logger.error('Development Error', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    userId: (req as any).user?.id
  });

  res.status(err.statusCode || 500).json(errorResponse);
}

// 프로덕션 환경 에러 응답
function sendErrorProd(err: AppError, req: Request, res: Response) {
  // 운영상 에러만 클라이언트에 전송
  if (err.isOperational) {
    const errorResponse = {
      status: err.status || 'error',
      message: err.message,
      timestamp: new Date().toISOString()
    };

    logger.error('Production Error', {
      error: err.message,
      path: req.originalUrl,
      method: req.method,
      userId: (req as any).user?.id,
      statusCode: err.statusCode
    });

    res.status(err.statusCode || 500).json(errorResponse);
  } else {
    // 프로그래밍 에러는 일반적인 메시지만 전송
    logger.error('Programming Error', {
      error: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      userId: (req as any).user?.id
    });

    // 긴급 상황 로깅
    if (err.statusCode === 500) {
      emergencyLogger.error('Critical Server Error', {
        error: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        userId: (req as any).user?.id,
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
}

// 에러 분류 및 처리
function classifyError(err: any): AppError {
  let error: AppError = err;

  // Prisma 에러 처리
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new CustomError('Invalid data provided', 400);
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    error = new CustomError('Database connection error', 500);
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    error = new CustomError('Database initialization error', 500);
  }
  
  // JWT 에러 처리
  else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  
  // 기타 공통 에러들
  else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    error = new CustomError('File size exceeds the allowed limit', 413);
  } else if (err.code === 'ENOTFOUND') {
    error = new CustomError('Network error: Service unavailable', 503);
  } else if (err.code === 'ECONNREFUSED') {
    error = new CustomError('Connection refused: Service unavailable', 503);
  }

  return error;
}

// 메인 에러 핸들러 미들웨어
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = classifyError(err);

  // 개발 환경과 프로덕션 환경을 구분하여 처리
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
}

// 404 Not Found 핸들러
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new CustomError(
    `Cannot ${req.method} ${req.originalUrl} on this server`,
    404
  );
  next(error);
}

// 비동기 함수 에러 캐치 래퍼
export function catchAsync(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 글로벌 에러 핸들러들
export function setupGlobalErrorHandlers() {
  // 처리되지 않은 Promise 거부
  process.on('unhandledRejection', (reason: any) => {
    emergencyLogger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack
    });
    
    // 개발 환경에서는 프로세스 종료
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
  });

  // 처리되지 않은 예외
  process.on('uncaughtException', (error: Error) => {
    emergencyLogger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
    
    // 항상 프로세스 종료
    process.exit(1);
  });

  // SIGTERM 신호 처리
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  // SIGINT 신호 처리 (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
}

export { CustomError };