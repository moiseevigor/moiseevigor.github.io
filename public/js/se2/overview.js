import {compose,maneuver,integrate,pendulumEnergy,plotScale as scale} from './overview-model.js?v=20261008-published1';
import * as M from './se2math.js?v=20261008-review2';
const colors={ink:'#25313c',gray:'#65727e',grid:'#dee3e7',blue:'#1565c0',orange:'#c8501a',purple:'#6b4fa3'};
const wrap=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
const format=(x,n=3)=>(Math.abs(x)<0.5*10**(-n)?0:x).toFixed(n);
function frame(canvas) {
  const {width:W,height:H}=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);return {g,W,H};
}
function box(points) {
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y),a=Math.min(0,...xs),b=Math.max(0,...xs),c=Math.min(0,...ys),d=Math.max(0,...ys),pad=.18*Math.max(b-a,d-c,.01);
  return [a-pad,b+pad,c-pad,d+pad];
}
function text(g,label,x,y,color=colors.gray,align='left'){g.font="12px 'Source Sans 3',sans-serif";g.fillStyle=color;g.textAlign=align;g.fillText(label,x,y);}
function line(g,points,s,color,width=2){g.beginPath();let on=false;for(const p of points){if(!p){on=false;continue;}if(on)g.lineTo(s.x(p.x),s.y(p.y));else g.moveTo(s.x(p.x),s.y(p.y));on=true;}g.strokeStyle=color;g.lineWidth=width;g.stroke();}
function axes(g,s,xLabel='x',yLabel='y') {
  const [a,b,c,d]=s.b,[l,t,w,h]=s.viewport,precision=span=>Math.max(0,Math.min(5,1-Math.floor(Math.log10(span/4))));g.strokeStyle=colors.grid;g.lineWidth=1;
  for(let i=0;i<=4;i++) {const x=a+(b-a)*i/4,y=c+(d-c)*i/4;g.beginPath();g.moveTo(s.x(x),s.y(c));g.lineTo(s.x(x),s.y(d));g.moveTo(s.x(a),s.y(y));g.lineTo(s.x(b),s.y(y));g.stroke();text(g,format(x,precision(b-a)),s.x(x),t+h-19,colors.gray,'center');text(g,format(y,precision(d-c)),l+49,s.y(y)+4,colors.gray,'right');}
  text(g,xLabel,l+w-17,t+h-3,colors.ink,'right');text(g,yLabel,l+55,t+13,colors.ink);
}
function pose(g,s,q,color=colors.ink){const x=s.x(q.x),y=s.y(q.y);g.save();g.translate(x,y);g.rotate(-q.theta);g.strokeStyle=color;g.lineWidth=2;g.beginPath();g.moveTo(-7,0);g.lineTo(17,0);g.lineTo(11,-5);g.moveTo(17,0);g.lineTo(11,5);g.stroke();g.beginPath();g.arc(0,0,3,0,2*Math.PI);g.fillStyle=color;g.fill();g.restore();}
class OverviewFigure {
  constructor(el){this.el=el;this.mode=el.dataset.se2Overview;this.canvas=el.querySelector('canvas');this.readout=el.querySelector('.se2-readout');this.state={};this.cache={};
    el.querySelectorAll('[data-param]').forEach(input=>{this.state[input.dataset.param]=input.type==='range'?+input.value:input.value;input.addEventListener('input',()=>{this.state[input.dataset.param]=input.type==='range'?+input.value:input.value;
      if(input.dataset.param==='family'){this.state.velocity={oscillation:.8,rotation:2.5,separatrix:2*Math.cos(.5)}[input.value];el.querySelector('[data-param=velocity]').value=this.state.velocity;}
      if(input.dataset.param==='velocity'){this.state.family='custom';el.querySelector('[data-param=family]').value='custom';}this.schedule();});});
    new ResizeObserver(()=>{if(this.visible)this.schedule();}).observe(this.canvas);
    new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible)this.schedule();},{rootMargin:'120px'}).observe(el);
  }
  schedule(){cancelAnimationFrame(this.pending);this.pending=requestAnimationFrame(()=>this.draw());}
  draw(){const {g,W,H}=frame(this.canvas);if(W<80)return;
    this.el.querySelectorAll('[data-value]').forEach(o=>{const key=o.dataset.value;o.textContent=key==='angle'?`${this.state[key]}°`:format(this.state[key],2);});
    try{this[this.mode](g,W,H);this.el.dataset.ready='true';}catch(error){this.readout.textContent='The illustration could not load. The equations remain available in the text.';this.el.dataset.error=error.message;}
  }
  motion(g,W,H){const {epsilon:e,progress}=this.state,end=maneuver(e),now=maneuver(e,progress),s=scale(box(end.points),[0,0,W,H]);axes(g,s);line(g,end.points,s,colors.grid,3);line(g,now.points,s,colors.blue,3);pose(g,s,now.q);text(g,'start',s.x(0)+10,s.y(0)+19);text(g,'end',s.x(end.q.x)-8,s.y(end.q.y)-15,colors.blue,'right');
    const stages=['Turn','Drive','Turn back','Reverse','Complete'],digits=e<.2?5:3;this.readout.textContent=`${stages[Math.min(4,Math.floor(progress))]} · current x = ${format(now.q.x,digits)}, y = ${format(now.q.y,digits)}, heading = ${format(now.q.theta)} rad. Full maneuver: sideways shift ${format(end.q.y,digits)}, horizontal remainder ${format(end.q.x,digits)}, total effort ${format(4*e)}.`;
  }
  order(g,W,H){const a=this.state.angle*Math.PI/180,turn={x:0,y:0,theta:a},drive={x:1,y:0,theta:0},first=compose(turn,drive),second=compose(drive,turn),s=scale(box([first,second]),[0,0,W,H]);axes(g,s);line(g,[{x:0,y:0},first],s,colors.blue,3);line(g,[{x:0,y:0},second],s,colors.orange,3);pose(g,s,first,colors.blue);pose(g,s,second,colors.orange);
    text(g,'turn → drive',50,20,colors.blue);text(g,'drive → turn',190,20,colors.orange);
    this.readout.textContent=`Turn then drive: (${format(first.x)}, ${format(first.y)}). Drive then turn: (1, 0). Both headings: ${this.state.angle}°. Both sequences cost ${format(1+Math.abs(a))}; neither sequence is claimed to be the shortest path to its own endpoint.`;
  }
  pendulum(g,W,H){const {velocity:c,time}=this.state;if(this.cache.c!==c)this.cache={c,path:integrate(1,c,10)};
    const path=this.cache.path,idx=Math.min(path.length-1,Math.round(time/10*(path.length-1))),selected=path.slice(0,idx+1),now=path[idx].v,E=pendulumEnergy(1,c),stack=W<560,v1=stack?[0,0,W,H/2]:[0,0,W/2,H],v2=stack?[0,H/2,W,H/2]:[W/2,0,W/2,H],s=scale([-Math.PI,Math.PI,-4.5,4.5],v1,true);axes(g,s,'γ modulo 2π','c');
    for(const energy of [-.5,.5,1,2,4])for(const sign of [-1,1]){const pts=Array.from({length:201},(_,i)=>{const x=-Math.PI+2*Math.PI*i/200,a=2*(energy+Math.cos(x));return a>=0?{x,y:sign*Math.sqrt(a)}:null;});line(g,pts,s,energy===1?colors.purple:colors.grid,1);}
    const points=selected.map(p=>({x:wrap(p.v[0]),y:p.v[1]})),continuous=[];points.forEach((p,i)=>{if(i&&Math.abs(p.x-points[i-1].x)>Math.PI)continuous.push(null);continuous.push(p);});line(g,continuous,s,colors.blue,2.5);g.beginPath();g.arc(s.x(wrap(now[0])),s.y(now[1]),4,0,2*Math.PI);g.fillStyle=colors.blue;g.fill();
    const spatial=path.map(p=>({x:p.v[2],y:p.v[3]})),z=scale(box(spatial),v2);axes(g,z);line(g,spatial,z,colors.grid,1.5);line(g,selected.map(p=>({x:p.v[2],y:p.v[3]})),z,colors.blue,2.5);pose(g,z,{x:now[2],y:now[3],theta:now[4]});
    const family=Math.abs(E-1)<1e-10?'separatrix':E<1?'oscillation':'rotation';this.readout.textContent=`Pendulum energy = ${format(E)} · ${family}. Time ${format(path[idx].t,2)} · heading ${format(wrap(now[4]))} rad. Unit total control speed; the planar driving speed can pass through zero. Purple curves mark the separatrix energy 1; the phase portrait wraps γ modulo 2π, while the controls retain the full angle.`;
  }
  maxwell(g,W,H){const {k,midpoint,fraction}=this.state,key=`${k}/${midpoint}`;
    if(this.cache.key!==key){const K=M.ellipk(k*k),p=M.cellData(k,1).p0,t=2*k*p,psi=midpoint*K-p,other=-psi-2*p,sources=[psi,other],paths=sources.map(a=>Array.from({length:241},(_,i)=>M.expC2(a,k,t*i/240))),a=paths[0].at(-1),b=paths[1].at(-1);this.cache={key,t,paths,sources,residual:Math.hypot(a.x-b.x,a.y-b.y,wrap(a.theta-b.theta))};}
    const {t,paths,sources,residual}=this.cache,s=scale(box(paths.flat()),[0,0,W,H]);axes(g,s);
    paths.forEach((path,i)=>{const color=i?colors.orange:colors.blue;line(g,path,s,colors.grid,1);const current=M.expC2(sources[i],k,t*fraction);line(g,[...path.slice(0,Math.floor(fraction*240)+1),current],s,color,2.5);pose(g,s,current,color);});text(g,'path A',50,20,colors.blue);text(g,'path B',135,20,colors.orange);
    const a=M.expC2(sources[0],k,t*fraction),b=M.expC2(sources[1],k,t*fraction),gap=Math.hypot(a.x-b.x,a.y-b.y,wrap(a.theta-b.theta));
    this.readout.textContent=`Equal current lengths: ${format(t*fraction)} each · common cut length ${format(t)}. Current pose difference ${gap.toExponential(2)}; endpoint residual at the cut ${residual.toExponential(2)}. ${fraction===1?'Both paths minimize to this target.':'Before the meeting, the paths generally have different endpoints.'}`;
  }
}
document.querySelectorAll('[data-se2-overview]').forEach(el=>new OverviewFigure(el));
const depthLabels={story:'The visual story: optional geometry and mathematics are closed.',mechanism:'The geometric explanations are open. Equations remain optional.',full:'All geometric explanations and mathematical details are open.'};
document.querySelectorAll('[data-depth]').forEach(button=>button.addEventListener('click',()=>{const depth=button.dataset.depth;document.querySelectorAll('[data-depth]').forEach(b=>b.setAttribute('aria-pressed',b===button?'true':'false'));document.querySelectorAll('.se2-detail').forEach(d=>{d.open=depth==='full'||(depth==='mechanism'&&d.dataset.level==='mechanism');});document.querySelector('.se2-depth-note').textContent=depthLabels[depth];window.dispatchEvent(new Event('resize'));}));
