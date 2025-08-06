# Floor Producing App - Expo SDK 53 마이그레이션 가이드

## 개요
이 가이드는 floor-producing 앱을 Expo SDK 49에서 SDK 53으로 업그레이드하는 과정을 안내합니다.

## 주요 버전 변경사항

### 이전 버전 vs 새 버전
| 패키지 | 이전 버전 | 새 버전 | 주요 변경사항 |
|--------|-----------|---------|---------------|
| Expo SDK | ~49.0.0 | ~53.0.0 | New Architecture 기본 활성화, React 19 지원 |
| React | 18.2.0 | 19.0.0 | 새로운 Hooks, 서버 컴포넌트 지원 |
| React Native | 0.72.6 | 0.79.3 | JSC 분리, 번들 압축 옵션, 디버깅 변경 |
| React Navigation | ^6.x.x | ^7.0.0 | 새로운 API, 타입 개선 |
| Redux Toolkit | ^1.9.7 | ^2.2.0 | RTK Query 개선, 타입 안정성 향상 |

## 마이그레이션 단계

### 1. 사전 준비
```bash
# Node.js 버전 확인 (Node 20+ 필수)
node --version

# 기존 node_modules 삭제
rm -rf node_modules
rm package-lock.json
```

### 2. 의존성 업데이트
package.json이 이미 업데이트되었으므로 새 패키지를 설치합니다:

```bash
npm install
```

### 3. Expo SDK 업그레이드
```bash
# Expo SDK 업그레이드
npx expo install --fix

# 호환성 확인
npx expo-doctor
```

### 4. 코드 변경사항

#### 4.1 React 19 관련 변경
- **React DevTools 제거**: React DevTools가 Expo CLI에서 제거되었습니다. 이제 React Native DevTools를 사용해야 합니다.
- **새로운 Hooks**: React 19의 새로운 기능들을 활용할 수 있습니다.

#### 4.2 React Native 0.79 관련 변경
- **JSC 변경**: JavaScriptCore가 별도 패키지로 분리되었지만, Hermes를 사용하는 경우 영향 없음
- **디버깅**: Remote JS Debugging이 제거되었으므로 React Native DevTools 사용 필요

#### 4.3 React Navigation 7.x 변경사항
React Navigation 7.x에서 일부 API가 변경되었을 수 있습니다. 현재 코드를 확인하고 필요시 업데이트하세요.

### 5. New Architecture 설정
SDK 53에서는 New Architecture가 기본으로 활성화됩니다. 비활성화하려면:

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// New Architecture 비활성화 (필요시)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
```

### 6. 잠재적 문제점 및 해결책

#### 6.1 Metro 번들러 변경사항
React Native 0.79에서 package.json exports 필드 지원이 기본 활성화되었습니다. 이로 인한 호환성 문제가 발생할 수 있습니다.

**증상:**
- "attempted to import the Node standard library module" 오류
- 중복 패키지 임포트 문제

**해결책:**
```javascript
// metro.config.js에서 비활성화
config.resolver.unstable_enablePackageExports = false;
```

#### 6.2 TypeScript 타입 오류
React 19와 새로운 패키지 버전으로 인한 타입 오류가 발생할 수 있습니다.

**해결책:**
```bash
# 타입 정의 재설치
npm install --save-dev @types/react@~19.0.10 @types/react-native@^0.79.0
```

#### 6.3 React Redux 9.x 변경사항
React Redux 9.x에서 일부 API가 변경되었을 수 있습니다. 현재 Redux 코드를 확인하세요.

### 7. 테스트 및 검증

#### 7.1 기본 실행 테스트
```bash
# 개발 서버 시작
npm start

# Android/iOS에서 테스트
npm run android
npm run ios
```

#### 7.2 기능별 테스트 체크리스트
- [ ] 앱 시작 및 스플래시 화면
- [ ] 네비게이션 (하단 탭, 스택 네비게이션)
- [ ] Redux 스토어 상태 관리
- [ ] AsyncStorage 데이터 저장/로드
- [ ] 체크리스트 기능
- [ ] 팀 관리 기능
- [ ] 커뮤니케이션 기능
- [ ] 비상 대응 기능

### 8. 성능 최적화

#### 8.1 번들 크기 최적화
```javascript
// metro.config.js
const config = getDefaultConfig(__dirname);

// 번들 압축 활성화 (시작 시간 vs 용량 트레이드오프)
config.transformer.minifierConfig = {
  // 압축 설정
};

module.exports = config;
```

#### 8.2 New Architecture 활용
New Architecture가 활성화된 상태에서 성능 개선을 확인하세요.

### 9. 배포 준비

#### 9.1 EAS Build 설정 업데이트
```json
// eas.json
{
  "cli": {
    "version": ">= 0.60.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "NODE_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

#### 9.2 앱 스토어 배포
새 SDK 버전으로 빌드된 앱을 테스트한 후 배포하세요.

## 문제 해결

### 자주 발생하는 오류들

1. **Metro bundler 오류**
   ```
   Error: Package exports for 'package-name' do not define a valid '.' target
   ```
   해결: `unstable_enablePackageExports: false` 설정

2. **TypeScript 타입 오류**
   ```
   Type 'ReactNode' is not assignable to type 'ReactChild'
   ```
   해결: React 19 타입 정의 업데이트

3. **Navigation 오류**
   React Navigation 7.x API 변경사항 확인 및 코드 수정

### 롤백 방법
문제 발생시 이전 package.json으로 롤백:

```bash
git checkout HEAD~1 -- package.json
npm install
```

## 참고 자료
- [Expo SDK 53 릴리스 노트](https://expo.dev/changelog/sdk-53)
- [React Native 0.79 릴리스 노트](https://reactnative.dev/blog/2025/04/08/react-native-0.79)
- [React 19 업그레이드 가이드](https://react.dev/blog/2024/12/05/react-19)
- [React Navigation 7.x 마이그레이션 가이드](https://reactnavigation.org/)

## 지원
마이그레이션 과정에서 문제가 발생하면 관련 이슈를 GitHub 레포지토리에 보고하세요.

---
작성일: 2025-08-06
작성자: Claude Code Assistant