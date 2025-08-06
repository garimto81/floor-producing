// 임시 아이콘 생성 스크립트
// 개발용 임시 아이콘을 생성합니다

const fs = require('fs');
const path = require('path');

// SVG 아이콘 생성
const iconSVG = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#2196F3"/>
  <text x="512" y="512" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white" dy=".3em">FD</text>
  <text x="512" y="700" font-family="Arial, sans-serif" font-size="80" text-anchor="middle" fill="white">Field Director</text>
</svg>
`;

const splashSVG = `
<svg width="1242" height="2436" xmlns="http://www.w3.org/2000/svg">
  <rect width="1242" height="2436" fill="#2196F3"/>
  <text x="621" y="1218" font-family="Arial, sans-serif" font-size="150" font-weight="bold" text-anchor="middle" fill="white" dy=".3em">Field Director Pro</text>
  <text x="621" y="1400" font-family="Arial, sans-serif" font-size="60" text-anchor="middle" fill="white">WSOP 현장 총괄</text>
</svg>
`;

// assets 폴더가 없으면 생성
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// 파일 저장
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSVG);
fs.writeFileSync(path.join(assetsDir, 'splash.svg'), splashSVG);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), iconSVG);

// PNG 변환 안내
console.log(`
✅ SVG 아이콘이 생성되었습니다!

다음 단계:
1. SVG를 PNG로 변환하세요:
   - icon.svg → icon.png (1024x1024)
   - splash.svg → splash.png (1242x2436)
   - adaptive-icon.svg → adaptive-icon.png (1024x1024)

2. 온라인 변환 도구:
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/kr/svg-png/

3. 또는 ImageMagick 사용:
   convert assets/icon.svg -resize 1024x1024 assets/icon.png
`);

// 간단한 favicon 생성
const faviconSVG = `
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#2196F3"/>
  <text x="24" y="24" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white" dy=".3em">FD</text>
</svg>
`;

fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), faviconSVG);