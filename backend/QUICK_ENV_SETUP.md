# ⚡ Vercel 환경 변수 빠른 설정 가이드

## 🚀 5분 안에 설정 완료하기

### 1️⃣ 보안 키 생성 (30초)

```bash
cd backend
node scripts/generate-env-keys.js
```

생성된 키들을 복사해두세요.

### 2️⃣ Vercel Postgres 생성 (2분)

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 → Storage 탭
3. "Create Database" → "Postgres" 선택
4. 이름: `wsop-field-director-db` → Create

### 3️⃣ 필수 환경 변수 설정 (2분)

Vercel 대시보드 → Settings → Environment Variables에서:

| 변수 이름 | 값 | 환경 |
|-----------|-----|------|
| `DATABASE_URL` | (Vercel Postgres가 자동 생성) | 모든 환경 |
| `JWT_SECRET` | (생성한 키 붙여넣기) | Production |
| `NODE_ENV` | `production` | Production |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Production |
| `DEFAULT_TIMEZONE` | `Asia/Seoul` | 모든 환경 |
| `TOURNAMENT_TIMEZONE` | `Europe/Athens` | 모든 환경 |

### 4️⃣ 배포 (30초)

```bash
vercel --prod
```

## 📋 복사용 환경 변수

```bash
# 필수 환경 변수
JWT_SECRET="생성한_JWT_키_붙여넣기"
NODE_ENV="production"
FRONTEND_URL="https://your-frontend.vercel.app"
DEFAULT_TIMEZONE="Asia/Seoul"
TOURNAMENT_TIMEZONE="Europe/Athens"
APP_NAME="WSOP Field Director Pro"
APP_VERSION="1.0.0"
LOG_LEVEL="info"
```

## 🔍 설정 확인

배포 후 다음 URL로 상태 확인:
```
https://your-project.vercel.app/api/health
```

정상 응답:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

## ⚠️ 주의사항

1. **JWT_SECRET은 절대 공유하지 마세요**
2. **DATABASE_URL은 Vercel이 자동 관리합니다**
3. **환경 변수 변경 후 재배포 필요**

## 🆘 문제 발생 시

### "Database connection failed"
→ DATABASE_URL이 설정되었는지 확인

### "JWT_SECRET is not defined"
→ 환경 변수가 Production 환경에 설정되었는지 확인

### "CORS error"
→ FRONTEND_URL이 올바른지 확인

---

더 자세한 설정은 [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)를 참고하세요.