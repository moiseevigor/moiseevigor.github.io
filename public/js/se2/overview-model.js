// Elementary constructions and the published unit-speed normal equations.
// Pure functions are shared by the illustrations and independent checks.
export function compose(a, b) {
  return {x: a.x + Math.cos(a.theta)*b.x - Math.sin(a.theta)*b.y,
    y: a.y + Math.sin(a.theta)*b.x + Math.cos(a.theta)*b.y, theta: a.theta+b.theta};
}
export function maneuver(epsilon, progress=4) {
  let q={x:0,y:0,theta:0}; const points=[q];
  const moves=[{x:0,y:0,theta:epsilon},{x:epsilon,y:0,theta:0},
    {x:0,y:0,theta:-epsilon},{x:-epsilon,y:0,theta:0}];
  for(let i=0;i<4;i++) {const f=Math.max(0,Math.min(1,progress-i));
    if(f===0)break;
    q=compose(q,{x:moves[i].x*f,y:0,theta:moves[i].theta*f});points.push(q);
  }
  return {q,points};
}
export function derivative(v) {
  const [gamma,c,x,y,theta]=v,u=Math.sin(gamma/2);
  return [c,-Math.sin(gamma),u*Math.cos(theta),u*Math.sin(theta),-Math.cos(gamma/2)];
}
export function integrate(gamma,c,time,steps=4800) {
  let v=[gamma,c,0,0,0];const dt=time/steps,path=[{t:0,v:[...v]}];
  const shift=(a,b,h)=>a.map((x,i)=>x+h*b[i]);
  for(let n=1;n<=steps;n++) {
    const a=derivative(v),b=derivative(shift(v,a,dt/2)),d=derivative(shift(v,b,dt/2)),e=derivative(shift(v,d,dt));
    v=v.map((x,i)=>x+dt*(a[i]+2*b[i]+2*d[i]+e[i])/6);
    path.push({t:n*dt,v:[...v]});
  }
  return path;
}
export const pendulumEnergy=(gamma,c)=>c*c/2-Math.cos(gamma);
