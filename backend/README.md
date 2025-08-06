# 🎬 WSOP Field Director Pro - Backend API

포커 대회 현장 총괄 관리를 위한 백엔드 API 서버입니다.

## 📋 목차
- [아키텍처 개요](#아키텍처-개요)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [API 엔드포인트](#api-엔드포인트)
- [실시간 통신](#실시간-통신)
- [배포](#배포)
- [모니터링](#모니터링)

## 🏗️ 아키텍처 개요

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │────│   Load Balancer │────│   ECS Fargate   │
│      App        │    │      (ALB)      │    │     Cluster     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │   API Gateway   │─────────────┤
                       │   + Socket.IO   │             │
                       └─────────────────┘             │
                                │                       │
              ┌─────────────────┼─────────────────┐     │
              │                 │                 │     │
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │   PostgreSQL    │ │     Redis       │ │      S3         │
    │   Database      │ │     Cache       │ │   File Storage  │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🛠️ 기술 스택

### Core Technologies
- **Runtime**: Node.js 18 + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis 7
- **Real-time**: Socket.IO
- **Authentication**: JWT + Redis Sessions

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Cloud**: AWS (ECS Fargate, RDS, ElastiCache, S3)
- **Monitoring**: CloudWatch + Winston Logging
- **CI/CD**: GitHub Actions

### Security
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: TLS/SSL, encrypted storage
- **Rate Limiting**: Express Rate Limit + Redis

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### 로컬 개발 환경 설정

1. **저장소 클론**
```bash
git clone <repository-url>
cd floor-producing/backend
```

2. **환경 변수 설정**
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 값들을 설정
```

3. **의존성 설치**
```bash
npm install
```

4. **데이터베이스 설정**
```bash
# Docker Compose로 PostgreSQL & Redis 실행
docker-compose up -d postgres redis

# Prisma 마이그레이션
npm run db:migrate

# 데이터 시드 (선택사항)
npm run db:seed
```

5. **개발 서버 시작**
```bash
npm run dev
```

서버가 http://localhost:3001 에서 실행됩니다.

### Docker로 전체 스택 실행

```bash
# 전체 서비스 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f api
```

## 📡 API 엔드포인트

### 인증 (Authentication)
```
POST   /api/auth/register      # 사용자 등록
POST   /api/auth/login         # 로그인
POST   /api/auth/refresh       # 토큰 갱신
POST   /api/auth/logout        # 로그아웃
GET    /api/auth/profile       # 프로필 조회
POST   /api/auth/change-password # 비밀번호 변경
```

### 사용자 관리 (Users)
```
GET    /api/users              # 사용자 목록
GET    /api/users/:id          # 사용자 상세
PUT    /api/users/:id          # 사용자 정보 수정
DELETE /api/users/:id          # 사용자 삭제
```

### 팀 관리 (Teams)
```
GET    /api/teams              # 팀 목록 조회
GET    /api/teams/:id          # 팀 상세 조회
PATCH  /api/teams/members/:id/status # 팀원 상태 변경
GET    /api/teams/stats/members      # 팀원 통계
GET    /api/teams/online/members     # 온라인 팀원
GET    /api/teams/:id/progress       # 팀 진행률
GET    /api/teams/search             # 팀원 검색
```

### 체크리스트 (Checklists)
```
GET    /api/checklists         # 체크리스트 목록
POST   /api/checklists         # 체크리스트 생성
GET    /api/checklists/:id     # 체크리스트 상세
PUT    /api/checklists/:id     # 체크리스트 수정
DELETE /api/checklists/:id     # 체크리스트 삭제
PATCH  /api/checklists/items/:id # 체크리스트 항목 토글
GET    /api/checklists/progress    # 진행률 조회
```

### 프로덕션 상태 (Production)
```
GET    /api/production/status  # 현재 상태 조회
PUT    /api/production/status  # 상태 업데이트
GET    /api/production/history # 상태 히스토리
POST   /api/production/mode    # 운영 모드 변경
```

### 커뮤니케이션 (Communication)
```
GET    /api/communication/messages    # 메시지 목록
POST   /api/communication/messages    # 메시지 전송
GET    /api/communication/templates   # 템플릿 목록
POST   /api/communication/templates   # 템플릿 생성
GET    /api/communication/contacts    # 연락처 목록
```

### 긴급 상황 (Emergency)
```
GET    /api/emergency          # 긴급 상황 목록
POST   /api/emergency          # 긴급 상황 생성
PUT    /api/emergency/:id      # 긴급 상황 업데이트
DELETE /api/emergency/:id      # 긴급 상황 해결
GET    /api/emergency/active   # 활성 긴급 상황
```

### 파일 관리 (Files)
```
POST   /api/files/upload       # 파일 업로드
GET    /api/files/:id          # 파일 다운로드
DELETE /api/files/:id          # 파일 삭제
GET    /api/files              # 파일 목록
```

## 🔄 실시간 통신 (Socket.IO)

### 연결 설정
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 이벤트 목록

#### 시스템 이벤트
- `connect` - 연결 성공
- `disconnect` - 연결 해제
- `error` - 오류 발생
- `heartbeat` - 활동 상태 유지

#### 사용자 상태
- `userOnline` - 사용자 온라인
- `userOffline` - 사용자 오프라인
- `onlineUsers` - 온라인 사용자 목록

#### 프로덕션 이벤트
- `productionStatusUpdate` - 프로덕션 상태 업데이트
- `productionStatusChanged` - 프로덕션 상태 변경 알림
- `productionModeChanged` - 운영 모드 변경

#### 팀 관리
- `teamMemberStatusUpdate` - 팀원 상태 업데이트
- `teamMemberStatusChanged` - 팀원 상태 변경 알림

#### 체크리스트
- `checklistItemToggle` - 체크리스트 항목 토글
- `checklistUpdated` - 체크리스트 업데이트 알림

#### 메시지
- `sendMessage` - 메시지 전송
- `newMessage` - 새 메시지 수신

#### 긴급 상황
- `emergencyAlert` - 긴급 상황 알림

## 🚢 배포

### Docker 배포

1. **이미지 빌드**
```bash
docker build -t floor-producing-backend .
```

2. **프로덕션 환경 실행**
```bash
docker-compose -f docker-compose.yml --profile production up -d
```

### AWS 배포

1. **인프라 구성**
```bash
# CloudFormation 스택 생성
aws cloudformation create-stack \
  --stack-name floor-producing-infra \
  --template-body file://aws/cloudformation/infrastructure.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_NAMED_IAM
```

2. **ECS 서비스 배포**
```bash
# ECS 태스크 정의 등록
aws ecs register-task-definition --cli-input-json file://aws/ecs/task-definition.json

# ECS 서비스 생성
aws ecs create-service --cli-input-json file://aws/ecs/service.json
```

### 환경별 설정

#### Development
- 로컬 PostgreSQL/Redis
- 상세한 로깅
- Hot reload

#### Staging
- AWS RDS/ElastiCache
- 프로덕션과 유사한 환경
- 테스트 데이터

#### Production
- 고가용성 구성
- 자동 백업
- 모니터링/알림

## 📊 모니터링

### 로깅
- **Winston**: 구조화된 로깅
- **CloudWatch**: AWS 로그 집계
- **로그 레벨**: DEBUG, INFO, WARN, ERROR

### 메트릭
- **API 응답 시간**
- **데이터베이스 쿼리 성능**
- **Redis 캐시 히트율**
- **WebSocket 연결 수**

### 헬스체크
```bash
# 서비스 상태 확인
curl http://localhost:3001/health

# 응답 예시
{
  "status": "healthy",
  "timestamp": "2025-08-06T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 알림
- **긴급 상황**: Slack/Email 알림
- **서버 오류**: CloudWatch 알람
- **성능 저하**: 자동 모니터링

## 🔧 개발 도구

### 코드 품질
```bash
# 린팅
npm run lint

# 타입 체크
npm run build

# 테스트
npm test
```

### 데이터베이스 관리
```bash
# 마이그레이션 생성
npx prisma migrate dev --name migration_name

# 스키마 동기화
npx prisma db push

# 데이터베이스 리셋
npx prisma migrate reset
```

### 캐시 관리
```bash
# Redis 연결 테스트
redis-cli ping

# 캐시 초기화
redis-cli flushall
```

## 🐛 문제 해결

### 일반적인 이슈

1. **데이터베이스 연결 실패**
```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# 연결 테스트
docker-compose exec postgres psql -U postgres -d floor_producing
```

2. **Redis 연결 실패**
```bash
# Redis 상태 확인
docker-compose ps redis

# 연결 테스트
docker-compose exec redis redis-cli ping
```

3. **Socket.IO 연결 문제**
- CORS 설정 확인
- 토큰 유효성 검사
- 네트워크 방화벽 설정

4. **성능 이슈**
- 데이터베이스 인덱스 확인
- Redis 메모리 사용량 점검
- 로그 레벨 조정

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이센스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 지원

- **이슈 제보**: GitHub Issues
- **문서**: [API 문서](http://localhost:3001/api-docs)
- **팀 연락**: 지지 프로덕션

---

**WSOP Field Director Pro Backend** - 완벽한 현장 관리를 위한 강력한 API 서버 🚀