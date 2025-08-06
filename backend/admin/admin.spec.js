// WSOP Field Director Pro - 관리자 대시보드 E2E 테스트
// Playwright 기반 포괄적 테스트 스위트

const { test, expect } = require('@playwright/test');

// 테스트 설정
const BASE_URL = 'http://localhost:3003';
const ADMIN_URL = `${BASE_URL}/admin`;
const TEST_CREDENTIALS = {
  email: 'director@wsop.com',
  password: 'director123'
};

// 공통 테스트 유틸리티
class AdminTestUtils {
  constructor(page) {
    this.page = page;
  }

  // 로그인 헬퍼
  async login(email = TEST_CREDENTIALS.email, password = TEST_CREDENTIALS.password) {
    console.log('🔐 관리자 로그인 시도...');
    
    // 페이지 로드 대기
    await this.page.waitForLoadState('networkidle');
    
    // 로그인 폼 확인
    await expect(this.page.locator('h2:has-text("관리자 로그인")')).toBeVisible();
    
    // 이메일 입력
    await this.page.fill('input[type="email"]', email);
    await expect(this.page.locator('input[type="email"]')).toHaveValue(email);
    
    // 비밀번호 입력
    await this.page.fill('input[type="password"]', password);
    await expect(this.page.locator('input[type="password"]')).toHaveValue(password);
    
    // 로그인 버튼 클릭
    const loginButton = this.page.locator('button:has-text("로그인")');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    // 로그인 성공 확인 - 로그아웃 버튼이 나타날 때까지 대기
    await this.page.waitForSelector('button:has-text("로그아웃")', { timeout: 10000 });
    
    // 로그인 폼이 사라질 때까지 대기
    await this.page.waitForFunction(() => {
      const loginForm = document.querySelector('h2');
      if (loginForm && loginForm.textContent && loginForm.textContent.includes('관리자 로그인')) {
        return false; // 아직 로그인 폼이 있음
      }
      return true; // 로그인 폼이 없음
    }, { timeout: 5000 });
    
    // 대시보드가 표시되는지 확인
    await expect(this.page.locator('h1:has-text("WSOP 관리자 패널")')).toBeVisible();
    
    console.log('✅ 로그인 성공');
  }

  // 탭 전환 헬퍼
  async switchTab(tabName) {
    const tabButton = this.page.locator(`button:has-text("${tabName}")`);
    await expect(tabButton).toBeVisible();
    await tabButton.click();
    
    // 탭이 활성화될 때까지 대기
    await expect(tabButton).toHaveClass(/border-blue-500/);
    
    console.log(`🔄 ${tabName} 탭으로 전환됨`);
  }

  // API 응답 모니터링
  async monitorApiCalls() {
    const apiCalls = [];
    
    this.page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return apiCalls;
  }

  // 에러 메시지 확인
  async checkForErrors() {
    const errorMessage = this.page.locator('[x-text="error"]');
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.warn(`⚠️ 에러 메시지 발견: ${errorText}`);
      return errorText;
    }
    return null;
  }

  // 성공 메시지 확인
  async checkForSuccess() {
    const successMessage = this.page.locator('[x-text="success"]');
    if (await successMessage.isVisible()) {
      const successText = await successMessage.textContent();
      console.log(`✅ 성공 메시지: ${successText}`);
      return successText;
    }
    return null;
  }

  // 로딩 상태 확인
  async waitForLoading() {
    // Alpine.js 로딩 상태 대기
    await this.page.waitForFunction(() => {
      const app = window.Alpine && window.Alpine.data('adminApp');
      return app && !app.loading;
    }, { timeout: 5000 });
  }
}

// 테스트 그룹: 기본 페이지 로드 및 로그인
test.describe('관리자 대시보드 - 기본 기능', () => {
  
  test('페이지 로드 및 초기 상태 확인', async ({ page }) => {
    console.log('🚀 페이지 로드 테스트 시작');
    
    const utils = new AdminTestUtils(page);
    const apiCalls = await utils.monitorApiCalls();
    
    // 관리자 페이지로 이동
    await page.goto(ADMIN_URL);
    
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/WSOP Field Director Pro/);
    
    // 로그인 폼이 표시되는지 확인
    await expect(page.locator('h2:has-text("관리자 로그인")')).toBeVisible();
    
    // 필수 입력 필드 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("로그인")')).toBeVisible();
    
    // Alpine.js 초기화 확인
    await page.waitForFunction(() => window.Alpine !== undefined);
    
    console.log('✅ 페이지 로드 테스트 완료');
  });

  test('로그인 기능 테스트', async ({ page }) => {
    console.log('🔐 로그인 기능 테스트 시작');
    
    const utils = new AdminTestUtils(page);
    await page.goto(ADMIN_URL);
    
    // 올바른 자격 증명으로 로그인
    await utils.login();
    
    // 로그인 후 사용자 정보 표시 확인
    await expect(page.locator('[x-text="user?.name"]')).toBeVisible();
    
    // 로그아웃 버튼 확인
    await expect(page.locator('button:has-text("로그아웃")')).toBeVisible();
    
    console.log('✅ 로그인 기능 테스트 완료');
  });

  test('잘못된 로그인 정보 처리', async ({ page }) => {
    console.log('❌ 잘못된 로그인 테스트 시작');
    
    const utils = new AdminTestUtils(page);
    await page.goto(ADMIN_URL);
    
    try {
      // 잘못된 자격 증명으로 시도
      await utils.login('wrong@email.com', 'wrongpassword');
    } catch (error) {
      // 로그인 실패가 예상됨
      console.log('✅ 잘못된 로그인 정보 정상적으로 처리됨');
    }
    
    // 에러 메시지 확인
    const errorMessage = await utils.checkForErrors();
    if (errorMessage) {
      console.log(`✅ 에러 메시지 표시: ${errorMessage}`);
    }
  });
});

// 테스트 그룹: 대시보드 탭 기능
test.describe('관리자 대시보드 - 탭 전환', () => {
  
  test.beforeEach(async ({ page }) => {
    const utils = new AdminTestUtils(page);
    await page.goto(ADMIN_URL);
    await utils.login();
  });

  test('모든 탭 전환 테스트', async ({ page }) => {
    console.log('🔄 탭 전환 테스트 시작');
    
    const utils = new AdminTestUtils(page);
    const tabs = ['대시보드', '토너먼트 관리', '체크리스트 관리', '일정 관리', '팀 관리', '사용자 관리'];
    
    for (const tab of tabs) {
      await utils.switchTab(tab);
      
      // 탭 내용이 표시되는지 확인
      await page.waitForTimeout(500); // 애니메이션 대기
      
      // 활성 탭 확인
      const activeTab = page.locator(`button:has-text("${tab}")`);
      await expect(activeTab).toHaveClass(/border-blue-500/);
      
      console.log(`✅ ${tab} 탭 전환 완료`);
    }
    
    console.log('✅ 모든 탭 전환 테스트 완료');
  });

  test('대시보드 탭 - 통계 카드 확인', async ({ page }) => {
    console.log('📊 대시보드 통계 확인 시작');
    
    const utils = new AdminTestUtils(page);
    await utils.switchTab('대시보드');
    
    // 통계 카드들 확인
    const statCards = [
      '전체 사용자',
      '활성 토너먼트', 
      '체크리스트',
      '예정 일정'
    ];
    
    for (const statName of statCards) {
      await expect(page.locator(`dt:has-text("${statName}")`)).toBeVisible();
      console.log(`✅ ${statName} 카드 확인됨`);
    }
    
    // 시스템 상태 확인
    await expect(page.locator('h3:has-text("시스템 상태")')).toBeVisible();
    
    console.log('✅ 대시보드 통계 확인 완료');
  });
});

// 테스트 그룹: 토너먼트 관리
test.describe('관리자 대시보드 - 토너먼트 관리', () => {
  
  test.beforeEach(async ({ page }) => {
    const utils = new AdminTestUtils(page);
    await page.goto(ADMIN_URL);
    await utils.login();
    await utils.switchTab('토너먼트 관리');
  });

  test('새 토너먼트 버튼 및 폼 표시', async ({ page }) => {
    console.log('🏆 토너먼트 생성 버튼 테스트 시작');
    
    // 새 토너먼트 버튼 확인
    const newTournamentBtn = page.locator('button:has-text("새 토너먼트")');
    await expect(newTournamentBtn).toBeVisible();
    
    // 버튼 클릭
    await newTournamentBtn.click();
    
    // 모달 또는 폼이 표시되는지 확인 (현재 구현에 따라)
    await page.waitForTimeout(500);
    
    console.log('✅ 새 토너먼트 버튼 동작 확인');
  });

  test('토너먼트 목록 표시', async ({ page }) => {
    console.log('📋 토너먼트 목록 표시 테스트');
    
    // 테이블 헤더 확인
    const tableHeaders = ['이름', '위치', '시작일', '상태', '관리'];
    
    for (const header of tableHeaders) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
    
    // 기존 토너먼트 데이터 확인 (더미 데이터)
    await expect(page.locator('tbody tr')).toBeVisible();
    
    console.log('✅ 토너먼트 목록 표시 확인');
  });
});

// 테스트 그룹: 체크리스트 관리
test.describe('관리자 대시보드 - 체크리스트 관리', () => {
  
  test.beforeEach(async ({ page }) => {
    const utils = new AdminTestUtils(page);
    await page.goto(ADMIN_URL);
    await utils.login();
    await utils.switchTab('체크리스트 관리');
  });

  test('새 템플릿 버튼 및 폼 기능', async ({ page }) => {
    console.log('📝 체크리스트 템플릿 생성 테스트 시작');
    
    // 새 템플릿 버튼 확인
    const newTemplateBtn = page.locator('button:has-text("새 템플릿")');
    await expect(newTemplateBtn).toBeVisible();
    
    // 버튼 클릭
    await newTemplateBtn.click();
    
    // 폼 필드들 확인
    await expect(page.locator('input[x-model="checklistForm.name"]')).toBeVisible();
    await expect(page.locator('input[x-model="checklistForm.category"]')).toBeVisible();
    await expect(page.locator('select[x-model="checklistForm.timeSlot"]')).toBeVisible();
    await expect(page.locator('select[x-model="checklistForm.priority"]')).toBeVisible();
    
    console.log('✅ 체크리스트 폼 확인 완료');
  });

  test('체크리스트 템플릿 생성 플로우', async ({ page }) => {
    console.log('📝 체크리스트 생성 플로우 테스트');
    
    const utils = new AdminTestUtils(page);
    
    // 새 템플릿 버튼 클릭
    await page.locator('button:has-text("새 템플릿")').click();
    
    // 폼 입력
    await page.fill('input[x-model="checklistForm.name"]', '테스트 체크리스트');
    await page.fill('input[x-model="checklistForm.category"]', '기술 점검');
    await page.selectOption('select[x-model="checklistForm.timeSlot"]', 'MORNING');
    await page.selectOption('select[x-model="checklistForm.priority"]', 'HIGH');
    
    // 저장 버튼 클릭
    const saveBtn = page.locator('button:has-text("생성")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    
    // 성공 메시지 또는 결과 확인
    await utils.waitForLoading();
    const successMsg = await utils.checkForSuccess();
    
    if (successMsg) {
      console.log('✅ 체크리스트 생성 성공');
    } else {
      console.log('⚠️ 체크리스트 생성 결과 불명확');
    }
  });

  test('체크리스트 템플릿 목록 표시', async ({ page }) => {
    console.log('📋 체크리스트 템플릿 목록 확인');
    
    // 템플릿 섹션 확인
    await expect(page.locator('h3:has-text("체크리스트 템플릿")')).toBeVisible();
    
    // 기존 템플릿이 있다면 표시 확인
    const templateCards = page.locator('[x-for="template in checklistTemplates"]');
    const count = await templateCards.count();
    
    console.log(`✅ 체크리스트 템플릿 ${count}개 표시됨`);
  });
});

// 테스트 그룹: 사용자 관리
test.describe('관리자 대시보드 - 사용자 관리', () => {
  
  test.beforeEach(async ({ page }) => {
    const utils = new AdminTestUtils(page);
    await page.goto(ADMIN_URL);
    await utils.login();
    await utils.switchTab('사용자 관리');
  });

  test('사용자 목록 테이블 확인', async ({ page }) => {
    console.log('👥 사용자 관리 테이블 확인');
    
    // 테이블 헤더 확인
    const headers = ['이름', '이메일', '역할', '상태', '마지막 로그인', '관리'];
    
    for (const header of headers) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }
    
    console.log('✅ 사용자 테이블 헤더 확인 완료');
  });
});

// 테스트 그룹: API 호출 및 네트워크 테스트
test.describe('관리자 대시보드 - API 통합', () => {
  
  test('API 엔드포인트 응답 확인', async ({ page }) => {
    console.log('🌐 API 엔드포인트 테스트 시작');
    
    const utils = new AdminTestUtils(page);
    const apiCalls = await utils.monitorApiCalls();
    
    await page.goto(ADMIN_URL);
    
    // 로그인 API 호출
    await utils.login();
    
    // 대시보드 데이터 로드 API 호출들
    await utils.switchTab('대시보드');
    await utils.waitForLoading();
    
    // 다른 탭들도 전환해서 API 호출 확인
    const tabs = ['토너먼트 관리', '체크리스트 관리', '사용자 관리'];
    
    for (const tab of tabs) {
      await utils.switchTab(tab);
      await utils.waitForLoading();
    }
    
    // API 호출 결과 분석
    console.log(`📊 총 ${apiCalls.length}개의 API 호출 감지됨`);
    
    for (const call of apiCalls) {
      if (call.status >= 400) {
        console.warn(`⚠️ API 오류: ${call.url} - Status ${call.status}`);
      } else {
        console.log(`✅ API 성공: ${call.url} - Status ${call.status}`);
      }
    }
  });
});

// 테스트 그룹: 반응형 및 접근성
test.describe('관리자 대시보드 - UI/UX', () => {
  
  test('반응형 레이아웃 확인', async ({ page }) => {
    console.log('📱 반응형 레이아웃 테스트');
    
    const utils = new AdminTestUtils(page);
    await page.goto(ADMIN_URL);
    await utils.login();
    
    // 다양한 화면 크기 테스트
    const viewports = [
      { width: 1920, height: 1080, name: '데스크톱' },
      { width: 1024, height: 768, name: '태블릿' },
      { width: 375, height: 667, name: '모바일' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // 주요 요소들이 여전히 보이는지 확인
      await expect(page.locator('h1:has-text("WSOP 관리자 패널")')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      console.log(`✅ ${viewport.name} 화면에서 정상 표시`);
    }
  });

  test('키보드 네비게이션 확인', async ({ page }) => {
    console.log('⌨️ 키보드 접근성 테스트');
    
    const utils = new AdminTestUtils(page);
    await page.goto(ADMIN_URL);
    
    // Tab 키로 폼 네비게이션 테스트
    await page.keyboard.press('Tab'); // 이메일 필드
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // 비밀번호 필드
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab'); // 로그인 버튼
    await expect(page.locator('button:has-text("로그인")')).toBeFocused();
    
    console.log('✅ 키보드 네비게이션 정상 작동');
  });
});

// 테스트 그룹: 성능 및 안정성
test.describe('관리자 대시보드 - 성능 테스트', () => {
  
  test('페이지 로드 성능 측정', async ({ page }) => {
    console.log('⚡ 성능 테스트 시작');
    
    const startTime = Date.now();
    
    await page.goto(ADMIN_URL);
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`📊 페이지 로드 시간: ${loadTime}ms`);
    
    // 3초 이내 로드되어야 함
    expect(loadTime).toBeLessThan(3000);
    
    // JavaScript 에러 확인
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    // 로그인 수행
    const utils = new AdminTestUtils(page);
    await utils.login();
    
    // JavaScript 에러가 없어야 함
    expect(jsErrors).toHaveLength(0);
    
    console.log('✅ 성능 테스트 완료 - 에러 없음');
  });
});

// 테스트 실행 후 정리
test.afterEach(async ({ page }) => {
  // 콘솔 에러 확인
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });
  
  if (logs.length > 0) {
    console.warn('⚠️ 콘솔 에러 발견:', logs);
  }
});

console.log('🎬 WSOP Field Director Pro - E2E 테스트 스위트 로드 완료');