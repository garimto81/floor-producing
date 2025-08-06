// 간단한 관리자 대시보드 테스트
const { test, expect } = require('@playwright/test');

test('Alpine.js 및 기본 동작 테스트', async ({ page }) => {
  console.log('🔍 Alpine.js 동작 확인 테스트 시작');
  
  // 관리자 페이지로 이동
  await page.goto('http://localhost:3003/admin/');
  
  // 페이지 로드 완료 대기
  await page.waitForLoadState('networkidle');
  
  // Alpine.js 로드 확인
  const alpineLoaded = await page.evaluate(() => {
    return typeof window.Alpine !== 'undefined';
  });
  console.log('Alpine.js 로드됨:', alpineLoaded);
  
  // 로그인 폼 확인
  await expect(page.locator('h2:has-text("관리자 로그인")')).toBeVisible();
  console.log('✅ 로그인 폼 표시됨');
  
  // 입력 필드에 값 입력
  await page.fill('input[type="email"]', 'director@wsop.com');
  await page.fill('input[type="password"]', 'director123');
  console.log('✅ 로그인 정보 입력 완료');
  
  // 로그인 버튼 클릭
  await page.click('button:has-text("로그인")');
  console.log('✅ 로그인 버튼 클릭됨');
  
  // 잠시 대기
  await page.waitForTimeout(2000);
  
  // 결과 확인 - 로그아웃 버튼이 나타나거나 오류 메시지 확인
  const logoutButton = page.locator('button:has-text("로그아웃")');
  const errorMessage = page.locator('[x-text="error"]');
  
  const logoutVisible = await logoutButton.isVisible();
  const errorVisible = await errorMessage.isVisible();
  
  console.log('로그아웃 버튼 표시됨:', logoutVisible);
  console.log('에러 메시지 표시됨:', errorVisible);
  
  if (errorVisible) {
    const errorText = await errorMessage.textContent();
    console.log('에러 내용:', errorText);
  }
  
  // Alpine.js 데이터 상태 확인
  const alpineData = await page.evaluate(() => {
    try {
      // DOM 요소에서 Alpine 데이터 직접 접근 시도
      const appElement = document.querySelector('[x-data="adminApp"]');
      if (appElement && appElement._x_dataStack) {
        return appElement._x_dataStack[0];
      }
      return null;
    } catch (error) {
      return { error: error.message };
    }
  });
  
  console.log('Alpine.js 데이터 상태:', JSON.stringify(alpineData, null, 2));
  
  console.log('✅ 기본 동작 테스트 완료');
});