// Generates Splay's extension icons (16/48/128 px) as PNGs with no external
// dependencies: it rasterizes the design-language "fan" mark (five rounded
// blades fanning from a shared bottom pivot) on a soft daylight gradient, and
// encodes the PNG by hand (zlib via Node's built-in module).
//
// Run with: node scripts/gen-icons.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_DIR = resolve(import.meta.dirname, '..', 'public', 'icons');

// Background = daylight gradient (lavender → warm cream).
const BG_TOP = [0xe7, 0xe2, 0xf2];
const BG_BOTTOM = [0xf4, 0xef, 0xe7];

// Fan blades, drawn back-to-front so the center blade sits on top. Angle is
// degrees from vertical (+ tilts right). Left→right hue order per the design
// language: indigo · teal · plum · clay · violet.
const BLADES = [
  { angle: -32, color: [0x5b, 0x73, 0xc4] }, // indigo (far left)
  { angle: 32, color: [0x8a, 0x6f, 0xc0] }, // violet (far right)
  { angle: -16, color: [0x2f, 0x9e, 0x9b] }, // teal
  { angle: 16, color: [0xbf, 0x8a, 0x4e] }, // clay
  { angle: 0, color: [0xc2, 0x63, 0x8f] }, // plum (center, on top)
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

function insideRoundRect(px, py, x0, y0, x1, y1, rad) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const dx = px < x0 + rad ? x0 + rad - px : px > x1 - rad ? px - (x1 - rad) : 0;
  const dy = py < y0 + rad ? y0 + rad - py : py > y1 - rad ? py - (y1 - rad) : 0;
  if (dx > 0 && dy > 0) return dx * dx + dy * dy <= rad * rad;
  return true;
}

// Is the point inside this blade — a capsule from the pivot (0,0) straight up to
// (0,-len) with radius hw, rotated by the blade's angle about the pivot?
function inBlade(px, py, blade, pivotX, pivotY, len, hw) {
  const t = (blade.angle * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const vx = px - pivotX;
  const vy = py - pivotY;
  const lx = vx * c + vy * s; // rotate the offset by -angle into blade-local space
  const ly = -vx * s + vy * c;
  const cy = clamp(ly, -len, 0);
  const dx = lx;
  const dy = ly - cy;
  return dx * dx + dy * dy <= hw * hw;
}

function drawIcon(N) {
  const SS = 4; // supersampling per axis
  const rad = N * 0.22;
  const pivotX = N * 0.5;
  const pivotY = N * 0.74;
  const len = N * 0.46;
  const hw = N * 0.085;
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

          // Start with the background gradient, then let each blade (front-most
          // last) overwrite the color where it covers this sample.
          const tg = clamp(py / N, 0, 1);
          let r = lerp(BG_TOP[0], BG_BOTTOM[0], tg);
          let g = lerp(BG_TOP[1], BG_BOTTOM[1], tg);
          let b = lerp(BG_TOP[2], BG_BOTTOM[2], tg);
          for (const blade of BLADES) {
            if (inBlade(px, py, blade, pivotX, pivotY, len, hw)) {
              r = blade.color[0];
              g = blade.color[1];
              b = blade.color[2];
            }
          }
          sumR += r;
          sumG += g;
          sumB += b;
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

  const raw = Buffer.alloc(N * (N * 4 + 1));
  for (let y = 0; y < N; y++) {
    raw[y * (N * 4 + 1)] = 0; // filter type 0
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
