// Plot regression checks for the 9 October 2026 corrections.
// Run: node research/se2-overview/check-plot-regressions.mjs
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import * as M from '../../public/js/se2/se2math.js';
const base=new URL('../../',import.meta.url);const read=n=>fs.readFileSync(new URL(n,base),'utf8');
const scale=(domain=[0,1],range=[0,1])=>{let f=x=>range[0]+(x-domain[0])*(range[1]-range[0])/(domain[1]-domain[0]);f.domain=a=>(domain=a,f);f.range=a=>(range=a,f);f.invert=y=>domain[0]+(y-range[0])*(domain[1]-domain[0])/(range[1]-range[0]);return f;};
let attrs=[];
class Selection {append(){return new Selection()}selectAll(){return this}remove(){return this}attr(k,v){attrs.push([k,v]);return this}text(v){attrs.push(['text',v]);return this}call(){return this}}
const d3={scaleLinear:scale,select:()=>new Selection(),range:(a,b,h=1)=>{if(b===undefined){b=a;a=0}return Array.from({length:Math.ceil((b-a)/h)},(_,i)=>a+i*h);},line:()=>{let x=p=>p[0],y=p=>p[1],defined=()=>true;let f=arr=>JSON.stringify(arr.map(p=>defined(p)?[x(p),y(p)]:null));f.x=a=>(x=a,f);f.y=a=>(y=a,f);f.defined=a=>(defined=a,f);return f;}};
function context(name,exports,values={}){
 const elements={};for(const [id,value]of Object.entries(values))elements[id]={value:String(value),checked:true,style:{},setAttribute(){},addEventListener(){},clientWidth:740};
 const svg={clientWidth:740,setAttribute(){},getBoundingClientRect:()=>({width:740})};
 const document={readyState:'loading',addEventListener(){},getElementById:id=>elements[id]||(id.startsWith('fig-')?svg:{style:{},value:'0',addEventListener(){}})};
 let ctx={d3,document,window:{addEventListener(){}},Math,requestAnimationFrame:()=>1,cancelAnimationFrame(){}};vm.createContext(ctx);vm.runInContext(read('public/js/elliptic-core.js'),ctx);
 const scripts=[...read(name).matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.trim());
 for(let s of scripts){const idx=s.lastIndexOf('if (document.readyState');assert.ok(idx>=0);s=s.slice(0,idx)+`window.audit={${exports.join(',')}};\n`+s.slice(idx);vm.runInContext(s,ctx);}
 return {api:ctx.window.audit,elements,ctx};
}
let cases=0;
const A2=context('_appendices/2026-05-02-geometry-of-seeing-A2-distributions-contact.md',['drawReach'],{'reach-target':'sideways','reach-eps':22});
for(const target of ['forward','sideways','rotated','parking'])for(const e of [5,10,22,40,60]){
 A2.elements['reach-target'].value=target;A2.elements['reach-eps'].value=String(e);attrs=[];A2.api.drawReach();const status=attrs.find(([k,v])=>k==='text'&&v.includes('miss ='));assert.ok(status[1].endsWith('miss = 0.000'),status[1]);cases++;
}
const A3=context('_appendices/2026-05-03-geometry-of-seeing-A3-pmp.md',['drawPhase','drawVariation'],{'phase-E':70,'phase-mode':'all','var-eta':100,'var-n':6});attrs=[];A3.api.drawPhase();assert.ok(attrs.some(([k,v])=>k==='d'&&v.includes('null')),'phase gaps retained');cases++;
attrs=[];A3.api.drawVariation();const path=JSON.parse(attrs.filter(([k])=>k==='d')[2][1]);assert.ok(path.every(p=>p[1]>=18&&p[1]<=268));cases++;
const A5=context('_appendices/2026-05-05-geometry-of-seeing-A5-sr-exponential.md',['drawExpMap','animateConjugate','conjState'],{'exp-family':'inflectional','exp-k':195,'exp-T':200,'conj-T':65});
A5.api.drawExpMap();assert.equal(A5.elements['exp-k'].value,'99');A5.elements['exp-family'].value='noninflectional';A5.api.drawExpMap();assert.equal(A5.elements['exp-k'].value,'101');cases+=2;
// Animation draw would need a full DOM. Replace its local call only for this
// accumulation test; all inline scripts are syntax-checked separately below.
const s=read('_appendices/2026-05-05-geometry-of-seeing-A5-sr-exponential.md');const animation=s.slice(s.indexOf('function animateConjugate(now)'),s.indexOf('// ── Boot',s.indexOf('function animateConjugate(now)'))).replace('drawConjugate();','');const animCtx={conjState:{playing:true,playTime:6.5,sMax:10},document:{getElementById:()=>A5.elements['conj-T']},requestAnimationFrame:()=>1,Math};vm.createContext(animCtx);vm.runInContext(animation,animCtx);for(let n=0;n<=60;n++)animCtx.animateConjugate(1000*n/60);assert.equal(A5.elements['conj-T'].value,'71');cases++;
for(const k of [.25,.75,.90,.908,.91,.97]){const K=M.ellipk(k*k),r=M.conjugateTimes(K,k,6*K,2500);for(const n of [1,2,3])assert.ok(r.some(p=>Math.abs(p-2*n*K)<1e-9));cases++;}
let ctx={d3,Math};vm.createContext(ctx);vm.runInContext(read('public/js/elliptic-core.js'),ctx);for(const W of [271,740,1100]){const f=ctx.equalPhaseScales([-4,4],[-3,3],[44,W-20],[344,20]);assert.ok(Math.abs((f.x(1)-f.x(0))-(f.y(0)-f.y(1)))<1e-10);cases++;}
let scriptCount=0;for(const name of ["_posts/2026-10-08-shortest-paths-se2-overview.md", "_posts/2026-10-07-se2-geodesics-research-program.md", "_articles/2026-10-07-se2-conjugate-locus.md", "_articles/2026-10-07-se2-conjugate-times.md", "_articles/2026-10-07-se2-geodesic-counts.md", "_posts/2026-04-25-geometry-of-seeing-visual-cortex-se2.md", "_posts/2026-04-28-geometry-of-seeing-elastica-jacobi.md", "_posts/2026-05-05-geometry-of-seeing-maxwell-strata.md", "_posts/2026-05-15-geometry-of-seeing-cut-time-open-problem.md", "_appendices/2026-05-01-geometry-of-seeing-A1-lie-groups.md", "_appendices/2026-05-02-geometry-of-seeing-A2-distributions-contact.md", "_appendices/2026-05-03-geometry-of-seeing-A3-pmp.md", "_appendices/2026-05-04-geometry-of-seeing-A4-jacobi-elliptic.md", "_appendices/2026-05-05-geometry-of-seeing-A5-sr-exponential.md"])for(const m of read(name).matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(m[1].trim()){new vm.Script(m[1]);scriptCount++;}}
console.log(JSON.stringify({passed:cases,inlineScriptsSyntaxChecked:scriptCount,scope:'20 exact reachability endpoints; phase gap; action clipping; family parameter; 1-second animation; analytical endpoint roots; equal phase units'}));
