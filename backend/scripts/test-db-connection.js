#!/usr/bin/env node

/**
 * Vercel 데이터베이스 연결 테스트
 * 
 * 사용법:
 * node scripts/test-db-connection.js
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// 환경 변수 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 Vercel 데이터베이스 연결 테스트\n');

// 환경 변수 확인
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL이 설정되지 않았습니다.');
  console.log('\n해결 방법:');
  console.log('1. node scripts/setup-vercel-db.js 실행');
  console.log('2. .env.local 파일에 DATABASE_URL 설정');
  process.exit(1);
}

console.log('📋 연결 정보:');
const dbUrl = new URL(process.env.DATABASE_URL);
console.log(`- 호스트: ${dbUrl.hostname}`);
console.log(`- 데이터베이스: ${dbUrl.pathname.slice(1)}`);
console.log(`- 포트: ${dbUrl.port}`);

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  try {
    console.log('\n🔄 데이터베이스 연결 중...');
    
    // 연결 테스트
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공!\n');
    
    // 버전 확인
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL 버전:', result[0].version);
    
    // 테이블 목록 확인
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    if (tables.length > 0) {
      console.log('\n📋 현재 테이블 목록:');
      tables.forEach(table => {
        console.log(`  - ${table.tablename}`);
      });
    } else {
      console.log('\n⚠️  테이블이 없습니다. 마이그레이션을 실행하세요:');
      console.log('  npm run db:migrate');
    }
    
    // 샘플 쿼리 실행 (User 테이블이 있는 경우)
    try {
      const userCount = await prisma.user.count();
      console.log(`\n👥 등록된 사용자 수: ${userCount}명`);
    } catch (error) {
      // User 테이블이 없는 경우
    }
    
    console.log('\n✅ 모든 테스트 통과!');
    console.log('🚀 백엔드 서버를 시작할 수 있습니다:');
    console.log('  npm run dev:simple');
    
  } catch (error) {
    console.error('\n❌ 연결 실패:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n🔧 해결 방법:');
      console.log('1. DATABASE_URL이 올바른지 확인');
      console.log('2. Vercel 대시보드에서 데이터베이스 상태 확인');
      console.log('3. IP 화이트리스트 설정 확인 (Vercel은 자동)');
    } else if (error.code === 'P1002') {
      console.log('\n🔧 데이터베이스 서버에 연결할 수 없습니다.');
      console.log('네트워크 연결을 확인하세요.');
    } else if (error.code === 'P2002') {
      console.log('\n🔧 Prisma 스키마와 데이터베이스가 동기화되지 않았습니다.');
      console.log('npm run db:migrate 실행하세요.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// 연결 테스트 실행
testConnection().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});