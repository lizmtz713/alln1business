#!/usr/bin/env node
/**
 * Generates 1024x1024 solid-color placeholder PNGs for Expo app icon, adaptive icon, and splash.
 * Run: node scripts/generate-placeholder-icons.js
 * Requires: npm install pngjs (dev)
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'images');
const SIZE = 1024;
// Brand-ish dark blue to match splash backgroundColor #0F172A
const R = 0x0f, G = 0x17, B = 0x2a, A = 255;

function createPNG(width, height, r, g, b, a) {
  const buf = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    buf[i * 4] = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = a;
  }
  return encodePNG(width, height, buf);
}

// Minimal PNG encoder (signature + IHDR + IDAT + IEND) using zlib
function crc32(data) {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(out, type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const chunk = Buffer.concat([Buffer.from(type), data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(chunk), 0);
  out.push(len, chunk, crcBuf);
}

function encodePNG(width, height, rgba) {
  const out = [];
  out.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  writeChunk(out, 'IHDR', ihdr);

  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw[y * (1 + width * 4) + 1 + x * 4] = rgba[i];
      raw[y * (1 + width * 4) + 2 + x * 4] = rgba[i + 1];
      raw[y * (1 + width * 4) + 3 + x * 4] = rgba[i + 2];
      raw[y * (1 + width * 4) + 4 + x * 4] = rgba[i + 3];
    }
  }
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(raw, { level: 9 });
  writeChunk(out, 'IDAT', compressed);
  writeChunk(out, 'IEND', Buffer.alloc(0));

  return Buffer.concat(out);
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  const png = createPNG(SIZE, SIZE, R, G, B, A);
  const files = ['icon.png', 'adaptive-icon.png', 'splash-icon.png'];
  for (const name of files) {
    const filePath = path.join(OUT_DIR, name);
    fs.writeFileSync(filePath, png);
    console.log('Written:', filePath);
  }
  // Favicon can be smaller; use same 1024x1024 for simplicity (Expo may resize)
  fs.writeFileSync(path.join(OUT_DIR, 'favicon.png'), png);
  console.log('Written: favicon.png');
}

main();
