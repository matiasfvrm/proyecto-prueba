// Timeline, transitions and finishing pass.
const DURATION = 48;
const SCENES = [
  { a: 0, b: 4, draw: sOpen, name: 'SHOWREEL' },
  { a: 4, b: 8, draw: sEditor, name: '01 — THE EDIT' },
  { a: 8, b: 14, draw: sPlatforms, name: '02 — PLATFORMS' },
  { a: 14, b: 22, draw: sGaming, name: '03 — GAMING' },
  { a: 22, b: 30, draw: sStyles, name: '04 — STYLES' },
  { a: 30, b: 36, draw: sFx, name: '05 — FINISHING' },
  { a: 36, b: 40, draw: sChat, name: '06 — HOW IT WORKS' },
  { a: 40, b: 48, draw: sCta, name: '' },
];
// transition centered on each cut (all cuts sit on a bar line of the 120 BPM track)
const CUTS = [
  { t: 4, type: 'zoom', d: 0.5 }, { t: 8, type: 'whip', d: 0.45 }, { t: 14, type: 'flash', d: 0.2 },
  { t: 22, type: 'rise', d: 0.5 }, { t: 30, type: 'zoom', d: 0.5 }, { t: 36, type: 'whip', d: 0.45 }, { t: 40, type: 'dip', d: 0.5 },
];
// where the kick plays on every beat (see soundtrack.py)
const DROPS = [[4, 36], [40, 46.5]];

const out = document.getElementById('c');
const octx = out.getContext('2d');
const bufA = canvas(), bufB = canvas(), comp = canvas(), post = canvas();
const ca = bufA.getContext('2d'), cb = bufB.getContext('2d'), cc = comp.getContext('2d'), pc = post.getContext('2d');

function renderScene(ctx, i, t) {
  const s = SCENES[i];
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  s.draw(ctx, t - s.a);
  ctx.restore();
}
function blurCopies(dst, src, n, fn) {
  for (let k = 0; k < n; k++) { dst.save(); dst.globalAlpha = k === 0 ? 1 : 1 / (k + 1.5); fn(dst, k / Math.max(1, n - 1)); dst.drawImage(src, 0, 0); dst.restore(); }
}
function transition(type, p, dst) {
  dst.fillStyle = '#000'; dst.fillRect(0, 0, W, H);
  const e = E.inOut(p);
  if (type === 'zoom') {
    if (p < 0.5) {
      const s = 1 + E.expoIn(p * 2) * 1.6;
      blurCopies(dst, bufA, 6, (d, k) => { const z = s * (1 + k * 0.12 * p); d.translate(W / 2, H / 2); d.scale(z, z); d.translate(-W / 2, -H / 2); });
    } else {
      const s = 1 + (1 - E.expo((p - 0.5) * 2)) * 0.5;
      blurCopies(dst, bufB, 6, (d, k) => { const z = s * (1 + k * 0.1 * (1 - p)); d.translate(W / 2, H / 2); d.scale(z, z); d.translate(-W / 2, -H / 2); });
    }
    dst.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - Math.abs(p - 0.5) * 6) * 0.3})`; dst.fillRect(0, 0, W, H);
  } else if (type === 'whip') {
    const x = -e * W, v = Math.sin(p * Math.PI) * 240;
    for (const [src, ox] of [[bufA, x], [bufB, x + W]]) blurCopies(dst, src, 8, (d, k) => d.translate(ox + (k - 0.5) * v, 0));
  } else if (type === 'flash') {
    dst.drawImage(p < 0.5 ? bufA : bufB, 0, 0);
    dst.fillStyle = `rgba(255,255,255,${(1 - Math.abs(p - 0.5) * 2) * 0.55})`; dst.fillRect(0, 0, W, H);
  } else if (type === 'rise') {
    const k = E.expo(p);
    dst.drawImage(bufA, 0, -k * 160);
    dst.fillStyle = `rgba(0,0,0,${k * 0.5})`; dst.fillRect(0, 0, W, H);
    dst.drawImage(bufB, 0, (1 - k) * H);
  } else if (type === 'dip') {
    dst.drawImage(p < 0.5 ? bufA : bufB, 0, 0);
    dst.fillStyle = `rgba(0,0,0,${1 - Math.abs(p - 0.5) * 2})`; dst.fillRect(0, 0, W, H);
  }
}

function cutNear(t) { return CUTS.find((k) => Math.abs(t - k.t) < k.d / 2); }
// brief emphasis on the big section changes only
function accent(t) {
  let a = 0;
  for (const k of [4, 14, 30, 40]) a += Math.exp(-Math.abs(t - k) / 0.07);
  return Math.min(a, 1);
}
function beatPunch(t) {
  for (const [a, b] of DROPS) if (t >= a && t < b) return Math.exp(-(((t - a) % 0.5) / 0.09));
  return 0;
}

// small corner labels, like the burn-in on an editor's export
function chrome(c, t) {
  const a = prog(t, 0.2, 0.6) * (1 - prog(t, 39.8, 0.3));
  if (a <= 0) return;
  let i = SCENES.findIndex((s) => t >= s.a && t < s.b); if (i < 0) i = SCENES.length - 1;
  const o = { font: 'ITight', weight: 600, size: 20, ls: 4.5, base: 'alphabetic', color: '#fff' };
  c.save(); c.globalAlpha = a * 0.8; c.globalCompositeOperation = 'difference';
  text(c, 'VIDEO EDITING  —  SHOWREEL', 56, 62, { ...o, align: 'left' });
  text(c, SCENES[i].name, W - 56, 62, { ...o, align: 'right' });
  const s = Math.floor(t), f = Math.floor((t - s) * FPS);
  text(c, `00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`, 56, H - 44, { ...o, font: 'JMono', weight: 500, ls: 2, align: 'left' });
  text(c, 'AVAILABLE ON FIVERR', W - 56, H - 44, { ...o, align: 'right' });
  c.restore();
}

function renderFrame(t) {
  const cut = cutNear(t);
  if (cut) {
    const i = SCENES.findIndex((s) => s.b === cut.t);
    renderScene(ca, i, t); renderScene(cb, i + 1, t);
    transition(cut.type, (t - (cut.t - cut.d / 2)) / cut.d, cc);
  } else {
    let i = SCENES.findIndex((s) => t >= s.a && t < s.b); if (i < 0) i = SCENES.length - 1;
    renderScene(cc, i, t);
  }
  // camera: a light push on each kick, a touch of shake on the big cuts
  const acc = accent(t), punch = beatPunch(t);
  const z = 1 + 0.01 * punch + 0.02 * acc, sh = acc * 7, fr = Math.floor(t * FPS);
  pc.save(); pc.fillStyle = '#000'; pc.fillRect(0, 0, W, H);
  pc.translate(W / 2 + (rnd(fr) - 0.5) * sh, H / 2 + (rnd(fr + 0.5) - 0.5) * sh); pc.scale(z, z); pc.translate(-W / 2, -H / 2);
  pc.drawImage(comp, 0, 0); pc.restore();
  if (acc > 0.3) chroma(octx, post, acc * 7); else octx.drawImage(post, 0, 0);
  vignette(octx, 0.38);
  grain(octx, t, 0.03);
  chrome(octx, t);
  const fade = Math.min(prog(t, 0, 0.2), 1 - prog(t, DURATION - 0.7, 0.7));
  if (fade < 1) { octx.fillStyle = `rgba(0,0,0,${1 - fade})`; octx.fillRect(0, 0, W, H); }
}

window.renderFrame = renderFrame;
window.loadPending = loadPending;
window.DURATION = DURATION;

// live preview when opened in a normal browser
if (!navigator.webdriver) {
  document.fonts.ready.then(() => {
    const start = performance.now();
    const audio = document.getElementById('music');
    if (audio) { document.body.addEventListener('click', () => { audio.currentTime = 0; audio.play(); }, { once: true }); }
    const loop = () => { const t = ((performance.now() - start) / 1000) % DURATION; renderFrame(t); loadPending(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });
}
