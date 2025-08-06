#!/usr/bin/env node

/**
 * Vercel 데이터베이스 연결 설정 도구
 * 
 * 사용법:
 * 1. Vercel 대시보드에서 Postgres 데이터베이스 생성
 * 2. 연결 정보 복사
 * 3. node scripts/setup-vercel-db.js 실행
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Vercel 데이터베이스 설정 도구\n');

// .env.local 파일 경로
const envPath = path.join(__dirname, '..', '.env.local');

// 현재 .env.local 파일 확인
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local 파일이 이미 존재합니다.');
  console.log('📋 현재 설정된 DATABASE_URL을 확인하세요.\n');
} else {
  console.log('⚠️  .env.local 파일이 없습니다.');
  console.log('📋 .env.template을 복사하여 생성합니다...\n');
  
  const templatePath = path.join(__dirname, '..', '.env.template');
  if (fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, envPath);
    console.log('✅ .env.local 파일이 생성되었습니다.\n');
  }
}

console.log('📌 Vercel 데이터베이스 연결 단계:\n');
console.log('1️⃣  Vercel 대시보드 접속');
console.log('   https://vercel.com/dashboard\n');

console.log('2️⃣  Storage 탭 → Create Database → Postgres 선택\n');

console.log('3️⃣  데이터베이스 생성 후 .env.local 탭에서 연결 정보 복사\n');

console.log('4️⃣  .env.local 파일에 다음 정보 입력:');
console.log('   - DATABASE_URL');
console.log('   - POSTGRES_URL_NON_POOLING\n');

console.log('=' .repeat(60));
console.log('\n💡 Vercel CLI로 환경 변수 가져오기 (선택사항):\n');

try {
  // Vercel CLI 설치 확인
  execSync('vercel --version', { stdio: 'ignore' });
  
  console.log('Vercel CLI가 설치되어 있습니다.');
  console.log('다음 명령어로 환경 변수를 가져올 수 있습니다:\n');
  console.log('  vercel env pull .env.local\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('환경 변수를 자동으로 가져올까요? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('\n환경 변수를 가져오는 중...');
      try {
        execSync('vercel env pull .env.local', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        console.log('\n✅ 환경 변수를 성공적으로 가져왔습니다!');
        testDatabaseConnection();
      } catch (error) {
        console.error('\n❌ 환경 변수 가져오기 실패:', error.message);
        console.log('수동으로 설정해주세요.');
      }
    } else {
      console.log('\n수동으로 환경 변수를 설정해주세요.');
      showManualInstructions();
    }
    rl.close();
  });
} catch (error) {
  console.log('Vercel CLI가 설치되어 있지 않습니다.');
  console.log('수동으로 환경 변수를 설정해주세요.\n');
  showManualInstructions();
}

function showManualInstructions() {
  console.log('\n📝 수동 설정 방법:\n');
  console.log('1. Vercel 대시보드에서 프로젝트 선택');
  console.log('2. Storage 탭에서 생성한 데이터베이스 클릭');
  console.log('3. .env.local 탭의 내용을 복사');
  console.log(`4. ${envPath} 파일에 붙여넣기`);
  console.log('\n완료 후 다음 명령어로 연결 테스트:');
  console.log('  npm run test:db-connection\n');
}

function testDatabaseConnection() {
  console.log('\n🔍 데이터베이스 연결 테스트...\n');
  
  // 환경 변수 로드
  require('dotenv').config({ path: envPath });
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL이 설정되지 않았습니다.');
    return;
  }
  
  console.log('✅ DATABASE_URL이 설정되었습니다.');
  console.log('🔗 호스트:', process.env.DATABASE_URL.split('@')[1]?.split(':')[0] || 'Unknown');
  
  console.log('\n다음 명령어로 Prisma 설정을 진행하세요:');
  console.log('  npm run db:generate   # Prisma Client 생성');
  console.log('  npm run db:migrate    # 데이터베이스 마이그레이션');
  console.log('  npm run dev           # 개발 서버 시작\n');
}