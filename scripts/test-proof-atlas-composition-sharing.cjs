'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict');
const I=require('../public/js/proof-atlas-introduction-transport'),C=require('../public/js/proof-atlas-context-transport'),L=require('../public/js/proof-atlas-context-views'),T=require('../public/js/proof-atlas-occurrence-types');
// Independent nonmemoizing tree oracle, used only on small acyclic controls.
function treeSame(a,b){if(a===b)return true;if(!a||!b||typeof a!==typeof b||typeof a!=='object'||Array.isArray(a)!==Array.isArray(b))return false;const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&treeSame(a[k],b[k]));}
let seed=74923,cases=0;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function json(depth,pool){if(!depth||random()<.3)return [null,false,true,Math.floor(random()*10),'x'][Math.floor(random()*5)];if(pool.length&&random()<.25)return pool[Math.floor(random()*pool.length)];const out=random()<.5?[]:{};for(let j=0;j<Math.floor(random()*4);j++)out[Array.isArray(out)?out.length:'k'+j]=json(depth-1,pool);pool.push(out);return out;}
for(let j=0;j<2000;j++){const a=json(5,[]),b=j%2===0?JSON.parse(JSON.stringify(a)):json(5,[]);assert.equal(L.same(a,b),treeSame(a,b));cases++;}
let a={n:1},b={n:1};for(let j=0;j<24;j++){a={left:a,right:a};b={left:b,right:b};}const stats={};assert(L.same(a,b,stats));assert.equal(stats.work,50);assert.equal(stats.shortcuts,24);
const child={n:1};assert.equal(L.same({a:child,b:{n:2}},{a:{n:1},b:child}),false);cases++;
const x={n:1},y={n:1};assert(L.same(x,y));y.n=2;assert.equal(L.same(x,y),false);cases++;
const ca={},cb={};ca.x=ca;cb.x=cb;assert.throws(()=>L.same(ca,cb),/JSON comparison bound/);cases++;
// A broad unshared comparison must still reach the unchanged work limit.
assert.throws(()=>L.same(Array(524288).fill(0),Array(524288).fill(0)),/JSON comparison bound/);
let deepA={},deepB={};for(let j=0;j<1025;j++){deepA={x:deepA};deepB={x:deepB};}assert.throws(()=>L.same(deepA,deepB),/JSON comparison bound/);
// Reusing a pair verified at a shallow depth must not evade the depth limit.
const tailA={leaf:1},tailB={leaf:1};let nestedA=tailA,nestedB=tailB;for(let j=0;j<1023;j++){nestedA={x:nestedA};nestedB={x:nestedB};}assert.throws(()=>L.same({first:tailA,second:nestedA},{first:tailB,second:nestedB}),/JSON comparison bound/);
const w={};for(const f of ['source-references-manifest.js','compositional-types-manifest.js'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f,'utf8'),{window:w});
let records=0,anchors=0;
for(const d of w.PROOF_ATLAS_COMPOSITIONAL_TYPES.records){const r=w.PROOF_ATLAS_SOURCE_REFERENCES.edition.declarations.find(r=>r.name===d.name),data=JSON.parse(z.gunzipSync(fs.readFileSync('.'+r.indexFile))),pkg=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.file)));
 for(const e of I.entries(pkg)){const terminal=e.derivation.terminal,c=C.candidates(data,terminal.route);assert(treeSame(c.context,T.context(data,terminal.route).binders));assert(treeSame(terminal.anchors,c.anchors));assert.equal(terminal.anchorCollectorTruncated,c.truncated);records++;
  for(const anchor of c.anchors){const context=T.context(data,anchor.route);assert(treeSame(anchor.sourceContext,context.binders));assert(treeSame(anchor.sourceContext,c.context.slice(0,context.binders.length)));assert.equal(anchor.node,context.node);assert.equal(anchor.lift,c.context.length-context.binders.length);anchors++;}
 }
}
assert.equal(records,44);console.log(JSON.stringify({status:'PASS',records,independentAnchorScopes:anchors,independentJsonCases:cases,sharedDagComparison:stats,workLimit:524288,depthLimit:1024}));
