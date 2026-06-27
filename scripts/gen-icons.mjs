// Generates Splay's extension icons (16/48/128 px) as PNGs with no external
// dependencies: it rasterizes the ☷ trigram in white on the brand gradient and
// encodes the PNG by hand (zlib via Node's built-in module).
//
// Run with: node scripts/gen-icons.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_DIR = resolve(import.meta.dirname, '..', 'public', 'icons');

const C1 = [0x43, 0x61, 0xee]; // #4361EE
const C2 = [0x7c, 0x3a, 0xed]; // #7C3AED

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

function insideRoundRect(px, py, x0, y0, x1, y1, rad) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const dx = px < x0 + rad ? x0 + rad - px : px > x1 - rad ? px - (x1 - rad) : 0;
  const dy = py < y0 + rad ? y0 + rad - py : py > y1 - rad ? py - (y1 - rad) : 0;
  if (dx > 0 && dy > 0) return dx * dx + dy * dy <= rad * rad;
  return true;
}

// Capsule (rounded horizontal segment) hit test.
function inCapsule(px, py, xa, xb, yc, halfTh) {
  const cx = clamp(px, xa, xb);
  const dx = px - cx;
  const dy = py - yc;
  return dx * dx + dy * dy <= halfTh * halfTh;
}

function inTrigram(px, py, N) {
  const barLeft = N * 0.27;
  const barRight = N * 0.73;
  const gap = N * 0.1;
  const leftEnd = N / 2 - gap / 2;
  const rightStart = N / 2 + gap / 2;
  const halfTh = (N * 0.085) / 2;
  const rows = [N * 0.34, N * 0.5, N * 0.66];
  for (const yc of rows) {
    if (inCapsule(px, py, barLeft, leftEnd, yc, halfTh)) return true;
    if (inCapsule(px, py, rightStart, barRight, yc, halfTh)) return true;
  }
  return false;
}

function drawIcon(N) {
  const SS = 4; // supersampling factor per axis
  const rad = N * 0.22;
  const data = Buffer.alloc(N * N * 4);

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let covered = 0;
      const total = SS * SS;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (!insideRoundRect(px, py, 0, 0, N, N, rad)) continue;
          covered++;
          if (inTrigram(px, py, N)) {
            sumR += 255;
            sumG += 255;
            sumB += 255;
          } else {
            const t = clamp((px + py) / (2 * N), 0, 1);
            sumR += lerp(C1[0], C2[0], t);
            sumG += lerp(C1[1], C2[1], t);
            sumB += lerp(C1[2], C2[2], t);
          }
        }
      }

      const idx = (y * N + x) * 4;
      if (covered === 0) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      } else {
        data[idx] = Math.round(sumR / covered);
        data[idx + 1] = Math.round(sumG / covered);
        data[idx + 2] = Math.round(sumB / covered);
        data[idx + 3] = Math.round((covered / total) * 255);
      }
    }
  }
  return data;
}

// ─── Minimal PNG encoder ─────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(N, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(N, 0);
  ihdr.writeUInt32BE(N, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw scanlines, each prefixed by filter type 0.
  const raw = Buffer.alloc(N * (N * 4 + 1));
  for (let y = 0; y < N; y++) {
    raw[y * (N * 4 + 1)] = 0;
    rgba.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [16, 48, 128]) {
  const png = encodePNG(size, drawIcon(size));
  const file = resolve(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, png);
  console.log(`wrote ${file} (${png.length} bytes)`);
}
