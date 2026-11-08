import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const icon = await readFile(`${publicDir}/icon.svg`);
await mkdir(`${publicDir}/icons`, { recursive: true });
for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180], ['maskable-512', 512]]) {
  await sharp(icon).resize(size, size).png().toFile(`${publicDir}/icons/${name}.png`);
}
// Authoring requires an installed Korean font. Generated PNGs are tracked, so deployment does not.
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#fffdf7"/><rect x="28" y="28" width="1144" height="574" rx="36" fill="none" stroke="#e9e2ce" stroke-width="2"/><circle cx="970" cy="330" r="165" fill="#f3eedc"/><path d="M80 390H700" stroke="#f8d7bc" stroke-width="22" stroke-linecap="round"/><circle cx="1050" cy="120" r="15" fill="#eebc60"/><circle cx="810" cy="475" r="11" fill="#91a879"/><g font-family="Malgun Gothic, Noto Sans CJK KR, sans-serif"><text x="80" y="130" font-size="32" font-weight="700" fill="#557660">뱅뱅밥 · 우리 동네 한 끼 지도</text><text x="80" y="285" font-size="68" font-weight="700" fill="#384637">오늘 점심,</text><text x="80" y="380" font-size="68" font-weight="700" fill="#384637">뱅뱅 돌지 말고.</text><text x="80" y="490" font-size="26" fill="#858674">강남역부터 양재역까지, 맛있는 발견</text></g></svg>`;
await sharp(Buffer.from(bg)).composite([{ input: await sharp(icon).resize(270, 270).toBuffer(), top: 195, left: 835 }]).png().toFile(`${publicDir}/og-image.png`);
console.log('Generated PWA icons and social card background');
