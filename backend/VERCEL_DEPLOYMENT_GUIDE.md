# 🚀 Vercel 배포 실행 가이드

## ✅ 완료된 사항
- Vercel CLI 설치 완료 ✅
- Serverless 함수 생성 (`api/index.ts`) ✅
- Vercel 설정 파일 (`vercel.json`) ✅
- 환경변수 템플릿 (`.env.production`) ✅

## 📋 다음 단계

### 1️⃣ **Vercel 로그인**
```bash
vercel login
```
- 이메일 주소 입력
- 이메일로 전송된 인증 링크 클릭

### 2️⃣ **프로젝트 디렉토리 이동**
```bash
cd C:\claude01\floor-producing\backend
```

### 3️⃣ **첫 배포 실행**
```bash
vercel
```

첫 배포 시 물어보는 질문들:
```
? Set up and deploy "~/floor-producing/backend"? [Y/n] Y
? Which scope do you want to deploy to? (개인 계정 선택)
? Link to existing project? [y/N] N
? What's your project's name? wsop-field-director-backend
? In which directory is your code located? ./
? Want to override the settings? [y/N] N
```

### 4️⃣ **환경변수 설정**

#### 옵션 A: Vercel 대시보드에서 설정 (권장)
1. https://vercel.com/dashboard 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수 추가:

```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=your-super-secure-production-jwt-secret-key-change-this
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
DEFAULT_TIMEZONE=Asia/Seoul
TOURNAMENT_TIMEZONE=Europe/Athens
```

#### 옵션 B: CLI로 설정
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
```

### 5️⃣ **데이터베이스 선택**

#### 🗄️ **Vercel Postgres** (무료, 권장)
```bash
# Vercel 대시보드에서
1. Storage 탭 → Create Database
2. Postgres 선택
3. 생성 후 DATABASE_URL 자동 설정
```

#### 🗄️ **Supabase** (대안)
```bash
1. https://supabase.com 가입
2. 새 프로젝트 생성
3. Settings → Database → Connection string 복사
```

### 6️⃣ **Prisma 스키마 설정**
```bash
# package.json 수정
"prisma": {
  "schema": "prisma/schema-vercel.prisma"
}
```

### 7️⃣ **프로덕션 배포**
```bash
vercel --prod
```

## 🔍 배포 확인

### 1. **헬스체크**
```bash
curl https://your-project.vercel.app/api/health
```

예상 응답:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-06T...",
  "message": "WSOP Field Director Pro Backend is running on Vercel!",
  "environment": "production"
}
```

### 2. **관리자 계정 생성**
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

### 3. **로그인 테스트**
```bash
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@wsop.com",
    "password": "director123"
  }'
```

## 🛠️ 트러블슈팅

### 문제: "Error: No such file or directory"
```bash
# 올바른 디렉토리인지 확인
pwd
# 출력: C:\claude01\floor-producing\backend
```

### 문제: "Error: Missing required environment variables"
```bash
# 환경변수 확인
vercel env ls

# 환경변수 추가
vercel env add DATABASE_URL production
```

### 문제: "Prisma Client error"
```bash
# postinstall 스크립트 확인
npm run postinstall
```

## 📊 배포 성공 시

```
🎉 Production: https://wsop-field-director-backend.vercel.app
📋 Inspect: https://vercel.com/your-username/wsop-field-director-backend
✅ Preview: https://wsop-field-director-backend-git-main.vercel.app
```

## 🔄 지속적 배포

### GitHub 연동
```bash
# Git 저장소 연결
git remote add origin https://github.com/your-username/wsop-backend.git
git push -u origin main
```

### 자동 배포 설정
- main 브랜치 → 프로덕션 자동 배포
- PR → 프리뷰 URL 자동 생성

## 📱 프론트엔드 연동

React Native 앱의 API URL 업데이트:
```javascript
// src/config/api.js
const API_URL = __DEV__ 
  ? 'http://localhost:3003/api'
  : 'https://wsop-field-director-backend.vercel.app/api';
```

## ✅ 최종 체크리스트

- [ ] Vercel CLI 설치 완료
- [ ] Vercel 로그인 완료
- [ ] 프로젝트 배포 완료
- [ ] 환경변수 설정 완료
- [ ] 데이터베이스 연결 완료
- [ ] 헬스체크 통과
- [ ] 관리자 계정 생성
- [ ] 프론트엔드 API URL 업데이트

---

**배포가 완료되면 WSOP Super Circuit CYPRUS 2024에서 전 세계 어디서나 안정적으로 접속 가능한 백엔드가 준비됩니다!** 🎬🃏