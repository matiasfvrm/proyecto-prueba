// Footage slots. If media/frames/<id>/ exists (see prep_media.py) the real clip is shown,
// otherwise the procedural stand-in below is drawn (authored at 1920x1080, key action centered).
const BEAT = 0.5;

function sky(c, top, bottom, y1 = H) {
  const g = c.createLinearGradient(0, 0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(0, 0, W, y1);
}
function glowCircle(c, x, y, r, col) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

const SLOTS = {
  // ------------------------------------------------------------ retro bullet-hell RPG
  rpg: {
    name: 'UNDERTALE', generic: 'RETRO RPG',
    draw(c, t) {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      // pixel monster
      const px = 14, mx = W / 2 - 8 * px, my = 90 + Math.sin(t * 3) * 10;
      const ghost = ['..XXXXXXXX..', '.XXXXXXXXXX.', 'XXX..XX..XXX', 'XXX..XX..XXX', 'XXXXXXXXXXXX', 'XXXX....XXXX', 'XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XX.XXX.XXX.X', 'X...X...X...'];
      c.fillStyle = '#fff';
      ghost.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') c.fillRect(mx + i * px + Math.sin(t * 6 + j) * 2, my + j * px, px, px); }));
      // battle box
      const bw = 620, bh = 340, bx = W / 2 - bw / 2, by = 330;
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
      c.fillStyle = '#fff';
      for (let i = 0; i < 18; i++) {
        const lane = i % 6, dir = lane % 2 ? 1 : -1;
        const x = ((t * 420 + i * 173) % (bw + 160)) - 80;
        const y = by + 30 + lane * 52 + Math.sin(t * 5 + i) * 6;
        const xx = dir > 0 ? bx + x : bx + bw - x;
        c.fillRect(xx - 22, y - 7, 44, 14); c.fillRect(xx - 28, y - 11, 10, 22); c.fillRect(xx + 18, y - 11, 10, 22);
      }
      // falling pellets
      for (let i = 0; i < 10; i++) {
        const x = bx + 40 + ((i * 97) % (bw - 80)), y = by + ((t * 300 + i * 91) % (bh + 40)) - 20;
        c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill();
      }
      // heart (soul)
      const hx = W / 2 + Math.sin(t * 2.3) * 200, hy = by + bh / 2 + Math.sin(t * 3.7) * 100;
      c.save(); c.translate(hx - 22, hy - 22); c.scale(0.44, 0.44); c.fillStyle = '#ff1a1a'; c.fill(ICON.heart); c.restore();
      c.restore();
      c.strokeStyle = '#fff'; c.lineWidth = 8; c.strokeRect(bx, by, bw, bh);
      // stats
      text(c, 'PLAYER   LV 19', W / 2 - 330, 730, { font: 'Mont', weight: 800, size: 36, align: 'left' });
      text(c, 'HP', W / 2 + 60, 730, { font: 'Mont', weight: 800, size: 32, align: 'left' });
      c.fillStyle = '#c00'; c.fillRect(W / 2 + 120, 712, 140, 36);
      c.fillStyle = '#ffe600'; c.fillRect(W / 2 + 120, 712, 140 * (0.75 + 0.2 * Math.sin(t * 2)), 36);
      text(c, '76 / 92', W / 2 + 290, 730, { font: 'Mont', weight: 800, size: 32, align: 'left' });
      ['ATTACK', 'SKILL', 'ITEM', 'RUN'].forEach((s, i) => {
        const x = W / 2 - 560 + i * 290, sel = Math.floor(t * 2) % 4 === i;
        c.strokeStyle = sel ? '#ffe600' : '#ff8c00'; c.lineWidth = 6; c.strokeRect(x, 790, 250, 90);
        text(c, s, x + 125, 836, { font: 'Mont', weight: 800, size: 40, color: sel ? '#ffe600' : '#ff8c00' });
      });
    },
  },
  // ------------------------------------------------------------ battle royale
  br: {
    name: 'FORTNITE', generic: 'BATTLE ROYALE',
    draw(c, t) {
      sky(c, '#3a8dff', '#bfe7ff', 620);
      c.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 5; i++) { const x = ((i * 470 - t * 40) % 2300 + 2300) % 2300 - 200, y = 90 + (i % 3) * 70; c.beginPath(); c.ellipse(x, y, 140, 38, 0, 0, 7); c.ellipse(x + 80, y - 20, 90, 40, 0, 0, 7); c.fill(); }
      c.fillStyle = '#6aa0c9'; c.beginPath(); c.moveTo(0, 620); for (let x = 0; x <= W; x += 160) c.lineTo(x, 520 - 90 * Math.abs(Math.sin(x * 0.004))); c.lineTo(W, 620); c.fill();
      const g = c.createLinearGradient(0, 600, 0, H); g.addColorStop(0, '#5fbf3f'); g.addColorStop(1, '#2f7d22');
      c.fillStyle = g; c.fillRect(0, 600, W, H);
      // storm wall
      const sx = 1500 + Math.sin(t) * 30, sg = c.createLinearGradient(sx, 0, W, 0);
      sg.addColorStop(0, 'rgba(160,60,255,0)'); sg.addColorStop(0.15, 'rgba(160,60,255,.55)'); sg.addColorStop(1, 'rgba(90,20,170,.8)');
      c.fillStyle = sg; c.fillRect(sx, 0, W - sx, H);
      if ((t * 3) % 1 < 0.08) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(1750, 0); c.lineTo(1700, 200); c.lineTo(1760, 260); c.lineTo(1690, 480); c.stroke(); }
      // build ramps
      const n = Math.min(6, Math.floor(t / 0.18) + 1);
      for (let i = 0; i < n; i++) {
        const x = 1080 + i * 90, y = 760 - i * 90;
        c.fillStyle = '#c98b4a'; c.beginPath(); c.moveTo(x, y + 90); c.lineTo(x + 180, y); c.lineTo(x + 260, y + 40); c.lineTo(x + 80, y + 130); c.fill();
        c.strokeStyle = '#7a4b1f'; c.lineWidth = 5; c.stroke();
      }
      // enemy on ramp
      const ex = 1400, ey = 470;
      c.fillStyle = '#e03a3a'; rr(c, ex, ey, 60, 110, 20); c.fill(); c.fillStyle = '#f2c79a'; c.beginPath(); c.arc(ex + 30, ey - 20, 30, 0, 7); c.fill();
      // player (third person)
      const bob = Math.sin(t * 10) * 6, pxx = 780, pyy = 640 + bob;
      c.fillStyle = '#2b2b5a'; rr(c, pxx - 50, pyy + 170, 40, 150, 14); c.fill(); rr(c, pxx + 10, pyy + 170, 40, 150, 14); c.fill();
      c.fillStyle = '#ff8a00'; rr(c, pxx - 80, pyy, 160, 190, 50); c.fill();
      c.fillStyle = '#5a3d1a'; rr(c, pxx - 60, pyy + 20, 120, 120, 30); c.fill();
      c.fillStyle = '#f2c79a'; c.beginPath(); c.arc(pxx, pyy - 40, 58, 0, 7); c.fill();
      c.fillStyle = '#6b3b12'; c.beginPath(); c.arc(pxx, pyy - 52, 58, Math.PI, 0); c.fill();
      c.fillStyle = '#333'; c.save(); c.translate(pxx + 70, pyy + 60); c.rotate(-0.35); rr(c, 0, -18, 190, 36, 8); c.fill(); c.restore();
      // tracers + damage numbers
      const shot = (t % 0.3) / 0.3;
      if (shot < 0.35) { c.strokeStyle = '#fff6a0'; c.lineWidth = 5; c.beginPath(); c.moveTo(pxx + 240, pyy - 10); c.lineTo(lerp(pxx + 240, ex + 30, shot * 3), lerp(pyy - 10, ey + 30, shot * 3)); c.stroke(); glowCircle(c, pxx + 250, pyy - 12, 60, 'rgba(255,230,120,.9)'); }
      for (let i = 0; i < 4; i++) {
        const lt = (t - i * 0.3) % 1.2; if (lt < 0) continue;
        text(c, String([98, 42, 107, 76][i]), ex + 100 + i * 20, ey - 40 - lt * 120, { size: 64, color: i % 2 ? '#fff' : '#ffe14d', alpha: 1 - lt / 1.2, stroke: 0 });
      }
      // HUD
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(1780, 140, 100, 0, 7); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke(); c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(1770, 150, 10, 0, 7); c.fill();
      text(c, '3 LEFT   7 ELIMS', 1780, 280, { font: 'Mont', weight: 800, size: 30 });
      c.fillStyle = 'rgba(0,0,0,.4)'; rr(c, 60, 960, 520, 70, 14); c.fill();
      c.fillStyle = '#3aa0ff'; rr(c, 80, 975, 480 * 0.8, 16, 8); c.fill();
      c.fillStyle = '#3ddc5a'; rr(c, 80, 1000, 480 * 0.95, 16, 8); c.fill();
      text(c, '30 | 120', 1760, 1000, { size: 64 });
    },
  },
  // ------------------------------------------------------------ tactical shooter
  fps: {
    name: 'VALORANT', generic: 'TACTICAL FPS',
    draw(c, t) {
      const sway = Math.sin(t * 1.3) * 30;
      c.save(); c.translate(sway, 0);
      c.fillStyle = '#1b2b35'; c.fillRect(-100, 0, W + 200, H);
      const vx = W / 2, vy = 470;
      // floor + walls
      c.fillStyle = '#2d3f4a'; c.beginPath(); c.moveTo(-100, H); c.lineTo(vx - 260, vy + 150); c.lineTo(vx + 260, vy + 150); c.lineTo(W + 100, H); c.fill();
      c.fillStyle = '#3a4f5c'; c.beginPath(); c.moveTo(-100, 0); c.lineTo(vx - 260, vy - 260); c.lineTo(vx - 260, vy + 150); c.lineTo(-100, H); c.fill();
      c.fillStyle = '#a58f6a'; c.beginPath(); c.moveTo(W + 100, 0); c.lineTo(vx + 260, vy - 260); c.lineTo(vx + 260, vy + 150); c.lineTo(W + 100, H); c.fill();
      c.fillStyle = '#e8dcc2'; c.fillRect(vx - 260, vy - 260, 520, 410);
      c.fillStyle = '#12202a'; c.fillRect(vx - 90, vy - 150, 180, 300);
      // light panels
      c.fillStyle = 'rgba(255,70,85,.8)'; c.fillRect(vx + 300, vy - 180, 20, 300);
      // enemy peeking
      const dead = (t % 2) > 1.35;
      if (!dead) {
        const ex = vx - 40 + Math.sin(t * 4) * 40;
        c.fillStyle = '#0a0f14'; rr(c, ex - 30, vy - 60, 90, 200, 30); c.fill(); c.beginPath(); c.arc(ex + 15, vy - 90, 34, 0, 7); c.fill();
        if ((t % 2) > 1.1) { c.strokeStyle = '#ff4655'; c.lineWidth = 6; rr(c, ex - 34, vy - 130, 98, 274, 30); c.stroke(); }
      }
      c.restore();
      // muzzle + gun
      const shoot = (t % 0.22) < 0.07 && (t % 2) > 0.9 && (t % 2) < 1.4;
      const rec = shoot ? 24 : 0;
      c.save(); c.translate(1300 + rec * 0.5, 740 + rec);
      c.fillStyle = '#20262c'; c.beginPath(); c.moveTo(0, 340); c.lineTo(120, 120); c.lineTo(420, 60); c.lineTo(620, 120); c.lineTo(660, 340); c.fill();
      c.fillStyle = '#ff4655'; c.fillRect(200, 110, 220, 20);
      c.fillStyle = '#363f47'; c.beginPath(); c.moveTo(120, 120); c.lineTo(0, 60); c.lineTo(-10, 90); c.lineTo(100, 160); c.fill();
      if (shoot) glowCircle(c, -10, 70, 160, 'rgba(255,220,140,.95)');
      c.restore();
      // crosshair
      c.fillStyle = '#35f0c8'; c.fillRect(W / 2 - 22, H / 2 - 2 - 70, 14, 4); c.fillRect(W / 2 + 8, H / 2 - 72, 14, 4);
      c.fillRect(W / 2 - 2, H / 2 - 92, 4, 14); c.fillRect(W / 2 - 2, H / 2 - 62, 4, 14);
      // HUD
      c.fillStyle = 'rgba(10,20,26,.7)'; rr(c, W / 2 - 200, 30, 400, 80, 10); c.fill();
      text(c, '7', W / 2 - 130, 72, { size: 54, color: '#35f0c8' }); text(c, '1:24', W / 2, 72, { size: 54 }); text(c, '5', W / 2 + 130, 72, { size: 54, color: '#ff4655' });
      ['C', 'Q', 'E', 'X'].forEach((k, i) => { c.fillStyle = 'rgba(10,20,26,.7)'; rr(c, W / 2 - 200 + i * 105, 960, 90, 90, 12); c.fill(); text(c, k, W / 2 - 155 + i * 105, 1005, { size: 46, color: i === 3 ? '#ffe14d' : '#fff' }); });
      text(c, '100', 180, 1000, { size: 80 }); text(c, '25 / 75', 1760, 1000, { size: 60 });
      if (dead) { text(c, 'ELIMINATED', W / 2, 800, { size: 70, color: '#ff4655', glow: '#ff4655' }); }
    },
  },
  // ------------------------------------------------------------ block sandbox
  craft: {
    name: 'MINECRAFT', generic: 'SANDBOX',
    draw(c, t) {
      sky(c, '#6fb6ff', '#bfe3ff', H);
      c.fillStyle = '#fff6a0'; c.fillRect(1500, 110, 140, 140);
      c.fillStyle = 'rgba(255,255,255,.9)';
      for (let i = 0; i < 4; i++) { const x = ((i * 560 - t * 60) % 2400 + 2400) % 2400 - 300; c.fillRect(x, 150 + (i % 2) * 90, 260, 50); c.fillRect(x + 60, 110 + (i % 2) * 90, 140, 40); }
      const B = 120, scroll = t * 180, first = Math.floor(scroll / B);
      for (let i = -1; i < W / B + 2; i++) {
        const col = first + i, x = i * B - (scroll % B);
        const hgt = 3 + Math.floor(2.5 + 2 * Math.sin(col * 0.5) + Math.sin(col * 1.3));
        for (let j = 0; j < 10; j++) {
          const y = H - (j + 1) * B; if (j > hgt) break;
          const top = j === hgt;
          c.fillStyle = top ? '#5cb338' : j < 2 ? '#7d7d7d' : '#8b5a2b';
          c.fillRect(x, y, B, B);
          c.fillStyle = 'rgba(0,0,0,.12)';
          for (let k = 0; k < 6; k++) { const r1 = rnd(col * 31 + j * 7 + k); c.fillRect(x + Math.floor(r1 * 6) * 20, y + Math.floor(rnd(r1 * 9) * 6) * 20, 20, 20); }
          if (top) { c.fillStyle = '#8b5a2b'; c.fillRect(x, y + 36, B, 12); }
        }
        if (col % 7 === 3) { const ty = H - (hgt + 1) * B; c.fillStyle = '#6b4a2a'; c.fillRect(x + 40, ty - 240, 40, 240); c.fillStyle = '#2f8a2f'; c.fillRect(x - 60, ty - 400, 240, 180); }
      }
      // arm swinging
      const sw = Math.sin(t * 12) * 0.25;
      c.save(); c.translate(1500, 1150); c.rotate(-0.5 + sw); c.fillStyle = '#c8966b'; c.fillRect(-60, -420, 130, 440); c.restore();
      // hotbar
      for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(W / 2 - 405 + i * 90, 985, 84, 84); c.strokeStyle = i === 2 ? '#fff' : '#555'; c.lineWidth = 6; c.strokeRect(W / 2 - 405 + i * 90, 985, 84, 84); }
      ['#5cb338', '#8b5a2b', '#7d7d7d', '#c98b4a', '#3aa0ff'].forEach((col, i) => { c.fillStyle = col; c.fillRect(W / 2 - 385 + i * 90, 1005, 44, 44); });
      c.fillStyle = '#fff'; c.fillRect(W / 2 - 3, H / 2 - 24, 6, 48); c.fillRect(W / 2 - 24, H / 2 - 3, 48, 6);
    },
  },
  // ------------------------------------------------------------ travel vlog
  vlog: {
    name: 'VLOGS', generic: 'VLOGS',
    draw(c, t) {
      const z = 1 + t * 0.02; c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
      const g = c.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#2a1b5c'); g.addColorStop(0.45, '#e2508a'); g.addColorStop(1, '#ffb65c');
      c.fillStyle = g; c.fillRect(0, 0, W, 640);
      glowCircle(c, W / 2, 560, 520, 'rgba(255,210,120,.8)');
      c.fillStyle = '#ffe7a3'; c.beginPath(); c.arc(W / 2, 570, 140, 0, 7); c.fill();
      const sea = c.createLinearGradient(0, 620, 0, H); sea.addColorStop(0, '#d9667f'); sea.addColorStop(1, '#27164a');
      c.fillStyle = sea; c.fillRect(0, 620, W, H);
      c.fillStyle = 'rgba(255,230,170,.7)';
      for (let i = 0; i < 26; i++) { const y = 640 + i * 16, w = 260 - i * 7 + Math.sin(t * 3 + i) * 40; c.fillRect(W / 2 - w / 2 + Math.sin(t * 2 + i * 1.7) * 20, y, w, 5); }
      // plane + trail
      const px = ((t * 150) % 2400) - 200;
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 4; c.beginPath(); c.moveTo(px - 600, 250); c.lineTo(px, 200); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(px + 20, 198, 30, 8, -0.08, 0, 7); c.fill();
      // birds
      c.strokeStyle = '#1b0f33'; c.lineWidth = 5;
      for (let i = 0; i < 5; i++) { const bx = 500 + i * 80 + t * 60, by = 300 + (i % 2) * 40, f = Math.sin(t * 10 + i) * 12; c.beginPath(); c.moveTo(bx - 24, by - f); c.lineTo(bx, by); c.lineTo(bx + 24, by - f); c.stroke(); }
      c.restore();
      // palms (foreground parallax)
      for (const [x0, s, sp] of [[180, 1.2, 40], [1740, 1.0, 55]]) {
        const x = x0 - t * sp * 0.3;
        c.save(); c.translate(x, H + 40); c.scale(s, s); c.fillStyle = '#12091f';
        c.beginPath(); c.moveTo(-18, 0); c.quadraticCurveTo(10, -380, 60, -700); c.lineTo(86, -700); c.quadraticCurveTo(40, -380, 22, 0); c.fill();
        for (let k = 0; k < 7; k++) { c.save(); c.translate(72, -700); c.rotate(-Math.PI + k * 0.52 + Math.sin(t * 2 + k) * 0.05); c.beginPath(); c.ellipse(170, 0, 180, 30, 0.25, 0, 7); c.fill(); c.restore(); }
        c.restore();
      }
    },
  },
  // ------------------------------------------------------------ product commercial
  ad: {
    name: 'ADS', generic: 'ADS',
    draw(c, t) {
      const g = c.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 1100); g.addColorStop(0, '#ff5d8f'); g.addColorStop(1, '#3b0a57');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.save(); c.globalAlpha = 0.18; c.strokeStyle = '#fff'; c.lineWidth = 3;
      for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(W / 2, H / 2, 200 + i * 90 + ((t * 120) % 90), 0, 7); c.stroke(); }
      c.restore();
      // pedestal
      c.fillStyle = '#2a0a3d'; c.beginPath(); c.ellipse(W / 2, 880, 360, 70, 0, 0, 7); c.fill();
      c.fillStyle = '#ff9fc0'; c.beginPath(); c.ellipse(W / 2, 860, 360, 70, 0, 0, 7); c.fill();
      // can
      const cx = W / 2, top = 250 + Math.sin(t * 2) * 14, cw = 300, ch = 580;
      c.save(); rr(c, cx - cw / 2, top, cw, ch, 60); c.clip();
      c.fillStyle = '#ffd23f'; c.fillRect(cx - cw / 2, top, cw, ch);
      const off = (t * 220) % 600;
      for (let k = -1; k < 3; k++) { c.fillStyle = '#ff2e63'; c.save(); c.translate(cx - cw / 2 - off + k * 600, top + 180); c.rotate(-0.25); c.fillRect(0, 0, 300, 120); c.restore(); }
      for (let k = -1; k < 2; k++) text(c, 'FIZZ', cx + 300 - off + k * 600, top + 360, { size: 120, color: '#2a0a3d' });
      const sh = c.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
      sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(0.3, 'rgba(255,255,255,.5)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.45)');
      c.fillStyle = sh; c.fillRect(cx - cw / 2, top, cw, ch);
      c.restore();
      c.fillStyle = '#ccc'; rr(c, cx - cw / 2 + 20, top - 30, cw - 40, 50, 20); c.fill();
      // sparkles
      for (let i = 0; i < 8; i++) {
        const a = t * 1.5 + i * 0.8, r = 420 + (i % 3) * 60, x = cx + Math.cos(a) * r, y = 540 + Math.sin(a) * r * 0.5;
        const s = 20 + 14 * Math.sin(t * 6 + i);
        c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.25, y); c.lineTo(x, y + s); c.lineTo(x - s * 0.25, y); c.fill();
        c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y + s * 0.25); c.lineTo(x + s, y); c.lineTo(x, y - s * 0.25); c.fill();
      }
      c.save(); c.translate(cx + 260, 300); c.rotate(-0.2 + Math.sin(t * 3) * 0.08);
      c.fillStyle = '#fff'; c.beginPath(); for (let i = 0; i < 24; i++) { const r = i % 2 ? 95 : 120, a = i * Math.PI / 12; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill();
      text(c, '-50%', 0, 4, { size: 64, color: C.pink }); c.restore();
    },
  },
  // ------------------------------------------------------------ concert / music video
  music: {
    name: 'MUSIC VIDEOS', generic: 'MUSIC VIDEOS',
    draw(c, t) {
      c.fillStyle = '#05030c'; c.fillRect(0, 0, W, H);
      const beat = Math.exp(-((t % BEAT) / 0.12));
      c.save(); c.globalCompositeOperation = 'lighter';
      const cols = ['#ff2e63', '#08d9d6', '#7b2bff', '#ffd23f'];
      for (let i = 0; i < 8; i++) {
        const x = 160 + i * 230, a = Math.sin(t * 1.4 + i) * 0.5 + (i % 2 ? 0.2 : -0.2);
        c.save(); c.translate(x, -20); c.rotate(a);
        const g = c.createLinearGradient(0, 0, 0, 1100); g.addColorStop(0, cols[i % 4] + 'dd'); g.addColorStop(1, cols[i % 4] + '00');
        c.fillStyle = g; c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.lineTo(160, 1100); c.lineTo(-160, 1100); c.fill(); c.restore();
      }
      c.restore();
      // performer silhouette center
      c.fillStyle = '#000'; c.beginPath(); c.arc(W / 2, 470, 55, 0, 7); c.fill();
      rr(c, W / 2 - 80, 520, 160, 260, 50); c.fill();
      c.save(); c.translate(W / 2 + 60, 560); c.rotate(-2.2 + Math.sin(t * 8) * 0.2); rr(c, -15, 0, 30, 200, 15); c.fill(); c.restore();
      glowCircle(c, W / 2, 460, 260 + beat * 80, `rgba(255,255,255,${0.12 + beat * 0.15})`);
      // crowd
      for (let i = 0; i < 26; i++) {
        const x = i * 78 + 20, jump = Math.abs(Math.sin(t * Math.PI * 2 + i * 0.7)) * 30;
        c.fillStyle = '#000'; c.beginPath(); c.arc(x, 900 - jump, 34, 0, 7); c.fill(); rr(c, x - 50, 930 - jump, 100, 200, 40); c.fill();
        if (i % 3 === 0) { c.save(); c.translate(x + 20, 920 - jump); c.rotate(-0.3 + Math.sin(t * 6 + i) * 0.3); rr(c, -10, -170, 20, 170, 10); c.fill(); c.restore(); }
      }
      // equalizer
      for (let i = 0; i < 40; i++) { const hh = 20 + Math.abs(Math.sin(t * 7 + i * 0.6) * Math.cos(t * 3 + i)) * 160 * (0.5 + beat); c.fillStyle = cols[i % 4]; c.fillRect(i * 48 + 4, 250 - hh / 2, 30, hh); }
      c.fillStyle = `rgba(255,255,255,${beat * 0.25})`; c.fillRect(0, 0, W, H);
    },
  },
  // ------------------------------------------------------------ podcast
  podcast: {
    name: 'PODCASTS', generic: 'PODCASTS',
    draw(c, t) {
      const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2b1a12'); g.addColorStop(1, '#120c1f');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) glowCircle(c, rnd(i) * W, rnd(i + 9) * 600, 60 + rnd(i + 3) * 80, `rgba(255,${150 + i * 5},80,.25)`);
      // on air sign
      c.fillStyle = '#300'; rr(c, W / 2 - 150, 60, 300, 90, 16); c.fill();
      text(c, 'ON AIR', W / 2, 108, { font: 'Mont', weight: 800, size: 46, color: '#ff4040', glow: '#ff2020', alpha: 0.7 + 0.3 * Math.sin(t * 6) });
      const who = Math.floor(t / 1.0) % 2;
      for (const side of [0, 1]) {
        const x = side ? 1420 : 500, dir = side ? -1 : 1, talk = who === side ? Math.abs(Math.sin(t * 14)) * 8 : 0;
        c.fillStyle = side ? '#3b2d5c' : '#5c2d3b'; c.beginPath(); c.ellipse(x, 1050, 300, 260, 0, Math.PI, 0); c.fill();
        c.fillStyle = side ? '#c8966b' : '#f2c79a'; c.beginPath(); c.arc(x, 560 - talk * 0.3, 130, 0, 7); c.fill();
        c.fillStyle = '#1b1210'; c.beginPath(); c.arc(x, 520, 135, Math.PI * 1.05, Math.PI * 1.95); c.fill();
        c.fillStyle = '#111'; rr(c, x - 150, 470, 30, 120, 12); c.fill(); rr(c, x + 120, 470, 30, 120, 12); c.fill();
        c.strokeStyle = '#111'; c.lineWidth = 16; c.beginPath(); c.arc(x, 520, 150, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
        // mic
        c.strokeStyle = '#222'; c.lineWidth = 14; c.beginPath(); c.moveTo(x + dir * 400, 1100); c.lineTo(x + dir * 330, 780); c.lineTo(x + dir * 200, 640); c.stroke();
        c.fillStyle = '#333'; c.save(); c.translate(x + dir * 180, 620); c.rotate(dir * 0.6); rr(c, -40, -80, 80, 160, 40); c.fill(); c.restore();
      }
      // waveform
      for (let i = 0; i < 50; i++) { const hh = 10 + Math.abs(Math.sin(t * 9 + i * 0.5)) * (40 + 60 * Math.sin(i * 0.2)); c.fillStyle = C.yellow; rr(c, W / 2 - 250 + i * 10, 800 - hh / 2, 6, hh, 3); c.fill(); }
      text(c, 'EP. 42', W / 2, 920, { font: 'Mont', weight: 800, size: 40, ls: 8, color: '#ffd9a0' });
    },
  },
  // ------------------------------------------------------------ city night (for captions / color demo)
  city: {
    name: 'CITY', generic: 'CITY',
    draw(c, t) {
      sky(c, '#0b1036', '#6a2a7a', 760);
      c.fillStyle = '#f5f0d8'; c.beginPath(); c.arc(1500, 180, 70, 0, 7); c.fill();
      for (let layer = 0; layer < 2; layer++) {
        const sp = layer ? 50 : 20, base = layer ? 820 : 760;
        for (let i = 0; i < 22; i++) {
          const w = 110 + rnd(i + layer * 50) * 90, hgt = 200 + rnd(i * 3 + layer) * (layer ? 420 : 300);
          const x = ((i * 130 - t * sp) % 2860 + 2860) % 2860 - 300;
          c.fillStyle = layer ? '#141026' : '#241a45'; c.fillRect(x, base - hgt, w, hgt);
          for (let wy = base - hgt + 20; wy < base - 20; wy += 34) for (let wx = x + 14; wx < x + w - 20; wx += 28) if (rnd(wx * 0.13 + wy * 0.7 + layer) > 0.55) { c.fillStyle = layer ? '#ffd27a' : '#8a6bd6'; c.fillRect(wx, wy, 12, 18); }
        }
      }
      c.fillStyle = '#0a0a14'; c.fillRect(0, 820, W, H);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) {
        const lane = i % 2, x = ((t * (lane ? 900 : -700) + i * 400) % 2600 + 2600) % 2600 - 300, y = 900 + lane * 90;
        const g = c.createLinearGradient(x - 500, 0, x, 0); const col = lane ? '255,80,80' : '255,240,200';
        g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.9)`); c.fillStyle = g; c.fillRect(x - 500, y, 500, 8);
      }
      c.restore();
    },
  },
};
Object.assign(SLOTS, {
  hk: { name: 'HOLLOW KNIGHT', generic: 'METROIDVANIA', draw: (c, t) => SLOTS.rpg.draw(c, t) },
  amongus: { name: 'AMONG US', generic: 'PARTY GAME', draw: (c, t) => SLOTS.craft.draw(c, t) },
  skate: { name: 'SPORTS', generic: 'SPORTS', draw: (c, t) => SLOTS.city.draw(c, t) },
  car: { name: 'CARS', generic: 'CARS', draw: (c, t) => SLOTS.city.draw(c, t) },
  food: { name: 'FOOD', generic: 'FOOD', draw: (c, t) => SLOTS.ad.draw(c, t) },
  dance: { name: 'DANCE', generic: 'DANCE', draw: (c, t) => SLOTS.music.draw(c, t) },
  fashion: { name: 'FASHION', generic: 'FASHION', draw: (c, t) => SLOTS.ad.draw(c, t) },
  travel: { name: 'TRAVEL', generic: 'TRAVEL', draw: (c, t) => SLOTS.vlog.draw(c, t) },
  drone: { name: 'DRONE', generic: 'DRONE', draw: (c, t) => SLOTS.vlog.draw(c, t) },
});
