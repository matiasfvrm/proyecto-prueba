// Renders promo.html frame by frame to PNGs: node render.js <outDir> [fps] [onlyTimes,comma,separated]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || 'frames';
  const fps = Number(process.argv[3] || 30);
  const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.resolve(__dirname, 'promo-vertical.html'));
  await page.evaluate(() => document.fonts.ready);
  const times = only || Array.from({ length: 27 * fps }, (_, i) => i / fps);
  for (let i = 0; i < times.length; i++) {
    await page.evaluate((t) => window.seek(t), times[i]);
    const name = only ? `t${times[i]}.png` : `f${String(i).padStart(5, '0')}.png`;
    await page.screenshot({ path: path.join(out, name) });
  }
  await browser.close();
})();
