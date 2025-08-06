@echo off
echo ==========================================
echo  WSOP Field Director Pro Backend Setup
echo ==========================================
echo.

:: Node.js 버전 확인
echo [1/6] Node.js 버전 확인...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo    다음 링크에서 Node.js 18 LTS를 설치해주세요:
    echo    https://nodejs.org/en/download/
    pause
    exit /b 1
) else (
    echo ✅ Node.js 설치됨
    node --version
)
echo.

:: npm 의존성 설치
echo [2/6] npm 의존성 설치...
if exist "node_modules" (
    echo ℹ️  node_modules 폴더가 이미 존재합니다.
) else (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ npm install 실패
        pause
        exit /b 1
    )
    echo ✅ 의존성 설치 완료
)
echo.

:: 환경 변수 파일 생성
echo [3/6] 환경 변수 파일 생성...
if exist ".env" (
    echo ℹ️  .env 파일이 이미 존재합니다.
) else (
    copy ".env.example" ".env" >nul
    echo ✅ .env 파일 생성 완료
    echo ⚠️  .env 파일을 편집하여 데이터베이스 연결 정보를 설정해주세요.
)
echo.

:: 로그 디렉토리 생성
echo [4/6] 로그 디렉토리 생성...
if not exist "logs" mkdir logs
echo ✅ 로그 디렉토리 생성 완료
echo.

:: PostgreSQL 연결 테스트 (선택사항)
echo [5/6] 데이터베이스 연결 테스트...
echo ℹ️  PostgreSQL이 실행 중이어야 합니다.
echo    연결을 테스트하려면 Enter를 누르세요. 건너뛰려면 's'를 입력하세요.
set /p choice="> "
if /i "%choice%"=="s" (
    echo ⏭️  데이터베이스 연결 테스트를 건너뜁니다.
) else (
    :: PostgreSQL 연결 테스트를 위한 간단한 스크립트
    node -e "
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/floor_producing'
    });
    client.connect()
      .then(() => {
        console.log('✅ PostgreSQL 연결 성공');
        return client.end();
      })
      .catch(err => {
        console.log('❌ PostgreSQL 연결 실패:', err.message);
        console.log('   .env 파일의 DATABASE_URL을 확인해주세요.');
      });
    " 2>nul
)
echo.

:: TypeScript 컴파일 테스트
echo [6/6] TypeScript 컴파일 테스트...
npx tsc --noEmit
if %errorlevel% neq 0 (
    echo ❌ TypeScript 컴파일 오류가 있습니다.
    echo    위의 오류를 확인하고 수정해주세요.
) else (
    echo ✅ TypeScript 컴파일 성공
)
echo.

echo ==========================================
echo  설정 완료!
echo ==========================================
echo.
echo 다음 명령어로 서버를 시작하세요:
echo   npm run dev    (개발 모드)
echo   npm start      (프로덕션 모드)
echo.
echo API 서버: http://localhost:3001
echo 헬스체크: http://localhost:3001/health
echo.
echo 추가 설정이 필요한 경우:
echo 1. .env 파일에서 데이터베이스 연결 정보 수정
echo 2. npx prisma migrate dev --name init (데이터베이스 초기화)
echo 3. npm run db:seed (테스트 데이터 추가)
echo.
pause