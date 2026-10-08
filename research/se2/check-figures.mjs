import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import * as M from '../../public/js/se2/se2math.js';
const checks=[];
for(const k of [.25,.75,.97]) {
 const c=M.cellData(k,1),K=c.K;
 for(const phase of [0,.6,1,2,3,4]) {
  const roots=M.conjugateTimes(phase*K,k,c.cells[0].pnext-1e-8,2800).filter(p=>p>=c.p0-1e-7);
  assert.equal(roots.length,2,`generic cell k=${k},phase=${phase}`);
  for(const p of roots){const q=M.expC2(phase*K,k,2*k*p);assert.ok([q.x,q.y,q.theta].every(Number.isFinite));}
  checks.push(`bracket controls k=${k} phase=${phase}`);
 }
}
const K=M.ellipk(M.K0*M.K0),roots=M.conjugateTimes(K,M.K0,6.3*K,4000);
assert.equal(roots.length,3);roots.forEach((p,i)=>assert.ok(Math.abs(p/K-2*(i+1))<1e-5));checks.push('critical touching roots retained');
const src=M.rotatingSources(-1,-2,-.9,400,40);assert.equal(src.length,9);assert.ok(src.every(s=>s.residual<1e-9));checks.push('nine-source preset forward checked');
const target=M.expC2(.3,.75,1),forward=M.rotatingSources(target.x,target.y,target.theta,400,40);assert.ok(forward.some(s=>Math.abs(s.t-1)<1e-8&&Math.abs(s.k-.75)<1e-9));checks.push('forward preset source retained');
const ray=JSON.parse(readFileSync(new URL('../../public/research/se2/se2-ray-thresholds.json',import.meta.url)));
for(const [r,n]of ray.verified){const count=(r>ray.twoQ?1:0)+2*ray.S.filter(s=>s<r).length+2*ray.cusp.filter(s=>s<r).length;assert.equal(count,n,`ray R=${r}`);checks.push(`ray R=${r}`);}
const result={passed:checks.length,checks,scope:'bounded figure data and control-domain checks; no new global proof',max_forward_residual:Math.max(...src.map(s=>s.residual))};console.log(JSON.stringify({passed:checks.length,max_forward_residual:result.max_forward_residual}));
