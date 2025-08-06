# 🚀 빠른 시작 가이드

## 📱 STEP 1: Expo Go로 개발 테스트

### 1-1. 컴퓨터에서 준비
```bash
# 1. 프로젝트 폴더로 이동
cd floor-producing/app

# 2. 의존성 설치 (처음 한 번만)
npm install

# 3. 개발 서버 시작
npm start
```

### 1-2. 스마트폰에서 준비
1. **Google Play Store**에서 **"Expo Go"** 앱 설치
2. 같은 Wi-Fi 네트워크에 연결 확인

### 1-3. 앱 실행
1. 터미널에 QR 코드가 표시됩니다
2. Expo Go 앱을 열고 "Scan QR code" 선택
3. QR 코드 스캔
4. 앱이 자동으로 로드됩니다!

### 문제 해결
- **연결 안 될 때**: 
  ```bash
  # Tunnel 모드로 실행
  npm start -- --tunnel
  ```
- **리셋이 필요할 때**:
  ```bash
  # 캐시 삭제하고 재시작
  npm start -- --clear
  ```

## 🏗️ STEP 2: APK 빌드 (배포용)

### 2-1. EAS 계정 설정
```bash
# 1. EAS CLI 설치
npm install -g eas-cli

# 2. Expo 계정 생성 (무료)
# https://expo.dev/signup 에서 가입

# 3. 로그인
eas login
```

### 2-2. 프로젝트 설정
```bash
# 1. EAS 프로젝트 초기화
eas build:configure

# 2. 프로젝트 ID 생성
eas init
```

### 2-3. APK 빌드
```bash
# 개발용 APK 빌드
eas build --platform android --profile preview

# 또는 프로덕션 APK
eas build --platform android --profile production
```

### 2-4. APK 다운로드
1. 빌드 완료 메일 확인 (약 10-20분)
2. 링크 클릭하여 APK 다운로드
3. 스마트폰으로 전송하여 설치

## 📌 아이콘 준비

현재 임시 아이콘을 사용 중입니다. 실제 아이콘으로 교체하려면:

1. **준비할 파일**:
   - `icon.png` (1024x1024) - 앱 아이콘
   - `splash.png` (1242x2436) - 시작 화면
   - `adaptive-icon.png` (1024x1024) - 안드로이드 적응형

2. **아이콘 만들기**:
   - 온라인 도구: [Canva](https://www.canva.com), [Figma](https://www.figma.com)
   - 색상: 파란색 #2196F3
   - 텍스트: "FD" 또는 로고

3. **파일 교체**:
   ```bash
   # assets 폴더에 새 아이콘 파일 복사
   cp 새아이콘.png app/assets/icon.png
   ```

## ✅ 체크리스트

### 개발 테스트
- [ ] Node.js 설치됨 (v18+)
- [ ] npm install 완료
- [ ] Expo Go 앱 설치됨
- [ ] 같은 Wi-Fi 연결
- [ ] QR 코드 스캔 가능

### APK 빌드
- [ ] Expo 계정 생성됨
- [ ] EAS CLI 설치됨
- [ ] eas login 완료
- [ ] 아이콘 파일 준비

## 🆘 도움말

### 자주 묻는 질문

**Q: Expo Go 없이 테스트할 수 있나요?**
A: 네, APK를 빌드하면 Expo Go 없이 사용 가능합니다.

**Q: 빌드에 얼마나 걸리나요?**
A: 보통 10-20분 정도 걸립니다.

**Q: 무료인가요?**
A: Expo 계정은 무료이며, 매달 제한된 무료 빌드 제공됩니다.

### 유용한 명령어
```bash
# 로그 보기
npm start -- --clear

# 개발 서버 재시작
r (터미널에서)

# 개발 메뉴 열기
shake device (흔들기)
```

## 🎯 다음 단계

1. **테스트**: Expo Go로 모든 기능 테스트
2. **커스터마이즈**: 로고, 색상 등 변경
3. **빌드**: APK 생성
4. **배포**: 팀원들에게 APK 배포

---

문제가 있으면 [이슈](https://github.com/garimto81/floor-producing/issues)를 남겨주세요!