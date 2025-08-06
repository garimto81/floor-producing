# 🚀 WSOP Field Director Pro - Backend API 상태

## 📊 현재 상태
- **이름**: WSOP Field Director Pro - Backend API
- **버전**: 1.0.0
- **상태**: ✅ 실행 중
- **데이터베이스**: SQLite (dev.db)
- **서버 URL**: http://localhost:3003

## 🔌 API 엔드포인트

### 1. 헬스체크
```
GET /health
```
응답 예시:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-06T08:08:22.316Z",
  "message": "WSOP Field Director Pro Backend is running!"
}
```

### 2. 사용자 등록
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "사용자 이름",
  "role": "DIRECTOR" | "FIELD_MEMBER"
}
```

### 3. 로그인
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "director@wsop.com",
  "password": "director123"
}
```
응답 예시:
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "director@wsop.com",
    "name": "Field Director",
    "role": "DIRECTOR"
  },
  "token": "JWT_TOKEN_HERE"
}
```

### 4. 사용자 목록 조회 (인증 필요)
```
GET /api/users
Authorization: Bearer JWT_TOKEN_HERE
```

## 🧪 테스트 계정

| 이메일 | 비밀번호 | 역할 |
|--------|----------|------|
| director@wsop.com | director123 | DIRECTOR |
| member@wsop.com | member123 | FIELD_MEMBER |

## 🛠️ 추가 API 엔드포인트

### 인증 관련
- `GET /api/auth/profile` - 현재 사용자 프로필
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/refresh` - 토큰 갱신

### 데이터베이스 상태
- `GET /api/db-status` - DB 연결 상태 확인

### 관리자 대시보드
- `GET /admin` - 웹 기반 관리 인터페이스

## 🔐 인증 방식

JWT Bearer Token 사용:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

토큰 유효기간: 7일

## 📱 프론트엔드 연동 예시

```javascript
// API 기본 URL
const API_BASE_URL = 'http://localhost:3003/api';

// 로그인
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (data.token) {
    // 토큰 저장
    localStorage.setItem('token', data.token);
  }
  return data;
};

// 인증된 요청
const getUsers = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

## 🚀 다음 단계

1. **Vercel Postgres 연결**
   - 프로덕션 데이터베이스 설정
   - 환경 변수 구성

2. **프론트엔드 통합**
   - React Native 앱에서 API 호출
   - 실시간 통신 구현

3. **배포**
   - Vercel에 백엔드 배포
   - 프로덕션 URL로 API 엔드포인트 업데이트

---

백엔드가 완벽하게 작동하고 있습니다! 🎉