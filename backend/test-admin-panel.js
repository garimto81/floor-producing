#!/usr/bin/env node

/**
 * 관리 패널 실제 동작 테스트
 */

const puppeteer = require('puppeteer');

async function testAdminPanel() {
    let browser;
    let page;
    
    try {
        console.log('🚀 관리 패널 실제 동작 테스트 시작...');
        
        // 브라우저 실행
        browser = await puppeteer.launch({ 
            headless: false, // 브라우저 UI 표시
            devtools: true   // 개발자 도구 열기
        });
        
        page = await browser.newPage();
        
        // 콘솔 에러 감지
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ 브라우저 콘솔 에러:', msg.text());
            } else if (msg.type() === 'log') {
                console.log('📝 브라우저 로그:', msg.text());
            }
        });
        
        // 네트워크 오류 감지
        page.on('requestfailed', request => {
            console.log('🌐 네트워크 요청 실패:', request.url(), request.failure().errorText);
        });
        
        // 관리 패널 페이지 로드
        console.log('🌐 http://localhost:3003/admin 페이지 로드 중...');
        await page.goto('http://localhost:3003/admin', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
        });
        
        // 페이지 로드 확인
        const title = await page.title();
        console.log('📄 페이지 제목:', title);
        
        // Alpine.js 로드 확인
        await page.waitForFunction(() => window.Alpine !== undefined, { timeout: 5000 });
        console.log('✅ Alpine.js 로드 확인');
        
        // 로그인 폼 확인
        const loginForm = await page.$('form');
        if (loginForm) {
            console.log('✅ 로그인 폼 발견');
            
            // 로그인 테스트
            await page.type('input[type="email"]', 'director@wsop.com');
            await page.type('input[type="password"]', 'director123');
            
            console.log('🔑 로그인 정보 입력 완료');
            
            // 로그인 버튼 클릭
            await page.click('button[type="submit"]');
            console.log('🚪 로그인 버튼 클릭');
            
            // 로그인 후 대시보드 로드 대기
            await page.waitForTimeout(3000);
            
            // 대시보드 확인
            const dashboard = await page.$('[x-show="activeTab === \'dashboard\'"]');
            if (dashboard) {
                console.log('✅ 대시보드 화면 로드됨');
                
                // 통계 카드 확인
                const statsCards = await page.$$('.bg-white.overflow-hidden.shadow.rounded-lg');
                console.log(`📊 통계 카드 수: ${statsCards.length}개`);
                
                // 탭 전환 테스트
                console.log('🔄 탭 전환 테스트 시작...');
                
                // 사용자 관리 탭 클릭
                await page.click('button[onclick*="activeTab = \'users\'"], button[@click="activeTab = \'users\'"]');
                await page.waitForTimeout(1000);
                console.log('✅ 사용자 관리 탭 전환');
                
                // 토너먼트 관리 탭 클릭
                await page.click('button[onclick*="activeTab = \'tournaments\'"], button[@click="activeTab = \'tournaments\'"]');
                await page.waitForTimeout(1000);
                console.log('✅ 토너먼트 관리 탭 전환');
                
                console.log('🎉 모든 기본 기능 테스트 통과!');
            } else {
                console.log('❌ 대시보드 화면을 찾을 수 없습니다');
            }
        } else {
            console.log('❌ 로그인 폼을 찾을 수 없습니다');
        }
        
        // 3초 후 브라우저 유지 (수동 확인용)
        console.log('⏳ 3초 후 브라우저를 열어둔 채로 테스트 완료...');
        await page.waitForTimeout(3000);
        
    } catch (error) {
        console.error('❌ 테스트 실행 중 오류:', error.message);
    }
    
    console.log('✅ 테스트 완료 - 브라우저는 열어둔 상태입니다 (수동 확인용)');
    console.log('📝 브라우저에서 F12를 눌러 콘솔 탭을 확인하세요');
    
    // 브라우저를 닫지 않고 유지 (수동 확인을 위해)
    // if (browser) {
    //     await browser.close();
    // }
}

// 스크립트 직접 실행시
if (require.main === module) {
    testAdminPanel().catch(console.error);
}

module.exports = { testAdminPanel };