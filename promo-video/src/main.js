// Timeline, transitions and post-processing.
const DURATION = 48;
const SCENES = [
  { a: 0, b: 4, draw: sOpen },
  { a: 4, b: 8, draw: sIntro },
  { a: 8, b: 14, draw: sPlatforms },
  { a: 14, b: 22, draw: sGaming },
  { a: 22, b: 30, draw: sStyles },
  { a: 30, b: 36, draw: sFx },
  { a: 36, b: 41, draw: sChat },
  { a: 41, b: 48, draw: sCta },
];
// transition centered on each cut
const CUTS = [
  { t: 4, type: 'zoom', d: 0.5 }, { t: 8, type: 'whip', d: 0.45 }, { t: 14, type: 'glitch', d: 0.4 },
  { t: 22, type: 'spin', d: 0.5 }, { t: 30, type: 'zoom', d: 0.5 }, { t: 36, type: 'slice', d: 0.55 }, { t: 41, type: 'circle', d: 0.6 },
];
// music structure (must match music.py): sections where the kick plays every beat
const DROPS = [[4, 36], [41, 46.5]];

const out = document.getElementById('c');
const octx = out.getContext('2d');
const bufA = canvas(), bufB = canvas(), comp = canvas(), post = canvas();
const ca = bufA.getContext('2d'), cb = bufB.getContext('2d'), cc = comp.getContext('2d'), pc = post.getContext('2d');

function renderScene(ctx, i, t) {
  const s = SCENES[i];
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
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
      const s = 1 + E.expoIn(p * 2) * 1.8;
      blurCopies(dst, bufA, 6, (d, k) => { const z = s * (1 + k * 0.12 * p); d.translate(W / 2, H / 2); d.scale(z, z); d.translate(-W / 2, -H / 2); });
    } else {
      const s = 1 + (1 - E.expo((p - 0.5) * 2)) * 0.6;
      blurCopies(dst, bufB, 6, (d, k) => { const z = s * (1 + k * 0.1 * (1 - p)); d.translate(W / 2, H / 2); d.scale(z, z); d.translate(-W / 2, -H / 2); });
    }
    dst.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - Math.abs(p - 0.5) * 5) * 0.8})`; dst.fillRect(0, 0, W, H);
  } else if (type === 'whip') {
    const x = -e * W, v = Math.sin(p * Math.PI) * 260;
    for (const [src, ox] of [[bufA, x], [bufB, x + W]]) blurCopies(dst, src, 8, (d, k) => d.translate(ox + (k - 0.5) * v, 0));
  } else if (type === 'glitch') {
    const src = p < 0.5 ? bufA : bufB;
    glitchSlices(dst, src, 260 * (1 - Math.abs(p - 0.5) * 2), Math.floor(p * 12));
    if (Math.floor(p * 16) % 3 === 0) { dst.globalAlpha = 0.5; dst.drawImage(p < 0.5 ? bufB : bufA, 0, 0); dst.globalAlpha = 1; }
  } else if (type === 'spin') {
    const src = p < 0.5 ? bufA : bufB, a = p < 0.5 ? E.expoIn(p * 2) * 0.9 : -(1 - E.expo((p - 0.5) * 2)) * 0.9;
    const z = 1 + Math.abs(a) * 0.8;
    blurCopies(dst, src, 7, (d, k) => { d.translate(W / 2, H / 2); d.rotate(a * (1 + k * 0.08)); d.scale(z, z); d.translate(-W / 2, -H / 2); });
  } else if (type === 'slice') {
    dst.drawImage(bufA, 0, 0);
    const n = 6, hh = H / n;
    for (let i = 0; i < n; i++) {
      const pp = E.expo(clamp((p - i * 0.06) / 0.6)), dir = i % 2 ? 1 : -1;
      dst.drawImage(bufB, 0, i * hh, W, hh, dir * (1 - pp) * W, i * hh, W, hh);
    }
  } else if (type === 'circle') {
    dst.drawImage(bufA, 0, 0);
    dst.save(); dst.beginPath(); dst.arc(W / 2, H / 2, E.expoIn(p) * 1200 + p * 100, 0, 7); dst.clip(); dst.drawImage(bufB, 0, 0); dst.restore();
    dst.save(); dst.strokeStyle = C.green; dst.lineWidth = 20; dst.beginPath(); dst.arc(W / 2, H / 2, E.expoIn(p) * 1200 + p * 100, 0, 7); dst.stroke(); dst.restore();
  }
}

function cutNear(t) { return CUTS.find((k) => Math.abs(t - k.t) < k.d / 2); }

// Accent amount for post effects (spikes around cuts)
function accent(t) {
  let a = 0;
  for (const k of CUTS) a += Math.exp(-Math.abs(t - k.t) / 0.08);
  if (t < 2) a += 0.5 * Math.exp(-((t % 0.25) / 0.05));
  for (const k of [15.45, 16.45, 17.45, 18.45]) a += Math.exp(-Math.abs(t - k) / 0.06) * 0.6; // game hype slams
  return a;
}
function beatPunch(t) {
  for (const [a, b] of DROPS) if (t >= a && t < b) return Math.exp(-(((t - a) % 0.5) / 0.09));
  return 0;
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
  // camera: beat punch + shake around accents
  const acc = accent(t), punch = beatPunch(t);
  const z = 1 + 0.018 * punch + 0.04 * Math.min(acc, 1);
  const sh = Math.min(acc, 1) * 18, fr = Math.floor(t * FPS);
  pc.save(); pc.fillStyle = '#000'; pc.fillRect(0, 0, W, H);
  pc.translate(W / 2 + (rnd(fr) - 0.5) * sh, H / 2 + (rnd(fr + 0.5) - 0.5) * sh); pc.scale(z, z); pc.translate(-W / 2, -H / 2);
  pc.drawImage(comp, 0, 0); pc.restore();
  // chromatic aberration + glitch
  const caAmt = 2 + Math.min(acc, 1.5) * 22;
  if (acc > 0.35 && (t < 2 || cut)) { glitchSlices(cc, post, acc * 60, fr); chroma(octx, comp, caAmt); }
  else chroma(octx, post, caAmt);
  // overlays
  lightLeak(octx, t, 0.18);
  vignette(octx, 0.5);
  grain(octx, t, 0.06);
  // fade in/out
  const fade = Math.min(prog(t, 0, 0.25), 1 - prog(t, DURATION - 0.6, 0.6));
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
