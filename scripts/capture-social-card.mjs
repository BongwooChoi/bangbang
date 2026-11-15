import { fileURLToPath } from 'node:url';

// Call from an existing ego-browser task: await captureSocialCard(page).
export async function captureSocialCard(page) {
  await page.goto(new URL('../tmp/og-popup-book.html', import.meta.url).href);
  await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await page.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  return page.screenshot({ path: fileURLToPath(new URL('../public/og-popup-book.png', import.meta.url)) });
}
