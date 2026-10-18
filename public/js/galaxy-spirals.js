// Spiral galaxy simulator: a 2D self-gravitating stellar disc (particle-mesh N-body)
// inside a rigid dark halo, with optional tidal companion or imposed density wave.
// Units: G = 1, disc scale length Rd = 1, circular speed at 2.2 Rd ≈ 1.
// Displayed as Rd = 3 kpc and V = 220 km/s, so one time unit = 13.3 Myr.
export const UNITS = {kpc: 3, kms: 220, myr: 3 / 220 * 977.8};

// S4G pitch angles (Díaz-García et al. 2019, n = 391), 2° bins from 4° to 54°.
export const S4G = {start: 4, width: 2,
  counts: [1, 2, 6, 17, 21, 26, 32, 50, 45, 51, 40, 25, 21, 23, 5, 7, 6, 4, 4, 1, 0, 1, 2, 0, 1]};

export const PRESETS = {
  multi:   {label: 'Multi-armed (light disc, heavy halo)', f: .45, Q: 1.1, gravity: true},
  few:     {label: 'Three arms (massive disc)', f: .65, Q: 1.2, gravity: true},
  barred:  {label: 'Barred spiral (cold, disc-dominated)', f: .85, Q: 1.0, gravity: true},
  tidal:   {label: 'Grand design from a passing companion', f: .5, Q: 1.8, gravity: true, companion: .25},
  wave:    {label: 'Density wave (imposed rotating pattern)', f: .5, Q: 0, gravity: false, wave: 20},
  winding: {label: 'Material arms (the winding problem)', f: .5, Q: 0, gravity: false, winding: true},
};

const NG = 128, NP = 256, L = 5.5, H = 2 * L / NG, EPS = 0.08, RMAX = 4.5, RC = 2;
const DT = 0.025, NT = 200, DR = 0.05;              // force table: R = 0..10 in 0.05 steps

function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const gauss = r => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r());

// In-place radix-2 complex FFT of length n (power of two).
function fft(re, im, n, inv) {
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}
const rowRe = new Float64Array(NP), rowIm = new Float64Array(NP);
function fft2(re, im, inv, rows = NP) {
  for (let j = 0; j < rows; j++) fft(re.subarray(j * NP, j * NP + NP), im.subarray(j * NP, j * NP + NP), NP, inv);
  for (let i = 0; i < NP; i++) {
    for (let j = 0; j < NP; j++) { rowRe[j] = re[j * NP + i]; rowIm[j] = im[j * NP + i]; }
    fft(rowRe, rowIm, NP, inv);
    for (let j = 0; j < NP; j++) { re[j * NP + i] = rowRe[j]; im[j * NP + i] = rowIm[j]; }
  }
}

// FFT of the softened 2D Green's function on the zero-padded grid (isolated boundaries).
let kernel = null;
function greens() {
  if (kernel) return kernel;
  const re = new Float64Array(NP * NP), im = new Float64Array(NP * NP);
  for (let j = 0; j < NP; j++) for (let i = 0; i < NP; i++) {
    const dx = (i < NP / 2 ? i : i - NP) * H, dy = (j < NP / 2 ? j : j - NP) * H;
    re[j * NP + i] = -1 / Math.sqrt(dx * dx + dy * dy + EPS * EPS);
  }
  fft2(re, im, false);
  return (kernel = {re, im});
}

const haloV0sq = f => (1 - f) * (2.2 ** 2 + RC ** 2) / 2.2 ** 2;
const haloAcc = (s, R2) => -s.v0sq / (R2 + RC * RC);   // times x or y

function gridForces(s) {
  const {re, im, ax, ay, x, y, n, m} = s, k = greens();
  re.fill(0); im.fill(0);
  for (let p = 0; p < n; p++) {
    const gx = (x[p] + L) / H - .5, gy = (y[p] + L) / H - .5;
    const i = Math.floor(gx), j = Math.floor(gy);
    if (i < 0 || j < 0 || i >= NG - 1 || j >= NG - 1) continue;
    const fx = gx - i, fy = gy - j, o = j * NP + i;
    re[o] += m * (1 - fx) * (1 - fy); re[o + 1] += m * fx * (1 - fy);
    re[o + NP] += m * (1 - fx) * fy; re[o + NP + 1] += m * fx * fy;
  }
  fft2(re, im, false, NG);                      // rows above NG are empty
  for (let q = 0; q < NP * NP; q++) {
    const a = re[q], b = im[q];
    re[q] = a * k.re[q] - b * k.im[q]; im[q] = a * k.im[q] + b * k.re[q];
  }
  fft2(re, im, true);
  const norm = 1 / (NP * NP);
  for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
    const c = j * NP + i, g = j * NG + i;
    const l = i > 0 ? re[c - 1] : re[c], r = i < NG - 1 ? re[c + 1] : re[c];
    const d = j > 0 ? re[c - NP] : re[c], u = j < NG - 1 ? re[c + NP] : re[c];
    ax[g] = -(r - l) * norm / (2 * H); ay[g] = -(u - d) * norm / (2 * H);
  }
}

function sampleGrid(s, px, py) {
  const gx = (px + L) / H - .5, gy = (py + L) / H - .5;
  const i = Math.floor(gx), j = Math.floor(gy);
  if (i < 0 || j < 0 || i >= NG - 1 || j >= NG - 1) {
    const r2 = px * px + py * py, f = -s.md / (r2 * Math.sqrt(r2));
    return [f * px, f * py];
  }
  const fx = gx - i, fy = gy - j, o = j * NG + i;
  const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
  return [s.ax[o] * w00 + s.ax[o + 1] * w10 + s.ax[o + NG] * w01 + s.ax[o + NG + 1] * w11,
          s.ay[o] * w00 + s.ay[o + 1] * w10 + s.ay[o + NG] * w01 + s.ay[o + NG + 1] * w11];
}

const interp = (tab, R) => {
  const u = Math.min(R / DR, NT - 1.001), i = Math.floor(u), f = u - i;
  return tab[i] * (1 - f) + tab[i + 1] * f;
};

function spiralPotential(s, px, py) {            // trailing log spiral, rotating at Ωp
  const R = Math.hypot(px, py) + 1e-6, th = Math.atan2(py, px);
  const env = R * R / (1 + R * R) * Math.exp(-((R / 5) ** 4));
  return -s.waveAmp * env * Math.cos(2 * (th - s.omegaP * s.t) + 2 * Math.log(R) / s.tanP);
}

function accelerate(s) {
  const {x, y, gxs, gys, n} = s;
  if (s.gravity) gridForces(s);
  const c = s.comp, d = 1e-3;
  let cax = 0, cay = 0;
  if (c) {                                        // indirect term: the host centre is held fixed
    const r2 = c.x * c.x + c.y * c.y + c.eps2, f = c.m / (r2 * Math.sqrt(r2));
    cax = f * c.x; cay = f * c.y;
  }
  for (let p = 0; p < n; p++) {
    const px = x[p], py = y[p], R2 = px * px + py * py, R = Math.sqrt(R2) + 1e-9;
    let fx, fy;
    if (s.gravity) [fx, fy] = sampleGrid(s, px, py);
    else { const a = -interp(s.fdisc, R) / R; fx = a * px; fy = a * py; }
    const h = haloAcc(s, R2);
    fx += h * px; fy += h * py;
    if (c) {
      const dx = px - c.x, dy = py - c.y, r2 = dx * dx + dy * dy + c.eps2, f = -c.m / (r2 * Math.sqrt(r2));
      fx += f * dx - cax; fy += f * dy - cay;
    }
    if (s.waveAmp) {
      fx -= (spiralPotential(s, px + d, py) - spiralPotential(s, px - d, py)) / (2 * d);
      fy -= (spiralPotential(s, px, py + d) - spiralPotential(s, px, py - d)) / (2 * d);
    }
    gxs[p] = fx; gys[p] = fy;
  }
}

function hostAcc(s, px, py) {                     // axisymmetric host force on the companion
  const R2 = px * px + py * py, R = Math.sqrt(R2), a = -interp(s.fdisc, R) / R + haloAcc(s, R2);
  return [a * px, a * py];
}

export function createSim(opts) {
  const o = {f: .5, Q: 1.3, n: 40000, seed: 1, gravity: true, ...opts};
  const r = prng(o.seed), n = o.n;
  const md = o.f / 0.4738;                       // exponential disc: V_d²(2.2 Rd) = 0.4738 G Md / Rd
  const s = {
    n, md, m: md / n, t: 0, f: o.f, Q: o.Q, gravity: o.gravity, v0sq: haloV0sq(o.f),
    x: new Float64Array(n), y: new Float64Array(n), vx: new Float64Array(n), vy: new Float64Array(n),
    gxs: new Float64Array(n), gys: new Float64Array(n), tag: new Uint8Array(n),
    re: new Float64Array(NP * NP), im: new Float64Array(NP * NP),
    ax: new Float64Array(NG * NG), ay: new Float64Array(NG * NG),
    fdisc: new Float64Array(NT), waveAmp: 0, comp: null,
  };
  for (let p = 0; p < n; p++) {
    let R;
    do R = -Math.log((r() || 1e-12) * (r() || 1e-12)); while (R > RMAX);  // Σ ∝ exp(-R)
    const th = 2 * Math.PI * r();
    s.x[p] = R * Math.cos(th); s.y[p] = R * Math.sin(th);
  }
  // Axisymmetric disc force from the particle grid, averaged over 32 directions.
  gridForces(s);
  for (let i = 1; i < NT; i++) {
    const R = i * DR;
    let acc = 0;
    for (let k = 0; k < 32; k++) {
      const a = 2 * Math.PI * k / 32, [fx, fy] = sampleGrid(s, R * Math.cos(a), R * Math.sin(a));
      acc += -(fx * Math.cos(a) + fy * Math.sin(a));
    }
    s.fdisc[i] = acc / 32;
  }
  const T = table(s);
  s.T = T;
  const cold = !o.Q;
  for (let p = 0; p < n; p++) {
    const R = Math.hypot(s.x[p], s.y[p]), th = Math.atan2(s.y[p], s.x[p]);
    const vc2 = interp(T.vc2, R), k = Math.sqrt(Math.max(interp(T.k2, R), 1e-6));
    const om = Math.sqrt(Math.max(vc2, 1e-9)) / Math.max(R, 1e-3);
    let sR = cold ? (o.wave ? .08 : .015) * Math.sqrt(vc2)
                  : o.Q * 3.36 * (md / (2 * Math.PI)) * Math.exp(-R) / k;
    sR = Math.min(sR, .5 * Math.sqrt(vc2) + .05);
    const dlog = cold ? 0 : interp(T.dlnSs2, R);
    const vphi = Math.sqrt(Math.max(vc2 + sR * sR * (1 - k * k / (4 * om * om) + dlog), 0));
    const vr = sR * gauss(r), vp = vphi + sR * k / (2 * om) * gauss(r);
    s.vx[p] = vr * Math.cos(th) - vp * Math.sin(th);
    s.vy[p] = vr * Math.sin(th) + vp * Math.cos(th);
    if (o.winding && (Math.abs(Math.sin(th)) < .035 && R > .3)) s.tag[p] = 1;
  }
  if (o.wave) {
    s.waveAmp = .045; s.tanP = Math.tan(o.wave * Math.PI / 180);
    s.omegaP = Math.sqrt(interp(T.vc2, 4)) / 4;   // corotation at 4 Rd = 12 kpc
  }
  if (o.companion) {                             // prograde fly-by, pericentre ≈ 6 Rd
    const M45 = interp(T.vc2, RMAX) * RMAX;
    s.comp = {m: o.companion * M45, eps2: .25, x: 14, y: -9, vx: -.33, vy: .93};
  }
  accelerate(s);
  return s;
}

function table(s) {
  const vc2 = new Float64Array(NT), k2 = new Float64Array(NT), om2 = new Float64Array(NT);
  const dlnSs2 = new Float64Array(NT), vd2 = new Float64Array(NT), vh2 = new Float64Array(NT);
  for (let i = 1; i < NT; i++) {
    const R = i * DR;
    vd2[i] = s.fdisc[i] * R; vh2[i] = s.v0sq * R * R / (R * R + RC * RC);
    vc2[i] = vd2[i] + vh2[i]; om2[i] = vc2[i] / (R * R);
  }
  vc2[0] = 0; om2[0] = om2[1];
  for (let i = 1; i < NT - 1; i++) {
    const R = i * DR;
    k2[i] = R * (om2[i + 1] - om2[i - 1]) / (2 * DR) + 4 * om2[i];
  }
  k2[0] = k2[1]; k2[NT - 1] = k2[NT - 2];
  const ss2 = new Float64Array(NT);
  for (let i = 1; i < NT; i++) {
    const R = i * DR, sR = s.Q * 3.36 * (s.md / (2 * Math.PI)) * Math.exp(-R) / Math.sqrt(Math.max(k2[i], 1e-6));
    ss2[i] = Math.log(Math.exp(-R) * sR * sR + 1e-30);
  }
  for (let i = 1; i < NT - 1; i++) dlnSs2[i] = i * DR * (ss2[i + 1] - ss2[i - 1]) / (2 * DR);
  return {vc2, k2, om2, dlnSs2, vd2, vh2};
}

export function step(s) {                         // kick-drift-kick leapfrog
  const {x, y, vx, vy, gxs, gys, n} = s, h = DT / 2;
  for (let p = 0; p < n; p++) { vx[p] += h * gxs[p]; vy[p] += h * gys[p]; x[p] += DT * vx[p]; y[p] += DT * vy[p]; }
  const c = s.comp;
  if (c) {
    let [ax, ay] = hostAcc(s, c.x, c.y);
    c.vx += h * ax; c.vy += h * ay; c.x += DT * c.vx; c.y += DT * c.vy;
    [ax, ay] = hostAcc(s, c.x, c.y);
    c.vx += h * ax; c.vy += h * ay;
  }
  s.t += DT;
  accelerate(s);
  for (let p = 0; p < n; p++) { vx[p] += h * gxs[p]; vy[p] += h * gys[p]; }
}

// Swing-amplification predictions at 2.2 Rd, from the initial disc.
export function predictions(s) {
  const R = 2.2, k2 = interp(s.T.k2, R), om2 = interp(s.T.om2, R);
  const sigma = s.md / (2 * Math.PI) * Math.exp(-R);
  const gamma = 2 - k2 / (2 * om2);
  return {
    gamma, k2, sigma,
    mSwing: k2 * R / (2 * Math.PI * sigma * 2),                     // X = 2 (Dobbs & Baba 2014)
    pitchMK: Math.atan(2 / 7 * Math.sqrt(4 - 2 * gamma) / gamma) * 180 / Math.PI,  // Michikoshi & Kokubo 2014
    period: 2 * Math.PI / Math.sqrt(om2),
  };
}

// 2D Fourier decomposition in (ln R, θ), the method used on galaxy images
// (Puerari & Dottori 1992): A(m, p) = Σ exp(-i(mθ + p ln R)) / N, 1.2 ≤ R ≤ 4.
export function measure(s, onlyTagged = false) {
  const idx = [];
  for (let p = 0; p < s.n && idx.length < 7000; p += onlyTagged ? 1 : Math.max(1, Math.floor(s.n / 7000))) {
    const R = Math.hypot(s.x[p], s.y[p]);
    if (R >= 1.2 && R <= 4 && (!onlyTagged || s.tag[p])) idx.push(p);
  }
  const N = idx.length, P0 = -30, NPITCH = 241, dp = .25;
  if (N < 50) return null;
  const re = new Float64Array(5 * NPITCH), im = new Float64Array(5 * NPITCH);
  const cp = new Float64Array(NPITCH), sp = new Float64Array(NPITCH);
  for (const p of idx) {
    const u = Math.log(Math.hypot(s.x[p], s.y[p])), th = Math.atan2(s.y[p], s.x[p]);
    let c = Math.cos(P0 * u), sn = Math.sin(P0 * u);
    const cd = Math.cos(dp * u), sd = Math.sin(dp * u);
    for (let q = 0; q < NPITCH; q++) { cp[q] = c; sp[q] = sn; const nc = c * cd - sn * sd; sn = sn * cd + c * sd; c = nc; }
    for (let m = 2; m <= 6; m++) {
      const cm = Math.cos(m * th), sm = Math.sin(m * th), o = (m - 2) * NPITCH;
      for (let q = 0; q < NPITCH; q++) { re[o + q] += cm * cp[q] - sm * sp[q]; im[o + q] += sm * cp[q] + cm * sp[q]; }
    }
  }
  let best = {amp: 0};
  for (let m = 2; m <= 6; m++) for (let q = 0; q < NPITCH; q++) {
    const amp = Math.hypot(re[(m - 2) * NPITCH + q], im[(m - 2) * NPITCH + q]) / N;
    if (amp > best.amp) best = {amp, m, p: P0 + q * dp};
  }
  // Arms where mθ + p ln R = const; trailing (outer arm lags the counter-clockwise rotation) for p > 0.
  return {...best, noise: 4 / Math.sqrt(N), n: N, trailing: best.p > 0,
          pitch: Math.atan(best.m / Math.max(Math.abs(best.p), 1e-6)) * 180 / Math.PI};
}

const blurTmp = new Float32Array(220 * 220);
function blur(a, n) {                             // 1-2-1 kernel along rows, then columns
  const t = blurTmp;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const q = j * n + i;
    t[q] = .5 * a[q] + .25 * (a[i > 0 ? q - 1 : q] + a[i < n - 1 ? q + 1 : q]);
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const q = j * n + i;
    a[q] = .5 * t[q] + .25 * (t[j > 0 ? q - n : q] + t[j < n - 1 ? q + n : q]);
  }
}

// ── page widget ──────────────────────────────────────────────────────────────
function mount(root) {
  const $ = q => root.querySelector(q), ctl = id => $(`[data-control="${id}"]`);
  const view = $('canvas[data-view]'), rc = $('canvas[data-rc]'), hist = $('canvas[data-hist]');
  const out = $('[data-readout]'), status = $('[data-status]');
  const ctx = view.getContext('2d');
  let sim, preset, seed = 1, playing = true, frame = 0, meas = null, visible = true, img, dens;

  const S = 220;                                 // density grid; CSS upscales it smoothly
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  off.width = off.height = S;
  img = octx.createImageData(S, S); dens = new Float32Array(S * S);

  function restart() {
    preset = PRESETS[ctl('type').value];
    root.dataset.mode = ctl('type').value;
    const f = +ctl('f').value, Q = +ctl('Q').value;
    sim = createSim({f, Q: preset.gravity ? Q : 0, n: +ctl('n').value, seed, gravity: preset.gravity,
                     wave: preset.wave ? +ctl('pitch').value : 0, winding: preset.winding,
                     companion: preset.companion ? +ctl('mc').value : 0});
    meas = null; frame = 0;
    drawRC(); draw(); readout();
  }
  function applyPreset() {
    const p = PRESETS[ctl('type').value];
    ctl('f').value = p.f; if (p.Q) ctl('Q').value = p.Q;
    if (p.companion) ctl('mc').value = p.companion;
    if (p.wave) ctl('pitch').value = p.wave;
    syncLabels(); restart();
  }
  function syncLabels() {
    for (const el of root.querySelectorAll('output[data-for]')) {
      const v = +ctl(el.dataset.for).value;
      el.textContent = el.dataset.for === 'pitch' ? v + '°' : el.dataset.for === 'f' ? Math.round(v * 100) + '%' : v.toFixed(2);
    }
  }
  const theme = () => document.documentElement.dataset.theme === 'dark';

  function draw() {
    const dark = theme(), R = 5.2, sc = S / (2 * R);
    dens.fill(0);
    const tagged = [];
    for (let p = 0; p < sim.n; p++) {
      const i = Math.floor((sim.x[p] + R) * sc), j = Math.floor((R - sim.y[p]) * sc);
      if (i < 0 || j < 0 || i >= S || j >= S) continue;
      if (sim.tag[p]) tagged.push(p); else dens[j * S + i] += 1;
    }
    blur(dens, S);
    let mx = 0;
    for (let q = 0; q < dens.length; q++) if (dens[q] > mx) mx = dens[q];
    const k = 1.5 / Math.max(1, sim.n / 40000), lm = Math.log(1 + k * mx * .5), d = img.data;
    for (let q = 0; q < dens.length; q++) {
      const v = Math.min(1, Math.log(1 + k * dens[q]) / lm), o = 4 * q;
      if (dark) { d[o] = 255 * Math.min(1, v * 1.1); d[o + 1] = 235 * v ** 1.15; d[o + 2] = 200 * v ** 1.6 + 30 * v; }
      else { const w = v ** .75; d[o] = 255 - 240 * w; d[o + 1] = 255 - 205 * w; d[o + 2] = 255 - 115 * w; }
      d[o + 3] = dark ? 255 : 255;
    }
    // Density on a coarse grid, smoothed up to the screen; overlays drawn at screen resolution.
    octx.putImageData(img, 0, 0);
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(Math.max(240, view.getBoundingClientRect().width) * dpr);
    if (view.width !== W) view.width = view.height = W;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, W, W);
    const u = W / (2 * R);                          // pixels per disc scale length
    ctx.fillStyle = '#e65100';                      // painted material arms, drawn crisp on top
    for (const p of tagged) ctx.fillRect((sim.x[p] + R) * u - dpr, (R - sim.y[p]) * u - dpr, 2 * dpr, 2 * dpr);
    if (sim.comp) {
      const cx = (sim.comp.x + R) * u, cy = (R - sim.comp.y) * u, e = 7 * dpr;
      ctx.fillStyle = '#e65100';
      ctx.beginPath(); ctx.arc(Math.max(e, Math.min(W - e, cx)), Math.max(e, Math.min(W - e, cy)), 5 * dpr, 0, 7); ctx.fill();
    }
    if (sim.waveAmp) {                             // resonances of the imposed m = 2 pattern
      ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.lineWidth = dpr;
      ctx.strokeStyle = dark ? 'rgba(120,180,255,.7)' : 'rgba(21,101,192,.7)';
      for (const r of resonances(sim)) { ctx.beginPath(); ctx.arc(W / 2, W / 2, r * u, 0, 7); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    ctx.fillStyle = dark ? '#ddd' : '#333'; ctx.font = `${12 * dpr}px sans-serif`;
    ctx.fillText('10 kpc', 10 * dpr, W - 16 * dpr);
    ctx.fillRect(10 * dpr, W - 10 * dpr, 10 / UNITS.kpc * u, 2 * dpr);
  }

  function resonances(s) {
    const res = [];
    for (const sign of [-1, 0, 1]) {
      for (let i = 2; i < NT - 1; i++) {
        const R = i * DR, om = Math.sqrt(s.T.om2[i]), kk = Math.sqrt(Math.max(s.T.k2[i], 0));
        const R2 = (i + 1) * DR, om2 = Math.sqrt(s.T.om2[i + 1]), k2 = Math.sqrt(Math.max(s.T.k2[i + 1], 0));
        const g1 = om + sign * kk / 2 - s.omegaP, g2 = om2 + sign * k2 / 2 - s.omegaP;
        if (g1 * g2 <= 0 && R < 5.2) { res.push(R); break; }
      }
    }
    return res;
  }

  function axes(c, w, h, pad, xlab, ylab, dark) {
    c.strokeStyle = c.fillStyle = dark ? '#bbb' : '#444'; c.lineWidth = 1; c.font = '11px sans-serif';
    c.beginPath(); c.moveTo(pad.l, pad.t); c.lineTo(pad.l, h - pad.b); c.lineTo(w - pad.r, h - pad.b); c.stroke();
    c.textAlign = 'center'; c.fillText(xlab, (pad.l + w - pad.r) / 2, h - 4);
    c.save(); c.translate(11, (pad.t + h - pad.b) / 2); c.rotate(-Math.PI / 2); c.fillText(ylab, 0, 0); c.restore();
  }
  function fit(c) {
    const w = Math.max(240, c.getBoundingClientRect().width), dpr = Math.min(window.devicePixelRatio || 1, 2), h = Math.round(w * .62);
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return [g, w, h];
  }
  function drawRC() {
    const [c, w, h] = fit(rc), dark = theme(), pad = {l: 40, r: 10, t: 10, b: 30};
    axes(c, w, h, pad, 'radius (kpc)', 'speed (km/s)', dark);
    const X = R => pad.l + R / 6 * (w - pad.l - pad.r), Y = v => h - pad.b - v / 300 * (h - pad.t - pad.b);
    c.textAlign = 'right';
    for (const v of [100, 200, 300]) c.fillText(v, pad.l - 3, Y(v) + 4);
    c.textAlign = 'center';
    for (const r of [5, 10, 15]) c.fillText(r, X(r / UNITS.kpc), h - pad.b + 13);
    const lines = [[sim.T.vc2, dark ? '#eee' : '#111', 'total'], [sim.T.vd2, '#e65100', 'stellar disc'], [sim.T.vh2, '#1565c0', 'dark halo']];
    lines.forEach(([tab, col, lab], k) => {
      c.strokeStyle = c.fillStyle = col; c.lineWidth = 2; c.beginPath();
      for (let i = 1; i < 120; i++) { const R = i * DR, v = Math.sqrt(Math.max(tab[i], 0)) * UNITS.kms; i === 1 ? c.moveTo(X(R), Y(v)) : c.lineTo(X(R), Y(v)); }
      c.stroke(); c.textAlign = 'left'; c.fillText(lab, w - pad.r - 80, Y(85) + 13 * k);   // legend in the empty lower right
    });
    c.setLineDash([3, 3]); c.strokeStyle = dark ? '#888' : '#999'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(X(2.2), pad.t); c.lineTo(X(2.2), h - pad.b); c.stroke(); c.setLineDash([]);
  }
  function drawHist() {
    const [c, w, h] = fit(hist), dark = theme(), pad = {l: 40, r: 10, t: 10, b: 30};
    axes(c, w, h, pad, 'pitch angle (degrees)', 'galaxies', dark);
    const X = p => pad.l + (p - 0) / 56 * (w - pad.l - pad.r), Y = n => h - pad.b - n / 55 * (h - pad.t - pad.b);
    c.textAlign = 'center';
    for (const p of [10, 20, 30, 40, 50]) c.fillText(p, X(p), h - pad.b + 13);
    c.textAlign = 'right';
    for (const n of [25, 50]) c.fillText(n, pad.l - 3, Y(n) + 4);
    c.fillStyle = 'rgba(46,125,50,.35)'; c.fillRect(X(12), pad.t, X(13) - X(12), h - pad.b - pad.t);
    c.fillStyle = dark ? '#6f7f88' : '#b0bec5';
    S4G.counts.forEach((n, i) => { const a = S4G.start + i * S4G.width; c.fillRect(X(a) + .5, Y(n), X(a + 2) - X(a) - 1, h - pad.b - Y(n)); });
    const pr = predictions(sim);
    if (preset.gravity) {
      c.strokeStyle = '#1565c0'; c.setLineDash([4, 3]); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(X(pr.pitchMK), pad.t); c.lineTo(X(pr.pitchMK), h - pad.b); c.stroke(); c.setLineDash([]);
    }
    if (meas && meas.amp > meas.noise) {
      c.strokeStyle = '#e65100'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(X(meas.pitch), pad.t); c.lineTo(X(meas.pitch), h - pad.b); c.stroke();
    }
  }

  function readout() {
    const pr = predictions(sim), t = sim.t * UNITS.myr, turns = sim.t / pr.period;
    const lines = [`<b>${Math.round(t)} Myr</b> · ${turns.toFixed(1)} rotations at 6.6 kpc (2.2 R<sub>d</sub>)`];
    if (preset.gravity) lines.push(`Swing amplification predicts <b>m ≈ ${pr.mSwing.toFixed(1)}</b> arms and pitch <b>${pr.pitchMK.toFixed(0)}°</b> (shear Γ = ${pr.gamma.toFixed(2)}).`);
    if (preset.winding) {
      const dOm = (Math.sqrt(interp(sim.T.om2, 2.3)) - Math.sqrt(interp(sim.T.om2, 2.1))) / .2;
      const cot = 2.2 * Math.abs(dOm) * sim.t;
      lines.push(`A material arm should have pitch <b>${(Math.atan(1 / Math.max(cot, 1e-6)) * 180 / Math.PI).toFixed(0)}°</b> at 6.6 kpc now (cot P = R|dΩ/dR|t).`);
    }
    if (meas && meas.amp > meas.noise) lines.push(`Measured: <b>m = ${meas.m}</b>, pitch <b>${meas.pitch.toFixed(0)}°</b> ${meas.trailing ? 'trailing' : 'leading'}, amplitude ${(meas.amp * 100).toFixed(0)}% (noise ${(meas.noise * 100).toFixed(0)}%).`);
    else lines.push('Measured: no single spiral pattern above the noise.');
    out.innerHTML = lines.join('<br>');
    drawHist();
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!playing || !visible || !sim) return;
    const t0 = performance.now(), steps = +ctl('speed').value;
    for (let k = 0; k < steps && performance.now() - t0 < 40; k++) step(sim);
    if (++frame % 12 === 0) { meas = measure(sim, preset.winding); readout(); }
    draw();
    if (sim.t * UNITS.myr > 3000) { playing = false; status.textContent = 'Paused at 3 Gyr. Restart or change the galaxy.'; ctl('play').textContent = 'Play'; }
  }

  ctl('type').addEventListener('change', applyPreset);
  for (const id of ['f', 'Q', 'n', 'mc', 'pitch']) ctl(id).addEventListener('change', () => { syncLabels(); restart(); });
  for (const id of ['f', 'Q', 'mc', 'pitch']) ctl(id).addEventListener('input', syncLabels);
  ctl('play').addEventListener('click', () => { playing = !playing; ctl('play').textContent = playing ? 'Pause' : 'Play'; status.textContent = ''; });
  ctl('restart').addEventListener('click', () => { playing = true; ctl('play').textContent = 'Pause'; status.textContent = ''; restart(); });
  ctl('seed').addEventListener('click', () => { seed++; playing = true; ctl('play').textContent = 'Pause'; restart(); });
  window.addEventListener('themechange', () => { drawRC(); drawHist(); draw(); });
  window.addEventListener('resize', () => { drawRC(); drawHist(); });
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(root);
  if (matchMedia('(max-width: 640px)').matches) ctl('n').value = '20000';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { playing = false; ctl('play').textContent = 'Play'; }
  applyPreset();
  requestAnimationFrame(loop);
}

if (typeof document !== 'undefined') document.querySelectorAll('[data-galaxy-sim]').forEach(mount);
