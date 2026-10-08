import assert from 'node:assert/strict';
import {maneuver,compose,integrate,pendulumEnergy,plotScale} from '../../public/js/se2/overview-model.js';
import * as M from '../../public/js/se2/se2math.js';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
let maxEnergyError=0,maxFlowError=0,maxMeetingError=0,cases=0;
for(const epsilon of [.05,.2,.5,1]){
 const {q}=maneuver(epsilon);assert.ok(Math.abs(q.x-epsilon*(Math.cos(epsilon)-1))<1e-15);assert.ok(Math.abs(q.y-epsilon*Math.sin(epsilon))<1e-15);assert.equal(q.theta,0);cases++;
}
const r={x:1.2,y:-.4,theta:.9},b={x:-.2,y:.7,theta:-.3},c={x:.3,y:.1,theta:.5};
const lhs=compose(compose(r,b),c),rhs=compose(r,compose(b,c));assert.ok(Math.hypot(lhs.x-rhs.x,lhs.y-rhs.y,lhs.theta-rhs.theta)<1e-15);cases++;
for(const velocity of [0,.8,2*Math.cos(.5),2.5,4]){
 const path=integrate(1,velocity,10);for(const point of path)maxEnergyError=Math.max(maxEnergyError,Math.abs(pendulumEnergy(...point.v.slice(0,2))-pendulumEnergy(1,velocity)));cases++;
}
assert.ok(maxEnergyError<3e-10);
for(const k of [.3,.75,.94])for(const fraction of [.2,.6,.8]){
 const K=M.ellipk(k*k),p=M.cellData(k,1).p0,t=2*k*p,psi=fraction*K-p,partner=-psi-2*p,a=M.expC2(psi,k,t),b=M.expC2(partner,k,t);
 const residual=Math.hypot(a.x-b.x,a.y-b.y,wrap(a.theta-b.theta));maxMeetingError=Math.max(maxMeetingError,residual);assert.ok(residual<1e-11);
 assert.ok(!M.sameRotatingSource({k,t,psi,eps:1},{k,t,psi:partner,eps:1}));
 const j=M.ellipj(psi,k*k),actual=integrate(2*j.am,2*j.dn/k,t,3200).at(-1).v;
 const error=Math.hypot(a.x-actual[2],a.y-actual[3],wrap(a.theta-actual[4]));maxFlowError=Math.max(maxFlowError,error);assert.ok(error<1e-9);cases++;
}
// Different panel sizes must retain the same pixels per data unit. Bounds of
// the wrapped phase portrait remain [-pi,pi] rather than suggesting extra turns.
let scaleCases=0;
for(const viewport of [[0,0,850,350],[0,0,430,380],[0,0,330,260],[0,260,330,260]])
 for(const fixed of [false,true]) {
  const bounds=[-Math.PI,Math.PI,-4.5,4.5],s=plotScale(bounds,viewport,fixed);
  assert.ok(Math.abs((s.x(1)-s.x(0))-(s.y(0)-s.y(1)))<1e-12);
  if(fixed)assert.deepEqual(s.b,bounds);
  assert.ok(s.x(bounds[0])>=viewport[0] && s.x(bounds[1])<=viewport[0]+viewport[2]);
  assert.ok(s.y(bounds[2])<=viewport[1]+viewport[3] && s.y(bounds[3])>=viewport[1]);scaleCases++;
 }
console.log(JSON.stringify({cases,scaleCases,maxEnergyError,maxFlowError,maxMeetingError,scope:'Elementary constructions; conservation; published endpoint formulas vs normal ODE; distinct symmetric cut sources'},null,2));
