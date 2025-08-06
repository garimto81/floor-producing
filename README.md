# WSOP Super Circuit CYPRUS - 현장 총괄 백서 앱

## 🎯 프로젝트 개요

지지 프로덕션의 포커 대회 방송 현장 총괄을 위한 종합 관리 시스템입니다.
WSOP Super Circuit CYPRUS (2024년 10월, 메리트 호텔)를 위해 설계되었습니다.

### 핵심 목표
- **프리 프로덕션 99% 완성**: 현장에서는 실행만
- **실시간 편집 생방송**: 신속하고 정확한 촬영 소스 납품
- **품질 관리**: 방송 원자재의 최고 품질 보증

## 📁 프로젝트 구조

```
floor-producing/
├── docs/                    # 프로젝트 문서
│   ├── workflows/          # 워크플로우 정의
│   ├── checklists/         # 체크리스트 모음
│   ├── templates/          # 커뮤니케이션 템플릿
│   └── manuals/            # 운영 매뉴얼
├── app/                    # 모바일 앱 소스코드
├── backend/                # 백엔드 서비스
└── scripts/                # 유틸리티 스크립트
```

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18+
- React Native 개발 환경
- Firebase 계정

### 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/garimto81/floor-producing.git
cd floor-producing

# 의존성 설치
cd app
npm install

# 개발 서버 실행
npm start
```

## 🏢 조직 구조

### 본사 프로덕션
- 총괄 디렉터
- 포스트 프로덕션팀
- 송출팀

### 현장 프로덕션 (11-15명)
- 관리 파트: 현장 총괄, PM, 보조
- 피처 테이블 파트: 스위처, 카메라 담당
- 소프트 콘텐츠 파트: 인터뷰/스케치
- 기술 파트: 기술 지원

### 외부 파트너
- Pokercaster 프로덕션
- 메리트 호텔
- WSOP (대회 개최사)
- DTD Player (대회 운영사)

## 📋 주요 기능

### 1. 실시간 대시보드
- 촬영 현황 모니터링
- 팀원 상태 확인
- 일정 관리

### 2. 체크리스트 시스템
- 시간대별 자동 전환
- 완료율 추적
- 오프라인 지원

### 3. 커뮤니케이션 센터
- 템플릿 기반 빠른 전송
- 비상 연락망
- 보고서 자동 생성

### 4. 위기 대응 모드
- 레벨별 대응 시나리오
- 긴급 연락 시스템
- 백업 플랜 실행

## 🛠️ 기술 스택

- **Frontend**: React Native + Expo
- **Backend**: Firebase (Firestore, Functions, Auth)
- **State**: Redux Toolkit
- **Monitoring**: Sentry, Firebase Crashlytics

## 📱 스크린샷

[추후 추가 예정]

## 🤝 기여하기

이 프로젝트는 지지 프로덕션 내부용으로 개발되었습니다.
문의사항은 현장 총괄 담당자에게 연락 바랍니다.

## 📄 라이센스

Proprietary - 지지 프로덕션 소유

---

© 2024 지지 프로덕션. All rights reserved.