'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),A=require('../public/js/proof-atlas-library-data'),T=require('../public/js/proof-atlas-occurrence-types'),V=require('../research/proof-atlas/source_reference_view.cjs'),C=require('../research/proof-atlas/source_reference_validation.cjs');
const [requestsFile,outputFile,ordinaryFile]=process.argv.slice(2),requests=JSON.parse(fs.readFileSync(requestsFile)),outputs=JSON.parse(fs.readFileSync(outputFile)),ordinary=ordinaryFile?JSON.parse(fs.readFileSync(ordinaryFile)):null,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let entries=0,cuts=0,negative=0,borrowed=0,links=0,nativeRootComparisons=0;const large=[],shared=[];
for(const pkg of outputs){
 const q=requests.find(q=>q.source.name===pkg.source.name);assert(q);assert.deepEqual(pkg.source,q.source);assert.equal(pkg.nativeDagMatchesPacket,true);assert.equal(pkg.leanVersion,'4.33.1');assert.equal(pkg.environment.kind,'fresh-source-reference-control/1');assert.equal(pkg.environment.sourceSha256,q.source.sourceSha256);assert(/^[a-f0-9]{64}$/.test(pkg.environment.compiledModuleSha256));assert(/^[a-f0-9]{64}$/.test(pkg.producerSha256));assert.equal(pkg.requestSha256,sha(fs.readFileSync(requestsFile)));
 const raw=fs.readFileSync(q.packetFile);assert.equal(sha(raw),q.source.indexSha256);const data={...JSON.parse(raw),serialization:'ExprDAG/1'},record=q.source;T.validateExpressionGraph(data,data.roots,0,1000000);
 assert.equal(pkg.entries.length,q.routes.length);
 for(const [i,e]of pkg.entries.entries()){
  assert.deepEqual(e.route,q.routes[i]);const {view,derived,comparison}=C.validate(e,data,record);entries++;borrowed+=comparison.borrowedShortcuts;
  if(ordinary&&!record.name.startsWith('AtlasReferenceControl.large')){
   const old=ordinary.find(x=>x.name===record.name).entries.find(x=>JSON.stringify(x.route)===JSON.stringify(e.route));assert.equal(old.status,'checked');assert.equal(old.projectionJudgment.status,'checked');
   require('../public/js/proof-atlas-projections').validateEntry(old,data,old.typeGraph);
   const p=old.projectionJudgment,roots=[p.structure.expressionRoot,p.structure.typeRoot,p.structure.normalizedTypeRoot,p.resultRoot,p.expectedRoot,...p.parameterRoots,...p.previousProjectionRoots];assert.equal(roots.length,view.roots.length);
   for(let j=0;j<roots.length;j++){assert(V.equal(view.graph,view.roots[j],old.typeGraph,roots[j]).equal,'view differs from native materialized graph');nativeRootComparisons++;}
  }
  for(let r=0;r<view.roots.length;r++){
   const v={...view,root:view.roots[r]},s=V.scene(v,record,e.context,[],{maxNodes:13,maxDepth:3,anchors:e.anchors});assert(s.stats.displayed<=13);assert.equal(s.source.template.root,e.roots[r]);assert.deepEqual(s.source.anchors,e.anchors);assert.equal(BigInt(s.stats.retainedOccurrences)+BigInt(s.stats.hidden),BigInt(s.stats.represented));cuts++;links+=s.links.filter(l=>l.relation==='bound-to').length;
   // Every source-backed visible vertex resolves back to the original packet.
   for(const n of s.nodes){const origin=view.origin(n.route.slots,e.anchors,view.roots[r]);if(origin)assert.equal(A.walk(data,origin.route),origin.node);}
  }
  if(record.name.endsWith('.shared'))shared.push({node:e.node,context:e.context});
  if(data.kind.length>32768){
   const result=V.scene({...view,root:view.roots[3]},record,e.context,[],{anchors:e.anchors});
   assert(view.stats().virtualNodes<1024);assert(derived.stats().virtualNodes<1024);assert(comparison.work<1024);assert(e.templateGraph.kind.length<128);
   large.push({name:record.name,role:e.role,storedSourceNodes:data.kind.length,templateNodes:e.templateGraph.kind.length,view:view.stats(),comparison,drawnResultRegions:result.stats.displayed,resultOccurrences:result.stats.represented});
  }
  for(const mutate of [x=>x.anchors[0].route.slots.pop(),x=>x.anchors[0].node++,x=>x.context.reverse(),x=>x.roots[0]=-1,x=>x.index++,x=>x.family='Nat',x=>x.kernelFieldConversion='FAIL',x=>x.templateInstantiationStructuralRoundtrip=false,x=>x.anchors.pop(),x=>x.templateGraph.expanded[0]='9',x=>x.fieldName='wrong']){
   const bad=structuredClone(e);mutate(bad);if(JSON.stringify(bad)===JSON.stringify(e))continue;assert.throws(()=>C.validate(bad,data,record));negative++;
  }
 }
}
assert.equal(outputs.length,19);assert.equal(large.length,4);assert(large.some(x=>x.role==='proof'));assert.equal(shared.length,2);assert.equal(shared[0].node,shared[1].node);assert.notDeepEqual(shared[0].context,shared[1].context);
if(ordinary)assert(nativeRootComparisons>90);
const result={status:'PASS',declarations:outputs.length,entries,cuts,nativeRootComparisons,scopeLinkAppearances:links,negativeControls:negative,borrowedComparisonShortcuts:borrowed,sharedContexts:shared.length,large,scope:'Own synthetic native-checked source-reference experiment. No public reader integration, arbitrary source paging, AI benchmark or comprehension claim.'};
fs.writeFileSync(require('path').join(require('path').dirname(outputFile),'checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
