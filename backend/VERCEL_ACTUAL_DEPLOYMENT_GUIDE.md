# 🚀 실제 Vercel 배포 및 연동 가이드

## 📋 현재 상황 분석

### ✅ **완료된 것들:**
- 백엔드 서버 완전 구현 ✅
- 로컬에서 모든 기능 완벽 작동 ✅ 
- 관리자 대시보드 100% 기능 ✅
- GitHub 저장소 업로드 완료 ✅

### ❌ **아직 필요한 것들:**
- Vercel 계정 로그인 및 인증 ❌
- Vercel Postgres 데이터베이스 생성 ❌
- 환경 변수 실제 설정 ❌
- 프로덕션 배포 ❌

## 🔧 **실제 Vercel 연동 단계**

### 1단계: Vercel 계정 로그인 (수동 필요)

1. **브라우저에서 직접 로그인**:
   ```
   https://vercel.com/login
   ```

2. **GitHub 계정으로 연결**

3. **CLI에서 로그인 확인**:
   ```bash
   cd backend
   vercel login
   # 브라우저에서 인증 완료 후 CLI 연결
   ```

### 2단계: Vercel Postgres 데이터베이스 생성

1. **Vercel 대시보드 접속**:
   ```
   https://vercel.com/dashboard
   ```

2. **프로젝트 생성 또는 기존 선택**

3. **Storage 탭 → Create Database**:
   - Database Type: **Postgres**
   - Database Name: `wsop-field-director-db`
   - Region: **Singapore (sin1)** (아시아 최적)

4. **연결 정보 복사**:
   - `.env.local` 탭에서 모든 환경 변수 복사

### 3단계: 환경 변수 로컬 설정

1. **Vercel에서 환경변수 가져오기**:
   ```bash
   cd backend
   vercel env pull .env.local
   ```

2. **또는 수동으로 복사**:
   `.env.local` 파일에 Vercel에서 제공하는 값들을 붙여넣기

### 4단계: 데이터베이스 마이그레이션

1. **PostgreSQL 스키마 사용**:
   ```bash
   npx prisma generate --schema=prisma/schema.prisma
   ```

2. **프로덕션 데이터베이스로 마이그레이션**:
   ```bash
   npx prisma migrate deploy
   ```

### 5단계: Vercel 배포

1. **프로젝트 배포**:
   ```bash
   vercel
   ```

2. **프로덕션 배포**:
   ```bash
   vercel --prod
   ```

## 📋 **필수 환경 변수 목록**

Vercel 대시보드에서 설정해야 할 환경 변수들:

```env
# Vercel Postgres (자동 생성됨)
DATABASE_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
POSTGRES_PRISMA_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"

# 애플리케이션 설정
JWT_SECRET="a33636923f438f9f69e9c8d6ff38f8130e648f8d10bec8a2d55cba1c57102dd7"
NODE_ENV="production"
FRONTEND_URL="https://your-frontend.vercel.app"
DEFAULT_TIMEZONE="Asia/Seoul"
TOURNAMENT_TIMEZONE="Europe/Athens"
APP_NAME="WSOP Field Director Pro"
APP_VERSION="1.0.0"
```

## 🧪 **배포 후 테스트**

### 1. 헬스체크 테스트
```bash
curl https://your-project.vercel.app/api/health
```

### 2. 관리자 대시보드 접근
```
https://your-project.vercel.app/admin
```

### 3. API 테스트
```bash
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"director@wsop.com","password":"director123"}'
```

## 🚨 **주의사항**

1. **데이터 손실 방지**: 로컬 SQLite 데이터는 백업해두세요
2. **환경 분리**: 로컬 개발용과 프로덕션용 환경 변수 분리
3. **보안**: JWT_SECRET은 프로덕션에서 새로 생성하세요

## 📞 **문제 해결**

### Vercel 로그인 문제
```bash
# 토큰이 있다면 직접 설정 가능
vercel --token YOUR_VERCEL_TOKEN
```

### 데이터베이스 연결 문제
```bash
# 연결 테스트
npx prisma db push
```

### 배포 실패
```bash
# 로그 확인
vercel logs
```

## ✅ **성공 확인 체크리스트**

- [ ] Vercel 계정 로그인 완료
- [ ] Postgres 데이터베이스 생성
- [ ] 환경 변수 설정 완료  
- [ ] 데이터베이스 마이그레이션 성공
- [ ] Vercel 프로덕션 배포 완료
- [ ] 프로덕션 URL에서 헬스체크 성공
- [ ] 관리자 대시보드 프로덕션에서 작동
- [ ] 모든 API 기능 클라우드에서 정상 작동

---

**이제 실제 Vercel 계정 로그인부터 시작해주세요!** 🚀

브라우저에서 https://vercel.com/login 접속 후 GitHub으로 로그인하세요.