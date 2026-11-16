// Showreel scenes. One typeface pair, one accent colour, footage first.
// Each scene draw(c, lt) gets local time lt (can be slightly < 0 or > duration during transitions).

const P = {
  bg: '#0b0b0d', ink: '#f4f1ea', mute: 'rgba(244,241,234,.62)', faint: 'rgba(244,241,234,.14)',
  acc: '#ff5a36', green: '#1dbf73', paper: '#efece4', panel: '#141417', row: 'rgba(255,255,255,.045)',
};
const SANS = 'ITight', SERIF = 'ISerif', MONO = 'JMono';

// ---------- type helpers
function partFont(st, size) {
  return st === 'i' ? { font: SERIF, weight: 'italic 400', size: size * 1.1, ls: 0 } : { font: SANS, weight: 800, size, ls: -size * 0.03 };
}
function lineW(c, parts, size) { return parts.reduce((w, [s, st]) => w + measure(c, s, partFont(st, size)), 0); }
// One line of mixed sans / serif-italic text that slides up from behind a mask.
function line(c, parts, x, y, size, o = {}) {
  const w = lineW(c, parts, size);
  let x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  const p = o.t === undefined ? 1 : E.expo(prog(o.t, o.at || 0, o.dur || 0.7));
  if (p <= 0) return w;
  c.save();
  c.beginPath(); c.rect(x0 - 60, y - size * 1.02, w + 120, size * 1.36); c.clip();
  c.translate(0, (1 - p) * size * 1.3);
  for (const [s, st, col] of parts) {
    const f = partFont(st, size);
    text(c, s, x0, y, { ...f, align: 'left', base: 'alphabetic', color: col || o.color || P.ink, glow: o.glow, blur: o.blur });
    x0 += measure(c, s, f);
  }
  c.restore();
  return w;
}
function lab(c, s, x, y, o = {}) {
  text(c, s, x, y, { font: SANS, weight: 600, size: 22, ls: 5, align: 'left', base: 'alphabetic', color: P.mute, ...o });
}
function mono(c, s, x, y, o = {}) {
  text(c, s, x, y, { font: MONO, weight: 500, size: 22, ls: 1, align: 'left', base: 'alphabetic', color: P.mute, ...o });
}
// small "● LABEL" marker used on the feature shots
function marker(c, s, x, y, t = 9, at = 0) {
  const p = E.expo(prog(t, at, 0.5)); if (p <= 0) return;
  c.save(); c.globalAlpha *= p; c.translate((1 - p) * -30, 0);
  c.fillStyle = P.acc; c.beginPath(); c.arc(x + 7, y - 8, 7, 0, 7); c.fill();
  lab(c, s, x + 28, y, { color: P.ink, glow: 'rgba(0,0,0,.6)', blur: 12 });
  c.restore();
}

// ---------- footage helpers
function foot(c, id, ft, z = 1, dim = 0, filter = null) {
  c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
  if (filter) c.filter = filter;
  drawSlot(c, id, ft, W, H); c.restore();
  if (dim) { c.fillStyle = `rgba(8,8,10,${dim})`; c.fillRect(0, 0, W, H); }
}
function shade(c, a = 0.8, from = 0.45) {
  const g = c.createLinearGradient(0, H * from, 0, H); g.addColorStop(0, 'rgba(8,8,10,0)'); g.addColorStop(1, `rgba(8,8,10,${a})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
const softBuf = canvas(480, 270);
// Out-of-focus footage as a backdrop (blurred at low resolution, then scaled up).
function blurBg(c, id, ft, dim = 0.75) {
  const s = softBuf.getContext('2d');
  s.filter = 'blur(10px)'; s.save(); drawSlot(s, id, ft, 480, 270); s.restore(); s.filter = 'none';
  c.save(); c.imageSmoothingQuality = 'high'; c.drawImage(softBuf, -80, -45, W + 160, H + 90); c.restore();
  c.fillStyle = `rgba(8,8,10,${dim})`; c.fillRect(0, 0, W, H);
}
function topShade(c, a = 0.5) {
  const g = c.createLinearGradient(0, 0, 0, H * 0.4); g.addColorStop(0, `rgba(8,8,10,${a})`); g.addColorStop(1, 'rgba(8,8,10,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H * 0.4);
}
function check(c, x, y, r, col = P.acc) {
  c.save(); c.strokeStyle = col; c.lineWidth = r * 0.28; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - r * 0.55, y + r * 0.02); c.lineTo(x - r * 0.12, y + r * 0.42); c.lineTo(x + r * 0.6, y - r * 0.4); c.stroke(); c.restore();
}

// ============ 0-4s  cold open: eight fast cuts, then the line
function sOpen(c, lt) {
  if (lt < 2) {
    const order = ['skate', 'fps', 'dance', 'car', 'hk', 'food', 'travel', 'music'];
    const i = clamp(Math.floor(lt / 0.25), 0, 7), l = lt - i * 0.25;
    foot(c, order[i], 1 + l * 2.4, 1.14 - 0.5 * l, 0.1);
    c.fillStyle = `rgba(255,255,255,${hit(l, 0, 0.03) * 0.22})`; c.fillRect(0, 0, W, H);
    return;
  }
  const l = lt - 2;
  c.fillStyle = P.bg; c.fillRect(0, 0, W, H);
  const z = 1 + l * 0.02;
  c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
  line(c, [['Good footage deserves', 's']], W / 2, 520, 124, { align: 'center', t: l, at: 0.05 });
  line(c, [['a better edit.', 'i']], W / 2, 690, 158, { align: 'center', t: l, at: 0.4, color: P.acc });
  c.restore();
}

// ============ 4-8s  the edit: timeline, preview follows the playhead, effects switch on
function sEditor(c, lt) {
  blurBg(c, 'drone', lt + 1, 0.8);
  line(c, [['Professional ', 's'], ['video editing', 'i', P.acc]], W / 2, 168, 104, { align: 'center', t: lt, at: 0.05 });
  const pp = E.expo(prog(lt, 0.12, 0.7));
  if (pp <= 0) return;
  const px = 240, py = 236, pw = 1440, ph = 764;
  c.save(); c.globalAlpha = clamp(pp * 1.6); c.translate(0, (1 - pp) * 90);
  c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 90; c.shadowOffsetY = 30; c.fillStyle = P.panel; rr(c, px, py, pw, ph, 20); c.fill(); c.restore();
  c.strokeStyle = 'rgba(255,255,255,.09)'; c.lineWidth = 2; rr(c, px, py, pw, ph, 20); c.stroke();
  for (let i = 0; i < 3; i++) { c.fillStyle = '#3a3a41'; c.beginPath(); c.arc(px + 34 + i * 26, py + 30, 8, 0, 7); c.fill(); }
  text(c, 'client_edit_v3  —  Timeline 1', px + pw / 2, py + 37, { font: SANS, weight: 500, size: 20, base: 'alphabetic', color: P.mute });

  // timeline layout (shared by preview + timeline so the preview always matches the playhead)
  const tx = px + 28, ty = py + 520, tw = pw - 56;
  const CLIPS = ['amongus', 'skate', 'food', 'car', 'drone'].map((id, i) => ({ id, x: tx + 10 + i * 0.2 * (tw - 20), cw: 0.2 * (tw - 20) }));
  const tl = clamp((lt - 0.8) / 3.2), phX = tx + 10 + (tw - 20) * tl;
  const activeIdx = Math.min(4, Math.floor(tl * 5));
  const FX = ['Zoom punch', 'Glitch accents', 'Transitions', 'Color grade', 'Sound sync', 'Camera shake'];
  const fxOn = (i) => prog(lt, 0.9 + i * 0.18, 0.2) > 0.5;

  // preview
  const vx = px + 28, vy = py + 62, vw = 760, vh = 428;
  c.save(); rr(c, vx, vy, vw, vh, 10); c.clip();
  c.fillStyle = '#000'; c.fillRect(vx, vy, vw, vh);
  const beat = Math.exp(-((Math.max(0, lt) % 0.5) / 0.1));
  const sh = fxOn(5) ? beat * 8 : 0, fr = Math.floor(lt * 30);
  const grade = fxOn(3) ? 'saturate(1.35) contrast(1.1)' : null;
  const drawClip = (i, alpha, extraZoom) => {
    const local = 0.5 + (tl - i * 0.2) * 3.2;
    const zoom = (1 + (fxOn(0) ? 0.07 * beat : 0)) * extraZoom;
    c.save(); c.globalAlpha = alpha;
    c.translate(vx + vw / 2 + (rnd(fr) - 0.5) * sh, vy + vh / 2 + (rnd(fr + 0.3) - 0.5) * sh); c.scale(zoom, zoom); c.translate(-vw / 2, -vh / 2);
    slotRect(c, CLIPS[i].id, local, 0, 0, vw, vh, 0, grade);
    if (fxOn(1) && beat > 0.5) {
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * 0.25 * beat;
      slotRect(c, CLIPS[i].id, local, -10 * beat, 0, vw, vh, 0, 'sepia(1) hue-rotate(300deg) saturate(4)');
      slotRect(c, CLIPS[i].id, local, 10 * beat, 0, vw, vh, 0, 'sepia(1) hue-rotate(140deg) saturate(4)');
    }
    c.restore();
  };
  const TWN = 0.05, nb = Math.round(tl * 5), dist = tl - nb / 5;
  if (nb >= 1 && nb <= 4 && Math.abs(dist) < TWN) {
    const p = (dist + TWN) / (2 * TWN);
    drawClip(nb - 1, 1, 1 + 0.25 * E.in(p));
    drawClip(nb, E.inOut(p), 1.25 - 0.25 * E.out(p));
    c.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - Math.abs(p - 0.5) * 3) * 0.45})`; c.fillRect(vx, vy, vw, vh);
  } else drawClip(activeIdx, 1, 1);
  c.restore();
  const secs = tl * 30;
  mono(c, '00:' + String(Math.floor(secs)).padStart(2, '0') + ':' + String(Math.floor((secs % 1) * 30)).padStart(2, '0'), vx + 20, vy + 36, { color: P.ink, glow: 'rgba(0,0,0,.8)', blur: 8 });

  // effects panel
  lab(c, 'EFFECTS', px + 822, py + 84, { size: 18 });
  FX.forEach((s, i) => {
    const on = prog(lt, 0.9 + i * 0.18, 0.2), y = py + 104 + i * 64;
    c.fillStyle = P.row; rr(c, px + 820, y, 592, 52, 10); c.fill();
    text(c, s, px + 844, y + 35, { font: SANS, weight: 600, size: 25, align: 'left', base: 'alphabetic', color: on > 0.5 ? P.ink : P.mute });
    c.fillStyle = on > 0.5 ? P.acc : '#3a3a41'; rr(c, px + 1336, y + 13, 54, 26, 13); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(px + 1349 + E.out(on) * 28, y + 26, 9.5, 0, 7); c.fill();
  });

  // timeline
  c.fillStyle = 'rgba(255,255,255,.03)'; rr(c, tx, ty, tw, 216, 12); c.fill();
  CLIPS.forEach((k, i) => {
    const ap = E.expo(prog(lt, 0.5 + i * 0.1, 0.4)); if (ap <= 0) return;
    const act = i === activeIdx;
    c.save(); c.globalAlpha *= clamp(ap) * (act ? 1 : 0.5); c.translate(0, (1 - ap) * 30);
    slotRect(c, k.id, 0.3, k.x + 2, ty + 14, k.cw - 4, 84, 6);
    c.strokeStyle = act ? '#fff' : 'rgba(255,255,255,.25)'; c.lineWidth = act ? 3 : 2; rr(c, k.x + 2, ty + 14, k.cw - 4, 84, 6); c.stroke();
    c.restore();
  });
  // audio track: bars already played are brighter
  for (let i = 0; i < 170; i++) {
    const bx = tx + 16 + i * ((tw - 32) / 170), hh = 8 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)) * 62;
    c.fillStyle = bx < phX ? 'rgba(244,241,234,.85)' : 'rgba(244,241,234,.28)'; c.fillRect(bx, ty + 156 - hh / 2, 4, hh);
  }
  // playhead
  c.fillStyle = P.acc; c.fillRect(phX - 2, ty - 6, 4, 228);
  c.beginPath(); c.moveTo(phX - 12, ty - 18); c.lineTo(phX + 12, ty - 18); c.lineTo(phX, ty); c.fill();
  // cursor makes one cut
  if (lt > 1.5) {
    const cp = E.inOut(prog(lt, 1.6, 0.6));
    const cx = lerp(1560, tx + 10 + 0.6 * (tw - 20), cp), cy = lerp(1010, ty + 60, cp);
    const k = hit(lt, 2.2, 0.12);
    if (k > 0.02) { c.fillStyle = `rgba(255,255,255,${k})`; c.fillRect(cx - 2, ty + 8, 4, 96); }
    c.save(); c.translate(cx, cy); c.scale(0.5 * (1 - 0.12 * k), 0.5 * (1 - 0.12 * k)); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 6; c.stroke(ICON.cursor); c.fill(ICON.cursor); c.restore();
  }
  c.restore();
}

// ============ 8-14s  platforms
const PLAT = [
  { id: 'youtube', name: 'YouTube', fmt: '16:9', sub: 'Long-form videos and Shorts', slot: 'hk' },
  { id: 'tiktok', name: 'TikTok', fmt: '9:16', sub: 'Hooks, trends and fast cuts', slot: 'dance' },
  { id: 'instagram', name: 'Instagram', fmt: '9:16 · 4:5', sub: 'Reels, Stories and posts', slot: 'travel' },
  { id: 'facebook', name: 'Facebook', fmt: '16:9 · 1:1', sub: 'Ads, videos and Reels', slot: 'fashion' },
];
function phoneMock(c, slot, lt, x, y, w, h, handle, caption) {
  c.save(); c.shadowColor = 'rgba(0,0,0,.65)'; c.shadowBlur = 70; c.shadowOffsetY = 24; c.fillStyle = '#0d0d0f'; rr(c, x - 14, y - 14, w + 28, h + 28, 54); c.fill(); c.restore();
  c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 2; rr(c, x - 14, y - 14, w + 28, h + 28, 54); c.stroke();
  slotRect(c, slot, lt, x, y, w, h, 42);
  c.save(); rr(c, x, y, w, h, 42); c.clip();
  const g = c.createLinearGradient(0, y + h * 0.6, 0, y + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.7)'); c.fillStyle = g; c.fillRect(x, y, w, h);
  const ax = x + w - 54;
  c.save(); c.translate(ax - 26, y + h * 0.52 - 26); c.scale(0.52, 0.52); c.fillStyle = '#fff'; c.fill(ICON.heart); c.restore();
  for (const dy of [96, 180]) { c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(ax, y + h * 0.52 + dy, 22, 0, 7); c.fill(); }
  text(c, handle, x + 30, y + h - 96, { font: SANS, weight: 800, size: 28, align: 'left', base: 'alphabetic' });
  text(c, caption, x + 30, y + h - 58, { font: SANS, weight: 500, size: 24, align: 'left', base: 'alphabetic', color: 'rgba(255,255,255,.85)' });
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, y + h - 6, w, 6); c.fillStyle = '#fff'; c.fillRect(x, y + h - 6, w * clamp(0.2 + lt * 0.12), 6);
  c.restore();
}
function platformMock(c, p, lt) {
  if (p.id === 'youtube') {
    const x = -900, y = -310, w = 1040, h = 585;
    c.save(); c.shadowColor = 'rgba(0,0,0,.65)'; c.shadowBlur = 70; c.shadowOffsetY = 24; c.fillStyle = '#0f0f0f'; rr(c, x - 12, y - 12, w + 24, h + 150, 20); c.fill(); c.restore();
    slotRect(c, p.slot, lt + 1, x, y, w, h, 10);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, y + h - 6, w, 6); c.fillStyle = '#ff0033'; c.fillRect(x, y + h - 6, w * (0.3 + lt * 0.05), 6);
    c.fillStyle = '#3a3a41'; c.beginPath(); c.arc(x + 42, y + h + 66, 30, 0, 7); c.fill();
    text(c, 'Boss fight — no damage run', x + 92, y + h + 58, { font: SANS, weight: 800, size: 32, align: 'left', base: 'alphabetic' });
    text(c, 'Your channel', x + 92, y + h + 96, { font: SANS, weight: 500, size: 24, align: 'left', base: 'alphabetic', color: P.mute });
    c.fillStyle = P.ink; rr(c, x + w - 196, y + h + 40, 180, 54, 27); c.fill();
    text(c, 'Subscribe', x + w - 106, y + h + 76, { font: SANS, weight: 800, size: 24, base: 'alphabetic', color: '#0f0f0f' });
  } else if (p.id === 'facebook') {
    const x = -880, y = -400, w = 960;
    c.save(); c.shadowColor = 'rgba(0,0,0,.65)'; c.shadowBlur = 70; c.shadowOffsetY = 24; c.fillStyle = '#fff'; rr(c, x, y, w, 790, 22); c.fill(); c.restore();
    c.fillStyle = '#1877f2'; c.beginPath(); c.arc(x + 58, y + 58, 30, 0, 7); c.fill();
    text(c, 'Your Brand', x + 106, y + 56, { font: SANS, weight: 800, size: 30, align: 'left', base: 'alphabetic', color: '#111' });
    text(c, 'Sponsored', x + 106, y + 88, { font: SANS, weight: 500, size: 22, align: 'left', base: 'alphabetic', color: '#777' });
    text(c, 'The new collection is here.', x + 30, y + 148, { font: SANS, weight: 500, size: 27, align: 'left', base: 'alphabetic', color: '#222' });
    slotRect(c, p.slot, lt + 1, x, y + 176, w, 500, 0);
    text(c, 'yourbrand.com', x + 30, y + 742, { font: SANS, weight: 800, size: 26, align: 'left', base: 'alphabetic', color: '#111' });
    c.fillStyle = '#1877f2'; rr(c, x + w - 216, y + 700, 190, 60, 10); c.fill();
    text(c, 'Shop now', x + w - 121, y + 739, { font: SANS, weight: 800, size: 25, base: 'alphabetic' });
  } else {
    phoneMock(c, p.slot, lt + 1, -560, -440, 470, 850, p.id === 'tiktok' ? '@yourchannel' : '@yourbrand', p.id === 'tiktok' ? 'wait for the drop' : 'somewhere warm');
  }
  // label block
  const lp = E.expo(prog(lt, 0.08, 0.6));
  c.save(); c.globalAlpha *= lp; c.translate((1 - lp) * 90, 0);
  platformIcon(c, p.id, 372, -230, 132);
  text(c, p.name, 300, -40, { font: SANS, weight: 800, size: 138, ls: -4, align: 'left', base: 'alphabetic' });
  const fw = measure(c, p.fmt, { font: MONO, weight: 500, size: 28 }) + 44;
  c.strokeStyle = P.ink; c.lineWidth = 2.5; rr(c, 306, 20, fw, 58, 29); c.stroke();
  mono(c, p.fmt, 328, 59, { size: 28, color: P.ink });
  text(c, p.sub, 306, 150, { font: SANS, weight: 500, size: 38, align: 'left', base: 'alphabetic', color: P.mute });
  c.restore();
}
function sPlatforms(c, lt) {
  const stops = [1.0, 2.3, 3.55, 4.8], SP = 2600;
  const posAt = (t) => { let p = 0; for (let i = 1; i < 4; i++) p += E.inOut(prog(t, stops[i] - 0.3, 0.3)); return p; };
  const pos = posAt(lt), vel = (pos - posAt(lt - 1 / 30)) * SP;
  blurBg(c, PLAT[clamp(Math.round(pos), 0, 3)].slot, lt + 1, 0.82);
  // header: big, then tucks up to the top
  const up = E.inOut(prog(lt, 0.75, 0.45));
  c.save(); c.translate(W / 2, lerp(H / 2 - 20, 118, up)); const hs = lerp(1, 0.34, up); c.scale(hs, hs);
  line(c, [['One editor.', 's']], 0, -30, 170, { align: 'center', t: lt, at: 0 });
  line(c, [['Every platform.', 'i']], 0, 150, 184, { align: 'center', t: lt, at: 0.2, color: P.acc });
  c.restore();
  if (lt < 0.9) return;
  const zoomOut = 0, enter = E.expo(prog(lt, 0.9, 0.5));
  const draw = (cc, offset) => {
    cc.save(); cc.translate(W / 2, H / 2 + 70 + (1 - enter) * 760);
    const s = lerp(0.8, 0.18, zoomOut); cc.scale(s, s);
    const camX = lerp(pos * SP, 4000, zoomOut);
    PLAT.forEach((p, i) => { cc.save(); cc.translate(i * SP - camX + offset / s, 0); platformMock(cc, p, lt - (i ? stops[i] - 0.3 : 1.0)); cc.restore(); });
    cc.restore();
  };
  if (Math.abs(vel) > 40) { const n = 7; for (let k = 0; k < n; k++) { c.save(); c.globalAlpha = k === 0 ? 1 : 0.2; draw(c, (k / n - 0.5) * vel * 0.5); c.restore(); } } else draw(c, 0);
}

// ============ 14-22s  gaming
const GAMES = ['rpg', 'br', 'fps', 'craft'];
function sGaming(c, lt) {
  if (lt < 1.0) {
    foot(c, 'fps', 0.3 + lt * 0.6, 1.1 - 0.04 * lt, 0.55);
    line(c, [['Gaming', 's']], W / 2, 600, 340, { align: 'center', t: lt, at: 0.0, dur: 0.6 });
    line(c, [['montages, highlights & funny moments', 'i']], W / 2, 740, 64, { align: 'center', t: lt, at: 0.25, color: P.acc });
    return;
  }
  if (lt < 5.0) {
    const i = clamp(Math.floor(lt - 1.0), 0, 3), id = GAMES[i], l = lt - 1.0 - i;
    // speed ramp: fast into the beat, slow motion after it
    const ft = 0.4 + (l < 0.5 ? l * 2.6 : 1.3 + (l - 0.5) * 0.45);
    foot(c, id, ft, 1.1 - 0.05 * E.out(clamp(l * 2)) + 0.045 * hit(l, 0.5, 0.14));
    shade(c, 0.78, 0.5);
    c.fillStyle = P.acc; c.fillRect(92, 846, 14, 14);
    mono(c, 'GAMEPLAY EDIT  0' + (i + 1) + ' / 04', 122, 860, { color: P.ink });
    line(c, [[slotName(id), 's']], 88, 984, 116, { t: l, at: 0.04, dur: 0.5 });
    c.fillStyle = `rgba(255,255,255,${hit(l, 0, 0.04) * 0.35})`; c.fillRect(0, 0, W, H);
    return;
  }
  const l = lt - 5.0;
  c.fillStyle = P.bg; c.fillRect(0, 0, W, H);
  const GRID = [...GAMES, 'hk', 'amongus'], gw = 580, gh = 326, gap = 20;
  GRID.forEach((id, i) => {
    const col = i % 3, row = Math.floor(i / 3), p = E.expo(prog(l, i * 0.06, 0.6));
    if (p <= 0) return;
    const cx = W / 2 + (col - 1) * (gw + gap), cy = 478 + (row ? 1 : -1) * (gh / 2 + gap / 2);
    c.save(); c.globalAlpha = clamp(p * 1.5); c.translate(cx, cy + (1 - p) * (row ? 260 : -260));
    const s = 0.9 + 0.1 * p; c.scale(s, s);
    slotRect(c, id, l + i * 0.7, -gw / 2, -gh / 2, gw, gh, 12);
    c.save(); rr(c, -gw / 2, -gh / 2, gw, gh, 12); c.clip();
    const g = c.createLinearGradient(0, gh / 2 - 110, 0, gh / 2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.75)'); c.fillStyle = g; c.fillRect(-gw / 2, gh / 2 - 110, gw, 110);
    c.restore();
    lab(c, slotName(id), -gw / 2 + 22, gh / 2 - 22, { color: P.ink, size: 20 });
    c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 2; rr(c, -gw / 2, -gh / 2, gw, gh, 12); c.stroke();
    c.restore();
  });
  line(c, [['Any game. ', 's'], ['Any style.', 'i', P.acc]], W / 2, 968, 88, { align: 'center', t: l, at: 0.45 });
}

// ============ 22-30s  styles
const STY = [
  { id: 'vlog', a: 'Vlogs & ', b: 'travel' }, { id: 'ad', a: 'Ads & ', b: 'commercials' },
  { id: 'music', a: 'Music ', b: 'videos' }, { id: 'podcast', a: 'Podcasts & ', b: 'interviews' },
];
function styleShot(c, i, l) {
  const s = STY[i];
  foot(c, s.id, 0.5 + l * 0.9, 1.09 - 0.03 * l);
  shade(c, 0.82, 0.45);
  mono(c, '0' + (i + 1) + ' / 04', 92, 838, { color: P.ink, size: 24 });
  c.fillStyle = P.faint; c.fillRect(226, 829, 220, 3); c.fillStyle = P.ink; c.fillRect(226, 829, 220 * clamp(l / 1.8), 3);
  line(c, [[s.a, 's'], [s.b, 'i', P.acc]], 86, 984, 150, { t: l, at: 0.1, dur: 0.6 });
}
function sStyles(c, lt) {
  if (lt < 0.8) {
    c.fillStyle = P.paper; c.fillRect(0, 0, W, H);
    line(c, [['Any ', 's', '#111114'], ['style.', 'i', P.acc]], W / 2, 610, 300, { align: 'center', t: lt, at: 0, dur: 0.5 });
    lab(c, 'VLOGS  ·  ADS  ·  MUSIC VIDEOS  ·  PODCASTS', W / 2, 750, { align: 'center', color: 'rgba(17,17,20,.6)', alpha: E.expo(prog(lt, 0.25, 0.4)) });
    return;
  }
  const l = lt - 0.8, seg = 1.8, i = clamp(Math.floor(l / seg), 0, 3), local = l - i * seg;
  if (i > 0 && local < 0.3) {
    styleShot(c, i - 1, local + seg);
    const x = W * E.inOut(local / 0.3);
    c.save(); c.beginPath(); c.rect(0, 0, x, H); c.clip(); styleShot(c, i, local); c.restore();
    c.fillStyle = P.ink; c.fillRect(x - 3, 0, 6, H);
  } else styleShot(c, i, local);
}

// ============ 30-36s  finishing: captions, colour, speed ramps
const gradeBuf = canvas();
function colorWheel(c, x, y, r, label, px, py) {
  const g = c.createConicGradient(0, x, y);
  ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000'].forEach((col, i) => g.addColorStop(i / 6, col));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(32,32,36,1)'); rg.addColorStop(0.82, 'rgba(32,32,36,.62)'); rg.addColorStop(1, 'rgba(32,32,36,0)');
  c.fillStyle = rg; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke();
  c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 2.5; c.beginPath(); c.arc(x + px * r, y + py * r, 11, 0, 7); c.fill(); c.stroke();
  lab(c, label, x, y + r + 34, { align: 'center', size: 18 });
}
function sGrade(c, l) {
  const gb = gradeBuf.getContext('2d'); drawSlot(gb, 'travel', l + 1, W, H);
  const g = E.inOut(prog(l, 1.0, 0.6)); // 0 = raw, 1 = graded
  const z = 1.04 + 0.025 * l + 0.035 * hit(l, 1.6, 0.15);
  c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
  c.filter = `grayscale(${lerp(0.75, 0, g)}) contrast(${lerp(0.72, 1.14, g)}) saturate(${lerp(0.75, 1.4, g)}) brightness(${lerp(0.96, 1.03, g)})`;
  c.drawImage(gradeBuf, 0, 0); c.filter = 'none';
  c.fillStyle = `rgba(125,135,150,${0.2 * (1 - g)})`; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'soft-light'; c.globalAlpha = g * 0.75;
  const tg = c.createLinearGradient(0, 0, 0, H); tg.addColorStop(0, '#ff9a3c'); tg.addColorStop(0.55, '#ff7a6a'); tg.addColorStop(1, '#00a6a6');
  c.fillStyle = tg; c.fillRect(0, 0, W, H);
  c.restore();
  c.fillStyle = `rgba(255,255,255,${hit(l, 1.6, 0.08) * 0.4})`; c.fillRect(0, 0, W, H);
  topShade(c, 0.5);
  marker(c, 'COLOR GRADING', 90, 150, l, 0.05);
  const bOut = E.in(prog(l, 0.95, 0.25));
  if (bOut < 1) {
    c.save(); c.globalAlpha = 1 - bOut;
    line(c, [['Before', 's']], 86, 360, 180, { t: l, at: 0.05, dur: 0.5, glow: 'rgba(0,0,0,.45)', blur: 30 });
    mono(c, 'RAW FOOTAGE', 94, 420, { color: P.ink, alpha: E.expo(prog(l, 0.25, 0.4)) });
    c.restore();
  }
  if (l > 1.2 && l < 1.6) mono(c, 'GRADING  ' + String(Math.round(g * 100)).padStart(3, ' ') + '%', 94, 330, { size: 40, color: P.ink, glow: 'rgba(0,0,0,.6)', blur: 16 });
  if (l >= 1.6) {
    line(c, [['After', 'i']], 86, 360, 210, { t: l, at: 1.6, dur: 0.5, glow: 'rgba(0,0,0,.5)', blur: 34 });
    mono(c, 'COLOR GRADED', 94, 420, { color: P.ink, alpha: E.expo(prog(l, 1.8, 0.4)) });
  }
  // grading panel
  const pIn = E.expo(prog(l, 0.3, 0.5)), pOut = E.in(prog(l, 1.65, 0.35));
  const py = H - 310 + (1 - pIn) * 380 + pOut * 380;
  if (pIn > 0 && pOut < 1) {
    c.save(); c.fillStyle = 'rgba(16,16,19,.9)'; rr(c, 300, py, W - 600, 250, 18); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 2; c.stroke();
    colorWheel(c, 440, py + 106, 72, 'LIFT', lerp(0, -0.45, g), lerp(0, 0.35, g));
    colorWheel(c, 640, py + 106, 72, 'GAMMA', lerp(0, 0.15, g), lerp(0, -0.1, g));
    colorWheel(c, 840, py + 106, 72, 'GAIN', lerp(0, 0.5, g), lerp(0, -0.45, g));
    [['Exposure', 0.5, 0.58], ['Contrast', 0.35, 0.8], ['Saturation', 0.3, 0.9], ['Temperature', 0.5, 0.72]].forEach(([name, a, b], i) => {
      const y = py + 58 + i * 48, x0 = 1010, w = 560, v = lerp(a, b, g);
      text(c, name, x0, y + 7, { font: SANS, weight: 600, size: 22, align: 'left', base: 'alphabetic', color: P.mute });
      c.fillStyle = 'rgba(255,255,255,.14)'; rr(c, x0 + 170, y - 3, w - 170, 6, 3); c.fill();
      c.fillStyle = P.ink; rr(c, x0 + 170, y - 3, (w - 170) * v, 6, 3); c.fill();
      c.fillStyle = P.acc; c.beginPath(); c.arc(x0 + 170 + (w - 170) * v, y, 10, 0, 7); c.fill();
    });
    c.restore();
  }
}
const rampSpeed = (u) => 0.35 + 2.9 * Math.exp(-Math.pow((u - 0.5) / 0.13, 2));
function sRamp(c, l) {
  const D = 1.6, u = clamp(l / D);
  let ft = 0; for (let k = 0; k < 40; k++) { const uu = (k / 40) * u; ft += rampSpeed(uu) * (u * D / 40); } // integrate the speed curve
  const sp = rampSpeed(u), fast = clamp((sp - 0.8) / 2.4);
  foot(c, 'skate', 0.6 + ft, 1.05 + 0.05 * fast);
  if (fast > 0.25) { c.save(); c.globalAlpha = 0.35 * fast; foot(c, 'skate', 0.6 + ft - 0.05, 1.05 + 0.05 * fast); c.globalAlpha = 0.2 * fast; foot(c, 'skate', 0.6 + ft - 0.1, 1.05 + 0.05 * fast); c.restore(); }
  shade(c, 0.8, 0.45); topShade(c, 0.55);
  marker(c, 'SPEED RAMPS', 90, 150, l, 0.05);
  line(c, [['Speed ramps & ', 's'], ['sound design', 'i', P.acc]], 86, 984, 104, { t: l, at: 0.1, dur: 0.55 });
  // speed curve
  const gx = 1270, gy = 640, gw = 560, gh = 250, gp = E.expo(prog(l, 0.1, 0.5));
  c.save(); c.globalAlpha = gp; c.translate(0, (1 - gp) * 40);
  c.fillStyle = 'rgba(16,16,19,.82)'; rr(c, gx, gy, gw, gh, 16); c.fill(); c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 2; c.stroke();
  lab(c, 'SPEED', gx + 26, gy + 44, { size: 18 });
  mono(c, sp.toFixed(2) + 'x', gx + gw - 26, gy + 46, { align: 'right', size: 30, color: P.ink });
  const X = (v) => gx + 30 + v * (gw - 60), Y = (v) => gy + gh - 34 - ((rampSpeed(v) - 0.35) / 2.9) * (gh - 110);
  c.strokeStyle = P.faint; c.lineWidth = 2; c.beginPath(); c.moveTo(X(0), gy + gh - 34); c.lineTo(X(1), gy + gh - 34); c.stroke();
  c.strokeStyle = 'rgba(244,241,234,.35)'; c.lineWidth = 3; c.beginPath(); for (let k = 0; k <= 60; k++) c[k ? 'lineTo' : 'moveTo'](X(k / 60), Y(k / 60)); c.stroke();
  c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); for (let k = 0; k <= 60; k++) { const v = (k / 60) * u; c[k ? 'lineTo' : 'moveTo'](X(v), Y(v)); } c.stroke();
  c.fillStyle = P.acc; c.beginPath(); c.arc(X(u), Y(u), 10, 0, 7); c.fill();
  c.restore();
}
function sCaptions(c, lt) {
  foot(c, 'city', lt, 1.05 + lt * 0.02, 0.38);
  marker(c, 'CAPTIONS & SUBTITLES', 90, 150, lt, 0.05);
  const words = ['This', 'is', 'how', 'your', 'video', 'should', 'look.'], size = 132;
  [[0, 1, 2, 3], [4, 5, 6]].forEach((ln, row) => {
    const f = { font: SANS, weight: 800, size, ls: -3 };
    const ws = ln.map((k) => measure(c, words[k], f) + 44);
    let x = W / 2 - ws.reduce((a, b) => a + b, 0) / 2;
    ln.forEach((k, j) => {
      const a = 0.1 + k * 0.17, p = prog(lt, a, 0.16);
      if (p > 0) {
        const s = 0.82 + 0.18 * E.expo(p), active = (lt >= a && lt < a + 0.17) || (k === 6 && lt > a);
        c.save(); c.globalAlpha *= clamp(p * 2); c.translate(x + ws[j] / 2, 540 + row * 170); c.scale(s, s);
        if (active) { c.fillStyle = P.acc; rr(c, -ws[j] / 2 + 8, -size * 0.56, ws[j] - 16, size * 1.08, 18); c.fill(); }
        text(c, words[k], 0, size * 0.34, { ...f, base: 'alphabetic', color: '#fff', glow: active ? null : 'rgba(0,0,0,.7)', blur: 26 });
        c.restore();
      }
      x += ws[j];
    });
  });
}
function sFx(c, lt) {
  if (lt < 1.7) return sCaptions(c, lt);
  if (lt < 4.4) {
    const l = lt - 1.7;
    if (l < 0.25) {
      sCaptions(c, 1.69);
      const x = W * E.inOut(l / 0.25);
      c.save(); c.beginPath(); c.rect(0, 0, x, H); c.clip(); sGrade(c, l); c.restore();
      c.fillStyle = P.ink; c.fillRect(x - 3, 0, 6, H);
    } else sGrade(c, l);
    return;
  }
  sRamp(c, lt - 4.4);
}

// ============ 36-40s  how it works: a short chat
function bubble(c, s, x, y, me, p) {
  if (p <= 0) return;
  const size = 36, w = measure(c, s, { font: SANS, weight: 600, size }) + 60, h = 88, bx = me ? x - w : x, k = E.expo(p);
  c.save(); c.globalAlpha *= clamp(p * 2); c.translate(0, (1 - k) * 26);
  c.fillStyle = me ? P.green : '#26262b'; rr(c, bx, y - h / 2, w, h, 30); c.fill();
  text(c, s, bx + 30, y + 13, { font: SANS, weight: 600, size, align: 'left', base: 'alphabetic', color: '#fff' });
  c.restore();
}
function typing(c, x, y, t) {
  c.fillStyle = P.green; rr(c, x - 124, y - 34, 124, 68, 30); c.fill();
  for (let i = 0; i < 3; i++) { c.fillStyle = `rgba(255,255,255,${0.55 + 0.45 * Math.sin(t * 12 - i)})`; c.beginPath(); c.arc(x - 90 + i * 28, y, 8, 0, 7); c.fill(); }
}
function sChat(c, lt) {
  const t = lt * 1.2; // same beats as before, a little quicker
  blurBg(c, 'br', lt + 0.5, 0.88);
  line(c, [['You ask.', 's']], 110, 440, 190, { t: lt, at: 0.05 });
  line(c, [['I edit.', 'i']], 110, 650, 216, { t: lt, at: 0.3, color: P.acc });
  ['Any idea you have', 'Any platform', 'Pro quality, fast delivery'].forEach((s, i) => {
    const p = E.expo(prog(lt, 0.7 + i * 0.15, 0.5));
    c.save(); c.globalAlpha = p; c.translate((1 - p) * -40, 0);
    check(c, 134, 770 + i * 72, 24);
    text(c, s, 180, 783 + i * 72, { font: SANS, weight: 600, size: 40, align: 'left', base: 'alphabetic' });
    c.restore();
  });
  const wp = E.expo(prog(lt, 0.15, 0.6)), x = 960, y = 130, w = 850, h = 830;
  c.save(); c.globalAlpha = clamp(wp * 1.5); c.translate(0, (1 - wp) * 90);
  c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 80; c.shadowOffsetY = 26; c.fillStyle = '#151518'; rr(c, x, y, w, h, 28); c.fill(); c.restore();
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 2; rr(c, x, y, w, h, 28); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(x, y + 108, w, 2);
  c.fillStyle = '#3a3a41'; c.beginPath(); c.arc(x + 68, y + 56, 32, 0, 7); c.fill();
  text(c, 'C', x + 68, y + 68, { font: SANS, weight: 800, size: 30, base: 'alphabetic' });
  c.fillStyle = P.green; c.beginPath(); c.arc(x + 92, y + 80, 10, 0, 7); c.fill();
  text(c, 'New client', x + 120, y + 52, { font: SANS, weight: 800, size: 32, align: 'left', base: 'alphabetic' });
  text(c, 'online', x + 120, y + 84, { font: SANS, weight: 500, size: 22, align: 'left', base: 'alphabetic', color: P.green });
  const L = x + 36, R = x + w - 36;
  bubble(c, 'Can you edit my Fortnite montage?', L, y + 196, false, prog(t, 0.7, 0.3));
  if (t > 1.2 && t < 1.8) typing(c, R, y + 306, t);
  bubble(c, 'Of course. Effects, music, all of it.', R, y + 306, true, prog(t, 1.8, 0.3));
  bubble(c, 'And a TikTok version too?', L, y + 416, false, prog(t, 2.4, 0.3));
  if (t > 2.8 && t < 3.3) typing(c, R, y + 526, t);
  bubble(c, 'Done. Both versions are ready.', R, y + 526, true, prog(t, 3.3, 0.3));
  const dp = E.expo(prog(t, 3.8, 0.4));
  if (dp > 0) {
    c.save(); c.globalAlpha *= clamp(dp * 2); c.translate(R, y + 694 + (1 - dp) * 26);
    c.fillStyle = '#1e1e22'; rr(c, -560, -92, 560, 184, 22); c.fill();
    slotRect(c, 'br', lt, -542, -74, 264, 148, 12);
    text(c, 'final_edit_v3.mp4', -254, -16, { font: SANS, weight: 800, size: 30, align: 'left', base: 'alphabetic' });
    check(c, -238, 30, 20, P.green);
    text(c, 'Delivered', -208, 40, { font: SANS, weight: 600, size: 28, align: 'left', base: 'alphabetic', color: P.green });
    c.restore();
  }
  c.restore();
}

// ============ 40-48s  call to action
function sCta(c, lt) {
  c.fillStyle = P.bg; c.fillRect(0, 0, W, H);
  const tiles = ['fps', 'dance', 'br', 'skate', 'rpg', 'fashion', 'craft', 'food', 'hk'];
  c.save(); c.globalAlpha = 0.2;
  tiles.forEach((id, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = col * 700 - 150 + ((lt * (row % 2 ? 30 : -30)) % 700), y = row * 400 - 60;
    slotRect(c, id, lt + i, x, y, 640, 360, 14);
  });
  c.restore();
  const g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100); g.addColorStop(0, 'rgba(11,11,13,.78)'); g.addColorStop(1, 'rgba(11,11,13,.96)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  lab(c, 'READY WHEN YOU ARE', W / 2, 176, { align: 'center', alpha: E.expo(prog(lt, 0.15, 0.5)) });
  line(c, [["Let's make your ", 's'], ['next video.', 'i', P.acc]], W / 2, 330, 124, { align: 'center', t: lt, at: 0.25 });
  // wordmark
  const fp = E.expo(prog(lt, 0.9, 0.7));
  if (fp > 0) {
    c.save(); c.globalAlpha = clamp(fp * 1.5); c.translate(W / 2, 545); const s = 0.92 + 0.08 * fp; c.scale(s, s);
    c.font = '800 250px Mont'; c.letterSpacing = '-9px';
    const fw = c.measureText('fiverr').width;
    text(c, 'fiverr', -30, 0, { font: 'Mont', weight: 800, size: 250, ls: -9, color: P.ink });
    c.fillStyle = P.green; c.beginPath(); c.arc(-30 + fw / 2 + 26, 70, 29, 0, 7); c.fill();
    c.restore();
  }
  const mp = E.expo(prog(lt, 1.5, 0.6));
  text(c, "Tell me what you need. I'll take it from there.", W / 2, 728 + (1 - mp) * 24, { font: SANS, weight: 500, size: 44, base: 'alphabetic', color: P.mute, alpha: mp });
  // button + click
  const bp = E.expo(prog(lt, 2.0, 0.6)), click = hit(lt, 3.5, 0.14);
  if (bp > 0) {
    c.save(); c.globalAlpha = clamp(bp * 1.5); c.translate(W / 2, 862 + (1 - bp) * 40); const s = 1 - 0.06 * click; c.scale(s, s);
    c.fillStyle = P.green; rr(c, -400, -66, 800, 132, 66); c.fill();
    text(c, 'Message me on Fiverr', -34, 18, { font: SANS, weight: 800, size: 52, ls: -1, base: 'alphabetic', color: '#fff' });
    c.strokeStyle = '#fff'; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(262, 0); c.lineTo(318, 0); c.moveTo(296, -22); c.lineTo(318, 0); c.lineTo(296, 22); c.stroke();
    c.restore();
    for (let r = 0; r < 2; r++) {
      const rp = prog(lt, 3.5 + r * 0.18, 0.9);
      if (rp > 0 && rp < 1) { c.save(); c.strokeStyle = P.green; c.globalAlpha = (1 - rp) * 0.8; c.lineWidth = 4; rr(c, W / 2 - 400 - rp * 70, 862 - 66 - rp * 70, 800 + rp * 140, 132 + rp * 140, 66 + rp * 70); c.stroke(); c.restore(); }
    }
  }
  if (lt > 2.7) {
    const cp = E.inOut(prog(lt, 2.7, 0.7)), cx = lerp(1700, W / 2 + 340, cp), cy = lerp(1140, 896, cp), s = 0.62 * (1 - 0.14 * click);
    c.save(); c.translate(cx, cy); c.scale(s, s); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 6; c.stroke(ICON.cursor); c.fill(ICON.cursor); c.restore();
  }
  lab(c, 'YOUTUBE   ·   TIKTOK   ·   INSTAGRAM   ·   FACEBOOK', W / 2, 1010, { align: 'center', alpha: E.expo(prog(lt, 4.0, 0.6)) });
}
