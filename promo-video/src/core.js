// Core helpers: math, easing, text, shapes, media frames and full-frame effects.
const W = 1920, H = 1080, FPS = 30;
const C = {
  bg: '#07070d', pink: '#ff2e63', cyan: '#08d9d6', yellow: '#ffd23f',
  purple: '#7b2bff', green: '#1dbf73', white: '#f5f5fa', muted: '#a9a9c2',
};

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, d) => clamp((t - a) / d);
const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const E = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoIn: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  back: (t) => { const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  elastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
};
// Decaying pulse that starts at time a
const hit = (t, a, d = 0.15) => (t < a ? 0 : Math.exp(-(t - a) / d));

function canvas(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function rr(c, x, y, w, h, r) {
  if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; }
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function text(c, s, x, y, o = {}) {
  c.save();
  c.font = `${o.weight || ''} ${o.size || 100}px ${o.font || 'Anton'}`;
  c.textAlign = o.align || 'center';
  c.textBaseline = o.base || 'middle';
  c.letterSpacing = (o.ls || 0) + 'px';
  if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur || 40; }
  if (o.stroke) { c.lineWidth = o.stroke; c.strokeStyle = o.color || '#fff'; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  else { c.fillStyle = o.color || '#fff'; c.fillText(s, x, y); }
  c.restore();
}
function measure(c, s, o = {}) {
  c.save(); c.font = `${o.weight || ''} ${o.size || 100}px ${o.font || 'Anton'}`; c.letterSpacing = (o.ls || 0) + 'px';
  const w = c.measureText(s).width; c.restore(); return w;
}

// Per-letter animated text. style: 'drop' | 'pop' | 'slide' | 'flip'
function kinetic(c, s, x, y, o, t, start, stagger = 0.04, style = 'pop', dur = 0.4) {
  const ws = [...s].map((ch) => measure(c, ch, o));
  const total = ws.reduce((a, b) => a + b, 0);
  let cx = x - (o.align === 'left' ? 0 : total / 2);
  [...s].forEach((ch, i) => {
    const p = prog(t, start + i * stagger, dur);
    if (p > 0) {
      c.save();
      c.translate(cx + ws[i] / 2, y);
      if (style === 'drop') { c.translate(0, (1 - E.back(p)) * -160); c.globalAlpha *= clamp(p * 3); }
      if (style === 'pop') { const k = E.back(p); c.scale(k, k); c.globalAlpha *= clamp(p * 3); }
      if (style === 'slide') { c.translate((1 - E.expo(p)) * 300, 0); c.globalAlpha *= clamp(p * 2); }
      if (style === 'flip') { c.scale(1, Math.max(0.01, E.back(p))); c.globalAlpha *= clamp(p * 3); }
      text(c, ch, 0, 0, { ...o, align: 'center' });
      c.restore();
    }
    cx += ws[i];
  });
  return total;
}

// ---------- icons (SVG paths on a 100x100 box) ----------
const ICON = {
  play: new Path2D('M40 32v36l30-18z'),
  ttNote: new Path2D('M55 12v50a14 14 0 1 1-14-14 M55 12c2 12 10 20 22 21'),
  fbF: new Path2D('M55 90V58h11l2-13H55v-8c0-4 1-7 7-7h7V19c-2 0-6-1-11-1-10 0-17 6-17 17v10H30v13h11v32z'),
  heart: new Path2D('M50 85 C20 62 8 48 8 32 C8 18 19 9 31 9 C40 9 46 14 50 21 C54 14 60 9 69 9 C81 9 92 18 92 32 C92 48 80 62 50 85z'),
  check: new Path2D('M22 52 L42 72 L80 30'),
  cursor: new Path2D('M10 5 L10 80 L30 62 L44 94 L58 88 L44 57 L70 57 Z'),
};
function platformIcon(c, name, x, y, size) {
  c.save(); c.translate(x - size / 2, y - size / 2); c.scale(size / 100, size / 100);
  if (name === 'youtube') {
    c.fillStyle = '#ff0033'; rr(c, 4, 18, 92, 64, 18); c.fill();
    c.fillStyle = '#fff'; c.fill(ICON.play);
  } else if (name === 'tiktok') {
    c.lineWidth = 10; c.lineCap = 'round'; c.fillStyle = 'none';
    c.save(); c.translate(3, 3); c.strokeStyle = '#25f4ee'; c.stroke(ICON.ttNote); c.restore();
    c.save(); c.translate(-3, -3); c.strokeStyle = '#fe2c55'; c.stroke(ICON.ttNote); c.restore();
    c.strokeStyle = '#fff'; c.stroke(ICON.ttNote);
  } else if (name === 'instagram') {
    const g = c.createLinearGradient(0, 100, 100, 0);
    g.addColorStop(0, '#feda75'); g.addColorStop(0.3, '#fa7e1e'); g.addColorStop(0.55, '#d62976'); g.addColorStop(0.8, '#962fbf'); g.addColorStop(1, '#4f5bd5');
    c.fillStyle = g; rr(c, 4, 4, 92, 92, 26); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 8; rr(c, 22, 22, 56, 56, 18); c.stroke();
    c.beginPath(); c.arc(50, 50, 13, 0, 7); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(66, 34, 4.5, 0, 7); c.fill();
  } else if (name === 'facebook') {
    c.fillStyle = '#1877f2'; c.beginPath(); c.arc(50, 50, 46, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.fill(ICON.fbF);
  }
  c.restore();
}

// ---------- media: real clips (frame sequences) with procedural fallback ----------
window.MEDIA = window.MEDIA || {};
const frameCache = new Map();
const pending = new Set();
function mediaFrame(id, lt) {
  const m = MEDIA[id];
  if (!m || !m.frames) return null;
  const n = m.frames;
  const idx = (((Math.floor((lt + (m.offset || 0)) * FPS)) % n) + n) % n;
  const key = `${id}/${idx}`;
  const img = frameCache.get(key);
  if (img && img.complete && img.naturalWidth) return img;
  if (!img) pending.add(key);
  return 'loading';
}
async function loadPending() {
  const keys = [...pending]; pending.clear();
  await Promise.all(keys.map((key) => new Promise((res) => {
    const [id, idx] = key.split('/');
    const img = new Image();
    img.onload = img.onerror = () => res();
    img.src = `media/frames/${id}/${String(Number(idx) + 1).padStart(5, '0')}.jpg`;
    frameCache.set(key, img);
  })));
  if (frameCache.size > 600) { // simple eviction
    const it = frameCache.keys(); for (let i = 0; i < 200; i++) frameCache.delete(it.next().value);
  }
}
function slotName(id) { return MEDIA[id] && MEDIA[id].frames ? SLOTS[id].name : SLOTS[id].generic; }

// Draws footage `id` covering the box (0,0,w,h) in the current transform.
function drawSlot(c, id, lt, w, h) {
  const img = mediaFrame(id, lt);
  if (img && img !== 'loading') {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    c.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  } else if (img === 'loading') {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
  } else {
    // procedural scenes are authored at 1920x1080 and scaled to cover the box
    const s = Math.max(w / W, h / H);
    c.save(); c.translate((w - W * s) / 2, (h - H * s) / 2); c.scale(s, s);
    SLOTS[id].draw(c, lt); c.restore();
  }
}
function slotRect(c, id, lt, x, y, w, h, r = 0, filter = null) {
  c.save();
  rr(c, x, y, w, h, r); c.clip();
  c.translate(x, y);
  if (filter) c.filter = filter;
  drawSlot(c, id, lt, w, h);
  c.restore();
}

// ---------- full-frame effects ----------
const fxR = canvas(), fxG = canvas();
function chroma(dst, src, amt) {
  const r = fxR.getContext('2d'), g = fxG.getContext('2d');
  for (const [cx, col] of [[r, '#f00'], [g, '#0ff']]) {
    cx.globalCompositeOperation = 'source-over'; cx.drawImage(src, 0, 0);
    cx.globalCompositeOperation = 'multiply'; cx.fillStyle = col; cx.fillRect(0, 0, W, H);
  }
  dst.save();
  dst.fillStyle = '#000'; dst.fillRect(0, 0, W, H);
  dst.globalCompositeOperation = 'lighter';
  dst.drawImage(fxR, -amt, 0); dst.drawImage(fxG, amt, 0);
  dst.restore();
}
function glitchSlices(dst, src, amt, seed) {
  dst.drawImage(src, 0, 0);
  const n = 10;
  for (let i = 0; i < n; i++) {
    if (rnd(seed * 3 + i) > 0.55) continue;
    const y = Math.floor(rnd(seed + i * 7.3) * H), h = 10 + rnd(seed + i) * 90;
    const dx = (rnd(seed * 1.7 + i) - 0.5) * amt * 2;
    dst.drawImage(src, 0, y, W, h, dx, y, W, h);
  }
}
const grainTiles = [];
function grain(c, t, alpha = 0.07) {
  if (!grainTiles.length) {
    for (let k = 0; k < 4; k++) {
      const g = canvas(256, 256), gc = g.getContext('2d'), d = gc.createImageData(256, 256);
      for (let i = 0; i < d.data.length; i += 4) { const v = rnd(i * 0.37 + k * 999) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      gc.putImageData(d, 0, 0); grainTiles.push(c.createPattern(g, 'repeat'));
    }
  }
  c.save(); c.globalAlpha = alpha; c.globalCompositeOperation = 'overlay';
  c.fillStyle = grainTiles[Math.floor(t * FPS) % 4]; c.fillRect(0, 0, W, H); c.restore();
}
function vignette(c, a = 0.55) {
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function lightLeak(c, t, a = 0.35) {
  c.save(); c.globalCompositeOperation = 'screen';
  const x = W * (0.5 + 0.5 * Math.sin(t * 0.7)), y = H * (0.2 + 0.2 * Math.cos(t * 0.5));
  const g = c.createRadialGradient(x, y, 0, x, y, 900);
  g.addColorStop(0, `rgba(255,120,60,${a})`); g.addColorStop(0.5, `rgba(255,46,99,${a * 0.4})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
}
// Background: dark gradient, drifting color blobs and a subtle grid.
function darkBg(c, t, hueA = C.pink, hueB = C.cyan) {
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'screen';
  for (const [col, px, py, r, sp] of [[hueA, 0.15, 0.2, 800, 0.3], [hueB, 0.85, 0.8, 800, 0.25], [C.purple, 0.5, 0.5, 600, 0.4]]) {
    const x = W * (px + 0.12 * Math.sin(t * sp * 2)), y = H * (py + 0.12 * Math.cos(t * sp * 2));
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col + '66'); g.addColorStop(1, col + '00');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  c.restore();
  c.save(); c.strokeStyle = 'rgba(255,255,255,0.045)'; c.lineWidth = 1;
  const off = (t * 20) % 80;
  for (let x = -off; x < W; x += 80) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = -off; y < H; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.restore();
}
// A rounded "tag" pill with text
function tag(c, s, x, y, o = {}) {
  const size = o.size || 34, pad = size * 0.7;
  const w = measure(c, s, { font: 'Mont', weight: 800, size, ls: o.ls ?? 4 }) + pad * 2, h = size * 1.9;
  const ax = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
  c.save();
  c.fillStyle = o.bg || C.pink; rr(c, ax, y - h / 2, w, h, o.r ?? h / 2); c.fill();
  text(c, s, ax + w / 2, y + 2, { font: 'Mont', weight: 800, size, ls: o.ls ?? 4, color: o.color || '#fff' });
  c.restore();
  return w;
}
// Particles burst (deterministic)
function burst(c, t, x, y, n, seed, o = {}) {
  if (t < 0) return;
  const cols = o.colors || [C.pink, C.cyan, C.yellow, C.green, '#fff'];
  for (let i = 0; i < n; i++) {
    const a = rnd(seed + i) * Math.PI * 2, sp = (o.speed || 900) * (0.3 + rnd(seed + i * 3.1));
    const life = (o.life || 1.4) * (0.6 + 0.4 * rnd(i + seed * 2));
    if (t > life) continue;
    const px = x + Math.cos(a) * sp * t, py = y + Math.sin(a) * sp * t + (o.gravity ?? 900) * t * t * 0.5;
    c.save(); c.globalAlpha = 1 - t / life; c.translate(px, py); c.rotate(t * 8 + i);
    c.fillStyle = cols[i % cols.length];
    const s = (o.size || 16) * (0.5 + rnd(i * 5.7 + seed));
    if (i % 3 === 0) { c.beginPath(); c.arc(0, 0, s / 2, 0, 7); c.fill(); } else c.fillRect(-s / 2, -s / 4, s, s / 2);
    c.restore();
  }
}
