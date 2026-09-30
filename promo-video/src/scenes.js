// Scenes. Each draw(c, lt) gets local time lt (can be slightly < 0 or > duration during transitions).

// ============ 0-4s  cold open: rapid montage + "YOUR VIDEOS / NEXT LEVEL"
function sOpen(c, lt) {
  if (lt < 2) {
    const order = ['fps', 'br', 'music', 'rpg', 'vlog', 'craft', 'ad', 'podcast'];
    const words = ['CUT', 'ZOOM', 'SYNC', 'GLITCH', 'COLOR', 'FX', 'SOUND', 'BOOM'];
    const i = clamp(Math.floor(lt / 0.25), 0, 7), local = lt - i * 0.25;
    const z = 1.15 - local * 0.4;
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.rotate((i % 2 ? 1 : -1) * 0.02); c.translate(-W / 2, -H / 2);
    drawSlot(c, order[i], lt + 3, W, H); c.restore();
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, W, H);
    const k = 1 + 0.5 * hit(local, 0, 0.06);
    c.save(); c.translate(W / 2, H / 2); c.scale(k, k);
    text(c, words[i], 0, 0, { size: 300, stroke: 6, color: '#fff' });
    text(c, words[i], 0, 0, { size: 300, color: [C.pink, C.cyan, C.yellow][i % 3], alpha: 0.9 });
    c.restore();
  } else {
    const l = lt - 2;
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    // light streaks accelerating toward camera
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) {
      const a = rnd(i) * Math.PI * 2, sp = 0.4 + rnd(i + 5), d = ((l * sp * (1 + l)) + rnd(i + 9)) % 1;
      const r1 = 80 + d * 1300, r2 = r1 + 60 + d * 300;
      c.strokeStyle = [C.pink, C.cyan, C.purple][i % 3]; c.globalAlpha = d; c.lineWidth = 2 + d * 5;
      c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); c.lineTo(W / 2 + Math.cos(a) * r2, H / 2 + Math.sin(a) * r2); c.stroke();
    }
    c.restore();
    const z = 1 + l * 0.06, shake = l > 1.5 ? (l - 1.5) * 14 : 0;
    c.save(); c.translate(W / 2 + (rnd(Math.floor(lt * 30)) - 0.5) * shake, H / 2 + (rnd(Math.floor(lt * 30) + 1) - 0.5) * shake); c.scale(z, z);
    kinetic(c, 'YOUR VIDEOS', 0, -120, { size: 230, color: '#fff' }, l, 0.05, 0.04, 'drop');
    kinetic(c, 'NEXT LEVEL', 0, 130, { size: 260, color: C.pink, glow: C.pink, blur: 50 }, l, 0.75, 0.05, 'pop');
    c.restore();
  }
}

// ============ 4-8s  intro: editor UI
function sIntro(c, lt) {
  darkBg(c, lt + 4);
  // synthwave floor
  c.save(); c.strokeStyle = 'rgba(8,217,214,.35)'; c.lineWidth = 2;
  for (let i = -20; i <= 20; i++) { c.beginPath(); c.moveTo(W / 2 + i * 40, 700); c.lineTo(W / 2 + i * 300, H); c.stroke(); }
  for (let j = 0; j < 10; j++) { const y = 700 + Math.pow(((j + (lt * 2) % 1) / 10), 2) * 380; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.restore();
  kinetic(c, 'PROFESSIONAL', W / 2, 62, { font: 'Mont', weight: 800, size: 40, ls: 18, color: C.cyan }, lt, 0.1, 0.025, 'flip');
  // title with light sweep (gradient fill moving across the letters)
  const tp = E.expo(prog(lt, 0.05, 0.6));
  c.save(); c.globalAlpha = tp; c.translate(W / 2, 195); c.scale(0.8 + 0.2 * tp, 0.8 + 0.2 * tp);
  const sx = -900 + ((lt * 900) % 1800);
  const g = c.createLinearGradient(sx - 220, 0, sx + 220, 0);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, C.yellow); g.addColorStop(1, '#ffffff');
  text(c, 'VIDEO EDITING', 0, 0, { size: 150, color: g });
  c.restore();
  // editor panel (tilts in)
  const pp = E.back(prog(lt, 0.15, 0.7));
  if (pp <= 0) return;
  const px = 240, py = 290, pw = 1440, ph = 740;
  c.save(); c.globalAlpha = clamp(pp * 2);
  c.translate(W / 2, py + ph / 2); c.scale(0.7 + 0.3 * pp, 0.7 + 0.3 * pp); c.transform(1, 0, (1 - pp) * -0.3, 1, 0, 0); c.translate(-W / 2, -(py + ph / 2));
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 80; c.fillStyle = 'rgba(16,16,30,.95)'; rr(c, px, py, pw, ph, 30); c.fill(); c.shadowBlur = 0;
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 3; c.stroke();
  // window dots
  ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(px + 36 + i * 30, py + 30, 9, 0, 7); c.fill(); });
  // preview (cuts on beat)
  const prev = ['br', 'vlog', 'fps', 'music', 'craft', 'ad', 'rpg', 'podcast'];
  const pi = Math.floor(Math.max(0, lt) / 0.5) % prev.length;
  slotRect(c, prev[pi], lt, px + 30, py + 60, 760, 428, 14);
  text(c, '● 00:0' + Math.floor(lt + 4) + ':' + String(Math.floor((lt * 30) % 30)).padStart(2, '0'), px + 60, py + 90, { font: 'Mont', weight: 800, size: 22, align: 'left' });
  // effects panel
  const fx = ['Zoom punch', 'RGB glitch', 'Speed ramp', 'Color grade', 'Captions', 'Shake'];
  fx.forEach((s, i) => {
    const on = prog(lt, 0.9 + i * 0.18, 0.2);
    c.save(); c.globalAlpha *= 0.4 + 0.6 * on;
    c.fillStyle = on > 0.5 ? 'rgba(8,217,214,.14)' : 'rgba(255,255,255,.05)'; rr(c, px + 820, py + 60 + i * 72, 590, 58, 12); c.fill();
    text(c, s, px + 850, py + 90 + i * 72, { font: 'Mont', weight: 600, size: 28, align: 'left' });
    c.fillStyle = on > 0.5 ? C.cyan : '#444'; rr(c, px + 1330, py + 76 + i * 72, 60, 26, 13); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(px + 1330 + (on > 0.5 ? 47 : 13), py + 89 + i * 72, 10, 0, 7); c.fill();
    c.restore();
  });
  // timeline
  const tx = px + 30, ty = py + 510, tw = pw - 60;
  c.fillStyle = 'rgba(255,255,255,.04)'; rr(c, tx, ty, tw, 210, 12); c.fill();
  const cut = prog(lt, 2.2, 0.3);
  const clips = [['fps', 0, 0.22], ['br', 0.23, 0.2], ['music', 0.44, 0.18], ['vlog', 0.63, 0.17], ['ad', 0.81, 0.19]];
  clips.forEach(([id, a, w], i) => {
    const ap = E.back(prog(lt, 0.6 + i * 0.12, 0.35)); if (ap <= 0) return;
    let x = tx + 10 + a * (tw - 20), cw = w * (tw - 20) - 6;
    if (i >= 2) x += E.out(cut) * 14;
    c.save(); c.globalAlpha *= clamp(ap); c.translate(0, (1 - ap) * 40);
    slotRect(c, id, lt, x, ty + 14, cw, 80, 8);
    c.strokeStyle = [C.pink, C.cyan, C.yellow, C.purple, C.green][i]; c.lineWidth = 4; rr(c, x, ty + 14, cw, 80, 8); c.stroke();
    c.restore();
  });
  // audio waveform track
  c.fillStyle = 'rgba(8,217,214,.12)'; rr(c, tx + 10, ty + 110, tw - 20, 80, 8); c.fill();
  for (let i = 0; i < 150; i++) { const hh = 8 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)) * 60; c.fillStyle = C.cyan; c.fillRect(tx + 20 + i * 8.9, ty + 150 - hh / 2, 5, hh); }
  // playhead
  const ph2 = tx + 10 + (tw - 20) * clamp((lt - 0.8) / 3.2);
  c.fillStyle = C.yellow; c.shadowColor = C.yellow; c.shadowBlur = 20; c.fillRect(ph2 - 3, ty - 6, 6, 222);
  c.beginPath(); c.moveTo(ph2 - 14, ty - 20); c.lineTo(ph2 + 14, ty - 20); c.lineTo(ph2, ty - 2); c.fill(); c.shadowBlur = 0;
  // razor cursor
  const cx = lerp(1500, tx + 10 + 0.435 * (tw - 20) + 6, E.inOut(prog(lt, 1.6, 0.6))), cy = lerp(1000, ty + 50, E.inOut(prog(lt, 1.6, 0.6)));
  if (lt > 1.5) {
    c.save(); c.translate(cx, cy); c.scale(0.55, 0.55); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 6; c.stroke(ICON.cursor); c.fill(ICON.cursor); c.restore();
    if (lt > 2.2) burst(c, lt - 2.2, cx, cy, 24, 7, { speed: 500, life: 0.6, size: 12, gravity: 600 });
  }
  c.restore();
}

// ============ 8-14s  platforms carousel
const PLAT = [
  { id: 'youtube', name: 'YouTube', col: '#ff0033', fmt: '16:9', sub: 'Long videos · Shorts · Thumbnails-ready', slot: 'fps' },
  { id: 'tiktok', name: 'TikTok', col: '#25f4ee', fmt: '9:16', sub: 'Viral edits · Trends · Hooks', slot: 'music' },
  { id: 'instagram', name: 'Instagram', col: '#e1306c', fmt: '9:16 · 4:5', sub: 'Reels · Stories · Posts', slot: 'vlog' },
  { id: 'facebook', name: 'Facebook', col: '#1877f2', fmt: '16:9 · 1:1', sub: 'Ads · Videos · Reels', slot: 'ad' },
];
function phone(c, slot, lt, x, y, w, h, ui) {
  c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 60; c.fillStyle = '#0d0d0d'; rr(c, x - 16, y - 16, w + 32, h + 32, 56); c.fill(); c.restore();
  slotRect(c, slot, lt, x, y, w, h, 44);
  c.save(); rr(c, x, y, w, h, 44); c.clip();
  const g = c.createLinearGradient(0, y + h * 0.55, 0, y + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.7)'); c.fillStyle = g; c.fillRect(x, y, w, h);
  // side actions
  const ax = x + w - 60;
  [['heart', '248K'], ['c', '3.1K'], ['s', '12K']].forEach(([k, n], i) => {
    const yy = y + h * 0.5 + i * 110;
    if (k === 'heart') { c.save(); c.translate(ax - 32, yy - 32); c.scale(0.64, 0.64); c.fillStyle = ui === 'tiktok' ? '#fe2c55' : '#fff'; c.fill(ICON.heart); c.restore(); }
    else { c.fillStyle = '#fff'; c.beginPath(); c.arc(ax, yy, 28, 0, 7); c.fill(); }
    text(c, n, ax, yy + 50, { font: 'Mont', weight: 800, size: 22 });
  });
  text(c, '@yourchannel', x + 30, y + h - 110, { font: 'Mont', weight: 800, size: 28, align: 'left' });
  text(c, ui === 'tiktok' ? 'this edit is insane #fyp' : 'Golden hour vibes', x + 30, y + h - 70, { font: 'Mont', weight: 600, size: 24, align: 'left' });
  // floating hearts
  for (let i = 0; i < 6; i++) { const l = (lt * 0.9 + i / 6) % 1; c.save(); c.globalAlpha = 1 - l; c.translate(ax - 20 + Math.sin(l * 8 + i) * 30, y + h * 0.45 - l * 380); c.scale(0.35, 0.35); c.fillStyle = [C.pink, '#fff', C.yellow][i % 3]; c.fill(ICON.heart); c.restore(); }
  if (ui === 'instagram') { const gg = c.createLinearGradient(x, y, x + 80, y + 80); gg.addColorStop(0, '#feda75'); gg.addColorStop(1, '#962fbf'); c.strokeStyle = gg; c.lineWidth = 6; c.beginPath(); c.arc(x + 60, y + 60, 30, 0, 7); c.stroke(); text(c, 'Reels', x + 110, y + 62, { font: 'Mont', weight: 800, size: 30, align: 'left' }); }
  c.restore();
}
function platformMock(c, p, lt) {
  // device on the left (centered at -330), label on the right (+450)
  if (p.id === 'youtube') {
    const x = -900, y = -300, w = 1040, h = 585;
    c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 60; c.fillStyle = '#000'; c.fillRect(x - 10, y - 10, w + 20, h + 150); c.restore();
    slotRect(c, p.slot, lt, x, y, w, h, 0);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, y + h - 8, w, 6); c.fillStyle = '#ff0033'; c.fillRect(x, y + h - 8, w * (0.3 + lt * 0.05), 6);
    c.beginPath(); c.arc(x + w * (0.3 + lt * 0.05), y + h - 5, 10, 0, 7); c.fill();
    c.fillStyle = '#212121'; c.fillRect(x - 10, y + h, w + 20, 140);
    c.fillStyle = C.purple; c.beginPath(); c.arc(x + 40, y + h + 70, 32, 0, 7); c.fill();
    text(c, 'INSANE CLUTCH 1v5 — Best Moments', x + 95, y + h + 50, { font: 'Mont', weight: 800, size: 32, align: 'left' });
    text(c, '1.2M views · 2 days ago', x + 95, y + h + 95, { font: 'Mont', weight: 600, size: 24, align: 'left', color: '#aaa' });
    c.fillStyle = '#ff0033'; rr(c, x + w - 210, y + h + 45, 190, 56, 28); c.fill();
    text(c, 'SUBSCRIBE', x + w - 115, y + h + 74, { font: 'Mont', weight: 800, size: 24 });
  } else if (p.id === 'facebook') {
    const x = -880, y = -420, w = 980;
    c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 60; c.fillStyle = '#fff'; rr(c, x, y, w, 840, 26); c.fill(); c.restore();
    c.fillStyle = '#1877f2'; c.beginPath(); c.arc(x + 60, y + 60, 32, 0, 7); c.fill();
    text(c, 'Your Brand', x + 110, y + 48, { font: 'Mont', weight: 800, size: 30, align: 'left', color: '#111' });
    text(c, 'Sponsored', x + 110, y + 82, { font: 'Mont', weight: 600, size: 22, align: 'left', color: '#777' });
    text(c, 'Our new drop is here. Watch till the end!', x + 30, y + 140, { font: 'Mont', weight: 600, size: 26, align: 'left', color: '#222' });
    slotRect(c, p.slot, lt, x, y + 180, w, 551 * 0.8, 0);
    c.fillStyle = '#f0f2f5'; c.fillRect(x, y + 180 + 441, w, 110);
    text(c, 'yourbrand.com', x + 30, y + 690, { font: 'Mont', weight: 800, size: 26, align: 'left', color: '#111' });
    c.fillStyle = '#1877f2'; rr(c, x + w - 230, y + 660, 200, 60, 12); c.fill();
    text(c, 'Shop now', x + w - 130, y + 691, { font: 'Mont', weight: 800, size: 26 });
    text(c, '24K reactions · 1.9K shares', x + 30, y + 790, { font: 'Mont', weight: 600, size: 24, align: 'left', color: '#555' });
  } else {
    phone(c, p.slot, lt, -560, -440, 470, 860, p.id);
  }
  // label block
  const lp = E.expo(prog(lt, 0.1, 0.5));
  c.save(); c.globalAlpha = lp; c.translate((1 - lp) * 120, 0);
  platformIcon(c, p.id, 400, -200, 150);
  text(c, p.name, 300, -30, { size: 150, align: 'left', color: '#fff' });
  tag(c, p.fmt, 300, 110, { bg: p.col, color: p.id === 'tiktok' ? '#000' : '#fff', align: 'left', size: 34 });
  text(c, p.sub, 300, 210, { font: 'Mont', weight: 600, size: 34, align: 'left', color: C.muted });
  c.restore();
}
function sPlatforms(c, lt) {
  darkBg(c, lt + 8, C.purple, C.pink);
  // header
  const hp = prog(lt, 0, 0.9), up = E.inOut(prog(lt, 0.75, 0.4));
  c.save(); c.translate(W / 2, lerp(H / 2, 90, up)); const hs = lerp(1, 0.42, up); c.scale(hs, hs);
  kinetic(c, 'ONE EDITOR.', 0, -80, { size: 180, color: '#fff' }, lt, 0, 0.03, 'drop');
  kinetic(c, 'EVERY PLATFORM.', 0, 100, { size: 180, color: C.yellow, glow: C.yellow, blur: 30 }, lt, 0.25, 0.03, 'drop');
  c.restore();
  if (lt < 0.9) return;
  // camera path across 4 mockups, then zoom out to show all
  const stops = [1.0, 2.35, 3.65, 4.95];
  let pos = 0;
  for (let i = 1; i < 4; i++) pos += E.inOut(prog(lt, stops[i] - 0.3, 0.3));
  const SP = 2600;
  const zoomOut = E.inOut(prog(lt, 5.25, 0.55));
  const vel = (() => { let p2 = 0; for (let i = 1; i < 4; i++) p2 += E.inOut(prog(lt - 1 / 30, stops[i] - 0.3, 0.3)); return (pos - p2) * SP; })();
  const enter = E.expo(prog(lt, 0.9, 0.4));
  const draw = (cc, offset) => {
    cc.save(); cc.translate(W / 2, H / 2 + 60 + (1 - enter) * 700);
    const s = lerp(0.82, 0.18, zoomOut); cc.scale(s, s);
    const camX = lerp(pos * SP, 4000, zoomOut);
    PLAT.forEach((p, i) => {
      cc.save(); cc.translate(i * SP - camX + offset / s, 0);
      platformMock(cc, p, lt - (i ? stops[i] - 0.3 : 1.0));
      cc.restore();
    });
    cc.restore();
  };
  if (Math.abs(vel) > 40) {
    // motion blur: several copies along the motion direction
    const n = 7;
    for (let k = 0; k < n; k++) { c.save(); c.globalAlpha = k === 0 ? 1 : 0.22; draw(c, (k / n - 0.5) * vel * 0.5); c.restore(); }
  } else draw(c, 0);
}

// ============ 14-22s  gaming
const GAMES = [
  { id: 'rpg', fx: 'BOSS FIGHT', col: C.yellow },
  { id: 'br', fx: '#1 WINNER', col: C.cyan },
  { id: 'fps', fx: 'ACE!', col: C.pink },
  { id: 'craft', fx: 'SPEEDRUN', col: C.green },
];
function sGaming(c, lt) {
  if (lt < 1.0) {
    c.save(); c.filter = 'brightness(.35) saturate(1.3)'; drawSlot(c, 'fps', lt + 0.2, W, H); c.restore();
    const s = 1 + 0.25 * hit(lt, 0, 0.1) + lt * 0.06;
    c.save(); c.translate(W / 2, H / 2 - 40); c.scale(s, s);
    for (const [dx, col] of [[-10, C.pink], [10, C.cyan]]) text(c, 'GAMING', dx * (1 + 3 * hit(lt, 0, 0.2)), 0, { size: 400, color: col, alpha: 0.8 });
    text(c, 'GAMING', 0, 0, { size: 400, color: '#fff' });
    c.restore();
    kinetic(c, 'EDITS THAT HIT DIFFERENT', W / 2, 820, { font: 'Mont', weight: 800, size: 54, ls: 10, color: C.yellow }, lt, 0.2, 0.015, 'slide');
    return;
  }
  if (lt < 5.0) {
    const i = clamp(Math.floor(lt - 1.0), 0, 3), g = GAMES[i], l = lt - 1.0 - i;
    const z = 1.12 - 0.1 * E.out(clamp(l)) + 0.05 * hit(l, 0.45, 0.12);
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2); drawSlot(c, g.id, l + 0.5, W, H); c.restore();
    // letterbox
    c.fillStyle = '#000'; c.fillRect(0, 0, W, 70); c.fillRect(0, H - 70, W, 70);
    // name tag
    const tp = E.expo(prog(l, 0.05, 0.35));
    c.save(); c.translate((1 - tp) * -700, 0);
    c.fillStyle = g.col; c.fillRect(0, 820, 26, 150);
    c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(26, 820, measure(c, slotName(g.id), { size: 110 }) + 90, 150);
    text(c, slotName(g.id), 70, 900, { size: 110, align: 'left', color: '#fff' });
    c.restore();
    // hype text slam
    const sp = prog(l, 0.45, 0.2);
    if (sp > 0) {
      const k = lerp(2.6, 1, E.out(sp));
      c.save(); c.translate(W / 2 + 330, 330); c.rotate(-0.08); c.scale(k, k); c.globalAlpha = clamp(sp * 2);
      text(c, g.fx, 0, 0, { size: 170, color: g.col, glow: g.col, blur: 30 });
      text(c, g.fx, 0, 0, { size: 170, stroke: 5, color: '#fff' });
      c.restore();
    }
    c.fillStyle = `rgba(255,255,255,${hit(l, 0, 0.08) * 0.8})`; c.fillRect(0, 0, W, H);
    return;
  }
  // grid of all games
  const l = lt - 5.0;
  darkBg(c, lt + 14, C.cyan, C.pink);
  const gw = 900, gh = 470, gap = 30;
  GAMES.forEach((g, i) => {
    const p = E.back(prog(l, i * 0.08, 0.45));
    const cx = W / 2 + (i % 2 ? 1 : -1) * (gw / 2 + gap / 2), cy = H / 2 + (i < 2 ? -1 : 1) * (gh / 2 + gap / 2);
    const fromX = (i % 2 ? 1 : -1) * 1200, fromY = (i < 2 ? -1 : 1) * 800;
    c.save(); c.translate(cx + fromX * (1 - p), cy + fromY * (1 - p)); c.rotate((1 - p) * 0.3 * (i % 2 ? 1 : -1));
    const bz = 1 + 0.03 * Math.sin(l * 2 + i);
    c.scale(bz, bz);
    slotRect(c, g.id, l + i, -gw / 2, -gh / 2, gw, gh, 22);
    c.strokeStyle = g.col; c.lineWidth = 6; rr(c, -gw / 2, -gh / 2, gw, gh, 22); c.stroke();
    tag(c, slotName(g.id), -gw / 2 + 24, -gh / 2 + 50, { bg: g.col, color: '#000', align: 'left', size: 28 });
    c.restore();
  });
  const bp = E.back(prog(l, 0.5, 0.4));
  if (bp > 0) {
    c.save(); c.translate(W / 2, H / 2); c.scale(bp, bp);
    c.fillStyle = C.bg; c.shadowColor = C.pink; c.shadowBlur = 40; rr(c, -560, -70, 1120, 140, 70); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = C.pink; c.lineWidth = 5; c.stroke();
    text(c, 'MONTAGES · HIGHLIGHTS · FUNNY MOMENTS', 0, 4, { font: 'Mont', weight: 800, size: 40, ls: 3 });
    c.restore();
  }
}

// ============ 22-30s  any style
const STYLES = [
  { id: 'vlog', title: 'VLOGS & TRAVEL', col: C.yellow },
  { id: 'ad', title: 'ADS & COMMERCIALS', col: C.pink },
  { id: 'music', title: 'MUSIC VIDEOS', col: C.cyan },
  { id: 'podcast', title: 'PODCASTS', col: C.green },
];
function styleShot(c, i, l) {
  const s = STYLES[i];
  if (i === 1) {
    // split layout: color panel + footage
    c.fillStyle = s.col; c.fillRect(0, 0, W, H);
    slotRect(c, s.id, l, 760, 0, W - 760, H, 0);
    const p = E.expo(prog(l, 0.1, 0.5));
    kinetic(c, 'ADS &', 90, 380, { size: 190, align: 'left', color: '#fff' }, l, 0.1, 0.04, 'slide');
    kinetic(c, 'COMMER-', 90, 580, { size: 170, align: 'left', color: '#2a0a3d' }, l, 0.25, 0.03, 'slide');
    kinetic(c, 'CIALS', 90, 760, { size: 170, align: 'left', color: '#2a0a3d' }, l, 0.4, 0.03, 'slide');
    c.fillStyle = '#fff'; c.fillRect(90, 880, 400 * p, 12);
    return;
  }
  const z = 1.08 - 0.06 * l;
  c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2); drawSlot(c, s.id, l, W, H); c.restore();
  if (i === 0) {
    // camcorder overlay
    c.strokeStyle = '#fff'; c.lineWidth = 5;
    for (const [x, y, dx, dy] of [[80, 80, 1, 1], [W - 80, 80, -1, 1], [80, H - 80, 1, -1], [W - 80, H - 80, -1, -1]]) { c.beginPath(); c.moveTo(x, y + dy * 80); c.lineTo(x, y); c.lineTo(x + dx * 80, y); c.stroke(); }
    if ((l * 2) % 1 < 0.6) { c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(140, 140, 16, 0, 7); c.fill(); }
    text(c, 'REC', 170, 142, { font: 'Mont', weight: 800, size: 34, align: 'left' });
    kinetic(c, s.title, W / 2, H - 230, { size: 170, color: '#fff', glow: 'rgba(0,0,0,.6)' }, l, 0.1, 0.03, 'drop');
    kinetic(c, 'BALI · TOKYO · NEW YORK', W / 2, H - 110, { font: 'Mont', weight: 800, size: 40, ls: 12, color: s.col }, l, 0.4, 0.02, 'flip');
  } else if (i === 2) {
    const b = Math.exp(-((l % BEAT) / 0.1));
    c.save(); c.translate(W / 2, H / 2); c.scale(1 + b * 0.08, 1 + b * 0.08);
    for (const [dx, col] of [[-14, C.pink], [14, C.cyan]]) text(c, 'MUSIC VIDEOS', dx * (0.3 + b), 0, { size: 230, color: col, alpha: 0.85 });
    text(c, 'MUSIC VIDEOS', 0, 0, { size: 230, color: '#fff' });
    c.restore();
  } else if (i === 3) {
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, 190);
    kinetic(c, 'PODCASTS & INTERVIEWS', W / 2, 105, { size: 110, color: '#fff' }, l, 0.05, 0.02, 'drop');
    const words = ['WELCOME', 'BACK', 'TO', 'THE', 'SHOW!'];
    const cur = clamp(Math.floor((l - 0.3) / 0.25), -1, 4);
    let x = W / 2 - 520;
    words.forEach((w, k) => {
      if (k > cur) return;
      const ww = measure(c, w, { size: 110 });
      if (k === cur) { c.fillStyle = C.green; rr(c, x - 16, H - 200, ww + 32, 140, 18); c.fill(); }
      text(c, w, x + ww / 2, H - 128, { size: 110, color: '#fff', glow: 'rgba(0,0,0,.8)', blur: 20 });
      x += ww + 36;
    });
  }
}
function sStyles(c, lt) {
  if (lt < 0.8) {
    c.fillStyle = C.yellow; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = 0.15; c.fillStyle = '#000';
    for (let i = -10; i < 30; i++) { c.save(); c.translate(i * 120 + ((lt * 400) % 120), 0); c.rotate(0.35); c.fillRect(0, -200, 50, 1600); c.restore(); }
    c.restore();
    kinetic(c, 'ANY', W / 2, H / 2 - 150, { size: 300, color: '#000' }, lt, 0, 0.05, 'pop');
    kinetic(c, 'STYLE.', W / 2, H / 2 + 150, { size: 300, color: C.pink }, lt, 0.2, 0.05, 'pop');
    return;
  }
  const l = lt - 0.8, seg = 1.8, i = clamp(Math.floor(l / seg), 0, 3), local = l - i * seg;
  const prevShown = i > 0 && local < 0.35;
  if (prevShown) styleShot(c, i - 1, local + seg);
  if (!prevShown) { styleShot(c, i, local); return; }
  // circle / diagonal reveal of the next style
  const p = E.inOut(local / 0.35);
  c.save(); c.beginPath();
  if (i % 2) c.arc(W / 2, H / 2, p * 1200, 0, 7);
  else { c.moveTo(0, 0); c.lineTo(W * 2 * p, 0); c.lineTo(W * 2 * p - 700, H); c.lineTo(0, H); }
  c.clip(); styleShot(c, i, local); c.restore();
  c.save(); c.strokeStyle = STYLES[i].col; c.lineWidth = 14; c.beginPath();
  if (i % 2) c.arc(W / 2, H / 2, p * 1200, 0, 7); else { c.moveTo(W * 2 * p, 0); c.lineTo(W * 2 * p - 700, H); }
  c.stroke(); c.restore();
}

// ============ 30-36s  effects showcase
function sFx(c, lt) {
  if (lt < 2) {
    c.save(); c.filter = 'brightness(.7)'; const z = 1.05 + lt * 0.03; c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2); drawSlot(c, 'city', lt, W, H); c.restore();
    tag(c, 'SUBTITLES & CAPTIONS', 90, 110, { align: 'left', bg: C.pink });
    const words = ['THIS', 'IS', 'HOW', 'YOUR', 'VIDEO', 'SHOULD', 'LOOK'];
    const lines = [[0, 1, 2, 3], [4, 5, 6]];
    lines.forEach((ln, row) => {
      const ws = ln.map((k) => measure(c, words[k], { size: 150 }) + 40);
      let x = W / 2 - ws.reduce((a, b) => a + b, 0) / 2;
      ln.forEach((k, j) => {
        const a = 0.15 + k * 0.2, p = prog(lt, a, 0.18);
        if (p > 0) {
          const s = E.back(p), active = lt >= a && lt < a + 0.2 || (k === 6 && lt > a);
          c.save(); c.translate(x + ws[j] / 2, 560 + row * 180); c.scale(s, s);
          text(c, words[k], 0, 0, { size: 150, stroke: 18, color: '#000' });
          text(c, words[k], 0, 0, { size: 150, color: active ? C.yellow : '#fff' });
          c.restore();
        }
        x += ws[j];
      });
    });
    return;
  }
  if (lt < 4) {
    const l = lt - 2, split = W * lerp(0.15, 0.75, E.inOut(prog(l, 0.1, 1.6)));
    c.save(); c.filter = 'saturate(1.6) contrast(1.15) brightness(1.05)'; drawSlot(c, 'vlog', l + 1, W, H); c.restore();
    c.save(); c.beginPath(); c.rect(0, 0, split, H); c.clip(); c.filter = 'grayscale(.85) contrast(.75) brightness(.9)'; drawSlot(c, 'vlog', l + 1, W, H); c.restore();
    c.fillStyle = '#fff'; c.fillRect(split - 4, 0, 8, H);
    c.beginPath(); c.arc(split, H / 2, 46, 0, 7); c.fill();
    text(c, '‹ ›', split, H / 2 - 4, { font: 'Mont', weight: 800, size: 44, color: '#000' });
    tag(c, 'BEFORE', 90, H - 110, { align: 'left', bg: 'rgba(0,0,0,.6)' });
    tag(c, 'AFTER', W - 90, H - 110, { align: 'right', bg: C.yellow, color: '#000' });
    tag(c, 'COLOR GRADING', 90, 110, { align: 'left', bg: C.pink });
    return;
  }
  // VFX + sound design
  const l = lt - 4;
  c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let r = 0; r < 5; r++) { c.strokeStyle = [C.pink, C.cyan, C.purple, C.yellow, C.pink][r]; c.lineWidth = 6; c.globalAlpha = 0.7; c.beginPath(); c.arc(W / 2, H / 2 - 60, 180 + r * 90, l * (r % 2 ? 2 : -2) + r, l * (r % 2 ? 2 : -2) + r + 4); c.stroke(); }
  c.restore();
  burst(c, l - 0.1, W / 2, H / 2 - 60, 90, 3, { speed: 1300, life: 1.6, gravity: 200, size: 18 });
  const s = E.back(prog(l, 0.05, 0.4));
  c.save(); c.translate(W / 2, H / 2 - 60); c.scale(s, s);
  for (let d = 12; d > 0; d--) text(c, 'VFX', d * 3, d * 3, { size: 360, color: d > 6 ? '#3b0a57' : C.purple });
  text(c, 'VFX', 0, 0, { size: 360, color: '#fff' });
  c.restore();
  kinetic(c, 'MOTION GRAPHICS · SOUND DESIGN', W / 2, 820, { font: 'Mont', weight: 800, size: 50, ls: 6, color: C.cyan }, l, 0.3, 0.015, 'flip');
  for (let i = 0; i < 96; i++) { const hh = 10 + Math.abs(Math.sin(l * 9 + i * 0.4) * Math.cos(l * 4 + i * 0.13)) * 110; c.fillStyle = [C.pink, C.cyan, C.yellow][i % 3]; rr(c, i * 20 + 2, 1000 - hh / 2, 12, hh, 6); c.fill(); }
}

// ============ 36-41s  chat: you ask, I edit
function bubble(c, s, x, y, me, p) {
  const size = 32, w = measure(c, s, { font: 'Mont', weight: 600, size }) + 56, h = 80;
  const bx = me ? x - w : x;
  c.save(); c.globalAlpha = clamp(p * 2); const k = E.back(p);
  c.translate(me ? x : x, y); c.scale(k, k); c.translate(-(me ? x : x), -y);
  c.fillStyle = me ? C.green : '#2a2a40'; rr(c, bx, y - h / 2, w, h, 30); c.fill();
  text(c, s, bx + 28, y + 2, { font: 'Mont', weight: 600, size, align: 'left' });
  c.restore();
}
function typing(c, x, y, t) {
  c.fillStyle = C.green; rr(c, x - 130, y - 36, 130, 72, 30); c.fill();
  for (let i = 0; i < 3; i++) { c.fillStyle = '#fff'; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 10 - i); c.beginPath(); c.arc(x - 95 + i * 30, y, 9, 0, 7); c.fill(); }
  c.globalAlpha = 1;
}
function sChat(c, lt) {
  darkBg(c, lt + 36, C.green, C.purple);
  kinetic(c, 'YOU ASK.', 120, 380, { size: 200, align: 'left', color: '#fff' }, lt, 0.05, 0.04, 'drop');
  kinetic(c, 'I EDIT.', 120, 590, { size: 200, align: 'left', color: C.yellow, glow: C.yellow, blur: 30 }, lt, 0.35, 0.04, 'drop');
  ['Any idea you have', 'Any platform', 'Pro quality, fast delivery'].forEach((s, i) => {
    const p = E.expo(prog(lt, 0.8 + i * 0.2, 0.4));
    c.save(); c.globalAlpha = p; c.translate((1 - p) * -80, 0);
    c.fillStyle = C.green; c.beginPath(); c.arc(145, 760 + i * 80, 24, 0, 7); c.fill();
    c.save(); c.translate(125, 740 + i * 80); c.scale(0.4, 0.4); c.strokeStyle = '#fff'; c.lineWidth = 16; c.lineCap = 'round'; c.stroke(ICON.check); c.restore();
    text(c, s, 190, 762 + i * 80, { font: 'Mont', weight: 600, size: 40, align: 'left' });
    c.restore();
  });
  // chat window
  const wp = E.back(prog(lt, 0.2, 0.5));
  const x = 940, y = 120, w = 860, h = 860;
  c.save(); c.translate(x + w / 2, y + h / 2); c.scale(wp, wp); c.translate(-(x + w / 2), -(y + h / 2));
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 70; c.fillStyle = '#15152a'; rr(c, x, y, w, h, 36); c.fill(); c.shadowBlur = 0;
  c.fillStyle = '#1d1d38'; rr(c, x, y, w, 110, 36); c.fill(); c.fillRect(x, y + 70, w, 40);
  c.fillStyle = C.pink; c.beginPath(); c.arc(x + 70, y + 55, 34, 0, 7); c.fill();
  c.fillStyle = C.green; c.beginPath(); c.arc(x + 96, y + 80, 11, 0, 7); c.fill();
  text(c, 'New client', x + 125, y + 42, { font: 'Mont', weight: 800, size: 32, align: 'left' });
  text(c, 'online now', x + 125, y + 78, { font: 'Mont', weight: 600, size: 24, align: 'left', color: C.green });
  const L = x + 40, R = x + w - 40;
  bubble(c, 'Can you edit my Fortnite montage?', L, y + 200, false, prog(lt, 0.7, 0.3));
  if (lt > 1.2 && lt < 1.8) typing(c, R, y + 310, lt);
  bubble(c, 'Of course! Effects, music, all of it', R, y + 310, true, prog(lt, 1.8, 0.3));
  bubble(c, 'And a TikTok version too?', L, y + 420, false, prog(lt, 2.4, 0.3));
  if (lt > 2.8 && lt < 3.3) typing(c, R, y + 530, lt);
  bubble(c, 'Done. Both versions ready!', R, y + 530, true, prog(lt, 3.3, 0.3));
  // delivery card
  const dp = E.back(prog(lt, 3.8, 0.4));
  if (dp > 0) {
    c.save(); c.globalAlpha = clamp(dp * 2); c.translate(R, y + 700); c.scale(dp, dp);
    c.fillStyle = '#23233f'; rr(c, -560, -95, 560, 190, 24); c.fill();
    slotRect(c, 'br', lt, -540, -75, 270, 150, 14);
    text(c, 'FINAL_EDIT.mp4', -250, -30, { font: 'Mont', weight: 800, size: 30, align: 'left' });
    c.fillStyle = C.green; c.beginPath(); c.arc(-230, 30, 20, 0, 7); c.fill();
    c.save(); c.translate(-247, 13); c.scale(0.34, 0.34); c.strokeStyle = '#fff'; c.lineWidth = 16; c.lineCap = 'round'; c.stroke(ICON.check); c.restore();
    text(c, 'Delivered', -200, 32, { font: 'Mont', weight: 800, size: 28, align: 'left', color: C.green });
    c.restore();
  }
  c.restore();
}

// ============ 41-48s  CTA
function sCta(c, lt) {
  // background collage of footage
  c.fillStyle = '#04120b'; c.fillRect(0, 0, W, H);
  const tiles = ['fps', 'vlog', 'br', 'music', 'rpg', 'ad', 'craft', 'podcast', 'city'];
  c.save(); c.globalAlpha = 0.28;
  tiles.forEach((id, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = col * 700 - 150 + ((lt * (row % 2 ? 40 : -40)) % 700), y = row * 400 - 60;
    c.save(); c.translate(x + 300, y + 170); c.rotate(-0.06);
    slotRect(c, id, lt + i, -300, -170, 640, 360, 20); c.restore();
  });
  c.restore();
  const g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100); g.addColorStop(0, 'rgba(4,18,11,.55)'); g.addColorStop(1, 'rgba(4,18,11,.95)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  kinetic(c, 'READY TO GO VIRAL?', W / 2, 150, { font: 'Mont', weight: 800, size: 44, ls: 16, color: C.muted }, lt, 0.1, 0.02, 'flip');
  kinetic(c, 'ORDER NOW ON', W / 2, 280, { size: 140, color: '#fff' }, lt, 0.3, 0.03, 'drop');
  const fp = E.elastic(prog(lt, 0.7, 0.9));
  if (fp > 0) {
    c.save(); c.translate(W / 2, 480); c.scale(fp, fp);
    c.font = '800 300px Mont'; c.letterSpacing = '-10px';
    const fw = c.measureText('fiverr').width;
    text(c, 'fiverr', -40, 0, { font: 'Mont', weight: 800, size: 300, ls: -10, glow: 'rgba(29,191,115,.7)', blur: 60 });
    c.fillStyle = C.green; c.beginPath(); c.arc(-40 + fw / 2 + 30, 85, 34, 0, 7); c.fill();
    c.restore();
  }
  const mp = E.expo(prog(lt, 1.3, 0.5));
  c.save(); c.globalAlpha = mp; c.translate(0, (1 - mp) * 40);
  text(c, "Tell me the video you want — I'll make it happen.", W / 2, 680, { font: 'Mont', weight: 600, size: 50 });
  c.restore();
  // button + click
  const bp = E.back(prog(lt, 1.8, 0.45));
  const click = hit(lt, 3.1, 0.15);
  if (bp > 0) {
    const pulse = lt > 3.1 ? 1 + 0.04 * Math.sin((lt - 3.1) * 6) : 1;
    c.save(); c.translate(W / 2, 830); const s = bp * pulse * (1 - 0.08 * click); c.scale(s, s);
    c.shadowColor = 'rgba(29,191,115,.8)'; c.shadowBlur = 60; c.fillStyle = C.green; rr(c, -440, -75, 880, 150, 75); c.fill(); c.shadowBlur = 0;
    text(c, 'CONTACT ME ON FIVERR', -20, 4, { font: 'Mont', weight: 800, size: 56 });
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(360, -26); c.lineTo(400, 0); c.lineTo(360, 26); c.fill();
    c.restore();
    for (let r = 0; r < 3; r++) { const rp = prog(lt, 3.1 + r * 0.15, 0.8); if (rp > 0 && rp < 1) { c.save(); c.strokeStyle = C.green; c.globalAlpha = 1 - rp; c.lineWidth = 6; rr(c, W / 2 - 440 - rp * 120, 830 - 75 - rp * 120, 880 + rp * 240, 150 + rp * 240, 75 + rp * 120); c.stroke(); c.restore(); } }
  }
  // cursor
  if (lt > 2.3) {
    const cp = E.inOut(prog(lt, 2.3, 0.7));
    const cx = lerp(1700, W / 2 + 200, cp), cy = lerp(1150, 850, cp), s = 0.7 * (1 - 0.15 * click);
    c.save(); c.translate(cx, cy); c.scale(s, s); c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 6; c.stroke(ICON.cursor); c.fill(ICON.cursor); c.restore();
  }
  burst(c, lt - 3.1, W / 2, 830, 140, 11, { speed: 1600, life: 2.2, gravity: 1400, size: 22 });
  const tp = E.expo(prog(lt, 3.6, 0.5));
  c.save(); c.globalAlpha = tp;
  text(c, 'YOUTUBE  ·  TIKTOK  ·  INSTAGRAM  ·  FACEBOOK', W / 2, 975, { font: 'Mont', weight: 800, size: 38, ls: 6, color: C.cyan });
  text(c, 'GAMING · VLOGS · ADS · MUSIC · PODCASTS · AND MORE', W / 2, 1035, { font: 'Mont', weight: 800, size: 28, ls: 6, color: C.muted });
  c.restore();
}
