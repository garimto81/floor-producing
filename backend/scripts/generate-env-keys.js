#!/usr/bin/env node

/**
 * 환경 변수 키 생성 도구
 * 
 * 사용법:
 * node scripts/generate-env-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 안전한 랜덤 키 생성
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// 환경 변수 생성
const envVars = {
  // JWT 비밀 키
  JWT_SECRET: generateSecureKey(32),
  
  // 암호화 키
  ENCRYPTION_KEY: generateSecureKey(16),
  
  // 세션 비밀 키
  SESSION_SECRET: generateSecureKey(24),
  
  // API 키 (선택사항)
  API_SECRET_KEY: generateSecureKey(24),
};

// 결과 출력
console.log('🔐 생성된 보안 키들:\n');
console.log('=' .repeat(60));

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}="${value}"`);
});

console.log('=' .repeat(60));

// Vercel CLI 명령어 생성
console.log('\n📋 Vercel CLI 명령어 (복사해서 사용하세요):\n');

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`vercel env add ${key} production`);
  console.log(`# 값 입력 프롬프트가 나오면 붙여넣기: ${value}`);
  console.log('');
});

// 선택적: .env.local 파일 생성
const createEnvFile = process.argv.includes('--create-file');

if (createEnvFile) {
  const envContent = `# 자동 생성된 환경 변수 (${new Date().toISOString()})
# ⚠️ 주의: 이 파일을 절대 Git에 커밋하지 마세요!

${Object.entries(envVars).map(([key, value]) => `${key}="${value}"`).join('\n')}
`;

  const envPath = path.join(__dirname, '..', '.env.generated');
  fs.writeFileSync(envPath, envContent);
  console.log(`\n✅ 환경 변수 파일 생성됨: ${envPath}`);
  console.log('⚠️  이 파일을 .env.local로 복사하여 사용하세요.');
}

console.log('\n💡 팁:');
console.log('- 생성된 키를 Vercel 대시보드의 Environment Variables에 추가하세요');
console.log('- 프로덕션과 개발 환경에 다른 키를 사용하세요');
console.log('- 키는 정기적으로 교체하는 것이 좋습니다');
console.log('\n🔒 보안 주의사항:');
console.log('- 이 키들을 절대 공개 저장소에 커밋하지 마세요');
console.log('- 팀원들과 안전한 방법으로만 공유하세요');
console.log('- 프로덕션 키는 최소한의 인원만 접근 가능하도록 하세요');