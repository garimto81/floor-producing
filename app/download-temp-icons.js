const https = require('https');
const fs = require('fs');
const path = require('path');

// assets 폴더 생성
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// 다운로드 함수
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(assetsDir, filename));
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ ${filename} 다운로드 완료`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(path.join(assetsDir, filename), () => {});
      reject(err);
    });
  });
}

async function downloadAllIcons() {
  try {
    console.log('🔄 임시 아이콘 다운로드 중...\n');
    
    // Placeholder.com 서비스 사용
    await downloadImage(
      'https://via.placeholder.com/1024x1024/2196F3/FFFFFF.png?text=FD',
      'icon.png'
    );
    
    await downloadImage(
      'https://via.placeholder.com/1024x1024/2196F3/FFFFFF.png?text=FD',
      'adaptive-icon.png'
    );
    
    await downloadImage(
      'https://via.placeholder.com/1242x2436/2196F3/FFFFFF.png?text=Field+Director+Pro',
      'splash.png'
    );
    
    await downloadImage(
      'https://via.placeholder.com/48x48/2196F3/FFFFFF.png?text=FD',
      'favicon.png'
    );
    
    console.log('\n✅ 모든 아이콘 다운로드 완료!');
    console.log('📁 위치: app/assets/');
    
  } catch (error) {
    console.error('❌ 다운로드 실패:', error.message);
    console.log('\n대체 방법:');
    console.log('1. 브라우저에서 직접 다운로드:');
    console.log('   - icon.png: https://via.placeholder.com/1024x1024/2196F3/FFFFFF.png?text=FD');
    console.log('   - splash.png: https://via.placeholder.com/1242x2436/2196F3/FFFFFF.png?text=Field+Director+Pro');
    console.log('2. assets 폴더에 저장');
  }
}

// 실행
downloadAllIcons();