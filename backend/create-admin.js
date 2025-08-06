#!/usr/bin/env node

/**
 * 관리자 계정 생성 스크립트
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');

// .env 파일 로드
require('dotenv').config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        const adminData = {
            name: '현장 총괄 디렉터',
            email: 'director@wsop.com',
            password: await bcrypt.hash('director123', 12),
            role: 'DIRECTOR',
            isActive: true
        };

        // 기존 관리자 계정 확인
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminData.email }
        });

        if (existingAdmin) {
            console.log('✅ 관리자 계정이 이미 존재합니다:', adminData.email);
            
            // 비밀번호 업데이트 (테스트 목적)
            await prisma.user.update({
                where: { email: adminData.email },
                data: { 
                    password: adminData.password,
                    role: 'DIRECTOR' 
                }
            });
            console.log('🔄 관리자 계정 정보 업데이트 완료');
        } else {
            // 새 관리자 계정 생성
            const admin = await prisma.user.create({
                data: adminData,
                select: { id: true, email: true, name: true, role: true }
            });
            
            console.log('🎉 관리자 계정 생성 완료:', admin);
        }

        // 추가 테스트 사용자 생성
        const testMember = {
            name: '현장 팀원',
            email: 'member@wsop.com',
            password: await bcrypt.hash('member123', 12),
            role: 'FIELD_MEMBER',
            isActive: true
        };

        const existingMember = await prisma.user.findUnique({
            where: { email: testMember.email }
        });

        if (!existingMember) {
            const member = await prisma.user.create({
                data: testMember,
                select: { id: true, email: true, name: true, role: true }
            });
            console.log('👥 팀원 계정 생성 완료:', member);
        }

        // 사용자 통계
        const userCount = await prisma.user.count();
        console.log(`\n📊 총 사용자 수: ${userCount}명`);

        const usersByRole = await prisma.user.groupBy({
            by: ['role'],
            _count: {
                role: true
            }
        });

        console.log('📈 역할별 사용자 수:');
        usersByRole.forEach(group => {
            console.log(`  - ${group.role}: ${group._count.role}명`);
        });

        console.log('\n✅ 관리자 계정 설정 완료!');
        
    } catch (error) {
        console.error('❌ 관리자 계정 생성 실패:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// 스크립트 직접 실행 시
if (require.main === module) {
    createAdminUser()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { createAdminUser };