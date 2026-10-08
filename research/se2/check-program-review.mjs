import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as M from '../../public/js/se2/se2math.js';
const data=JSON.parse(readFileSync(new URL('../../public/research/se2/se2-ray-thresholds.json',import.meta.url)));
let cases=0,worst=0;
for(const [R,count] of data.verified) for(const th of [.7,-.7]) for(const sign of [1,-1]) {
 const a=th/2,x=sign*R*Math.sin(a),y=-sign*R*Math.cos(a),sources=M.rotatingSources(x,y,th,400,40);
 assert.equal(sources.length,count,`R=${R},theta=${th},sign=${sign}`);
 for(const source of sources){assert.ok(source.t<=40);worst=Math.max(worst,source.residual);assert.ok(source.residual<1e-9);}
 cases++;
}
const R=1.45,a=.35,pair=M.rotatingSources(R*Math.sin(a),-R*Math.cos(a),.7,400,40).filter(s=>!s.seam);
assert.equal(pair.length,2);assert.ok(Math.abs(pair[0].t-pair[1].t)<1e-8);assert.ok(Math.abs(pair[0].k-pair[1].k)<1e-8);
assert.ok(!M.sameRotatingSource(pair[0],pair[1]));
assert.ok(M.sameRotatingSource(pair[0],{...pair[0],psi:pair[0].psi+4*M.ellipk(pair[0].k**2)}));
for(const n of [0,1,2]){
 const r=(n+.5)*data.Lstar,sources=M.rotatingSources(r*Math.sin(a),-r*Math.cos(a),.7,400,40);
 assert.equal(sources.length,1+2*n,`shared short/long join n=${n}`);cases++;
}
assert.throws(()=>M.seamSources(Math.sin(.00005),-Math.cos(.00005),.0001,40),/budget/);
const K=M.ellipk(M.K0**2),critical=M.conjugateTimes(K,M.K0,6*K,100);
assert.equal(critical.length,3);critical.forEach((p,i)=>assert.equal(p,2*(i+1)*K));
console.log(JSON.stringify({ray_and_join_cases:cases,maximum_forward_residual:worst,maxwell_pair_preserved:true,phase_period_checked:true,critical_endpoint_retained:true}));
