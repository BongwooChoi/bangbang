import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const icon = await readFile(`${publicDir}/icon.svg`);
await mkdir(`${publicDir}/icons`, { recursive: true });
for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180], ['maskable-512', 512]]) {
  await sharp(icon).resize(size, size).png().toFile(`${publicDir}/icons/${name}.png`);
}
// CSS 3D requires browser rendering. Keep the checked-in PNG independent of deployment fonts.
const preview = execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./render-og-preview.tsx', import.meta.url))]);
const previewPath = new URL('../tmp/og-popup-book.html', import.meta.url);
await mkdir(new URL('../tmp/', import.meta.url), { recursive: true });
await writeFile(previewPath, preview);
console.log('Generated PWA icons and tmp/og-popup-book.html. Capture it with scripts/capture-social-card.mjs in ego-browser.');
