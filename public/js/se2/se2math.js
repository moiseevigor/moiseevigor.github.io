// Numerics for the SE(2) conjugate-locus explorer.  Plain ES module, no dependencies.
// Conventions follow the manuscripts: modulus k, parameter m = k^2, p = t/(2k), tau = psi + p.
// Jacobi functions by the arithmetic-geometric mean (Abramowitz-Stegun 16.4) with a
// continuous amplitude; incomplete integrals by Carlson's R_F and R_D.

const PI = Math.PI;

// ---------------------------------------------------------------- Carlson symmetric integrals
export function rf(x, y, z) {
  let A = (x + y + z) / 3, X = x, Y = y, Z = z, f = 1;
  const A0 = A, Q = 390 * Math.max(Math.abs(A - x), Math.abs(A - y), Math.abs(A - z));
  while (f * Q > Math.abs(A)) {
    const sx = Math.sqrt(X), sy = Math.sqrt(Y), sz = Math.sqrt(Z), l = sx * sy + sy * sz + sz * sx;
    X = (X + l) / 4; Y = (Y + l) / 4; Z = (Z + l) / 4; A = (A + l) / 4; f /= 4;
  }
  const dx = (A0 - x) * f / A, dy = (A0 - y) * f / A, dz = -(dx + dy);
  const E2 = dx * dy - dz * dz, E3 = dx * dy * dz;
  return (1 - E2 / 10 + E3 / 14 + E2 * E2 / 24 - 3 * E2 * E3 / 44) / Math.sqrt(A);
}

export function rd(x, y, z) {
  let A = (x + y + 3 * z) / 5, X = x, Y = y, Z = z, f = 1, sum = 0;
  const A0 = A, Q = 490 * Math.max(Math.abs(A - x), Math.abs(A - y), Math.abs(A - z));
  while (f * Q > Math.abs(A)) {
    const sx = Math.sqrt(X), sy = Math.sqrt(Y), sz = Math.sqrt(Z), l = sx * sy + sy * sz + sz * sx;
    sum += f / (sz * (Z + l));
    X = (X + l) / 4; Y = (Y + l) / 4; Z = (Z + l) / 4; A = (A + l) / 4; f /= 4;
  }
  const dx = (A0 - x) * f / A, dy = (A0 - y) * f / A, dz = -(dx + dy) / 3;
  const E2 = dx * dy - 6 * dz * dz, E3 = (3 * dx * dy - 8 * dz * dz) * dz, E4 = 3 * (dx * dy - dz * dz) * dz * dz, E5 = dx * dy * dz * dz * dz;
  return 3 * sum + f * (1 - 3 * E2 / 14 + E3 / 6 + 9 * E2 * E2 / 88 - 3 * E4 / 22 - 9 * E2 * E3 / 52 + 3 * E5 / 26) / (A * Math.sqrt(A));
}

// ---------------------------------------------------------------- complete integrals (AGM)
export function ellipk(m) {
  if (m >= 1) return Infinity;
  let a = 1, b = Math.sqrt(1 - m);
  for (let i = 0; i < 40 && Math.abs(a - b) > 4e-16 * a; i++) { const t = (a + b) / 2; b = Math.sqrt(a * b); a = t; }
  return PI / (2 * a);
}

export function ellipe(m) {
  if (m >= 1) return 1;
  let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m), sum = c * c / 2, pow = 1;
  for (let i = 0; i < 40 && Math.abs(c) > 1e-17; i++) {
    const t = (a + b) / 2; c = (a - b) / 2; b = Math.sqrt(a * b); a = t; pow *= 2; sum += pow * c * c / 2;
  }
  return (PI / (2 * a)) * (1 - sum);
}

// ---------------------------------------------------------------- incomplete integrals, any phi
function reducePhi(phi) {
  const n = Math.round(phi / PI);
  return [phi - n * PI, n];
}
export function ellipf(phi, m) {           // F(phi|m), continuous in phi
  const [r, n] = reducePhi(phi);
  const s = Math.sin(r), c = Math.cos(r);
  const F = s * rf(c * c, 1 - m * s * s, 1);
  return F + 2 * n * ellipk(m);
}
export function ellipeinc(phi, m) {        // E(phi|m), continuous in phi
  const [r, n] = reducePhi(phi);
  const s = Math.sin(r), c = Math.cos(r), q = 1 - m * s * s;
  const E = s * rf(c * c, q, 1) - (m / 3) * s * s * s * rd(c * c, q, 1);
  return E + 2 * n * ellipe(m);
}

// ---------------------------------------------------------------- Jacobi functions (AGM, continuous amplitude)
export function ellipj(u, m) {
  if (m < 1e-12) return { sn: Math.sin(u), cn: Math.cos(u), dn: 1, am: u };
  if (m > 1 - 1e-12) { const t = Math.tanh(u); return { sn: t, cn: 1 / Math.cosh(u), dn: 1 / Math.cosh(u), am: Math.atan(Math.sinh(u)) }; }
  const a = [1], b = [Math.sqrt(1 - m)], c = [Math.sqrt(m)];
  let n = 0;
  while (Math.abs(c[n]) > 1e-16 && n < 30) {
    a.push((a[n] + b[n]) / 2); b.push(Math.sqrt(a[n] * b[n])); c.push((a[n] - b[n]) / 2); n++;
  }
  let phi = Math.pow(2, n) * a[n] * u;
  for (let i = n; i > 0; i--) phi = (phi + Math.asin(c[i] / a[i] * Math.sin(phi))) / 2;
  const sn = Math.sin(phi), cn = Math.cos(phi);
  return { sn, cn, dn: Math.sqrt(1 - m * sn * sn), am: phi };
}
export function epsilon(u, m) { return ellipeinc(ellipj(u, m).am, m); }   // Jacobi's epsilon E(am u|m)

// ---------------------------------------------------------------- paper A: coefficients, J2, roots
export function coeffs(p, k) {
  const m = k * k, j = ellipj(p, m), e = ellipeinc(j.am, m);
  const s = j.sn, c = j.cn, d = j.dn;
  const f1 = c * (e - p) - d * s;
  const beta1 = c * e - d * s;
  const alpha1 = c * d * (p - 2 * e) + s * (d * d + e * (p - e));
  return { s, c, d, e, f1, beta1, alpha1, alpha: (1 - m) * s * alpha1, beta: f1 * beta1 };
}
export function j2(tau, p, k) {
  const q = coeffs(p, k), t = ellipj(tau, k * k);
  return q.alpha * t.sn * t.sn + q.beta * t.cn * t.cn;
}
export function j2geo(psi, p, k) { return j2(psi + p, p, k); }

export function bisect(f, lo, hi, iters = 80) {
  let flo = f(lo);
  if (flo === 0) return lo;
  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (fm === 0) return mid;
    if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else hi = mid;
  }
  return (lo + hi) / 2;
}
// Maxwell times p_n^1 (zeros of f1 in ((2n-1)K, 2nK)), b_n (beta1 in (2nK,(2n+1)K)), p_n^alpha.
export function cellData(k, ncell) {
  const K = ellipk(k * k), pn1 = [];
  for (let n = 1; n <= ncell + 1; n++) pn1.push(bisect(p => coeffs(p, k).f1, (2 * n - 1) * K + 1e-9, 2 * n * K - 1e-9));
  const cells = [];
  for (let n = 1; n <= ncell; n++) {
    const bn = bisect(p => coeffs(p, k).beta1, 2 * n * K + 1e-9, (2 * n + 1) * K - 1e-9);
    const pa = bisect(p => coeffs(p, k).alpha1, pn1[n - 1], bn);
    cells.push({ n, pn1: pn1[n - 1], pnext: pn1[n], bn, pa,
      Bm: [pn1[n - 1], Math.min(2 * n * K, pa)], Bp: [Math.max(2 * n * K, pa), bn] });
  }
  return { K, E: ellipe(k * k), cells, p0: pn1[0], p1: Math.min(2 * K, cells[0].pa) };
}
// All zeros of J2 along the geodesic tau = psi + p on (0, pmax]: sign changes (simple or odd-order
// zeros) plus touches (even-order zeros, e.g. the coalesced root p = 2nK at k = k0, psi = K), found
// as local minima of |J2| without a sign change that refine to |J2| below 1e-10 of the local scale.
export function conjugateTimes(psi, k, pmax, ngrid = 4000) {
  const f = q => j2geo(psi, q, k), out = [], vals = [];
  for (let i = 1; i <= ngrid; i++) vals.push([i * pmax / ngrid, f(i * pmax / ngrid)]);
  let scale = 0; for (const [, v] of vals) scale = Math.max(scale, Math.abs(v));
  for (let i = 0; i < vals.length - 1; i++) {
    const [p0, f0] = vals[i], [p1, f1] = vals[i + 1];
    if (f0 === 0) out.push({ p: p0, touch: false });
    else if (f0 * f1 < 0) out.push({ p: bisect(f, p0, p1), touch: false });
    else if (i > 0 && vals[i - 1][1] * f0 > 0 && f0 * f1 > 0 && Math.abs(f0) < Math.abs(vals[i - 1][1]) && Math.abs(f0) <= Math.abs(f1) && Math.abs(f0) < 1e-4 * scale) {
      // local minimum of |J2| without sign change: refine by ternary search on |J2|
      let lo = vals[i - 1][0], hi = p1;
      for (let it = 0; it < 100; it++) { const a = lo + (hi - lo) / 3, b = hi - (hi - lo) / 3; if (Math.abs(f(a)) < Math.abs(f(b))) hi = b; else lo = a; }
      const pm = (lo + hi) / 2;
      if (Math.abs(f(pm)) < 1e-10 * scale) out.push({ p: pm, touch: true });
    }
  }
  const roots = [];
  for (const r of out) if (!roots.some(q => Math.abs(q - r.p) < 1e-6 * pmax)) roots.push(r.p);
  return roots;
}
export function conjugateTimesDetailed(psi, k, pmax, ngrid = 4000) {   // same, with the touch flag
  const roots = conjugateTimes(psi, k, pmax, ngrid);
  return roots.map(p => ({ p, touch: Math.abs(j2geo(psi, p - 1e-4, k) * j2geo(psi, p + 1e-4, k)) > 0 && j2geo(psi, p - 1e-4, k) * j2geo(psi, p + 1e-4, k) > 0 }));
}
export const K0 = 0.9089085575485414;      // K = 2E

// ---------------------------------------------------------------- exponential map
// rotating stratum C2 (paper B eq:exp), psi = phi/k, p = t/(2k); s2 = sign of the pendulum velocity
export function expC2(psi, k, t, s2 = 1) {
  const m = k * k, p = t / (2 * k), j0 = ellipj(psi, m), j1 = ellipj(psi + 2 * p, m);
  const D = 2 * p + ellipeinc(j0.am, m) - ellipeinc(j1.am, m);
  const x = k * (j0.dn * (j0.cn - j1.cn) + j0.sn * D);
  const y = m * j0.sn * (j0.cn - j1.cn) - j0.dn * D;
  const th = Math.asin(k * j0.sn) - Math.asin(k * j1.sn);
  return { x: s2 * x, y: s2 * y, theta: th };
}
// oscillating stratum C1 (Moiseev-Sachkov 4.3), phase phi, s1 = sign cos(gamma/2)
export function expC1(phi, k, t, s1 = 1) {
  const m = k * k, a = ellipj(phi, m), b = ellipj(phi + t, m);
  const ea = ellipeinc(a.am, m), eb = ellipeinc(b.am, m), drift = t + ea - eb;
  const x = (s1 / k) * (a.cn * (a.dn - b.dn) + a.sn * drift);
  const y = (1 / k) * (a.sn * (a.dn - b.dn) - a.cn * drift);
  const cos = a.cn * b.cn + a.sn * b.sn, sin = s1 * (a.sn * b.cn - a.cn * b.sn);
  return { x, y, theta: Math.atan2(sin, cos) };
}
export function cutTimeC2(k) { return 2 * k * cellData(k, 1).p0; }
export function cutTimeC1(k) { return 2 * ellipk(k * k); }

// pendulum state (gamma, gamma_dot) of a rotating source at time t: sin(gamma/2) = s2 sn, cos(gamma/2) = cn
export function pendulumC2(psi, k, t, s2 = 1) {
  const j = ellipj(psi + t / k, k * k);
  return { gamma: 2 * Math.atan2(s2 * j.sn, j.cn), gdot: 2 * s2 * j.dn / k };
}

// ---------------------------------------------------------------- paper C: scalar inverse N(z), Prop. 2.1
// target (x, y, theta), sign eps = +1 (use (-x,-y) for eps = -1); z = tan a
export function scalarChart(z, x, y, th) {
  const H = 1 + z * z, C = x + y * z, D = z * Math.cos(th) - Math.sin(th), d = D * D - z * z, U = C * C + d;
  if (C === 0 || !(Math.cos(th) + z * Math.sin(th) > 0) || !(x * z - y > 0)) return null;
  const m = (z * z + (U / (2 * C)) ** 2) / H;
  if (!(m > 0 && m < 1)) return null;
  const sH = Math.sqrt(H), A = (x * z - y) / sH, f = U / (2 * C * sH), g = (d - C * C) / (2 * C * sH);
  const ph0 = ((Math.atan2(z / sH, f) % (2 * PI)) + 2 * PI) % (2 * PI);
  const ph1 = ((Math.atan2(D / sH, g) % (2 * PI)) + 2 * PI) % (2 * PI);
  const K = ellipk(m), E = ellipe(m), psi = ellipf(ph0, m), v0 = ellipf(ph1, m);
  const w = v0 < psi ? 1 : 0, delta = v0 - psi + 4 * K * w;
  const Q0 = delta - ellipeinc(ph1, m) + ellipeinc(ph0, m) - 4 * E * w;
  const L = 4 * (K - E);
  return { m, A, psi, delta, Q0, N: (A - Q0) / L, K, L };
}
// rotating sources of a target: integer levels of N on each admissible component, both signs.
// The components are located on a coarse grid, then N is sampled adaptively (intervals are split
// until the change of N is small), integer crossings are bisected, near-tangent contacts (a local
// extremum of N within 1e-7 of an integer) are counted once, roots are deduplicated by time and
// every source is forward-verified through the exponential map.  Returns {t, k, psi, eps, n, a}.
export function rotatingSources(x, y, th, na = 400, tmax = 40) {
  const out = [];
  for (const eps of [1, -1]) {
    const X = eps * x, Y = eps * y, Nof = a => { const c = scalarChart(Math.tan(a), X, Y, th); return c ? c.N : NaN; };
    // coarse grid to find the admissible components
    const grid = []; for (let i = 1; i <= na; i++) { const a = -PI / 2 + PI * i / (na + 1); grid.push([a, Nof(a)]); }
    let comps = [], cur = [];
    for (const g of grid) { if (Number.isNaN(g[1])) { if (cur.length) comps.push(cur); cur = []; } else cur.push(g); }
    if (cur.length) comps.push(cur);
    const found = [];
    for (const comp of comps) {
      // extend the component to its boundaries by bisection on admissibility
      let lo = comp[0][0], hi = comp[comp.length - 1][0], step = PI / (na + 1);
      let l0 = lo - step, h0 = hi + step;
      for (let it = 0; it < 40; it++) { const m = (l0 + lo) / 2; if (Number.isNaN(Nof(m))) l0 = m; else lo = m; }
      for (let it = 0; it < 40; it++) { const m = (hi + h0) / 2; if (Number.isNaN(Nof(m))) h0 = m; else hi = m; }
      // adaptive sampling
      const samples = [[lo, Nof(lo)], [hi, Nof(hi)]];
      const stack = [[lo, hi]];
      while (stack.length) {
        const [a, b] = stack.pop(), Na = Nof(a), Nb = Nof(b), m = (a + b) / 2, Nm = Nof(m);
        if (!Number.isFinite(Na) || !Number.isFinite(Nb) || !Number.isFinite(Nm)) continue;
        samples.push([m, Nm]);
        const rough = Math.abs(Na - Nm) > 0.15 || Math.abs(Nm - Nb) > 0.15 || Math.abs(Na + Nb - 2 * Nm) > 0.02;
        if (rough && b - a > 1e-6) { stack.push([a, m]); stack.push([m, b]); }
      }
      samples.sort((u, v) => u[0] - v[0]);
      for (let i = 0; i < samples.length - 1; i++) {
        const [a, Na] = samples[i], [b, Nb] = samples[i + 1];
        if (!Number.isFinite(Na) || !Number.isFinite(Nb)) continue;
        const l = Math.min(Na, Nb), h = Math.max(Na, Nb);
        for (let n = Math.max(0, Math.ceil(l)); n <= Math.floor(h); n++) {
          if (Na === n) { found.push([a, n]); continue; }
          if (Nb === n) continue;
          if ((Na - n) * (Nb - n) < 0) found.push([bisect(q => Nof(q) - n, a, b, 70), n]);
        }
      }
      // near-tangent contacts: local extrema of N within 1e-7 of an integer
      for (let i = 1; i < samples.length - 1; i++) {
        const [a, Na] = samples[i - 1], [m, Nm] = samples[i], [b, Nb] = samples[i + 1];
        if ((Nm - Na) * (Nb - Nm) < 0) {
          let l = a, h = b;
          const sgn = Nm > Na ? 1 : -1;
          for (let it = 0; it < 80; it++) { const u = l + (h - l) / 3, v = h - (h - l) / 3; if (sgn * Nof(u) < sgn * Nof(v)) l = u; else h = v; }
          const ae = (l + h) / 2, Ne = Nof(ae), n = Math.round(Ne);
          if (n >= 0 && Math.abs(Ne - n) < 1e-7 && !found.some(([q]) => Math.abs(q - ae) < 1e-4)) found.push([ae, n]);
        }
      }
    }
    for (const [a, n] of found) {
      const c = scalarChart(Math.tan(a), X, Y, th); if (!c) continue;
      const k = Math.sqrt(c.m), t = k * (c.delta + 4 * c.K * n);
      if (t > tmax) continue;
      const e = expC2(c.psi, k, t, eps);
      const res = Math.hypot(e.x - x, e.y - y) + Math.abs(Math.atan2(Math.sin(e.theta - th), Math.cos(e.theta - th)));
      if (res > 1e-7) continue;                                   // forward verification
      if (out.some(o => Math.abs(o.t - t) < 1e-8 && o.eps === eps && Math.abs(o.k - k) < 1e-8)) continue;
      out.push({ t, k, psi: c.psi, eps, n, a, residual: res });
    }
  }
  return out.sort((u, v) => u.t - v.t);
}
