/**
 * Vygeneruje ikony aplikace. Kreslíme je ručně po pixelech a kódujeme do PNG
 * přes vestavěné zlib – žádná knihovna na obrázky, žádné stahování zvenčí.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BRAND: [number, number, number] = [0x4f, 0x46, 0xe5];
const WHITE: [number, number, number] = [0xff, 0xff, 0xff];
const POLE: [number, number, number] = [0xe8, 0xa8, 0x00];

/** Jednoduchá vlaječka na žerdi – čitelná i v 48 px na liště. */
function draw(size: number): Buffer {
  const px = Buffer.alloc(size * size * 4);
  const r = size * 0.22; // zaoblení rohů

  const poleX = size * 0.3;
  const poleW = Math.max(2, size * 0.055);
  const poleTop = size * 0.2;
  const poleBottom = size * 0.8;

  const flagX = poleX + poleW;
  const flagW = size * 0.36;
  const flagTop = size * 0.24;
  const flagH = size * 0.26;

  const set = (x: number, y: number, color: [number, number, number], alpha = 255) => {
    const i = (y * size + x) * 4;
    px[i] = color[0];
    px[i + 1] = color[1];
    px[i + 2] = color[2];
    px[i + 3] = alpha;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // zaoblený čtverec: mimo rohový oblouk necháme průhledno
      const cx = Math.min(Math.max(x, r), size - r);
      const cy = Math.min(Math.max(y, r), size - r);
      const inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
      if (!inside) {
        set(x, y, BRAND, 0);
        continue;
      }
      set(x, y, BRAND);

      if (x >= poleX && x < poleX + poleW && y >= poleTop && y < poleBottom) {
        set(x, y, POLE);
      } else if (x >= flagX && x < flagX + flagW && y >= flagTop && y < flagTop + flagH) {
        set(x, y, WHITE);
      }
    }
  }
  return px;
}

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size: number, pixels: Buffer): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bitová hloubka
  header[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtr None
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = join(process.cwd(), 'public');
mkdirSync(outDir, { recursive: true });

for (const size of [180, 192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), encodePng(size, draw(size)));
}

writeFileSync(
  join(outDir, 'icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#4f46e5"/>
  <rect x="30" y="20" width="5.5" height="60" rx="2" fill="#e8a800"/>
  <rect x="35.5" y="24" width="36" height="26" fill="#ffffff"/>
</svg>
`,
  'utf8',
);

console.log('✓ public/icon.svg + icon-180/192/512.png');
