// Renders promo.html (canvas) frame by frame to JPGs: node render.js <outDir> [fps] [t1,t2,...]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || 'frames';
  const fps = Number(process.argv[3] || 30);
  const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
  const from = Number(process.env.FROM || 0), to = process.env.TO ? Number(process.env.TO) : null;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => { console.error('PAGE ERROR', e.message); process.exit(1); });
  await page.goto('file://' + path.resolve(__dirname, 'promo.html'));
  await page.evaluate(async () => {
    document.body.classList.add('render');
    await Promise.all(['100px Anton', '600 100px Mont', '800 100px Mont'].map((f) => document.fonts.load(f)));
  });
  const total = Math.round((await page.evaluate(() => window.DURATION)) * fps);
  const frames = only ? only.map((t) => [t, `t${t}.jpg`]) :
    Array.from({ length: (to ?? total) - from }, (_, k) => { const i = from + k; return [i / fps, `f${String(i).padStart(5, '0')}.jpg`]; });
  for (const [t, name] of frames) {
    const data = await page.evaluate(async (t) => {
      window.renderFrame(t); await window.loadPending(); window.renderFrame(t);
      return document.getElementById('c').toDataURL('image/jpeg', 0.93);
    }, t);
    fs.writeFileSync(path.join(out, name), Buffer.from(data.split(',')[1], 'base64'));
  }
  await browser.close();
})();
