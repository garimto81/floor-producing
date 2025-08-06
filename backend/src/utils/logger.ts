import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_FILE_PATH ? path.dirname(process.env.LOG_FILE_PATH) : './logs';
const logFile = process.env.LOG_FILE_PATH || './logs/app.log';

// 로그 포맷 설정
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // 메타데이터가 있으면 추가
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // 에러 스택이 있으면 추가
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Winston Logger 설정
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'floor-producing-backend' },
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    
    // 파일 출력 (모든 레벨)
    new winston.transports.File({
      filename: logFile,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      tailable: true
    }),
    
    // 에러 전용 파일
    new winston.transports.File({
      filename: logFile.replace('.log', '.error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // 예외 처리
  exceptionHandlers: [
    new winston.transports.File({
      filename: logFile.replace('.log', '.exceptions.log')
    })
  ],
  
  // 처리되지 않은 Promise 거부
  rejectionHandlers: [
    new winston.transports.File({
      filename: logFile.replace('.log', '.rejections.log')
    })
  ]
});

// 개발 환경에서만 디버그 로그 출력
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// HTTP 요청 로깅을 위한 미들웨어 함수
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  // 응답이 끝났을 때 로그 기록
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// 구조화된 로깅을 위한 헬퍼 함수들
export const loggerHelpers = {
  // 사용자 활동 로깅
  logUserActivity: (userId: string, activity: string, details?: any) => {
    logger.info('User Activity', {
      userId,
      activity,
      ...details
    });
  },

  // 보안 이벤트 로깅
  logSecurityEvent: (type: string, details: any) => {
    logger.warn('Security Event', {
      type,
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  // 성능 모니터링
  logPerformance: (operation: string, duration: number, details?: any) => {
    const level = duration > 1000 ? 'warn' : 'info';
    logger.log(level, 'Performance', {
      operation,
      duration: `${duration}ms`,
      ...details
    });
  },

  // 비즈니스 로직 이벤트
  logBusinessEvent: (event: string, details?: any) => {
    logger.info('Business Event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  // 시스템 상태 로깅
  logSystemStatus: (component: string, status: string, details?: any) => {
    logger.info('System Status', {
      component,
      status,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
};

// 긴급 상황 알림을 위한 특별 로거
export const emergencyLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `🚨 ${timestamp} [EMERGENCY]: ${message} ${JSON.stringify(meta)}`;
        })
      )
    }),
    new winston.transports.File({
      filename: logFile.replace('.log', '.emergency.log')
    })
  ]
});

// 로그 레벨별 헬퍼 함수
export const log = {
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, error?: Error | any) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack });
    } else {
      logger.error(message, error);
    }
  },
  emergency: (message: string, meta?: any) => emergencyLogger.error(message, meta)
};

export default logger;