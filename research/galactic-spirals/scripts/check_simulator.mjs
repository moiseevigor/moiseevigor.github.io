// Headless run of the blog's galaxy simulator (public/js/galaxy-spirals.js).
// Prints the measured arm number and pitch through time for each preset, and asserts
// the physics the page claims: material arms wind as cot P = R|dΩ/dR| t, and a lighter
// disc grows more arms than a massive one (swing amplification, m ∝ 1/f_disc).
// Run: node research/galactic-spirals/scripts/check_simulator.mjs [preset ...]
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createSim, step, measure, predictions, PRESETS, UNITS} from '../../../public/js/galaxy-spirals.js';

const only = process.argv.slice(2);
const T_END = 60, EVERY = 6;                    // simulation units (13.3 Myr each)
const summary = {};
for (const [key, p] of Object.entries(PRESETS)) {
  if (only.length && !only.includes(key)) continue;
  const ms = [];
  for (const seed of key === 'multi' || key === 'few' ? [1, 2, 3] : [1]) {
    const s = createSim({f: p.f, Q: p.Q, n: 40000, seed, gravity: p.gravity, wave: p.wave || 0,
                         winding: p.winding, companion: p.companion || 0});
    const pr = predictions(s), t0 = Date.now();
    if (seed === 1) console.log(`\n${key}: m_swing=${pr.mSwing.toFixed(2)} pitch_MK=${pr.pitchMK.toFixed(1)}° Γ=${pr.gamma.toFixed(2)}`);
    let next = EVERY;
    while (s.t < T_END) {
      step(s);
      if (s.t >= next) {
        next += EVERY;
        const m = measure(s, !!p.winding);
        const extra = s.comp ? ` comp R=${Math.hypot(s.comp.x, s.comp.y).toFixed(1)}` : '';
        if (seed === 1) console.log(`  t=${(s.t * UNITS.myr).toFixed(0).padStart(4)} Myr  m=${m?.m} pitch=${m?.pitch.toFixed(1)}° amp=${m?.amp.toFixed(3)} noise=${m?.noise.toFixed(3)}${extra}`);
        if (m && m.amp > m.noise && s.t > 20) ms.push(m);
        if (p.winding && Math.abs(s.t - 18) < EVERY / 2) {
          const om = R => Math.sqrt(s.T.om2[Math.round(R / 0.05)]);
          const cot = 2.2 * Math.abs((om(2.3) - om(2.1)) / 0.2) * s.t;
          const pred = Math.atan(1 / cot) * 180 / Math.PI;
          console.log(`  winding check: predicted ${pred.toFixed(1)}°, measured ${m.pitch.toFixed(1)}°`);
          summary.windingCheck = {pred, meas: m.pitch};
        }
      }
    }
    if (seed === 1) console.log(`  (${((Date.now() - t0) / (T_END / 0.025)).toFixed(1)} ms/step)`);
  }
  summary[key] = {meanM: ms.reduce((a, m) => a + m.m, 0) / Math.max(ms.length, 1),
                  meanPitch: ms.reduce((a, m) => a + m.pitch, 0) / Math.max(ms.length, 1), n: ms.length};
}
console.log('\n', JSON.stringify(summary, null, 1));
if (!only.length) writeFileSync(new URL('../artifacts/simulator_check.json', import.meta.url), JSON.stringify(summary, null, 1) + '\n');
if (summary.windingCheck) assert.ok(Math.abs(summary.windingCheck.meas - summary.windingCheck.pred) < 0.35 * summary.windingCheck.pred, 'material arms wind as predicted');
if (summary.multi && summary.few) assert.ok(summary.multi.meanM > summary.few.meanM, 'lighter disc has more arms');
console.log('checks passed');
