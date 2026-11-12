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
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#fffdf7"/><rect x="28" y="28" width="1144" height="574" rx="36" fill="none" stroke="#e9e2ce" stroke-width="2"/><circle cx="970" cy="330" r="165" fill="#f3eedc"/><path d="M80 390H735" stroke="#f8d7bc" stroke-width="22" stroke-linecap="round"/><circle cx="1050" cy="120" r="15" fill="#eebc60"/><circle cx="810" cy="475" r="11" fill="#91a879"/><g font-family="Malgun Gothic, Noto Sans CJK KR, sans-serif"><text x="80" y="130" font-size="30" font-weight="700" fill="#557660">뱅뱅밥 · 카드 데이터로 찾는 동네 맛집</text><text x="80" y="285" font-size="64" font-weight="700" fill="#384637">30대 여성이</text><text x="80" y="380" font-size="64" font-weight="700" fill="#384637">많이 찾는 카페?</text><text x="80" y="485" font-size="28" fill="#557660">연령·성별·단골까지, AI에게 물어보세요.</text><text x="80" y="540" font-size="22" fill="#858674">강남역 — 뱅뱅사거리 — 양재역 · BC카드 결제 데이터 기반</text></g></svg>`;
await sharp(Buffer.from(bg)).composite([{ input: await sharp(icon).resize(270, 270).toBuffer(), top: 195, left: 835 }]).png().toFile(`${publicDir}/og-card-data.png`);
console.log('Generated PWA icons and social card background');
