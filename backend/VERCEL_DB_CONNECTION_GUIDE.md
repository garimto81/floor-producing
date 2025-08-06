# 🗄️ Vercel 데이터베이스 연결 가이드

## 🎯 목표
백엔드가 Vercel Postgres 데이터베이스와 연결되도록 설정하기

## 📋 전체 프로세스

```mermaid
graph LR
    A[Vercel Postgres 생성] --> B[환경 변수 복사]
    B --> C[백엔드 .env.local 설정]
    C --> D[데이터베이스 연결 테스트]
    D --> E[마이그레이션 실행]
    E --> F[서버 시작]
```

## 🚀 단계별 가이드

### 1️⃣ Vercel Postgres 데이터베이스 생성

1. **Vercel 대시보드 접속**
   ```
   https://vercel.com/dashboard
   ```

2. **프로젝트 선택**
   - `floor-producing` 프로젝트 클릭

3. **Storage 탭**
   - 상단 메뉴에서 `Storage` 클릭
   - "Connect Store" 버튼 클릭

4. **Postgres 선택**
   - "Create New" → "Postgres" 선택
   - Database Name: `wsop-field-director`
   - Region: `Singapore (sin1)` (아시아 지역 권장)

5. **Create 클릭**
   - 데이터베이스 생성 완료!

### 2️⃣ 환경 변수를 백엔드로 가져오기

#### 방법 A: 자동으로 가져오기 (권장)

```bash
cd backend

# Vercel 환경 변수 자동 설정
npm run db:setup

# 또는 직접 Vercel CLI 사용
npm run vercel:pull
```

#### 방법 B: 수동으로 복사하기

1. **Vercel 대시보드에서**
   - Storage → 생성한 데이터베이스 클릭
   - `.env.local` 탭 선택
   - 모든 내용 복사

2. **백엔드 폴더에 붙여넣기**
   ```bash
   # backend/.env.local 파일 생성/편집
   ```

3. **필수 환경 변수 확인**
   ```env
   # Vercel이 제공하는 변수들
   POSTGRES_URL="..."
   POSTGRES_PRISMA_URL="..."
   POSTGRES_URL_NON_POOLING="..."
   POSTGRES_USER="..."
   POSTGRES_HOST="..."
   POSTGRES_PASSWORD="..."
   POSTGRES_DATABASE="..."
   
   # Prisma용 DATABASE_URL (POSTGRES_PRISMA_URL과 동일)
   DATABASE_URL="${POSTGRES_PRISMA_URL}"
   ```

### 3️⃣ 추가 환경 변수 설정

```bash
# 보안 키 자동 생성
npm run env:generate

# .env.local에 추가
JWT_SECRET="생성된_키_붙여넣기"
NODE_ENV="development"
FRONTEND_URL="http://localhost:8081"
```

### 4️⃣ 데이터베이스 연결 테스트

```bash
# 연결 테스트
npm run db:test
```

성공 시 출력:
```
✅ 데이터베이스 연결 성공!
📊 PostgreSQL 버전: PostgreSQL 15.x ...
```

### 5️⃣ Prisma 설정 및 마이그레이션

```bash
# Prisma Client 생성
npm run db:generate

# 데이터베이스 마이그레이션
npm run db:migrate
```

### 6️⃣ 서버 시작

```bash
# 개발 서버 시작
npm run dev:simple
```

서버가 시작되면:
```
🚀 서버가 http://localhost:3003 에서 실행 중입니다
✅ 데이터베이스 연결 성공
📡 환경: development
```

## 🔍 연결 확인 방법

### API 헬스체크
```bash
curl http://localhost:3003/api/health
```

응답:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-06T...",
  "database": "connected",
  "environment": "development"
}
```

### 관리자 계정 생성 테스트
```bash
curl -X POST http://localhost:3003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@wsop.com",
    "password": "admin123",
    "name": "관리자",
    "role": "DIRECTOR"
  }'
```

## 🚨 문제 해결

### "DATABASE_URL is not defined"
```bash
# 환경 변수 다시 가져오기
npm run vercel:pull
```

### "Can't reach database server"
1. Vercel 대시보드에서 데이터베이스 상태 확인
2. `.env.local`의 DATABASE_URL이 올바른지 확인
3. 인터넷 연결 확인

### "relation does not exist"
```bash
# 마이그레이션 실행
npm run db:migrate
```

### 연결 타임아웃
```env
# .env.local에서 타임아웃 늘리기
DATABASE_URL="...?connect_timeout=30"
```

## 📊 데이터베이스 관리

### Vercel 대시보드에서 직접 쿼리
1. Storage → 데이터베이스 선택
2. "Data" 탭
3. SQL 쿼리 직접 실행 가능

### Prisma Studio 사용
```bash
# 웹 기반 데이터베이스 GUI
npx prisma studio
```

## ✅ 최종 체크리스트

- [ ] Vercel Postgres 생성 완료
- [ ] 환경 변수를 백엔드에 복사
- [ ] JWT_SECRET 등 추가 환경 변수 설정
- [ ] 데이터베이스 연결 테스트 통과
- [ ] Prisma 마이그레이션 실행
- [ ] 서버 정상 시작
- [ ] API 헬스체크 성공

## 🎉 완료!

이제 백엔드가 Vercel Postgres와 연결되어 데이터를 저장하고 불러올 수 있습니다!

### 다음 단계:
1. 프론트엔드 앱에서 백엔드 API 연결
2. 실제 데이터 CRUD 테스트
3. 프로덕션 배포 준비