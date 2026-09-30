// Renders thumbnail.html to fiverr-thumbnail.png (1280x769) and fiverr-thumbnail-hd.png (1920x1154)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1154 } });
  page.on('pageerror', (e) => { console.error('PAGE ERROR', e.message); process.exit(1); });
  await page.goto('file://' + path.resolve(__dirname, 'thumbnail.html'));
  await page.evaluate(() => Promise.all(['100px Anton', '600 100px Mont', '800 100px Mont'].map((f) => document.fonts.load(f))));
  const data = await page.evaluate(() => window.renderThumb());
  fs.writeFileSync(path.join(__dirname, 'fiverr-thumbnail-hd.png'), Buffer.from(data.split(',')[1], 'base64'));
  await browser.close();
})();
