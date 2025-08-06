# WSOP Field Director Pro - 모바일 앱

포커 대회 방송 현장 총괄을 위한 React Native 모바일 앱입니다.

## 🚀 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS 개발: Xcode (Mac)
- Android 개발: Android Studio

### 설치

```bash
# 프로젝트 클론
git clone https://github.com/garimto81/floor-producing.git
cd floor-producing/app

# 의존성 설치
npm install
# 또는
yarn install
```

### 실행

```bash
# Expo 개발 서버 시작
npm start
# 또는
yarn start

# iOS 시뮬레이터에서 실행 (Mac만 가능)
npm run ios

# Android 에뮬레이터에서 실행
npm run android

# 웹 브라우저에서 실행
npm run web
```

### Expo Go 앱으로 실행

1. 스마트폰에 Expo Go 앱 설치
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. `npm start` 실행 후 나타나는 QR 코드를 스캔

3. 같은 네트워크에 연결되어 있어야 함

## 📱 주요 기능

### 1. 대시보드
- 실시간 촬영 현황 모니터링
- 피처 테이블 상태
- 데이터 전송 속도
- 팀원 활동 상태
- 다음 일정 표시

### 2. 체크리스트
- 시간대별 자동 전환 (아침/촬영/마감)
- 우선순위별 구분
- 완료율 실시간 추적
- 스와이프로 완료 처리

### 3. 커뮤니케이션
- 빠른 연락처 (긴급/팀/외부)
- 메시지 템플릿
- 원터치 전화/메시지
- 통신 이력 관리

### 4. 팀 관리
- 팀원 상태 실시간 확인
- 활동/휴식/오프라인 구분
- 빠른 검색 기능
- 연락처 즉시 접근

### 5. 설정 및 더보기
- 운영 모드 전환 (일반/촬영/위기)
- 다크 모드
- 알림 설정
- 데이터 백업/복원

## 🛠️ 기술 스택

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **UI Library**: React Native Paper
- **Navigation**: React Navigation
- **Storage**: AsyncStorage
- **Backend**: Firebase (예정)

## 📁 프로젝트 구조

```
app/
├── src/
│   ├── screens/          # 화면 컴포넌트
│   ├── components/       # 재사용 컴포넌트
│   ├── navigation/       # 네비게이션 설정
│   ├── store/           # Redux 스토어
│   ├── types/           # TypeScript 타입 정의
│   ├── services/        # API 및 서비스
│   ├── utils/           # 유틸리티 함수
│   └── theme/           # 테마 설정
├── assets/              # 이미지, 폰트 등
├── App.tsx              # 앱 진입점
└── app.json            # Expo 설정
```

## 🔧 개발 팁

### 디버깅
- React Native Debugger 사용 권장
- Expo DevTools에서 로그 확인
- `console.log()` 활용

### 성능 최적화
- 리스트는 FlatList 사용
- 이미지 최적화
- 불필요한 리렌더링 방지

### 테스트
```bash
# 테스트 실행 (추후 구현)
npm test
```

## 📲 빌드 및 배포

### 개발 빌드
```bash
# iOS 빌드 (Mac 필요)
expo build:ios

# Android 빌드
expo build:android
```

### 프로덕션 빌드
```bash
# EAS Build 사용 (권장)
eas build --platform all
```

## 🐛 알려진 이슈

- 아이콘 파일이 없어 경고 발생 (임시 아이콘 필요)
- Firebase 연동 미완성
- 오프라인 동기화 구현 필요

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트 관련 문의는 현장 총괄 담당자에게 연락 바랍니다.

---

© 2024 지지 프로덕션. All rights reserved.