/**
 * elliptic-core.js
 * Browser-side elliptic integral and Jacobi elliptic function routines.
 * Shared across all "Geometry of Seeing" series figures.
 *
 * Matches the moiseevigor/elliptic Python package algorithms exactly.
 */

// Complete elliptic integral of the first kind K(m) via AGM.
function ellipticK(m) {
  if (m >= 1) return Infinity;
  if (m <= 0) return Math.PI / 2;
  let a = 1, b = Math.sqrt(1 - m);
  for (let i = 0; i < 32; i++) {
    const an = (a + b) / 2;
    b = Math.sqrt(a * b);
    a = an;
    if (Math.abs(a - b) < 1e-15 * a) break;
  }
  return Math.PI / (2 * a);
}

// Jacobi elliptic functions sn, cn, dn via descending Landen transform.
function ellipj(u, m) {
  m = Math.max(0, Math.min(1, m));
  if (m < 1e-9)  return { sn: Math.sin(u), cn: Math.cos(u), dn: 1 };
  if (m > 1-1e-9) {
    const s = 1 / Math.cosh(u);
    return { sn: Math.tanh(u), cn: s, dn: s };
  }
  const MAX = 24;
  const a = [1], b = [Math.sqrt(1 - m)], c = [Math.sqrt(m)];
  let N = 0;
  for (let n = 0; n < MAX; n++) {
    a.push((a[n] + b[n]) / 2);
    b.push(Math.sqrt(a[n] * b[n]));
    c.push((a[n] - b[n]) / 2);
    N = n + 1;
    if (Math.abs(c[N]) < 1e-15) break;
  }
  let phi = Math.pow(2, N) * a[N] * u;
  for (let n = N; n > 0; n--)
    phi = (Math.asin(c[n] / a[n] * Math.sin(phi)) + phi) / 2;
  const sn = Math.sin(phi), cn = Math.cos(phi);
  return { sn, cn, dn: Math.sqrt(1 - m * sn * sn) };
}

// Integrate an elastica curve given κ(s) as a function.
// Returns array of {x, y, theta, kappa, s} using midpoint rule.
function integrateElastica(kappaFn, sMin, sMax, N, theta0 = 0) {
  const ds = (sMax - sMin) / N;
  let x = 0, y = 0, theta = theta0;
  const pts = [{ x, y, theta, kappa: kappaFn(sMin), s: sMin }];
  for (let i = 0; i < N; i++) {
    const s = sMin + i * ds;
    const kMid = kappaFn(s + ds / 2);
    const dtheta = kMid * ds;
    x += Math.cos(theta + dtheta / 2) * ds;
    y += Math.sin(theta + dtheta / 2) * ds;
    theta += dtheta;
    pts.push({ x, y, theta, kappa: kappaFn(s + ds), s: s + ds });
  }
  return pts;
}

// Inflectional elastica: κ(s) = 2k·cn(s|k²), k ∈ (0,1).
function elasticaInflectional(k, N = 600) {
  const m = k * k, Km = ellipticK(m);
  return integrateElastica(s => 2 * k * ellipj(s, m).cn, -2*Km, 2*Km, N);
}

// Euler/Cornu spiral (separatrix): κ(s) = 2·sech(s).
function elasticaSeparatrix(halfArc = 8, N = 600) {
  return integrateElastica(s => 2 / Math.cosh(s), -halfArc, halfArc, N);
}

// Non-inflectional: κ(s) = 2·dn(s|m), m ∈ (0,1).
function elasticaNonInflectional(m, N = 600) {
  const Km = ellipticK(m);
  return integrateElastica(s => 2 * ellipj(s, m).dn, -Km, Km, N);
}

// Centre a curve at its bounding-box midpoint.
function centreCurve(pts) {
  const xArr = pts.map(p => p.x), yArr = pts.map(p => p.y);
  const xMid = (Math.min(...xArr) + Math.max(...xArr)) / 2;
  const yMid = (Math.min(...yArr) + Math.max(...yArr)) / 2;
  return pts.map(p => ({ ...p, xc: p.x - xMid, yc: p.y - yMid }));
}
