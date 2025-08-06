# 🔐 Vercel 환경 변수 설정 가이드

## 📋 필수 환경 변수 목록

### 1. 데이터베이스 설정 (Vercel Postgres)
```bash
# Vercel Postgres 자동 생성 변수들
POSTGRES_URL="postgres://default:xxxxx@xxx.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_PRISMA_URL="postgres://default:xxxxx@xxx.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgres://default:xxxxx@xxx.postgres.vercel-storage.com:5432/verceldb"
POSTGRES_USER="default"
POSTGRES_HOST="xxx.postgres.vercel-storage.com"
POSTGRES_PASSWORD="xxxxx"
POSTGRES_DATABASE="verceldb"

# Prisma가 사용할 DATABASE_URL (POSTGRES_PRISMA_URL과 동일하게 설정)
DATABASE_URL="postgres://default:xxxxx@xxx.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
```

### 2. 인증 및 보안
```bash
# JWT 비밀 키 (최소 32자 이상의 랜덤 문자열)
JWT_SECRET="your-super-secure-jwt-secret-key-change-this-immediately"

# JWT 토큰 만료 시간
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# API 암호화 키
ENCRYPTION_KEY="your-encryption-key-for-sensitive-data"
```

### 3. 애플리케이션 설정
```bash
# 환경 설정
NODE_ENV="production"

# 프론트엔드 URL (CORS 설정용)
FRONTEND_URL="https://your-frontend-app.vercel.app"

# 타임존 설정
DEFAULT_TIMEZONE="Asia/Seoul"
TOURNAMENT_TIMEZONE="Europe/Athens"

# 앱 이름 및 버전
APP_NAME="WSOP Field Director Pro"
APP_VERSION="1.0.0"
```

### 4. 외부 서비스 (선택사항)
```bash
# 이메일 서비스 (SendGrid, AWS SES 등)
EMAIL_SERVICE="sendgrid"
EMAIL_API_KEY="your-email-service-api-key"
EMAIL_FROM="noreply@wsop-field-director.com"

# 파일 업로드 (AWS S3, Cloudinary 등)
STORAGE_SERVICE="s3"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET="wsop-field-director-uploads"

# 푸시 알림 (선택사항)
PUSH_NOTIFICATION_KEY="your-push-notification-key"
```

### 5. 모니터링 및 로깅 (선택사항)
```bash
# Sentry 에러 트래킹
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"

# 로그 레벨
LOG_LEVEL="info"

# APM (Application Performance Monitoring)
NEW_RELIC_LICENSE_KEY="your-new-relic-key"
```

## 🚀 Vercel에서 환경 변수 설정하기

### 방법 1: Vercel 대시보드에서 설정 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 로그인

2. **프로젝트 선택**
   - `floor-producing` 프로젝트 클릭

3. **Settings 탭 이동**
   - 상단 메뉴에서 `Settings` 클릭

4. **Environment Variables 섹션**
   - 좌측 메뉴에서 `Environment Variables` 클릭

5. **변수 추가**
   ```
   Key: DATABASE_URL
   Value: [Vercel Postgres URL 입력]
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

6. **Save 버튼 클릭**

### 방법 2: Vercel CLI로 설정

```bash
# Vercel CLI 로그인
vercel login

# 프로젝트 디렉토리로 이동
cd C:\claude01\floor-producing\backend

# 환경 변수 추가
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add FRONTEND_URL production
vercel env add NODE_ENV production

# 여러 환경에 동시 추가
vercel env add DATABASE_URL production preview development
```

### 방법 3: .env.production.local 파일 사용 (로컬 테스트용)

```bash
# backend/.env.production.local 파일 생성
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
FRONTEND_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

## 🗄️ Vercel Postgres 설정

### 1. Vercel Postgres 생성

1. **Vercel 대시보드에서 Storage 탭**
   - 프로젝트 페이지 → Storage 탭

2. **Create Database 클릭**
   - "Connect Store" → "Create New" → "Postgres"

3. **데이터베이스 이름 설정**
   - Name: `wsop-field-director-db`
   - Region: 가장 가까운 지역 선택

4. **Create 클릭**

### 2. 자동 환경 변수 설정

Vercel Postgres를 생성하면 다음 환경 변수가 자동으로 추가됩니다:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 3. Prisma 스키마 업데이트

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Vercel Postgres는 Prisma Accelerate 사용
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

### 4. 데이터베이스 마이그레이션

```bash
# 로컬에서 마이그레이션 생성
npx prisma migrate dev --name init

# Vercel에 배포 시 자동 실행되도록 package.json 수정
"scripts": {
  "vercel-build": "prisma generate && prisma migrate deploy"
}
```

## 🔒 보안 모범 사례

### 1. 강력한 비밀 키 생성

```bash
# Node.js로 안전한 랜덤 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 또는 OpenSSL 사용
openssl rand -hex 32
```

### 2. 환경별 다른 값 사용

```bash
# Production
JWT_SECRET="production-secret-key-very-long-and-secure"

# Preview (PR 환경)
JWT_SECRET="preview-secret-key-for-testing"

# Development
JWT_SECRET="dev-secret-key-local-only"
```

### 3. 민감한 정보 보호

- 절대 환경 변수를 코드에 하드코딩하지 마세요
- `.env` 파일을 Git에 커밋하지 마세요
- 프로덕션 키는 팀 리더만 접근 가능하도록 설정

## 📊 환경 변수 확인

### 1. Vercel 대시보드에서 확인
- Settings → Environment Variables에서 목록 확인
- 값은 보안상 숨겨져 있음 (클릭하면 표시)

### 2. 배포된 앱에서 확인
```javascript
// api/debug-env.ts (개발용, 프로덕션에서는 제거)
export default function handler(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Not set',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Not set',
    FRONTEND_URL: process.env.FRONTEND_URL,
  });
}
```

## 🚨 문제 해결

### 환경 변수가 적용되지 않을 때

1. **재배포 필요**
   ```bash
   vercel --prod --force
   ```

2. **캐시 클리어**
   - Vercel 대시보드 → Settings → Functions → Clear Cache

3. **변수 이름 확인**
   - 대소문자 구분
   - 언더스코어(_) 사용
   - 특수문자 금지

### 데이터베이스 연결 실패

1. **연결 문자열 확인**
   ```bash
   # pgbouncer 연결 풀링 사용
   ?pgbouncer=true&connect_timeout=15
   ```

2. **IP 화이트리스트**
   - Vercel Functions는 동적 IP 사용
   - Vercel Postgres는 자동으로 허용

3. **연결 제한**
   - Free tier: 최대 5개 동시 연결
   - Pro tier: 최대 15개 동시 연결

## ✅ 체크리스트

환경 변수 설정 완료 확인:

- [ ] Vercel Postgres 데이터베이스 생성
- [ ] DATABASE_URL 환경 변수 설정
- [ ] JWT_SECRET 생성 및 설정
- [ ] FRONTEND_URL 설정
- [ ] NODE_ENV를 "production"으로 설정
- [ ] 타임존 설정 (DEFAULT_TIMEZONE, TOURNAMENT_TIMEZONE)
- [ ] Prisma 스키마 업데이트
- [ ] 배포 후 연결 테스트

---

**중요**: 이 가이드를 따라 환경 변수를 설정한 후 반드시 재배포하세요!

```bash
vercel --prod
```