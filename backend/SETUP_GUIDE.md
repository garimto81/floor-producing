# 🚀 백엔드 개발 환경 설정 가이드

## Windows 환경에서 빠른 시작

### 1. 필수 프로그램 설치

#### Docker Desktop 설치 (권장)
1. [Docker Desktop for Windows](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe) 다운로드
2. 설치 후 시스템 재시작
3. Docker Desktop 실행 및 설정 완료

#### 또는 Node.js 직접 설치
1. [Node.js 18 LTS](https://nodejs.org/en/download/) 다운로드 및 설치
2. [PostgreSQL 15](https://www.postgresql.org/download/windows/) 다운로드 및 설치
3. [Redis for Windows](https://github.com/microsoftarchive/redis/releases) 다운로드 및 설치

### 2. 프로젝트 설정

```bash
# 프로젝트 디렉토리로 이동
cd C:\claude01\floor-producing\backend

# 의존성 설치
npm install

# 환경 변수 설정
copy .env.example .env
# .env 파일 편집 필요
```

### 3. 환경 변수 설정 (.env)

```env
# 서버 설정
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:19006

# 데이터베이스 설정 (로컬)
DATABASE_URL=postgresql://postgres:password@localhost:5432/floor_producing
REDIS_URL=redis://localhost:6379

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-for-development
REFRESH_TOKEN_EXPIRES_IN=30d

# 로그 설정
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/app.log
```

### 4. 데이터베이스 설정

#### PostgreSQL 설정
```sql
-- PostgreSQL에 연결한 후 실행
CREATE DATABASE floor_producing;
CREATE USER floor_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE floor_producing TO floor_user;
```

#### Prisma 마이그레이션
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션
npx prisma migrate dev --name init

# 테스트 데이터 추가 (선택사항)
npm run db:seed
```

### 5. 서버 시작

```bash
# 개발 서버 시작
npm run dev

# 또는 빌드 후 프로덕션 모드
npm run build
npm start
```

서버가 정상적으로 실행되면:
- API: http://localhost:3001
- 헬스체크: http://localhost:3001/health
- API 문서: http://localhost:3001/api-docs (개발 예정)

### 6. Docker 환경 (Docker Desktop 설치 후)

```bash
# Docker Compose 버전 확인
docker compose version

# 전체 스택 실행
docker compose up -d

# 로그 확인
docker compose logs -f api

# 서비스 중지
docker compose down
```

### 7. 개발 도구

#### VSCode 확장 프로그램 권장
- TypeScript 및 JavaScript
- Prisma
- Docker
- Thunder Client (API 테스트)

#### 유용한 명령어
```bash
# 타입 체크
npm run build

# 린팅
npm run lint

# 데이터베이스 스키마 확인
npx prisma studio

# Redis 연결 테스트
redis-cli ping

# PostgreSQL 연결 테스트
psql -h localhost -U postgres -d floor_producing
```

### 8. 문제 해결

#### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3001

# 프로세스 종료
taskkill /PID <PID번호> /F
```

#### 데이터베이스 연결 오류
1. PostgreSQL 서비스 실행 확인
2. 연결 정보 (.env) 확인
3. 방화벽 설정 확인

#### Redis 연결 오류
1. Redis 서비스 실행 확인
2. Windows Service 또는 수동 실행
3. 포트 6379 사용 가능 여부 확인

### 9. 프론트엔드 연결

React Native 앱에서 백엔드 연결 설정:

```javascript
// API 기본 URL
const API_BASE_URL = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// Socket.IO 연결
import io from 'socket.io-client';
const socket = io(SOCKET_URL, {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 10. 다음 단계

1. **API 테스트**: Thunder Client 또는 Postman으로 엔드포인트 테스트
2. **Socket.IO 테스트**: 브라우저 개발자 도구에서 실시간 연결 확인
3. **프론트엔드 연결**: React Native 앱에서 백엔드 API 호출 구현
4. **데이터 시드**: 실제 토너먼트 데이터로 테스트

---

이 가이드를 따라하시면 로컬 개발 환경에서 백엔드 서버를 실행할 수 있습니다. 
문제가 발생하면 각 단계별로 확인해주세요!