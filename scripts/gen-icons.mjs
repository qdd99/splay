// Generates Splay's extension icons (16/48/128 px) as PNGs with no external
// dependencies: it rasterizes the design-language "fan" mark on a soft daylight
// gradient and encodes the PNG by hand (zlib via Node's built-in module).
//
// The fan geometry is taken verbatim from the canonical logo HTML: five 11×40
// full-pill bars, all pinned to one shared bottom-center pivot in a 60×52 box,
// rotated -34° / -17° / 0° / +17° / +34°, listed left→right so each stacks above
// the one to its left.
//
// Run with: node scripts/gen-icons.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_DIR = resolve(import.meta.dirname, '..', 'public', 'icons');

// Background = daylight gradient (lavender → warm cream).
const BG_TOP = [0xe7, 0xe2, 0xf2];
const BG_BOTTOM = [0xf4, 0xef, 0xe7];

// Fan mark, in its native 60×52 coordinate box (top-left origin, y down).
const FAN_PIVOT = { x: 30, y: 46 }; // center-x, bottom of the bars (bottom: 6px)
const BAR_H = 40;
const BAR_HW = 5.5; // half of the 11px width; radius = half-width → full pill

const BLADES = [
  { angle: -34, color: [142, 159, 224] }, // indigo (left — drawn first, lowest)
  { angle: -17, color: [95, 200, 196] }, // teal
  { angle: 0, color: [224, 144, 180] }, // plum (center)
  { angle: 17, color: [224, 176, 111] }, // clay
  { angle: 34, color: [179, 154, 224] }, // violet (right — drawn last, on top)
];

const SHADOW_COLOR = [46, 42, 51]; // rgba(46,42,51,·) — design-language shadow
const SHADOW_OPACITY = 0.16;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

function insideRoundRect(px, py, x0, y0, x1, y1, rad) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const dx = px < x0 + rad ? x0 + rad - px : px > x1 - rad ? px - (x1 - rad) : 0;
  const dy = py < y0 + rad ? y0 + rad - py : py > y1 - rad ? py - (y1 - rad) : 0;
  if (dx > 0 && dy > 0) return dx * dx + dy * dy <= rad * rad;
  return true;
}

// Tight bounding box of the whole fan in fan-space (over the rotated bar rects;
// the rounded caps stay within the rect corners).
function fanBBox() {
  const corners = [
    [-BAR_HW, 0],
    [BAR_HW, 0],
    [-BAR_HW, -BAR_H],
    [BAR_HW, -BAR_H],
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of BLADES) {
    const t = (b.angle * Math.PI) / 180;
    const c = Math.cos(t);
    const s = Math.sin(t);
    for (const [dx, dy] of corners) {
      const x = FAN_PIVOT.x + (dx * c - dy * s);
      const y = FAN_PIVOT.y + (dx * s + dy * c);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

// Is a fan-space point inside this blade — an 11×40 full-pill bar rotated about
// the pivot? Modeled as a capsule whose centerline runs from (0,-hw) to
// (0,-(H-hw)) in the bar's local frame, so the bottom cap rests on the pivot.
function inBladeFan(fx, fy, blade) {
  const t = (blade.angle * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const vx = fx - FAN_PIVOT.x;
  const vy = fy - FAN_PIVOT.y;
  const lx = vx * c + vy * s; // inverse-rotate the offset into bar-local space
  const ly = -vx * s + vy * c;
  const cy = clamp(ly, -(BAR_H - BAR_HW), -BAR_HW);
  const dx = lx;
  const dy = ly - cy;
  return dx * dx + dy * dy <= BAR_HW * BAR_HW;
}

// Separable box-blur passes (out-of-bounds treated as 0) to soften the shadow.
function boxBlurPass(src, N, r, horizontal) {
  const out = new Float32Array(N * N);
  const win = 2 * r + 1;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const xx = horizontal ? x + k : x;
        const yy = horizontal ? y : y + k;
        if (xx < 0 || xx >= N || yy < 0 || yy >= N) continue;
        sum += src[yy * N + xx];
      }
      out[y * N + x] = sum / win;
    }
  }
  return out;
}

function blur(src, N, r, iterations) {
  let a = src;
  for (let i = 0; i < iterations; i++) {
    a = boxBlurPass(a, N, r, true);
    a = boxBlurPass(a, N, r, false);
  }
  return a;
}

function drawIcon(N) {
  const SS = 4; // supersampling per axis
  const total = SS * SS;
  const rad = N * 0.22;

  // Fit the fan's bounding box centered into the icon with even padding.
  const bb = fanBBox();
  const bw = bb.maxX - bb.minX;
  const bh = bb.maxY - bb.minY;
  const pad = N * 0.15;
  const scale = Math.min((N - 2 * pad) / bw, (N - 2 * pad) / bh);
  const ox = (N - bw * scale) / 2; // icon-space top-left of the fan box
  const oy = (N - bh * scale) / 2;
  const toFanX = (px) => bb.minX + (px - ox) / scale;
  const toFanY = (py) => bb.minY + (py - oy) / scale;

  // Pass 1 — per-pixel outer-mask coverage, fan coverage, and fan color.
  const maskA = new Float32Array(N * N);
  const fanA = new Float32Array(N * N);
  const fanR = new Float32Array(N * N);
  const fanG = new Float32Array(N * N);
  const fanB = new Float32Array(N * N);

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let covered = 0;
      let fanCount = 0;
      let fr = 0;
      let fg = 0;
      let fb = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          if (!insideRoundRect(px, py, 0, 0, N, N, rad)) continue;
          covered++;
          const fx = toFanX(px);
          const fy = toFanY(py);
          let col = null;
          for (const blade of BLADES) {
            if (inBladeFan(fx, fy, blade)) col = blade.color;
          }
          if (col) {
            fanCount++;
            fr += col[0];
            fg += col[1];
            fb += col[2];
          }
        }
      }
      const i = y * N + x;
      maskA[i] = covered / total;
      fanA[i] = fanCount / total;
      if (fanCount > 0) {
        fanR[i] = fr / fanCount;
        fanG[i] = fg / fanCount;
        fanB[i] = fb / fanCount;
      }
    }
  }

  // Pass 2 — shadow = the fan's coverage, shifted down and blurred.
  const dy = Math.max(1, Math.round(N * 0.03));
  const r = Math.max(1, Math.round(N * 0.05));
  const shifted = new Float32Array(N * N);
  for (let y = 0; y < N; y++) {
    const srcY = y - dy;
    if (srcY < 0) continue;
    for (let x = 0; x < N; x++) shifted[y * N + x] = fanA[srcY * N + x];
  }
  const shadow = blur(shifted, N, r, 2);

  // Pass 3 — composite: background gradient, then shadow, then the fan.
  const data = Buffer.alloc(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const idx = i * 4;
      const m = maskA[i];
      if (m <= 0) {
        data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0;
        continue;
      }
      const tg = clamp((y + 0.5) / N, 0, 1);
      let R = lerp(BG_TOP[0], BG_BOTTOM[0], tg);
      let G = lerp(BG_TOP[1], BG_BOTTOM[1], tg);
      let B = lerp(BG_TOP[2], BG_BOTTOM[2], tg);

      const sa = Math.min(1, shadow[i]) * SHADOW_OPACITY * m; // clipped to the card
      R = lerp(R, SHADOW_COLOR[0], sa);
      G = lerp(G, SHADOW_COLOR[1], sa);
      B = lerp(B, SHADOW_COLOR[2], sa);

      const fa = fanA[i];
      if (fa > 0) {
        R = lerp(R, fanR[i], fa);
        G = lerp(G, fanG[i], fa);
        B = lerp(B, fanB[i], fa);
      }

      data[idx] = Math.round(R);
      data[idx + 1] = Math.round(G);
      data[idx + 2] = Math.round(B);
      data[idx + 3] = Math.round(m * 255);
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
