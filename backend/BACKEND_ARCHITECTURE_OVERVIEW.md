# 🏗️ WSOP Field Director Pro - 백엔드 서버 아키텍처

## 📋 시스템 개요

**WSOP Field Director Pro Backend**는 포커 토너먼트 현장 연출을 위한 종합 관리 시스템입니다.

### 🎯 **핵심 목적**
- 포커 대회 현장에서 11-15명 팀원들의 업무 조율
- 99% 완벽한 사전 준비 + 1% 현장 대응 시스템
- 실시간 방송 제작 워크플로우 관리

## 🏢 **아키텍처 구조**

### 📚 **기술 스택**
```
프레임워크: Node.js 18+ + Express.js 4.18
언어: TypeScript 5.3
데이터베이스: SQLite (개발) / PostgreSQL (프로덕션)
ORM: Prisma 5.7
인증: JWT + bcryptjs
실시간: Socket.IO 4.7
캐싱: Redis 4.6 (옵션)
```

### 🏗️ **폴더 구조**
```
backend/
├── src/
│   ├── server.ts           # 메인 서버 (완전 구현)
│   ├── simple-server.ts    # 간소화 서버 (현재 실행 중)
│   ├── database/
│   │   ├── connection.ts   # 데이터베이스 연결 관리
│   │   └── redis.ts        # Redis 캐싱 (미사용)
│   ├── middleware/
│   │   ├── auth.ts         # JWT 인증 미들웨어
│   │   └── errorHandler.ts # 전역 에러 처리
│   ├── routes/
│   │   ├── auth.ts         # 인증 라우트
│   │   ├── users.ts        # 사용자 관리
│   │   ├── teams.ts        # 팀 관리
│   │   ├── checklists.ts   # 체크리스트 관리
│   │   ├── production.ts   # 프로덕션 상태
│   │   ├── emergency.ts    # 긴급 상황
│   │   └── communication.ts # 커뮤니케이션
│   ├── sockets/
│   │   └── socketHandler.ts # 실시간 통신
│   └── utils/
│       └── logger.ts       # 로깅 시스템
├── prisma/
│   ├── schema.prisma       # PostgreSQL 스키마
│   ├── schema-sqlite.prisma # SQLite 스키마 (현재 사용)
│   └── migrations/         # 데이터베이스 마이그레이션
├── admin/                  # 웹 관리 패널
│   ├── index.html         # 관리 대시보드 UI
│   └── app.js             # Alpine.js 프론트엔드
└── aws/
    └── cloudformation/     # AWS 인프라 정의
```

## 🚀 **현재 실행 중인 서버**

### 📍 **Simple Server (simple-server.ts)**
- **목적**: 빠른 프로토타이핑 및 테스트
- **포트**: 3003
- **특징**: 단일 파일, 필수 기능만 구현

```typescript
// 핵심 구성 요소
const app = express();
const prisma = new PrismaClient();

// 미들웨어
app.use(cors());
app.use(express.json());
app.use('/admin', express.static(...)); // 관리 패널

// 주요 엔드포인트
GET  /                      # API 정보
GET  /health               # 헬스 체크
POST /api/auth/register    # 사용자 등록
POST /api/auth/login       # 로그인
GET  /api/auth/profile     # 프로필 조회
GET  /api/users           # 사용자 목록 (인증 필요)
GET  /api/db-status       # DB 상태
```

## 🗄️ **데이터베이스 설계**

### 📊 **핵심 모델 (10개)**

#### 👤 **User (사용자)**
```typescript
{
  id: string          # UUID
  email: string       # 유니크
  password: string    # bcrypt 해시
  name: string        # 표시명
  role: string        # DIRECTOR | FIELD_MEMBER | TECHNICAL_DIRECTOR
  avatar?: string     # 프로필 이미지
  phone?: string      # 연락처
  isActive: boolean   # 활성 상태
  lastLogin?: DateTime
  timezone: string    # 기본: Asia/Seoul
}
```

#### 🏆 **Tournament (토너먼트)**
```typescript
{
  id: string
  name: string        # "WSOP Super Circuit CYPRUS 2024"
  location: string    # "Merit Crystal Cove, Cyprus"
  timezone: string    # "Europe/Athens"
  startDate: DateTime
  endDate: DateTime
  status: string      # UPCOMING | ACTIVE | COMPLETED
  description?: string
}
```

#### ✅ **ChecklistTemplate (체크리스트)**
```typescript
{
  id: string
  name: string        # "카메라 셋업"
  category: string    # TECHNICAL | CONTENT | LOGISTICS
  timeSlot: string    # MORNING | PRODUCTION | EVENING
  priority: string    # LOW | MEDIUM | HIGH | CRITICAL
  items: ChecklistItem[]
}
```

#### 👥 **Team (팀)**
```typescript
{
  id: string
  name: string        # "카메라 팀"
  description: string
  tournamentId: string
  leaderId: string    # 팀장
  members: TeamMember[]
}
```

#### 📅 **Schedule (일정)**
```typescript
{
  id: string
  title: string
  description?: string
  startTime: DateTime
  endTime: DateTime
  type: string        # MEETING | PRODUCTION | BREAK
  location?: string
  assignedUserId?: string
}
```

### 🔗 **관계 구조**
- User ↔ Tournament (다대다): 역할별 참여
- User ↔ Team (다대다): 팀 멤버십
- Tournament ↔ Team (일대다): 토너먼트별 팀 구성
- ChecklistTemplate ↔ ChecklistItem (일대다)
- User ↔ ChecklistItem (다대다): 완료 상태 추적

## 🔐 **보안 시스템**

### 🎫 **JWT 인증**
```typescript
// 토큰 구조
{
  userId: string,
  iat: number,     # 발급 시간
  exp: number      # 만료 시간 (7일)
}

// 헤더 형식
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 🛡️ **보안 기능**
- ✅ **비밀번호 해싱**: bcrypt (12 rounds)
- ✅ **토큰 검증**: JWT 기반 stateless 인증
- ✅ **CORS 정책**: 프론트엔드 도메인만 허용
- ✅ **입력 검증**: express-validator
- ✅ **Rate Limiting**: 요청 수 제한
- ✅ **보호된 라우트**: 인증 미들웨어

## 🌐 **API 설계**

### 📡 **RESTful 엔드포인트**

#### 🔐 **인증 (/api/auth)**
```
POST /api/auth/register     # 사용자 등록
POST /api/auth/login        # 로그인
GET  /api/auth/profile      # 프로필 조회
POST /api/auth/logout       # 로그아웃
POST /api/auth/refresh      # 토큰 갱신
```

#### 👥 **사용자 관리 (/api/users)**
```
GET    /api/users           # 목록 조회
GET    /api/users/:id       # 상세 조회  
POST   /api/users           # 생성
PUT    /api/users/:id       # 수정
DELETE /api/users/:id       # 삭제
```

#### 🏆 **토너먼트 (/api/tournaments)**
```
GET    /api/tournaments     # 목록 조회
POST   /api/tournaments     # 생성
GET    /api/tournaments/:id # 상세 조회
PUT    /api/tournaments/:id # 수정
```

### 📊 **응답 형식**
```typescript
// 성공 응답
{
  success: true,
  data: any,
  message?: string
}

// 에러 응답
{
  success: false,
  error: string,
  code: number
}
```

## ⚡ **실시간 통신 (Socket.IO)**

### 📡 **실시간 이벤트**
```typescript
// 클라이언트 → 서버
'join-tournament'     # 토너먼트 참여
'checklist-update'    # 체크리스트 상태 변경
'emergency-alert'     # 긴급 상황 알림
'team-message'        # 팀 메시지

// 서버 → 클라이언트  
'tournament-update'   # 토너먼트 상태 변경
'checklist-completed' # 체크리스트 완료
'emergency-broadcast' # 긴급 방송
'user-status-change'  # 사용자 상태 변경
```

## 🎛️ **관리 대시보드**

### 🖥️ **웹 관리 패널** (localhost:3003/admin)
- **프레임워크**: Alpine.js + Tailwind CSS
- **인증**: JWT 토큰 기반
- **기능**: 
  - 📊 실시간 대시보드
  - 👥 사용자 관리
  - 🏆 토너먼트 관리
  - ✅ 체크리스트 관리
  - 📅 일정 관리
  - 👥 팀 관리

### 📱 **반응형 UI**
- 데스크톱/태블릿 최적화
- 현장에서 사용 가능한 모바일 뷰
- 한국어 로컬라이제이션

## 🔧 **환경 설정**

### 📋 **.env 구성**
```bash
# 서버
NODE_ENV=development
PORT=3003
FRONTEND_URL=http://localhost:19006

# 데이터베이스
DATABASE_URL=file:./dev.db

# 보안
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# AWS (프로덕션)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-2

# 기타
DEFAULT_TIMEZONE=Asia/Seoul
TOURNAMENT_TIMEZONE=Europe/Athens
```

## 🚀 **배포 아키텍처**

### ☁️ **AWS 인프라** (cloudformation/)
- **EC2**: 서버 호스팅
- **RDS**: PostgreSQL 데이터베이스
- **ElastiCache**: Redis 캐싱
- **S3**: 파일 저장소
- **CloudFront**: CDN
- **Route 53**: DNS 관리
- **ALB**: 로드 밸런싱

### 🐳 **컨테이너화** (Docker)
- **Base**: Node.js 18 Alpine
- **Multi-stage build**: 빌드 최적화
- **Health checks**: 컨테이너 상태 모니터링

## 📈 **성능 & 모니터링**

### ⚡ **성능 최적화**
- **Connection Pooling**: 데이터베이스 연결 풀
- **Redis Caching**: 자주 조회되는 데이터
- **Compression**: gzip 압축
- **Rate Limiting**: API 호출 제한

### 📊 **모니터링**
- **Winston**: 구조화된 로깅
- **Health Checks**: `/health` 엔드포인트
- **Error Tracking**: 에러 로그 수집
- **Performance Metrics**: 응답 시간 추적

## 🎯 **현재 상태**

### ✅ **완료된 기능**
- 🔐 JWT 인증 시스템
- 👥 사용자 관리 (CRUD)
- 🗄️ SQLite 데이터베이스
- 🌐 RESTful API
- 🎛️ 웹 관리 패널
- 📡 정적 파일 서빙

### 🔄 **개발 중/계획**
- ⚡ Socket.IO 실시간 통신
- 📝 체크리스트 API
- 🏆 토너먼트 관리 API
- 👥 팀 관리 시스템
- 🚨 긴급 상황 대응
- ☁️ AWS 배포

## 🏃‍♂️ **실행 방법**

### 💻 **로컬 개발**
```bash
cd floor-producing/backend

# 의존성 설치
npm install

# 환경 설정
cp .env.example .env

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 관리자 계정 생성
node create-admin.js

# 서버 실행
npx ts-node src/simple-server.ts
```

### 🌐 **접속 정보**
- **API**: http://localhost:3003
- **관리 패널**: http://localhost:3003/admin
- **계정**: director@wsop.com / director123

---

**이 아키텍처는 WSOP Super Circuit CYPRUS 2024 포커 대회 현장에서 11-15명의 방송 제작팀이 완벽하게 조율된 작업을 수행할 수 있도록 설계되었습니다.** 🎬🃏