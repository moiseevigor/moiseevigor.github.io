'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const I=require('../../../public/js/proof-atlas-introduction-transport'),L=require('../../../public/js/proof-atlas-context-views'),base='../../../public/js/',A=require(base+'proof-atlas-library-data'),T=require(base+'proof-atlas-occurrence-types');
const folder=process.argv[2],read=n=>JSON.parse(fs.readFileSync(path.join(folder,n))),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),key=r=>r.root+':'+r.slots.join('.');
const packages=read('introductions.json'),ordinary=read('ordinary.json'),rows=[];let cuts=0,jumps=0,links=0,bindings=0,negative=0,declared=0,materialized=0,piRules=0,maxNodes=0,maxChildNodes=0;
for(const pkg of packages){
 assert(['ProofAtlasIntroductionTransportPackage/1','ProofAtlasIntroductionTransportPackage/2'].includes(pkg.format));assert.equal(pkg.leanVersion,'4.33.1');assert.equal(pkg.kernelDeclarationTyping,'PASS');assert(pkg.nativeDagMatchesPacket);
 const record=pkg.source,file=path.join(folder,record.name+'.json'),data=JSON.parse(fs.readFileSync(file));assert.equal(hash(file),record.indexSha256);
 const old=ordinary.find(x=>x.source.name===record.name);assert.deepEqual(old.source,record);
 for(const e of I.entries(pkg)){
  const p=I.validate(e,data,record),steps=e.derivation.steps;piRules+=steps.length;
  if(e.route.root===1&&e.route.slots.length===0){
   // Each fixture's declared type was obtained independently by Kernel.check
   // before creating the declaration and extracting these transport records.
   const eq=L.equal(p.graph,p.root,data,data.roots[0]);assert(eq.equal,record.name+' composed type vs original declared type');declared++;
  }else{const prior=old.entries.find(x=>key(x.route)===key(e.route));assert(prior);if(prior.status==='checked'){assert(L.equal(p.graph,p.root,prior.typeGraph,prior.typeRoot).equal,record.name+' vs materialized native type');materialized++;}}
  function visit(slots,options={}){
   const s=p.scene(slots,options);cuts++;const retained=s.nodes.reduce((n,x)=>n+BigInt(x.retainedOccurrences??1),0n);assert.equal(retained+BigInt(s.stats.hidden),BigInt(s.stats.represented));assert(s.nodes.length<=32);
   for(const n of s.nodes){const origin=p.origin(n.route.slots);if(origin){assert.equal(A.walk(data,origin.route),origin.node);jumps++;}else if(p.binderCorrespondence(n.route.slots))assert.equal(n.kind,'forallE');}
   for(const l of s.links.filter(l=>l.relation==='bound-to')){
    links++;const n=s.nodes.find(n=>n.id===l.from);assert(n);const original=p.origin(n.route.slots);if(!original||data.kind[original.node]!==0)continue;
    const ctx=T.context(data,original.route).binders,ix=data.payloads[original.node].index,wanted=ctx[ctx.length-1-ix];assert(wanted,'borrowed variable binding');
    let actual;if(l.targetNamespace==='proof-context')actual=l;else actual=p.binderCorrespondence(l.route.slots)?.source||p.origin(l.route.slots);
    assert(actual,'computed binder needs an exact checked correspondence or borrowed origin');assert.equal(actual.node,wanted.node);assert.equal(key(actual.route),key(wanted.route));bindings++;
   }
  }
  visit([]);visit([],{foldBinders:false,foldApplications:false,maxDepth:5});
  // Every introduced domain is opened before its own new type binder. The
  // body region is opened after it; this exercises both sides of each boundary.
  for(let j=0;j<steps.length;j++){visit([...Array(j).fill(1),0]);visit(Array(j+1).fill(1));assert.equal(p.origin(Array(j).fill(1)),null);assert.deepEqual(p.binderCorrespondence(Array(j).fill(1)).source,steps[j].source);}
  const initial=p.scene();for(const n of initial.nodes.filter(n=>n.frontier).slice(0,3))visit(n.route.slots);
  const changes=[x=>x.kernelOriginalTermTyping='FAIL',x=>x.reconstruction='kernel-equivalence',x=>x.node++,x=>x.path+='x',x=>x.context.push({}),x=>x.sortRoot=-1,x=>x.derivation.terminal.route.slots.push(0),x=>x.derivation.terminal.templatesAreKernelJudgments=true];
  if(steps.length)changes.push(x=>x.derivation.steps[0].kernelBodyTyping='FAIL',x=>x.derivation.steps[0].domainBeforeBinder=false,x=>x.derivation.steps[0].bodyContextExtended=false,x=>x.derivation.steps[0].binderName+='x',x=>x.derivation.steps[0].domain.node++,x=>x.derivation.steps[0].body.route.slots.push(0),x=>x.derivation.steps[0].context.push(x.derivation.steps[0].source),x=>x.derivation.steps.shift());
  if(steps.length>1)changes.push(x=>x.derivation.steps.reverse());
  for(const change of changes){const bad=structuredClone(e);change(bad);assert.throws(()=>I.validate(bad,data,record));negative++;}
  assert.throws(()=>p.graph.kind.map(x=>x));negative++;
  for(const maxNodes of [0,-1,1.2,Infinity,131073]){assert.throws(()=>I.validate(e,data,record,{maxNodes}));negative++;}
  const stats=p.stats();assert(stats.nodes<1024&&stats.child.virtualNodes<1024&&stats.embedding.nodes<1024);maxNodes=Math.max(maxNodes,stats.nodes);maxChildNodes=Math.max(maxChildNodes,stats.child.virtualNodes);
  rows.push({name:record.name,route:e.route,sourceNodes:data.kind.length,introductions:steps.length,terminalTemplateNodes:e.derivation.terminal.templateGraph.kind.length,typeOccurrences:p.graph.expanded[p.root],stats});
 }
}
assert.equal(packages.length,9);assert.equal(rows.length,22);assert.equal(declared,9);assert.equal(materialized,8);assert(bindings>0);
const result={status:'PASS',native:read('introduction-native-result.json'),declarations:packages.length,queries:rows.length,introductionRules:piRules,independentDeclaredTypeComparisons:declared,materializedInnerTypeComparisons:materialized,cuts,sourceJumpAppearances:jumps,scopeLinkAppearances:links,borrowedBindingComparisons:bindings,negativeControls:negative,maxComposedNodes:maxNodes,maxChildNodes,rows,scope:'Nine own native-checked controls, including two formerly unsupported whole-function types. Type composition only, not a full rule derivation for arbitrary terms. No public browser integration, semantic-compression or comprehension claim.'};
fs.writeFileSync(path.join(folder,'introduction-checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
