import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const icon = await readFile(`${publicDir}/icon.svg`);
await mkdir(`${publicDir}/icons`, { recursive: true });
for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180], ['maskable-512', 512]]) {
  await sharp(icon).resize(size, size).png().toFile(`${publicDir}/icons/${name}.png`);
}
// Authoring requires an installed Korean font. Generated PNGs are tracked, so deployment does not.
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f8f3e8"/><rect x="24" y="24" width="1152" height="582" rx="14" fill="none" stroke="#dcd1b9" stroke-width="2"/><path d="M68 355H545" stroke="#efc5aa" stroke-width="17"/><g font-family="Malgun Gothic, Noto Sans CJK KR, sans-serif"><text x="66" y="115" font-size="30" font-weight="700" fill="#557660">뱅뱅밥 · 우리 동네 맛집 수첩</text><text x="66" y="266" font-size="56" font-weight="700" fill="#384637">오늘 점심,</text><text x="66" y="346" font-size="52" font-weight="700" fill="#384637">한 장 펼쳐볼까요?</text><text x="66" y="433" font-size="25" fill="#557660">“30대 여성이 많이 찾는 카페”</text><text x="66" y="477" font-size="23" fill="#6e755f">카드 데이터와 AI로 찾아요.</text><text x="66" y="558" font-size="20" fill="#858674">강남역 — 뱅뱅사거리 — 양재역</text></g></svg>`;
const art = execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./render-paper-art.tsx', import.meta.url))]);
await sharp(Buffer.from(bg)).composite([{ input: await sharp(art).resize(620, 414).png().toBuffer(), top: 140, left: 552 }]).png().toFile(`${publicDir}/og-paper-town.png`);
console.log('Generated PWA icons and social card background');
