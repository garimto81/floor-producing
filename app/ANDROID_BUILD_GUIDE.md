# 안드로이드 APK 빌드 가이드

## 📱 개발 방법 선택

### 방법 1: Expo Go로 개발 (가장 쉬움)
**개발 중에만 사용, 최종 사용자는 APK 설치**

```bash
# 1. 개발 서버 시작
npm start

# 2. 안드로이드 폰에 Expo Go 설치
# Google Play Store에서 "Expo Go" 검색하여 설치

# 3. QR 코드 스캔하여 앱 실행
```

### 방법 2: 안드로이드 에뮬레이터 사용
```bash
# 1. Android Studio 설치
# 2. AVD Manager에서 에뮬레이터 생성
# 3. 실행
npm run android
```

## 🏗️ APK 빌드 방법

### 옵션 1: EAS Build (클라우드 빌드) - 권장
```bash
# 1. EAS CLI 설치
npm install -g eas-cli

# 2. Expo 계정 생성 및 로그인
eas login

# 3. 프로젝트 설정
eas build:configure

# 4. APK 빌드
eas build --platform android --profile preview

# 5. 빌드 완료 후 다운로드 링크 제공됨
```

### 옵션 2: 로컬 빌드 (복잡함)
```bash
# 1. Android Studio 설치 필요
# 2. Expo 프로젝트를 베어 프로젝트로 전환
expo eject

# 3. Android Studio에서 프로젝트 열기
# 4. Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### 옵션 3: Expo 클래식 빌드
```bash
# 1. Expo CLI로 빌드
expo build:android -t apk

# 2. Expo 계정 로그인 필요
# 3. 빌드 완료 후 다운로드 링크 제공
```

## 📲 APK 설치 방법

### 스마트폰에 APK 설치하기

1. **설정 변경**
   - 설정 > 보안 > "알 수 없는 소스" 허용
   - 또는 설정 > 애플리케이션 > 특수 액세스 > "알 수 없는 앱 설치" 허용

2. **APK 전송**
   - 이메일, 카카오톡, USB 등으로 APK 파일 전송
   - Google Drive, Dropbox 등 클라우드 저장소 이용

3. **설치**
   - APK 파일 탭
   - "설치" 버튼 클릭
   - 권한 허용

## 🚀 빠른 시작 (개발자용)

```bash
# 1. 프로젝트 클론
git clone https://github.com/garimto81/floor-producing.git
cd floor-producing/app

# 2. 의존성 설치
npm install

# 3. 개발 시작
npm start

# 4. 안드로이드에서 테스트
# - Expo Go 앱으로 QR 스캔
# - 또는 에뮬레이터에서 'a' a 누르기
```

## 🔧 문제 해결

### Expo Go 연결 안 될 때
- 폰과 컴퓨터가 같은 Wi-Fi에 있는지 확인
- 방화벽 설정 확인
- Tunnel 모드로 전환: `expo start --tunnel`

### 빌드 오류 시
- Node.js 버전 확인 (18+ 필요)
- 캐시 정리: `expo start -c`
- node_modules 재설치:
  ```bash
  rm -rf node_modules
  npm install
  ```

## 📋 체크리스트

빌드 전 확인사항:
- [ ] 앱 아이콘 준비 (1024x1024 PNG)
- [ ] 스플래시 스크린 준비
- [ ] 버전 번호 확인
- [ ] 패키지명 확인 (com.jijiprod.fielddirector)
- [ ] 권한 설정 확인

## 🎯 추천 개발 플로우

1. **개발 단계**: Expo Go 사용 (빠른 테스트)
2. **테스트 단계**: 개발 빌드 APK
3. **배포 단계**: 프로덕션 APK

## 📞 지원

문제가 있으시면:
- Expo 문서: https://docs.expo.dev
- 프로젝트 이슈: https://github.com/garimto81/floor-producing/issues