const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create PNG buffer purely with Node.js built-in zlib
function createPng(width, height, drawFn) {
  const bytesPerPixel = 4;
  const rowSize = width * bytesPerPixel + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression: Deflate
  ihdr[11] = 0; // Filter: Standard
  ihdr[12] = 0; // Interlace: None

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[i] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) | 0;
}

// Drawing icon design: Cyberpunk neon joystick & arcade cabinet emblem
function drawIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Deep dark slate / obsidian
  let r = 6, g = 9, b = 19, a = 255;

  const maxR = isMaskable ? w * 0.38 : w * 0.44;

  // Outer glowing circle
  if (dist < maxR && dist > maxR - (w * 0.04)) {
    // Electric Cyan ring
    return [6, 182, 212, 255];
  }

  // Inner cabinet joystick icon
  // Joystick ball: Red/Magenta
  const ballCy = cy - h * 0.08;
  const ballDist = Math.sqrt(dx * dx + (y - ballCy) * (y - ballCy));
  if (ballDist < w * 0.12) {
    return [236, 72, 153, 255]; // Hot pink / magenta
  }

  // Joystick stick: Titanium
  if (Math.abs(dx) < w * 0.03 && y >= ballCy && y <= cy + h * 0.1) {
    return [226, 232, 240, 255];
  }

  // Joystick base ring
  const baseCy = cy + h * 0.12;
  const baseDist = Math.sqrt((dx * dx) / 1.8 + (y - baseCy) * (y - baseCy));
  if (baseDist < w * 0.14) {
    return [30, 41, 59, 255];
  }

  // Neon Arcade Buttons (cyan, amber, emerald)
  const btn1Dist = Math.sqrt((x - (cx + w * 0.18)) ** 2 + (y - (cy + h * 0.02)) ** 2);
  if (btn1Dist < w * 0.05) return [6, 182, 212, 255];

  const btn2Dist = Math.sqrt((x - (cx + w * 0.22)) ** 2 + (y - (cy + h * 0.14)) ** 2);
  if (btn2Dist < w * 0.05) return [245, 158, 11, 255];

  const btn3Dist = Math.sqrt((x - (cx + w * 0.12)) ** 2 + (y - (cy + h * 0.22)) ** 2);
  if (btn3Dist < w * 0.05) return [16, 185, 129, 255];

  return [r, g, b, a];
}

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA PNG icons...');

// 192x192
const icon192 = createPng(192, 192, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

// 512x512
const icon512 = createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

// Maskable 512x512 (with safe-zone margin)
const iconMaskable = createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);

// Apple Touch Icon 180x180
const appleTouch = createPng(180, 180, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

console.log('Done generating PNG icons!');
