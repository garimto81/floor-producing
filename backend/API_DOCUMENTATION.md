# WSOP Field Director Pro - API 문서

## 개요

WSOP Field Director Pro는 포커 토너먼트 현장 운영을 위한 통합 관리 시스템입니다. 이 API 문서는 백엔드 시스템의 모든 엔드포인트와 사용법을 상세히 설명합니다.

### 기본 정보
- **베이스 URL**: `https://wsop-field-director-backend.vercel.app`
- **개발 URL**: `http://localhost:3001`
- **API 버전**: v1
- **인증 방식**: JWT Bearer Token
- **응답 형식**: JSON

## 목차

1. [인증 시스템](#인증-시스템)
2. [사용자 관리](#사용자-관리)
3. [팀 관리](#팀-관리)
4. [체크리스트 API](#체크리스트-api)
5. [프로덕션 관리](#프로덕션-관리)
6. [커뮤니케이션](#커뮤니케이션)
7. [긴급상황 관리](#긴급상황-관리)
8. [파일 관리](#파일-관리)
9. [실시간 통신 (Socket.IO)](#실시간-통신-socketio)
10. [에러 코드](#에러-코드)

## 인증 시스템

### JWT 토큰 기반 인증

모든 보호된 API 엔드포인트는 `Authorization` 헤더에 Bearer 토큰이 필요합니다.

```http
Authorization: Bearer <JWT_TOKEN>
```

### 1. 회원가입

사용자 계정을 생성합니다.

```http
POST /api/auth/register
```

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "홍길동",
  "phone": "+82-10-1234-5678",
  "role": "FIELD_MEMBER"
}
```

**응답:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "FIELD_MEMBER",
    "phone": "+82-10-1234-5678",
    "createdAt": "2025-08-06T10:00:00Z"
  }
}
```

### 2. 로그인

사용자 인증 및 토큰 발급을 수행합니다.

```http
POST /api/auth/login
```

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**응답:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "FIELD_MEMBER",
    "avatar": null,
    "phone": "+82-10-1234-5678",
    "tournament": {
      "id": "tournament-uuid",
      "name": "WSOP 2025 Main Event",
      "role": "FIELD_MEMBER"
    }
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### 3. 토큰 갱신

만료된 액세스 토큰을 갱신합니다.

```http
POST /api/auth/refresh
```

**요청 본문:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**응답:**
```json
{
  "tokens": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token"
  }
}
```

### 4. 로그아웃

사용자 세션을 종료하고 토큰을 무효화합니다.

```http
POST /api/auth/logout
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**응답:**
```json
{
  "message": "Logout successful"
}
```

### 5. 비밀번호 변경

현재 로그인된 사용자의 비밀번호를 변경합니다.

```http
POST /api/auth/change-password
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**응답:**
```json
{
  "message": "Password changed successfully"
}
```

### 6. 프로필 조회

현재 로그인된 사용자의 프로필을 조회합니다.

```http
GET /api/auth/profile
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "FIELD_MEMBER",
    "avatar": null,
    "phone": "+82-10-1234-5678",
    "timezone": "Asia/Seoul",
    "isActive": true,
    "lastLogin": "2025-08-06T10:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z",
    "tournaments": [
      {
        "tournament": {
          "id": "tournament-uuid",
          "name": "WSOP 2025 Main Event",
          "location": "Las Vegas",
          "status": "ACTIVE"
        }
      }
    ]
  }
}
```

## 사용자 관리

### 1. 사용자 목록 조회 (관리자만)

```http
GET /api/users
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지 크기 (기본값: 10)
- `search`: 검색어 (이름, 이메일)
- `role`: 역할 필터
- `isActive`: 활성 상태 필터

**응답:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "role": "FIELD_MEMBER",
      "avatar": null,
      "phone": "+82-10-1234-5678",
      "isActive": true,
      "lastLogin": "2025-08-06T10:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 2. 특정 사용자 조회

```http
GET /api/users/:userId
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "FIELD_MEMBER",
    "avatar": null,
    "phone": "+82-10-1234-5678",
    "timezone": "Asia/Seoul",
    "isActive": true,
    "lastLogin": "2025-08-06T10:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z",
    "tournaments": [
      {
        "tournament": {
          "id": "tournament-uuid",
          "name": "WSOP 2025 Main Event",
          "location": "Las Vegas",
          "status": "ACTIVE"
        }
      }
    ]
  }
}
```

### 3. 사용자 정보 수정

```http
PUT /api/users/:userId
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "name": "홍길동",
  "phone": "+82-10-1234-5678",
  "timezone": "Asia/Seoul",
  "avatar": "https://example.com/avatar.jpg"
}
```

**응답:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "FIELD_MEMBER",
    "avatar": "https://example.com/avatar.jpg",
    "phone": "+82-10-1234-5678",
    "timezone": "Asia/Seoul",
    "isActive": true,
    "updatedAt": "2025-08-06T10:00:00Z"
  }
}
```

### 4. 사용자 상태 변경 (관리자만)

```http
PATCH /api/users/:userId/status
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "isActive": false
}
```

**응답:**
```json
{
  "message": "User deactivated successfully",
  "user": {
    "id": "uuid",
    "name": "홍길동",
    "email": "user@example.com",
    "isActive": false
  }
}
```

### 5. 사용자 통계 (관리자만)

```http
GET /api/users/stats/overview
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "stats": {
    "total": 100,
    "active": 85,
    "inactive": 15,
    "recentLogins": 42,
    "byRole": {
      "ADMIN": 2,
      "FIELD_DIRECTOR": 5,
      "FIELD_MEMBER": 80,
      "HQ_MANAGER": 8,
      "TECHNICAL_SUPPORT": 5
    }
  }
}
```

## 팀 관리

### 1. 팀 목록 조회

```http
GET /api/teams
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "teams": [
    {
      "id": "team-uuid",
      "name": "Table Team 1",
      "color": "#FF5733",
      "members": [
        {
          "id": "member-uuid",
          "position": "Team Leader",
          "status": "ACTIVE",
          "user": {
            "id": "user-uuid",
            "name": "홍길동",
            "email": "user@example.com",
            "avatar": null,
            "phone": "+82-10-1234-5678",
            "role": "FIELD_MEMBER"
          }
        }
      ]
    }
  ]
}
```

### 2. 특정 팀 조회

```http
GET /api/teams/:teamId
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "team": {
    "id": "team-uuid",
    "name": "Table Team 1",
    "color": "#FF5733",
    "members": [
      {
        "id": "member-uuid",
        "position": "Team Leader",
        "status": "ACTIVE",
        "user": {
          "id": "user-uuid",
          "name": "홍길동",
          "email": "user@example.com",
          "avatar": null,
          "phone": "+82-10-1234-5678",
          "role": "FIELD_MEMBER",
          "lastLogin": "2025-08-06T10:00:00Z"
        }
      }
    ]
  }
}
```

### 3. 팀원 상태 업데이트

```http
PATCH /api/teams/members/:memberId/status
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "status": "BREAK"
}
```

**응답:**
```json
{
  "message": "Team member status updated successfully",
  "member": {
    "id": "member-uuid",
    "status": "BREAK",
    "user": {
      "id": "user-uuid",
      "name": "홍길동"
    }
  }
}
```

### 4. 팀원 상태 통계

```http
GET /api/teams/stats/members
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "stats": {
    "total": 50,
    "byStatus": {
      "ACTIVE": 35,
      "BREAK": 8,
      "OFFLINE": 5,
      "EMERGENCY": 2
    }
  }
}
```

### 5. 온라인 팀원 목록

```http
GET /api/teams/online/members
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "onlineMembers": [
    {
      "id": "member-uuid",
      "position": "Team Leader",
      "status": "ACTIVE",
      "user": {
        "id": "user-uuid",
        "name": "홍길동",
        "avatar": null,
        "role": "FIELD_MEMBER"
      },
      "team": {
        "id": "team-uuid",
        "name": "Table Team 1",
        "color": "#FF5733"
      }
    }
  ],
  "totalOnline": 35,
  "lastUpdated": "2025-08-06T10:00:00Z"
}
```

### 6. 팀별 업무 진행률

```http
GET /api/teams/:teamId/progress
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "team": {
    "id": "team-uuid",
    "name": "Table Team 1"
  },
  "averageProgress": 85,
  "memberProgress": [
    {
      "userId": "user-uuid",
      "userName": "홍길동",
      "totalItems": 20,
      "completedItems": 17,
      "progress": 85
    }
  ],
  "lastUpdated": "2025-08-06T10:00:00Z"
}
```

### 7. 팀원 검색

```http
GET /api/teams/search
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `q`: 검색어
- `status`: 상태 필터
- `role`: 역할 필터

**응답:**
```json
{
  "results": [
    {
      "id": "member-uuid",
      "position": "Team Leader",
      "status": "ACTIVE",
      "user": {
        "id": "user-uuid",
        "name": "홍길동",
        "email": "user@example.com",
        "avatar": null,
        "role": "FIELD_MEMBER",
        "lastLogin": "2025-08-06T10:00:00Z"
      },
      "team": {
        "id": "team-uuid",
        "name": "Table Team 1",
        "color": "#FF5733"
      }
    }
  ],
  "totalFound": 15,
  "query": {
    "q": "홍길동",
    "status": "ACTIVE",
    "role": "FIELD_MEMBER"
  }
}
```

## 체크리스트 API

### 1. 체크리스트 템플릿 목록

```http
GET /api/checklists/templates
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `timeSlot`: 시간대 필터 (MORNING, PRODUCTION, EVENING)
- `category`: 카테고리 필터

**응답:**
```json
{
  "templates": [
    {
      "id": "template-uuid",
      "name": "아침 체크리스트",
      "timeSlot": "MORNING",
      "category": "SETUP",
      "priority": "HIGH",
      "items": [
        {
          "id": "item-uuid",
          "title": "장비 점검",
          "description": "모든 장비가 정상 작동하는지 확인",
          "order": 1
        }
      ],
      "_count": {
        "items": 5
      }
    }
  ]
}
```

### 2. 내 체크리스트 진행상황

```http
GET /api/checklists/my-progress
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `date`: 날짜 (YYYY-MM-DD 형식, 기본값: 오늘)

**응답:**
```json
{
  "date": "2025-08-06",
  "overallProgress": 75,
  "totalItems": 20,
  "totalCompleted": 15,
  "templates": [
    {
      "templateId": "template-uuid",
      "templateName": "아침 체크리스트",
      "timeSlot": "MORNING",
      "category": "SETUP",
      "priority": "HIGH",
      "totalItems": 5,
      "completedItems": 4,
      "progress": 80,
      "items": [
        {
          "id": "item-uuid",
          "title": "장비 점검",
          "description": "모든 장비가 정상 작동하는지 확인",
          "order": 1,
          "isChecked": true,
          "checkedAt": "2025-08-06T09:00:00Z",
          "notes": "모든 장비 정상"
        }
      ]
    }
  ]
}
```

### 3. 체크리스트 항목 토글

```http
PATCH /api/checklists/items/:itemId/toggle
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "isChecked": true,
  "notes": "모든 장비 정상 확인",
  "date": "2025-08-06"
}
```

**응답:**
```json
{
  "message": "Checklist item updated successfully",
  "item": {
    "id": "user-item-uuid",
    "isChecked": true,
    "checkedAt": "2025-08-06T09:00:00Z",
    "notes": "모든 장비 정상 확인",
    "date": "2025-08-06T00:00:00Z",
    "title": "장비 점검",
    "description": "모든 장비가 정상 작동하는지 확인"
  }
}
```

### 4. 팀 전체 진행률 (현장 총괄만)

```http
GET /api/checklists/team-progress
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `date`: 날짜 (YYYY-MM-DD 형식, 기본값: 오늘)

**응답:**
```json
{
  "date": "2025-08-06",
  "averageProgress": 78,
  "totalUsers": 50,
  "userProgress": [
    {
      "user": {
        "id": "user-uuid",
        "name": "홍길동",
        "role": "FIELD_MEMBER",
        "avatar": null
      },
      "role": "FIELD_MEMBER",
      "totalItems": 20,
      "completedItems": 18,
      "progress": 90
    }
  ]
}
```

### 5. 템플릿별 완료율 통계

```http
GET /api/checklists/stats/templates
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `date`: 날짜 (YYYY-MM-DD 형식)
- `timeSlot`: 시간대 필터

**응답:**
```json
{
  "date": "2025-08-06",
  "timeSlot": "all",
  "templates": [
    {
      "templateId": "template-uuid",
      "name": "아침 체크리스트",
      "timeSlot": "MORNING",
      "category": "SETUP",
      "priority": "HIGH",
      "overallCompletionRate": 85,
      "totalItems": 5,
      "items": [
        {
          "itemId": "item-uuid",
          "title": "장비 점검",
          "totalAssignments": 50,
          "completedAssignments": 42,
          "completionRate": 84
        }
      ]
    }
  ]
}
```

### 6. 미완료 체크리스트 알림

```http
GET /api/checklists/pending-items
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `priority`: 우선순위 필터
- `timeSlot`: 시간대 필터

**응답:**
```json
{
  "date": "2025-08-06",
  "totalPending": 5,
  "byPriority": {
    "CRITICAL": [
      {
        "id": "item-uuid",
        "title": "긴급 장비 점검",
        "description": "중요 장비 상태 확인",
        "template": {
          "id": "template-uuid",
          "name": "긴급 체크리스트",
          "timeSlot": "PRODUCTION",
          "priority": "CRITICAL"
        }
      }
    ],
    "HIGH": [],
    "MEDIUM": [],
    "LOW": []
  },
  "items": [
    {
      "id": "item-uuid",
      "title": "긴급 장비 점검",
      "description": "중요 장비 상태 확인",
      "template": {
        "id": "template-uuid",
        "name": "긴급 체크리스트",
        "timeSlot": "PRODUCTION",
        "priority": "CRITICAL"
      }
    }
  ]
}
```

## 프로덕션 관리

### 1. 현재 프로덕션 상태 조회

```http
GET /api/production/status
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "status": {
    "id": "status-uuid",
    "tournamentId": "tournament-uuid",
    "mode": "PRODUCTION",
    "featureTable": "Main Event Final Table",
    "streamQuality": "4K",
    "uploadSpeed": 95.5,
    "teamStatus": {
      "total": 50,
      "active": 42,
      "break": 6,
      "offline": 2
    },
    "currentIssues": null,
    "nextSchedule": "2025-08-06T20:00:00Z",
    "updatedAt": "2025-08-06T15:30:00Z"
  }
}
```

### 2. 프로덕션 상태 업데이트 (현장 총괄 이상)

```http
PUT /api/production/status
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "mode": "PRODUCTION",
  "featureTable": "Main Event Final Table",
  "streamQuality": "4K",
  "uploadSpeed": 95.5,
  "teamStatus": {
    "total": 50,
    "active": 42,
    "break": 6,
    "offline": 2
  },
  "currentIssues": null,
  "nextSchedule": "2025-08-06T20:00:00Z"
}
```

**응답:**
```json
{
  "message": "Production status updated successfully",
  "status": {
    "id": "status-uuid",
    "tournamentId": "tournament-uuid",
    "mode": "PRODUCTION",
    "featureTable": "Main Event Final Table",
    "streamQuality": "4K",
    "uploadSpeed": 95.5,
    "teamStatus": {
      "total": 50,
      "active": 42,
      "break": 6,
      "offline": 2
    },
    "currentIssues": null,
    "nextSchedule": "2025-08-06T20:00:00Z",
    "updatedAt": "2025-08-06T15:30:00Z"
  }
}
```

### 3. 프로덕션 모드 빠른 변경

```http
PATCH /api/production/mode
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "mode": "EMERGENCY",
  "reason": "스트리밍 장비 이상"
}
```

**응답:**
```json
{
  "message": "Production mode changed to EMERGENCY",
  "status": {
    "id": "status-uuid",
    "mode": "EMERGENCY",
    "currentIssues": "스트리밍 장비 이상",
    "updatedAt": "2025-08-06T15:35:00Z"
  }
}
```

### 4. 프로덕션 상태 히스토리

```http
GET /api/production/history
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `days`: 조회 기간 (기본값: 7일)
- `mode`: 모드 필터

**응답:**
```json
{
  "history": [
    {
      "id": "status-uuid",
      "mode": "EMERGENCY",
      "featureTable": "Main Event Final Table",
      "currentIssues": "스트리밍 장비 이상",
      "updatedAt": "2025-08-06T15:35:00Z"
    }
  ],
  "period": {
    "startDate": "2025-07-30T15:35:00Z",
    "endDate": "2025-08-06T15:35:00Z",
    "days": 7
  },
  "statistics": {
    "totalRecords": 45,
    "modeDistribution": {
      "NORMAL": 25,
      "PRODUCTION": 18,
      "EMERGENCY": 2
    }
  }
}
```

### 5. 실시간 메트릭 조회

```http
GET /api/production/metrics/realtime
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "metrics": {
    "timestamp": "2025-08-06T15:35:00Z",
    "productionMode": "PRODUCTION",
    "streamQuality": "4K",
    "uploadSpeed": 95.5,
    "featureTable": "Main Event Final Table",
    "teamStatus": {
      "total": 50,
      "byStatus": {
        "ACTIVE": 42,
        "BREAK": 6,
        "OFFLINE": 2
      },
      "online": 35
    },
    "checklistProgress": {
      "overall": 85,
      "total": 100,
      "completed": 85
    },
    "activeEmergencies": 0,
    "lastUpdate": "2025-08-06T15:30:00Z"
  }
}
```

### 6. 시스템 상태 체크

```http
GET /api/production/health-check
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-06T15:35:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "production": "active"
  },
  "production": {
    "mode": "PRODUCTION",
    "lastUpdate": "2025-08-06T15:30:00Z",
    "activeEmergencies": 0
  },
  "tournament": {
    "id": "tournament-uuid"
  }
}
```

## 커뮤니케이션

### 1. 메시지 목록 조회

```http
GET /api/communication/messages
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지 크기 (기본값: 20)
- `type`: 메시지 타입 필터
- `unreadOnly`: 읽지 않은 메시지만 조회

**응답:**
```json
{
  "messages": [
    {
      "id": "message-uuid",
      "subject": "긴급 공지",
      "content": "메인 이벤트 일정 변경 안내",
      "type": "BROADCAST",
      "priority": "HIGH",
      "isRead": false,
      "createdAt": "2025-08-06T14:00:00Z",
      "sender": {
        "id": "sender-uuid",
        "name": "필드 디렉터",
        "avatar": null,
        "role": "FIELD_DIRECTOR"
      },
      "files": [
        {
          "id": "file-uuid",
          "filename": "schedule-change.pdf",
          "originalName": "일정변경공지.pdf",
          "url": "/api/files/schedule-change.pdf",
          "size": 524288
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "pages": 2
  }
}
```

### 2. 메시지 전송

```http
POST /api/communication/messages
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "recipientId": "user-uuid",
  "type": "GENERAL",
  "subject": "회의 일정",
  "content": "내일 오전 9시 회의실에서 브리핑이 있습니다.",
  "priority": "MEDIUM"
}
```

**응답:**
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": "message-uuid",
    "subject": "회의 일정",
    "content": "내일 오전 9시 회의실에서 브리핑이 있습니다.",
    "type": "GENERAL",
    "priority": "MEDIUM",
    "createdAt": "2025-08-06T15:00:00Z",
    "sender": {
      "id": "sender-uuid",
      "name": "홍길동",
      "avatar": null,
      "role": "FIELD_MEMBER"
    }
  }
}
```

### 3. 메시지 읽음 처리

```http
PATCH /api/communication/messages/:messageId/read
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "message": "Message marked as read"
}
```

### 4. 메시지 템플릿 목록

```http
GET /api/communication/templates
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `category`: 카테고리 필터
- `search`: 검색어

**응답:**
```json
{
  "templates": [
    {
      "id": "template-uuid",
      "subject": "브리핑 공지",
      "content": "{{time}}에 {{location}}에서 브리핑이 있습니다.",
      "category": "MEETING",
      "priority": "MEDIUM",
      "createdAt": "2025-08-01T00:00:00Z"
    }
  ],
  "groupedByCategory": {
    "MEETING": [
      {
        "id": "template-uuid",
        "subject": "브리핑 공지",
        "content": "{{time}}에 {{location}}에서 브리핑이 있습니다.",
        "category": "MEETING",
        "priority": "MEDIUM",
        "createdAt": "2025-08-01T00:00:00Z"
      }
    ]
  },
  "categories": ["MEETING", "ANNOUNCEMENT", "URGENT"]
}
```

### 5. 메시지 템플릿 생성

```http
POST /api/communication/templates
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "subject": "일일 브리핑",
  "content": "{{date}} {{time}}에 {{location}}에서 일일 브리핑이 있습니다. 필참 바랍니다.",
  "category": "MEETING",
  "priority": "MEDIUM"
}
```

**응답:**
```json
{
  "message": "Template created successfully",
  "template": {
    "id": "template-uuid",
    "subject": "일일 브리핑",
    "content": "{{date}} {{time}}에 {{location}}에서 일일 브리핑이 있습니다. 필참 바랍니다.",
    "category": "MEETING",
    "priority": "MEDIUM",
    "createdAt": "2025-08-06T15:00:00Z"
  }
}
```

### 6. 연락처 목록 조회

```http
GET /api/communication/contacts
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `role`: 역할 필터
- `search`: 검색어

**응답:**
```json
{
  "contacts": [
    {
      "id": "tournament-user-uuid",
      "role": "FIELD_MEMBER",
      "isOnline": true,
      "user": {
        "id": "user-uuid",
        "name": "홍길동",
        "email": "user@example.com",
        "avatar": null,
        "phone": "+82-10-1234-5678",
        "lastLogin": "2025-08-06T14:00:00Z"
      }
    }
  ],
  "groupedByRole": {
    "FIELD_DIRECTOR": [],
    "FIELD_MEMBER": [
      {
        "id": "tournament-user-uuid",
        "role": "FIELD_MEMBER",
        "isOnline": true,
        "user": {
          "id": "user-uuid",
          "name": "홍길동",
          "email": "user@example.com",
          "avatar": null,
          "phone": "+82-10-1234-5678",
          "lastLogin": "2025-08-06T14:00:00Z"
        }
      }
    ]
  },
  "onlineCount": 35,
  "totalCount": 50
}
```

### 7. 빠른 연락처 조회

```http
GET /api/communication/contacts/frequent
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "contacts": [
    {
      "id": "user-uuid",
      "name": "홍길동",
      "email": "user@example.com",
      "avatar": null,
      "role": "FIELD_MEMBER",
      "messageCount": 15,
      "isOnline": true
    }
  ],
  "period": "30 days"
}
```

### 8. 읽지 않은 메시지 수

```http
GET /api/communication/unread-count
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "total": 5,
  "byType": {
    "GENERAL": 3,
    "BROADCAST": 2,
    "EMERGENCY": 0
  }
}
```

## 긴급상황 관리

### 1. 긴급 상황 목록 조회

```http
GET /api/emergency
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `status`: 상태 필터
- `type`: 타입 필터
- `severity`: 심각도 필터
- `page`: 페이지 번호
- `limit`: 페이지 크기

**응답:**
```json
{
  "emergencies": [
    {
      "id": "emergency-uuid",
      "type": "TECHNICAL",
      "severity": "HIGH",
      "title": "스트리밍 장비 오류",
      "description": "메인 카메라에서 신호가 끊어짐",
      "status": "ACTIVE",
      "resolution": null,
      "createdAt": "2025-08-06T15:30:00Z",
      "resolvedAt": null,
      "user": {
        "id": "user-uuid",
        "name": "기술팀 홍길동",
        "avatar": null,
        "role": "TECHNICAL_SUPPORT"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "pages": 1
  }
}
```

### 2. 활성 긴급 상황 조회

```http
GET /api/emergency/active
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "emergencies": [
    {
      "id": "emergency-uuid",
      "type": "TECHNICAL",
      "severity": "HIGH",
      "title": "스트리밍 장비 오류",
      "description": "메인 카메라에서 신호가 끊어짐",
      "status": "ACTIVE",
      "createdAt": "2025-08-06T15:30:00Z",
      "user": {
        "id": "user-uuid",
        "name": "기술팀 홍길동",
        "avatar": null,
        "role": "TECHNICAL_SUPPORT"
      }
    }
  ],
  "count": 1,
  "severityStats": {
    "CRITICAL": 0,
    "HIGH": 1,
    "MEDIUM": 0,
    "LOW": 0
  }
}
```

### 3. 긴급 상황 생성

```http
POST /api/emergency
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "type": "TECHNICAL",
  "severity": "HIGH",
  "title": "스트리밍 장비 오류",
  "description": "메인 카메라에서 신호가 끊어짐. 즉시 확인 필요."
}
```

**응답:**
```json
{
  "message": "Emergency created successfully",
  "emergency": {
    "id": "emergency-uuid",
    "type": "TECHNICAL",
    "severity": "HIGH",
    "title": "스트리밍 장비 오류",
    "description": "메인 카메라에서 신호가 끊어짐. 즉시 확인 필요.",
    "status": "ACTIVE",
    "createdAt": "2025-08-06T15:30:00Z",
    "user": {
      "id": "user-uuid",
      "name": "기술팀 홍길동",
      "avatar": null,
      "role": "TECHNICAL_SUPPORT"
    }
  }
}
```

### 4. 긴급 상황 업데이트

```http
PUT /api/emergency/:emergencyId
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문:**
```json
{
  "status": "RESOLVED",
  "resolution": "백업 카메라로 교체 완료. 스트리밍 정상화됨."
}
```

**응답:**
```json
{
  "message": "Emergency updated successfully",
  "emergency": {
    "id": "emergency-uuid",
    "type": "TECHNICAL",
    "severity": "HIGH",
    "title": "스트리밍 장비 오류",
    "status": "RESOLVED",
    "resolution": "백업 카메라로 교체 완료. 스트리밍 정상화됨.",
    "resolvedAt": "2025-08-06T15:45:00Z",
    "user": {
      "id": "user-uuid",
      "name": "기술팀 홍길동",
      "avatar": null,
      "role": "TECHNICAL_SUPPORT"
    }
  }
}
```

### 5. 긴급 상황 통계

```http
GET /api/emergency/stats/overview
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `days`: 조회 기간 (기본값: 30일)

**응답:**
```json
{
  "stats": {
    "period": {
      "startDate": "2025-07-07T15:00:00Z",
      "endDate": "2025-08-06T15:00:00Z",
      "days": 30
    },
    "totals": {
      "total": 12,
      "active": 1,
      "resolved": 10,
      "cancelled": 1
    },
    "distributions": {
      "byType": {
        "TECHNICAL": 6,
        "EQUIPMENT": 3,
        "NETWORK": 2,
        "SAFETY": 1
      },
      "bySeverity": {
        "CRITICAL": 1,
        "HIGH": 4,
        "MEDIUM": 5,
        "LOW": 2
      },
      "byStatus": {
        "RESOLVED": 10,
        "ACTIVE": 1,
        "CANCELLED": 1
      }
    },
    "metrics": {
      "averageResolutionTimeMinutes": 45,
      "resolutionRate": 83
    }
  }
}
```

### 6. 긴급 상황 히스토리

```http
GET /api/emergency/history
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `days`: 조회 기간 (기본값: 30일)
- `status`: 상태 필터
- `page`: 페이지 번호
- `limit`: 페이지 크기

**응답:**
```json
{
  "emergencies": [
    {
      "id": "emergency-uuid",
      "type": "TECHNICAL",
      "severity": "HIGH",
      "title": "스트리밍 장비 오류",
      "status": "RESOLVED",
      "resolution": "백업 카메라로 교체 완료.",
      "createdAt": "2025-08-06T15:30:00Z",
      "resolvedAt": "2025-08-06T15:45:00Z",
      "durationMinutes": 15,
      "user": {
        "id": "user-uuid",
        "name": "기술팀 홍길동",
        "avatar": null,
        "role": "TECHNICAL_SUPPORT"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  },
  "period": {
    "startDate": "2025-07-07T15:00:00Z",
    "days": 30
  }
}
```

## 파일 관리

### 1. 단일 파일 업로드

```http
POST /api/files/upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**폼 데이터:**
- `file`: 업로드할 파일 (필수)
- `messageId`: 연결할 메시지 ID (선택)

**응답:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "file-uuid",
    "filename": "abc123-1691234567890.pdf",
    "originalName": "회의자료.pdf",
    "mimetype": "application/pdf",
    "size": 524288,
    "url": "/api/files/abc123-1691234567890.pdf",
    "createdAt": "2025-08-06T15:00:00Z"
  }
}
```

### 2. 다중 파일 업로드

```http
POST /api/files/upload-multiple
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**폼 데이터:**
- `files`: 업로드할 파일들 (최대 10개)
- `messageId`: 연결할 메시지 ID (선택)

**응답:**
```json
{
  "message": "Files uploaded successfully",
  "files": [
    {
      "id": "file-uuid-1",
      "filename": "abc123-1691234567890.pdf",
      "originalName": "회의자료.pdf",
      "mimetype": "application/pdf",
      "size": 524288,
      "url": "/api/files/abc123-1691234567890.pdf",
      "createdAt": "2025-08-06T15:00:00Z"
    },
    {
      "id": "file-uuid-2",
      "filename": "def456-1691234567891.jpg",
      "originalName": "사진.jpg",
      "mimetype": "image/jpeg",
      "size": 1048576,
      "url": "/api/files/def456-1691234567891.jpg",
      "createdAt": "2025-08-06T15:00:00Z"
    }
  ]
}
```

### 3. 파일 다운로드

```http
GET /api/files/:filename
Authorization: Bearer <JWT_TOKEN>
```

파일 스트림이 반환되며, 적절한 헤더가 설정됩니다.

### 4. 파일 정보 조회

```http
GET /api/files/info/:fileId
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "file": {
    "id": "file-uuid",
    "filename": "abc123-1691234567890.pdf",
    "originalName": "회의자료.pdf",
    "mimetype": "application/pdf",
    "size": 524288,
    "url": "/api/files/abc123-1691234567890.pdf",
    "createdAt": "2025-08-06T15:00:00Z",
    "message": {
      "id": "message-uuid",
      "subject": "회의 자료 공유",
      "type": "GENERAL",
      "createdAt": "2025-08-06T15:00:00Z"
    }
  }
}
```

### 5. 파일 목록 조회

```http
GET /api/files
Authorization: Bearer <JWT_TOKEN>
```

**쿼리 파라미터:**
- `page`: 페이지 번호
- `limit`: 페이지 크기
- `mimetype`: MIME 타입 필터
- `messageId`: 메시지 ID 필터

**응답:**
```json
{
  "files": [
    {
      "id": "file-uuid",
      "filename": "abc123-1691234567890.pdf",
      "originalName": "회의자료.pdf",
      "mimetype": "application/pdf",
      "size": 524288,
      "url": "/api/files/abc123-1691234567890.pdf",
      "createdAt": "2025-08-06T15:00:00Z",
      "message": {
        "id": "message-uuid",
        "subject": "회의 자료 공유",
        "type": "GENERAL",
        "createdAt": "2025-08-06T15:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

### 6. 파일 삭제

```http
DELETE /api/files/:fileId
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "message": "File deleted successfully"
}
```

### 7. 파일 통계

```http
GET /api/files/stats/overview
Authorization: Bearer <JWT_TOKEN>
```

**응답:**
```json
{
  "stats": {
    "total": {
      "files": 42,
      "size": 134217728
    },
    "byCategory": {
      "images": {
        "count": 15,
        "size": 52428800
      },
      "documents": {
        "count": 20,
        "size": 67108864
      },
      "videos": {
        "count": 5,
        "size": 104857600
      },
      "audio": {
        "count": 2,
        "size": 10485760
      }
    },
    "byMimetype": [
      {
        "mimetype": "image/jpeg",
        "count": 10,
        "size": 41943040
      },
      {
        "mimetype": "application/pdf",
        "count": 15,
        "size": 62914560
      }
    ],
    "recent": [
      {
        "id": "file-uuid",
        "originalName": "최신파일.pdf",
        "mimetype": "application/pdf",
        "size": 1048576,
        "createdAt": "2025-08-06T15:00:00Z"
      }
    ]
  }
}
```

## 실시간 통신 (Socket.IO)

### 연결 설정

WebSocket 연결을 설정합니다:

```javascript
const io = require('socket.io-client');

const socket = io('wss://wsop-field-director-backend.vercel.app', {
  auth: {
    token: 'JWT_ACCESS_TOKEN'
  }
});
```

### 이벤트 리스너

#### 1. 연결 상태

```javascript
// 연결 성공
socket.on('connect', () => {
  console.log('서버에 연결됨');
});

// 연결 해제
socket.on('disconnect', () => {
  console.log('서버와 연결 해제됨');
});

// 에러 발생
socket.on('error', (error) => {
  console.error('Socket 에러:', error);
});
```

#### 2. 사용자 온라인 상태

```javascript
// 사용자가 온라인 상태가 됨
socket.on('userOnline', (data) => {
  console.log(`사용자 ${data.userId}가 온라인 상태가 됨`);
});

// 사용자가 오프라인 상태가 됨
socket.on('userOffline', (data) => {
  console.log(`사용자 ${data.userId}가 오프라인 상태가 됨`);
});

// 현재 온라인 사용자 목록
socket.on('onlineUsers', (userIds) => {
  console.log('온라인 사용자:', userIds);
});
```

#### 3. 프로덕션 상태 변경

```javascript
// 프로덕션 상태 변경 알림
socket.on('productionStatusChanged', (data) => {
  console.log('프로덕션 상태 변경:', data);
});

// 프로덕션 모드 변경 알림
socket.on('productionModeChanged', (data) => {
  console.log('프로덕션 모드 변경:', data.mode, data.reason);
});
```

#### 4. 체크리스트 업데이트

```javascript
// 체크리스트 항목 업데이트 알림
socket.on('checklistUpdated', (data) => {
  console.log('체크리스트 업데이트:', data);
});
```

#### 5. 팀 관련 이벤트

```javascript
// 팀원 상태 변경 알림
socket.on('teamMemberStatusChanged', (data) => {
  console.log('팀원 상태 변경:', data);
});
```

#### 6. 메시지 및 커뮤니케이션

```javascript
// 새 메시지 수신
socket.on('newMessage', (message) => {
  console.log('새 메시지:', message);
});
```

#### 7. 긴급 상황 알림

```javascript
// 긴급 상황 알림
socket.on('emergencyAlert', (emergency) => {
  console.log('긴급 상황 발생:', emergency);
  // 긴급 알림 UI 표시
});

// 긴급 상황 업데이트
socket.on('emergencyUpdated', (data) => {
  console.log('긴급 상황 업데이트:', data);
});
```

### 클라이언트에서 서버로 이벤트 전송

#### 1. 활동 감지 (Heartbeat)

```javascript
// 5분마다 heartbeat 전송
setInterval(() => {
  socket.emit('heartbeat');
}, 5 * 60 * 1000);
```

#### 2. 체크리스트 항목 토글

```javascript
socket.emit('checklistItemToggle', {
  itemId: 'item-uuid',
  templateId: 'template-uuid',
  isChecked: true,
  date: '2025-08-06'
});
```

#### 3. 팀원 상태 업데이트

```javascript
socket.emit('teamMemberStatusUpdate', {
  status: 'BREAK'
});
```

#### 4. 메시지 전송

```javascript
socket.emit('sendMessage', {
  recipientId: 'user-uuid',
  content: '안녕하세요!',
  type: 'GENERAL',
  priority: 'MEDIUM'
});
```

#### 5. 긴급 상황 알림

```javascript
socket.emit('emergencyAlert', {
  type: 'TECHNICAL',
  severity: 'HIGH',
  title: '장비 오류',
  description: '긴급히 확인이 필요합니다.'
});
```

#### 6. 프로덕션 상태 업데이트

```javascript
socket.emit('productionStatusUpdate', {
  mode: 'PRODUCTION',
  featureTable: 'Final Table',
  streamQuality: '4K',
  uploadSpeed: 95.5
});
```

## 에러 코드

### HTTP 상태 코드

- **200 OK**: 성공적인 요청
- **201 Created**: 리소스 생성 성공
- **400 Bad Request**: 잘못된 요청 (유효성 검증 실패)
- **401 Unauthorized**: 인증 실패
- **403 Forbidden**: 권한 부족
- **404 Not Found**: 리소스를 찾을 수 없음
- **409 Conflict**: 리소스 충돌 (중복 등)
- **429 Too Many Requests**: 요청 한도 초과
- **500 Internal Server Error**: 서버 내부 오류

### 에러 응답 형식

```json
{
  "error": "에러 메시지",
  "details": [
    {
      "field": "email",
      "message": "유효한 이메일 주소를 입력해주세요"
    }
  ]
}
```

### 일반적인 에러 메시지

#### 인증 관련
- `Access denied. No token provided or invalid format.`
- `Invalid token.`
- `Token expired.`
- `Account is deactivated.`

#### 권한 관련
- `Access denied. Insufficient permissions.`
- `Not authorized to update this member status`
- `Only field directors can send broadcast messages`

#### 리소스 관련
- `User not found.`
- `Team not found`
- `Message not found`
- `Emergency not found`

#### 유효성 검증
- `Validation failed`
- `Password must be at least 8 characters long`
- `Invalid email format`

## Rate Limiting

API는 Rate Limiting이 적용되어 있습니다:

- **프로덕션 환경**: IP당 15분에 100회 요청
- **개발 환경**: IP당 15분에 1000회 요청

Rate limit에 도달하면 다음 응답을 받습니다:

```json
{
  "error": "Too many requests from this IP, please try again later"
}
```

## cURL 예시

### 1. 로그인

```bash
curl -X POST https://wsop-field-director-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### 2. 사용자 목록 조회

```bash
curl -X GET https://wsop-field-director-backend.vercel.app/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. 체크리스트 진행상황 조회

```bash
curl -X GET https://wsop-field-director-backend.vercel.app/api/checklists/my-progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. 파일 업로드

```bash
curl -X POST https://wsop-field-director-backend.vercel.app/api/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/file.pdf"
```

### 5. 긴급 상황 생성

```bash
curl -X POST https://wsop-field-director-backend.vercel.app/api/emergency \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TECHNICAL",
    "severity": "HIGH",
    "title": "스트리밍 장비 오류",
    "description": "메인 카메라에서 신호가 끊어짐"
  }'
```

## Postman 컬렉션

Postman 컬렉션을 다운로드하여 사용할 수 있습니다:

```json
{
  "info": {
    "name": "WSOP Field Director Pro API",
    "description": "포커 토너먼트 현장 운영 시스템 API",
    "version": "1.0.0"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://wsop-field-director-backend.vercel.app",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"Password123!\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 문의 및 지원

API 사용 중 문제가 발생하거나 추가 기능이 필요한 경우:

- **이메일**: support@wsop-field-director.com  
- **개발팀**: dev@wsop-field-director.com
- **긴급 상황**: emergency@wsop-field-director.com

---

**마지막 업데이트**: 2025년 8월 6일  
**API 버전**: v1.0.0