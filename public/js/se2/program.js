// Reading figures for the SE(2) program. Numerical illustrations, never certificates.
// The mathematical module is derived from the research explorer; web-review
// corrections and both origin/current hashes are recorded in the snapshot manifest.
import * as M from './se2math.js?v=20261008-review2';
const TAU = 2 * Math.PI;
const C = { ink: '#25313c', muted: '#65727e', rule: '#dee3e7', geo: '#1565c0', conjugate: '#c8501a', cut: '#6b4fa3', green: '#2d8061' };
const f = (x, n = 3) => Number(x).toFixed(n);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
let thresholds;
const rayData = () => thresholds ||= fetch('/public/research/se2/se2-ray-thresholds.json').then(r => { if (!r.ok) throw Error('Threshold data unavailable'); return r.json(); });

function frame(canvas) {
  const box = canvas.getBoundingClientRect(), W = box.width, H = box.height, dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  return { g, W, H };
}
function scale(box, W, H, equal = true) {
  let [x0, x1, y0, y1] = box;
  const l = 48, r = 22, t = 25, b = 39, iw = W - l - r, ih = H - t - b;
  if (equal) { const s = Math.min(iw / (x1 - x0), ih / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    x0 = cx - iw / s / 2; x1 = cx + iw / s / 2; y0 = cy - ih / s / 2; y1 = cy + ih / s / 2; }
  return { x: x => l + (x - x0) * iw / (x1 - x0), y: y => H - b - (y - y0) * ih / (y1 - y0),
    inverse: (x, y) => [x0 + (x - l) * (x1 - x0) / iw, y0 + (H - b - y) * (y1 - y0) / ih], box: [x0, x1, y0, y1], l, r, t, b };
}
function step(span) { const p = 10 ** Math.floor(Math.log10(span / 5)), q = span / 5 / p; return (q < 1.8 ? 1 : q < 3.8 ? 2 : q < 8 ? 5 : 10) * p; }
function text(g, str, x, y, color = C.muted, align = 'left', size = 12) { g.fillStyle = color; g.font = `${size}px 'Source Sans 3', sans-serif`; g.textAlign = align; g.fillText(str, x, y); }
function axes(g, s, W, H, xLabel = 'x', yLabel = 'y') {
  const [x0, x1, y0, y1] = s.box; g.lineWidth = 1;
  for (let x = Math.ceil(x0 / step(x1 - x0)) * step(x1 - x0); x <= x1 + 1e-8; x += step(x1 - x0)) {
    g.strokeStyle = C.rule; g.beginPath(); g.moveTo(s.x(x), s.y(y0)); g.lineTo(s.x(x), s.y(y1)); g.stroke(); text(g, `${+x.toFixed(2)}`, s.x(x), H - s.b + 18, C.muted, 'center', 11);
  }
  for (let y = Math.ceil(y0 / step(y1 - y0)) * step(y1 - y0); y <= y1 + 1e-8; y += step(y1 - y0)) {
    g.strokeStyle = C.rule; g.beginPath(); g.moveTo(s.x(x0), s.y(y)); g.lineTo(s.x(x1), s.y(y)); g.stroke(); text(g, `${+y.toFixed(2)}`, s.l - 8, s.y(y) + 4, C.muted, 'right', 11);
  }
  text(g, xLabel, W - s.r, H - 4, C.ink, 'right'); text(g, yLabel, s.l, 13, C.ink);
}
function line(g, points, s, color, width = 2, alpha = 1) {
  g.save(); g.strokeStyle = color; g.lineWidth = width; g.globalAlpha = alpha; g.beginPath(); let on = false;
  for (const p of points) { if (!p || !p.every(Number.isFinite)) { on = false; continue; } if (on) g.lineTo(s.x(p[0]), s.y(p[1])); else { g.moveTo(s.x(p[0]), s.y(p[1])); on = true; } }
  g.stroke(); g.restore();
}
function dot(g, s, p, color, r = 4) { g.beginPath(); g.arc(s.x(p[0]), s.y(p[1]), r, 0, TAU); g.fillStyle = color; g.fill(); }
function bounds(points) {
  const finite = points.filter(p => p && p.every(Number.isFinite));
  const xs = finite.map(p => p[0]), ys = finite.map(p => p[1]);
  const x0 = Math.min(0, ...xs), x1 = Math.max(0, ...xs), y0 = Math.min(0, ...ys), y1 = Math.max(0, ...ys), pad = Math.max(x1 - x0, y1 - y0, 1) * .13;
  return [x0 - pad, x1 + pad, y0 - pad, y1 + pad];
}
function trajectory(source, n = 190) { return Array.from({ length: n + 1 }, (_, i) => { const q = M.expC2(source.psi, source.k, source.t * i / n, source.eps || 1); return [q.x, q.y]; }); }
function pose(g, s, q) {
  const x = s.x(q.x), y = s.y(q.y); g.save(); g.translate(x, y); g.rotate(-q.theta); g.fillStyle = C.ink; g.fillRect(-8, -4, 16, 8);
  g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 0); g.lineTo(18, 0); g.stroke(); g.restore();
}

class Figure {
  constructor(el) {
    this.el = el; this.canvas = el.querySelector('canvas'); this.readout = el.querySelector('.se2-readout'); this.mode = el.dataset.se2Widget;
    this.state = { k: .75, phase: .6, time: 2.8, sheet: 'first', theta: -.9, target: 'nine', radius: 1.45 }; this.cache = {}; this.visible = false; this.playing = false; this.target = { x: -1, y: -2 };
    el.querySelectorAll('[data-control]').forEach(input => input.addEventListener('input', () => {
      const key = input.dataset.control; this.state[key] = input.type === 'range' ? +input.value : input.value;
      if (key === 'target') this.preset(input.value);
      if (key === 'theta') { this.state.target = 'custom'; this.sync('target', 'custom'); }
      this.schedule();
    }));
    el.querySelector('[data-action="critical"]')?.addEventListener('click', () => {
      this.state.k = M.K0; this.state.phase = 1; this.sync('k', M.K0); this.sync('phase', 1); this.schedule();
    });
    el.querySelector('[data-action="reset"]')?.addEventListener('click', () => { this.preset('nine'); this.schedule(); });
    el.querySelector('[data-action="play"]')?.addEventListener('click', () => { this.playing ? this.stop() : this.play(); });
    if (this.mode === 'inverse') this.canvas.addEventListener('click', event => {
      if (!this.inverseScale) return; const r = this.canvas.getBoundingClientRect(), p = this.inverseScale.inverse(event.clientX - r.left, event.clientY - r.top);
      if (!p.every(Number.isFinite) || Math.hypot(...p) > 8) return;
      this.target = { x: p[0], y: p[1] }; this.state.target = 'custom'; this.sync('target', 'custom'); this.schedule();
    });
    new ResizeObserver(() => { if (this.visible) this.schedule(); }).observe(this.canvas);
    new IntersectionObserver(entries => { this.visible = entries[0].isIntersecting; if (this.visible) this.schedule(); else this.stop(); }, { rootMargin: '160px' }).observe(el);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.stop(); });
  }
  sync(key, value) { const input = this.el.querySelector(`[data-control="${key}"]`); if (input) input.value = value; }
  preset(name) {
    this.state.target = name;
    if (name === 'forward') { const q = M.expC2(.3, .75, 1); this.target = q; this.state.theta = q.theta; }
    else if (name === 'ray') { this.state.theta = -.7; this.target = { x: 1.45 * Math.sin(-.35), y: -1.45 * Math.cos(-.35) }; }
    else { this.target = name === 'near' ? { x: -1.25, y: -1.8 } : { x: -1, y: -2 }; this.state.theta = -.9; }
    this.sync('theta', this.state.theta); this.sync('target', name);
  }
  schedule() { cancelAnimationFrame(this.pending); this.pending = requestAnimationFrame(() => this.draw()); }
  async draw() {
    const generation = this.drawGeneration = (this.drawGeneration || 0) + 1;
    if (this.mode === 'ray') {
      try { await rayData(); } catch (error) { this.readout.textContent = `Threshold data unavailable: ${error.message}`; return; }
      if (generation !== this.drawGeneration) return;
    }
    const { g, W, H } = frame(this.canvas); if (W < 80) return;
    this.el.querySelectorAll('[data-value]').forEach(o => { const key = o.dataset.value; o.textContent = f(this.state[key], key === 'k' || key === 'radius' ? 3 : 2); });
    try { await this[this.mode](g, W, H); this.el.dataset.ready = 'true'; }
    catch (error) { this.readout.textContent = `This illustration could not load: ${error.message}. The statement is available in the manuscript.`; this.el.dataset.error = error.message; }
  }
  geodesic(g, W, H) {
    const { k, phase, time } = this.state, K = M.ellipk(k * k), psi = phase * K, key = `${k}/${phase}`;
    if (this.cache.key !== key) {
      const c = M.cellData(k, 2), roots = M.conjugateTimes(psi, k, 6 * K, 2500), points = trajectory({ psi, k, t: 12 * k * K }, 400);
      this.cache = { key, c, roots, points, box: bounds(points) };
    }
    const { roots, points, box, c } = this.cache, s = scale(box, W, H); axes(g, s, W, H); line(g, points, s, C.geo, 1.5, .2);
    const current = points.slice(0, Math.floor(time / 6 * 400) + 1); line(g, current, s, C.geo, 2.5);
    const cut = M.expC2(psi, k, 2 * k * c.p0); dot(g, s, [cut.x, cut.y], C.cut, 5);
    for (const p of roots.filter(p => p <= time * K + 1e-8)) { const q = M.expC2(psi, k, 2 * k * p); dot(g, s, [q.x, q.y], C.conjugate, 4); }
    const q = M.expC2(psi, k, 2 * k * time * K); pose(g, s, q);
    text(g, 'path', W - 125, 20, C.geo); text(g, 'cut', W - 80, 20, C.cut); text(g, 'conjugate', W - 125, 38, C.conjugate);
    this.readout.innerHTML = `<b>t = ${f(2 * k * time * K)}</b> · cut: p/K = ${f(c.p0 / K)} · first conjugate: p/K = ${roots.length ? f(roots[0] / K) : 'unresolved'} · heading θ = ${f(q.theta)}. Driving may reverse; only sideways motion is forbidden.`;
  }
  brackets(g, W, H) {
    const { k, phase } = this.state, key = `${k}/${phase}`;
    if (this.cache.key !== key) {
      const c = M.cellData(k, 1), K = c.K, a = c.cells[0].pn1, b = c.cells[0].pnext, psi = phase * K;
      const points = Array.from({ length: 601 }, (_, i) => { const p = a + (b - a) * i / 600, q = M.coeffs(p, k), r = -q.beta / (q.alpha - q.beta), sn = M.ellipj(psi + p, k * k).sn;
        return { x: p / K, r: r >= -.03 && r <= 1.03 ? r : NaN, sn: sn * sn }; });
      const roots = M.conjugateTimes(psi, k, b - 1e-8, 2800).filter(p => p >= a - 1e-7 && p < b - 1e-8);
      this.cache = { key, c, points, roots, psi };
    }
    const { c, points, roots, psi } = this.cache, K = c.K, cell = c.cells[0], s = scale([cell.pn1 / K, cell.pnext / K, -.07, 1.12], W, H, false);
    for (const [band, color] of [[cell.Bm, C.geo], [cell.Bp, C.conjugate]]) { g.fillStyle = color; g.globalAlpha = .065; g.fillRect(s.x(band[0] / K), s.y(1.12), s.x(band[1] / K) - s.x(band[0] / K), s.y(-.07) - s.y(1.12)); g.globalAlpha = 1; }
    axes(g, s, W, H, 'scaled time p / K', 'phase ratio');
    line(g, points.map(p => [p.x, p.r]), s, C.conjugate, 2); line(g, points.map(p => [p.x, p.sn]), s, C.geo, 2);
    for (const p of roots) { const sn = M.ellipj(psi + p, k * k).sn; dot(g, s, [p / K, sn * sn], C.ink, 5); }
    text(g, 'r(p)', W - 55, 18, C.conjugate); text(g, 'sn²(ψ + p)', W - 155, 18, C.geo);
    this.readout.innerHTML = `<b>${roots.length} distinct intersection${roots.length === 1 ? '' : 's'} detected</b> in the first half-open Maxwell cell. Shaded regions are the two closed brackets. At k₀ and ψ = K their roots coincide at p = 2K; that touch need not change sign.`;
  }
  caustic(g, W, H) {
    const { k, sheet } = this.state, key = `${k}/${sheet}`;
    if (this.cache.key !== key) {
      const K = M.ellipk(k * k), outline = [], fan = [], ordinal = sheet === 'second' ? 1 : 0;
      for (let i = 0; i <= 80; i++) { const psi = 4 * K * i / 80, roots = M.conjugateTimes(psi, k, 4.9 * K, 1300), p = roots[ordinal];
        if (p === undefined) { outline.push(null); continue; } const q = M.expC2(psi, k, 2 * k * p); outline.push([q.x, q.y]);
        if (i % 5 === 0) fan.push(trajectory({ psi, k, t: 2 * k * p }, 110)); }
      this.cache = { key, outline, fan, box: bounds([...outline, ...fan.flat()]) };
    }
    const { outline, fan, box } = this.cache, s = scale(box, W, H); axes(g, s, W, H);
    for (const p of fan) line(g, p, s, C.geo, 1, .17); line(g, outline, s, C.conjugate, 2.4); dot(g, s, [0, 0], C.ink, 3);
    this.readout.innerHTML = `<b>${sheet === 'second' ? 'Second distinct conjugate' : 'First conjugate'} points</b> at fixed k = ${f(k)}. Blue paths meet the orange locus. This is its (x, y) projection; intersections in this picture can have different headings in SE(2).`;
  }
  inverse(g, W, H) {
    const { x, y } = this.target, theta = this.state.theta, key = `${x}/${y}/${theta}`;
    if (this.cache.key !== key) { const sources = M.rotatingSources(x, y, theta, 400, 40); this.cache = { key, sources, paths: sources.map(s => trajectory(s, 180)) }; }
    const { sources, paths } = this.cache, s = scale(bounds([...paths.flat(), [x, y]]), W, H); this.inverseScale = s; axes(g, s, W, H);
    paths.forEach((p, i) => line(g, p, s, i === 0 ? C.geo : C.conjugate, i === 0 ? 2.5 : 1.3, i === 0 ? 1 : .65)); dot(g, s, [0, 0], C.ink, 3); dot(g, s, [x, y], C.cut, 6);
    const heading = { x, y, theta }; pose(g, s, heading);
    const residual = sources.length ? Math.max(...sources.map(s => s.residual)).toExponential(1) : '—';
    this.readout.innerHTML = `<b>${sources.length} rotating source${sources.length === 1 ? '' : 's'} found</b> for (${f(x, 2)}, ${f(y, 2)}, ${f(theta, 2)}) with t ≤ 40. Largest forward residual: ${residual}. ${sources.filter(s => s.seam).length} use the separate seam chart. Click to move the target; all paths share its heading. Browser detection is illustrative and may miss roots near singular thresholds.`;
  }
  async ray(g, W, H) {
    const d = await rayData(), R = this.state.radius, s = scale([0, 1.85, -.6, 15], W, H, false);
    const count = r => (r > d.twoQ ? 1 : 0) + 2 * d.S.filter(v => v < r).length + 2 * d.cusp.filter(v => v < r).length;
    const ts = [d.twoQ, ...d.S, ...d.cusp].filter(t => t < 1.85).sort((a, b) => a - b), pts = [[.001, count(.001)]];
    const close = ts.some(t => Math.abs(R - t) < .0005);
    for (const t of ts) pts.push([t, count(t - 1e-9)], [t, count(t + 1e-9)]); pts.push([1.85, count(1.85)]);
    axes(g, s, W, H, 'radius R', 'rotating source count'); line(g, pts, s, C.geo, 2.5); if (!close) dot(g, s, [R, count(R)], C.conjugate, 6);
    for (const t of d.S.filter(t => t < 1.85)) { g.strokeStyle = C.cut; g.globalAlpha = .4; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(s.x(t), s.y(0)); g.lineTo(s.x(t), s.y(14)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
    this.readout.innerHTML = `<b>${close ? 'Near a threshold: consult the equality formula.' : `${count(R)} rotating sources`}</b>${close ? '' : ' away from thresholds.'} Purple guides mark Sₙ. At Sₙ the seam contributes one source; the graph uses rounded thresholds and its vertical jumps do not display equality values. The full normal fiber also contains winding sources.`;
  }
  play() {
    this.playing = true; const b = this.el.querySelector('[data-action="play"]'); b.textContent = 'Pause'; b.setAttribute('aria-pressed', 'true'); let last;
    const tick = now => { if (!this.playing || !this.visible || document.hidden) return this.stop(); if (last) this.state.time = (this.state.time + Math.min(now - last, 60) / 1800) % 6;
      last = now; this.sync('time', this.state.time); this.draw(); this.animation = requestAnimationFrame(tick); }; this.animation = requestAnimationFrame(tick);
  }
  stop() { this.playing = false; cancelAnimationFrame(this.animation); const b = this.el.querySelector('[data-action="play"]'); if (b) { b.textContent = 'Play geodesic'; b.setAttribute('aria-pressed', 'false'); } }
}
for (const figure of document.querySelectorAll('[data-se2-widget]')) new Figure(figure);
