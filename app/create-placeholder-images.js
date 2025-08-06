const fs = require('fs');
const path = require('path');

// 간단한 단색 PNG 생성 함수
function createPlaceholderPNG(width, height, filename) {
  // PNG 헤더
  const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR 청크 (이미지 헤더)
  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(width, 0);
  IHDR.writeUInt32BE(height, 4);
  IHDR[8] = 8; // bit depth
  IHDR[9] = 2; // color type (RGB)
  IHDR[10] = 0; // compression
  IHDR[11] = 0; // filter
  IHDR[12] = 0; // interlace
  
  // 파란색 픽셀 데이터 생성
  const pixelData = [];
  for (let y = 0; y < height; y++) {
    pixelData.push(0); // filter type
    for (let x = 0; x < width; x++) {
      pixelData.push(33, 150, 243); // RGB: #2196F3
    }
  }
  
  // zlib 압축 (간단한 비압축)
  const IDAT_data = Buffer.concat([
    Buffer.from([0x78, 0x9C]), // zlib header
    Buffer.from(pixelData),
    Buffer.from([0x00, 0x00, 0x00, 0x01]) // adler32 (dummy)
  ]);
  
  // CRC 계산 (간단한 더미값)
  const crc = 0x00000000;
  
  // 청크 생성 함수
  function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type, 'ascii');
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
  }
  
  // PNG 파일 조립
  const png = Buffer.concat([
    PNG_SIGNATURE,
    createChunk('IHDR', IHDR),
    createChunk('IDAT', IDAT_data),
    createChunk('IEND', Buffer.alloc(0))
  ]);
  
  fs.writeFileSync(filename, png);
}

// assets 디렉토리 확인
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// 대체 방법: Canvas를 사용한 PNG 생성
const { createCanvas } = require('canvas');

function createIconPNG(size, text, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 배경
  ctx.fillStyle = '#2196F3';
  ctx.fillRect(0, 0, size, size);
  
  // 텍스트
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size/5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size/2, size/2);
  
  // 파일 저장
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
}

// canvas 모듈이 없는 경우를 위한 대체 방법
console.log(`
임시 아이콘 생성 방법:

1. 온라인 도구 사용 (권장):
   - https://www.canva.com (무료)
   - https://www.figma.com (무료)
   - 파란 배경(#2196F3)에 흰색 "FD" 텍스트

2. 수동 생성:
   - Windows: Paint 또는 Paint 3D
   - 크기: icon.png (1024x1024)
   - 크기: splash.png (1242x2436)
   - 크기: adaptive-icon.png (1024x1024)

3. 다운로드 가능한 임시 아이콘:
   https://via.placeholder.com/1024x1024/2196F3/FFFFFF?text=FD

파일을 다운로드하여 assets 폴더에 저장하세요.
`);