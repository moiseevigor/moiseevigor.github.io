'use strict';
// Private finite evaluation; this is not a browser kernel certificate.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const C=require('../../../public/js/proof-atlas-context-transport'),L=require('../../../public/js/proof-atlas-context-views');
const base='../../../public/js/',A=require(base+'proof-atlas-library-data'),T=require(base+'proof-atlas-occurrence-types');
const folder=process.argv[2],read=n=>JSON.parse(fs.readFileSync(path.join(folder,n))),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),key=r=>r.root+':'+r.slots.join('.');
const packages=read('transport.json'),ordinary=read('ordinary.json'),rows=[];
let cuts=0,jumps=0,links=0,borrowedBindings=0,comparisons=0,unavailable=0,negative=0,maxVirtual=0,maxEmbedded=0;
for(const pkg of packages){
 assert.equal(pkg.format,'ProofAtlasContextTransportPackage/1');assert.equal(pkg.leanVersion,'4.33.1');assert(pkg.nativeDagMatchesPacket);
 const record=pkg.source,file=path.join(folder,record.name+'.json'),data=JSON.parse(fs.readFileSync(file));assert.equal(hash(file),record.indexSha256);
 const old=ordinary.find(x=>x.source.name===record.name);assert(old?.nativeDagMatchesPacket);assert.deepEqual(old.source,record);
 for(const e of pkg.entries){
  assert.equal(e.status,'checked');const p=C.validate(e,data,record),prior=old.entries.find(x=>key(x.route)===key(e.route));assert(prior);
  if(prior.status==='checked'){assert(L.equal(p.view.graph,p.view.roots[1],prior.typeGraph,prior.typeRoot).equal,record.name+' exact native type');comparisons++;}
  else{assert.equal(prior.status,'unavailable');assert(record.name.includes('.large'));unavailable++;}
  const visit=(component,slots)=>{
   const s=p.scene(component,slots);cuts++;
   assert.equal(BigInt(s.stats.retainedOccurrences)+BigInt(s.stats.hidden),BigInt(s.stats.represented));assert(s.nodes.length<=32);
   for(const n of s.nodes){const origin=p.origin(n.route.slots,p.view.roots[component]);if(origin){assert.equal(A.walk(data,origin.route),origin.node);jumps++;}}
   for(const l of s.links.filter(l=>l.relation==='bound-to')){
    links++;const n=s.nodes.find(n=>n.id===l.from);assert(n);const origin=p.origin(n.route.slots,p.view.roots[component]);
    if(!origin||data.kind[origin.node]!==0)continue;
    const ctx=T.context(data,origin.route).binders,ix=data.payloads[origin.node].index,target=ctx[ctx.length-1-ix];assert(target,'Original variable is bound');
    if(l.targetNamespace==='proof-context'){assert.equal(key(l.route),key(target.route));assert.equal(l.node,target.node);}
    else{const mapped=p.origin(l.route.slots,p.view.roots[component]);assert(mapped,'Borrowed variable cannot be captured by a computed binder');assert.equal(key(mapped.route),key(target.route));assert.equal(mapped.node,target.node);}
    borrowedBindings++;
   }
  };
  for(let component=0;component<3;component++){
   visit(component,[]);
   // Exercise every immediate child and the first few visible exact frontiers.
   const root=p.view.roots[component];for(let j=0;j<p.view.graph.children[root].length;j++)visit(component,[j]);
   const initial=p.scene(component);for(const n of initial.nodes.filter(n=>n.frontier).slice(0,3))visit(component,n.route.slots);
  }
  const changes=[x=>x.kernelOriginalTermTyping='FAIL',x=>x.kernelOriginalTypeTyping='FAIL',x=>x.templatesAreKernelJudgments=true,x=>x.templateInstantiationStructuralRoundtrip=false,x=>x.anchors[0].node++,x=>x.anchors[0].path+='x',x=>x.anchors[0].lift++,x=>x.context.push(x.context[0]),x=>x.roots[1]=-1,x=>x.anchorCollectorTruncated=!x.anchorCollectorTruncated];
  if(e.anchors.some(a=>a.lift>0))changes.push(x=>x.anchors.find(a=>a.lift>0).lift--,x=>x.anchors.find(a=>a.lift>0).sourceContext.push(x.context[0]));
  if(e.anchors.length>1)changes.push(x=>x.anchors.reverse());
  for(const change of changes){const bad=structuredClone(e);change(bad);assert.throws(()=>C.validate(bad,data,record));negative++;}
  const virtual=p.view.stats(),embedding=p.embedded.stats();assert(virtual.virtualNodes<1024);assert(embedding.nodes<1024);maxVirtual=Math.max(maxVirtual,virtual.virtualNodes);maxEmbedded=Math.max(maxEmbedded,embedding.nodes);
  rows.push({name:record.name,route:e.route,sourceNodes:data.kind.length,templateNodes:e.templateGraph.kind.length,anchors:e.anchors.length,lifts:e.anchors.map(a=>a.lift),ordinaryStatus:prior.status,virtual,embedding});
 }
}
assert.equal(packages.length,9);assert.equal(rows.length,13);assert.equal(comparisons,8);assert.equal(unavailable,5);assert(borrowedBindings>0);
for(const maxPairs of [0,-1,NaN,Infinity,131073,1.2]){assert.throws(()=>L.equal({},0,{},0,{maxPairs}));negative++;}
const result={status:'PASS',native:read('native-result.json'),declarations:packages.length,queries:rows.length,exactMaterializedTypeComparisons:comparisons,previousBoundFailures:unavailable,cuts,exactSourceJumpAppearances:jumps,scopeLinkAppearances:links,borrowedBindingComparisons:borrowedBindings,negativeControls:negative,maxVirtual,maxEmbedded,rows,scope:'Nine own native-checked controls. Generic occurrence/type transport, not application/lambda typing traces. No browser integration, public release or human comprehension result. Full packet paging remains open.'};
fs.writeFileSync(path.join(folder,'checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
