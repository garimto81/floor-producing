# 🚀 WSOP Field Director Pro - Vercel 배포 가이드

## 📋 Vercel 배포 준비 사항

### 1. **Vercel CLI 설치**
```bash
npm install -g vercel
```

### 2. **프로젝트 구조**
```
backend/
├── api/
│   └── index.ts        # Vercel Serverless 함수
├── prisma/
│   ├── schema-vercel.prisma  # PostgreSQL 스키마
│   └── schema-sqlite.prisma  # 로컬 개발용
├── vercel.json         # Vercel 설정
├── package.json        # 의존성 및 스크립트
└── .env.production     # 프로덕션 환경변수 템플릿
```

## 🎯 배포 단계

### 1단계: **Vercel 로그인**
```bash
vercel login
```

### 2단계: **데이터베이스 설정**

#### 옵션 A: **Vercel Postgres 사용** (권장)
1. Vercel 대시보드 → Storage → Create Database
2. PostgreSQL 선택
3. 연결 문자열 복사

#### 옵션 B: **외부 PostgreSQL 사용**
- Supabase, Neon, Railway 등 사용 가능
- SSL 연결 필수

### 3단계: **환경 변수 설정**

Vercel 대시보드에서 다음 환경 변수 설정:

```bash
# 필수 환경 변수
DATABASE_URL="postgresql://..."
JWT_SECRET="your-super-secure-production-key"
FRONTEND_URL="https://your-frontend.vercel.app"

# 선택 환경 변수
NODE_ENV="production"
DEFAULT_TIMEZONE="Asia/Seoul"
TOURNAMENT_TIMEZONE="Europe/Athens"
```

### 4단계: **Prisma 스키마 변경**
```bash
# package.json의 prisma schema 경로를 vercel용으로 변경
"prisma": {
  "schema": "prisma/schema-vercel.prisma"
}
```

### 5단계: **배포 실행**
```bash
# 첫 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 🔧 로컬 테스트

### Vercel Dev 서버 실행
```bash
npm run dev:vercel
# 또는
vercel dev
```

### 환경 변수 설정 (.env.local)
```bash
DATABASE_URL="file:./dev.db"  # 로컬 SQLite
JWT_SECRET="local-dev-secret"
FRONTEND_URL="http://localhost:19006"
```

## 📡 API 엔드포인트

배포 후 사용 가능한 엔드포인트:

```
https://your-project.vercel.app/api
https://your-project.vercel.app/api/health
https://your-project.vercel.app/api/auth/login
https://your-project.vercel.app/api/auth/register
https://your-project.vercel.app/api/auth/profile
https://your-project.vercel.app/api/users
https://your-project.vercel.app/api/db-status
```

## 🔍 배포 후 확인사항

### 1. **헬스 체크**
```bash
curl https://your-project.vercel.app/api/health
```

### 2. **데이터베이스 연결**
```bash
curl https://your-project.vercel.app/api/db-status
```

### 3. **관리자 계정 생성**
```bash
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@wsop.com",
    "password": "director123",
    "name": "현장 총괄 디렉터",
    "role": "DIRECTOR"
  }'
```

## 🛠️ 트러블슈팅

### 문제: **Prisma 클라이언트 에러**
```bash
# package.json에 추가
"postinstall": "prisma generate"
```

### 문제: **데이터베이스 연결 실패**
- DATABASE_URL이 올바른지 확인
- SSL 설정 확인: `?sslmode=require`
- Vercel IP 화이트리스트 확인

### 문제: **빌드 실패**
```bash
# vercel.json에서 빌드 명령 확인
"builds": [
  {
    "src": "api/index.ts",
    "use": "@vercel/node"
  }
]
```

## 📊 모니터링

### Vercel 대시보드에서 확인
- Functions 탭: API 호출 통계
- Logs 탭: 실시간 로그
- Analytics 탭: 성능 지표

### 로그 확인
```bash
vercel logs
vercel logs --follow
```

## 🔄 CI/CD 설정

### GitHub 연동
1. Vercel 대시보드 → Import Git Repository
2. GitHub 저장소 선택
3. 자동 배포 설정

### 배포 워크플로우
```
main 브랜치 → 프로덕션 배포
develop 브랜치 → 프리뷰 배포
PR → 프리뷰 URL 생성
```

## 🎯 프로덕션 체크리스트

- [ ] 환경 변수 모두 설정됨
- [ ] 데이터베이스 연결 확인
- [ ] JWT_SECRET 변경됨
- [ ] CORS 설정 확인
- [ ] 관리자 계정 생성
- [ ] 헬스 체크 통과
- [ ] API 응답 시간 확인
- [ ] 에러 로깅 설정

## 🚀 최적화 팁

### 1. **Edge Functions 사용**
```typescript
export const config = {
  runtime: 'edge',
};
```

### 2. **캐싱 헤더 설정**
```typescript
res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
```

### 3. **데이터베이스 연결 풀링**
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error'],
});
```

## 📱 프론트엔드 연동

### React Native 앱에서 API URL 설정
```typescript
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend.vercel.app/api'
  : 'http://localhost:3000/api';
```

### CORS 확인
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

---

**배포 완료 후 WSOP Super Circuit CYPRUS 2024에서 안정적인 현장 운영이 가능합니다!** 🎬🃏