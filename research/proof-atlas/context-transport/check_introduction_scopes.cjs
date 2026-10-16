'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const I=require('../../../public/js/proof-atlas-introduction-transport'),L=require('../../../public/js/proof-atlas-context-views'),base='../../../public/js/',A=require(base+'proof-atlas-library-data'),T=require(base+'proof-atlas-occurrence-types');
const folder=process.argv[2],read=n=>JSON.parse(fs.readFileSync(path.join(folder,n))),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),key=r=>r.root+':'+r.slots.join('.');
const packages=read('introductions.json'),ordinary=read('ordinary.json'),rows=[];let comparisons=0,cuts=0,jumps=0,links=0,bindings=0,negative=0,rules=0,maxNodes=0,maxContexts=0,maxPackageBytes=0;
const infos=new Set(),universes=new Set();
for(const pkg of packages){
 assert.equal(pkg.format,'ProofAtlasIntroductionTransportPackage/2');assert(pkg.nativeDagMatchesPacket);assert.equal(pkg.leanVersion,'4.33.1');assert.equal(pkg.kernelDeclarationTyping,'PASS');
 const source=pkg.source,data=read(source.name+'.json'),old=ordinary.find(p=>p.source.name===source.name);assert(old?.nativeDagMatchesPacket);assert.deepEqual(old.source,source);assert.equal(hash(path.join(folder,source.name+'.json')),source.indexSha256);
 maxContexts=Math.max(maxContexts,pkg.contexts.length);maxPackageBytes=Math.max(maxPackageBytes,Buffer.byteLength(JSON.stringify(pkg)));
 const actualEntries=[...I.entries(pkg)];assert.equal(actualEntries.length,old.entries.length);
 for(const e of actualEntries){
  const p=I.validate(e,data,source),prior=old.entries.find(x=>key(x.route)===key(e.route));assert.equal(prior?.status,'checked','Independent query unavailable at '+source.name+' '+key(e.route));
  assert.equal(prior.kernelCheck,'PASS');assert(prior.contextWellFormed&&prior.typeAbstractionRoundtrip);T.validateExpressionGraph(prior.typeGraph,[prior.typeRoot],e.context.length,32768);
  assert(L.equal(p.graph,p.root,prior.typeGraph,prior.typeRoot).equal,'Native type mismatch '+source.name+' '+key(e.route));comparisons++;
  for(const step of e.derivation.steps){infos.add(step.binderInfo);rules++;}
  function levelParameters(x){if(!x||typeof x!=='object')return;if(x.kind==='param')universes.add(x.name);for(const value of Object.values(x))if(typeof value==='object')levelParameters(value);}
  for(const payload of data.payloads){levelParameters(payload.level);for(const level of payload.levels||[])levelParameters(level);}
  function visit(slots,options={}){
   const s=p.scene(slots,options);cuts++;const retained=s.nodes.reduce((n,x)=>n+BigInt(x.retainedOccurrences??1),0n);assert.equal(retained+BigInt(s.stats.hidden),BigInt(s.stats.represented));
   for(const n of s.nodes){const o=p.origin(n.route.slots);if(o){assert.equal(A.walk(data,o.route),o.node);jumps++;}}
   for(const l of s.links.filter(l=>l.relation==='bound-to')){
    links++;const n=s.nodes.find(n=>n.id===l.from),o=p.origin(n.route.slots);if(!o||data.kind[o.node]!==0)continue;
    const ctx=T.context(data,o.route).binders,wanted=ctx[ctx.length-1-data.payloads[o.node].index];assert(wanted);const target=l.targetNamespace==='proof-context'?l:p.binderCorrespondence(l.route.slots)?.source||p.origin(l.route.slots);assert(target,'Missing binder correspondence');assert.equal(key(target.route),key(wanted.route));assert.equal(target.node,wanted.node);bindings++;
   }
  }
  visit([]);visit([],{foldBinders:false,foldApplications:false,maxDepth:5});
  for(let j=0;j<e.derivation.steps.length;j++){visit([...Array(j).fill(1),0]);visit(Array(j+1).fill(1));}
  const changes=[x=>x.derivation.terminal.anchors[0].lift++,x=>x.derivation.terminal.context.push({}),x=>x.kernelOriginalTypeTyping='FAIL'];
  if(e.derivation.steps.length)changes.push(x=>x.derivation.steps[0].source.route.slots.push(0),x=>x.derivation.steps[0].kernelBodyConversion='FAIL',x=>x.derivation.steps[0].binderInfo='wrong');
  for(const change of changes){const bad=structuredClone(e);change(bad);assert.throws(()=>I.validate(bad,data,source));negative++;}
  const stats=p.stats();assert(stats.nodes<=2048&&stats.child.virtualNodes<=2048&&stats.embedding.nodes<=2048);maxNodes=Math.max(maxNodes,stats.nodes);
  rows.push({name:source.name,route:e.route,steps:e.derivation.steps.length,templateNodes:e.derivation.terminal.templateGraph.kind.length,stats});
 }
 // These package checks run before any selected observation is trusted.
 for(const change of [x=>x.contexts[1].parent=1,x=>x.entries[0].contextRef=-1,x=>x.entries[0].context=[],x=>x.contexts[1].binder.kind='app',x=>x.contexts[1].binder.route.root=-1,x=>{let parent=0;for(let j=0;j<513;j++){x.contexts.push({parent,binder:x.contexts[1].binder});parent=x.contexts.length-1;}}]){const bad=structuredClone(pkg);change(bad);assert.throws(()=>[...I.entries(bad)]);negative++;}
}
assert.equal(packages.length,11);assert(rows.some(r=>r.name.endsWith('.deep64')&&r.steps===64));assert.deepEqual([...infos].sort(),['default','implicit','instImplicit','strictImplicit']);assert(universes.has('u')&&universes.has('v'));assert.equal(read('native-result.json').prefix65.status,'EXPECTED_BOUND');assert.equal(read('native-result.json').declarationWithoutBody.status,'EXPECTED_REJECTION');assert(bindings>0);
// This is a per-package size bound. The fixture file bundles eleven packages
// for this local audit; a reader would retain only its selected package.
assert(maxPackageBytes<=16*1024*1024);
const result={status:'PASS',native:read('native-result.json'),declarations:packages.length,queries:rows.length,independentNativeTypeComparisons:comparisons,introductionRules:rules,cuts,sourceJumpAppearances:jumps,scopeLinkAppearances:links,borrowedBindingComparisons:bindings,negativeControls:negative,binderInfos:[...infos].sort(),universeParameters:[...universes].sort(),maxComposedNodes:maxNodes,maxContextPrefixes:maxContexts,maxPackageBytes,prefix64:'PASS',prefix65:'EXPLICIT_NATIVE_BOUND',rows,scope:'All selected compiled lambda occurrences in eleven own small declarations. No large theorem-solving or human comprehension benchmark; full source-packet paging and arbitrary application trace composition remain open.'};
fs.writeFileSync(path.join(folder,'checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
