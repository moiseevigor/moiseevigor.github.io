'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const {table,compact,sha}=require('../method-context/catalogue.cjs'),A=require('../../../public/js/proof-atlas-library-data');
const base='research/proof-atlas/region-result-closures/',clone=x=>JSON.parse(JSON.stringify(x));
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const bytes=x=>Buffer.from(JSON.stringify(canonical(x))),digest=x=>sha(bytes(x)),same=(x,y)=>bytes(x).equals(bytes(y));
function sourceContext(g,anchor){let node=g.roots[anchor.route.root];const frames=[];
 for(const [i,slot] of anchor.route.slots.entries()){
  const kind=A.kinds[g.kind[node]],route={root:anchor.route.root,slots:anchor.route.slots.slice(0,i)};
  if((kind==='lam'||kind==='forallE')&&slot===1||kind==='letE'&&slot===2)frames.push({node,kind,route,path:A.path(g,route)});
  node=g.children[node][slot];
 }assert.equal(node,anchor.node,'exact source node/route');return frames;
}
function commonContext(calls){let common=calls[0].context.slice();for(const c of calls){let n=0;while(n<common.length&&n<c.context.length&&same(common[n],c.context[n]))n++;common=common.slice(0,n);}return common;}
function importer(t,g){const memo=new Map();function visit(id){assert(Number.isInteger(id)&&id>=0&&id<g.kind.length);if(memo.has(id))return memo.get(id);assert(t.g.kind.length<131072,'reconstruction cell bound');const node=t.add(g.kind[id],g.payloads[id],g.children[id].map(visit));memo.set(id,node);return node;}return visit;}
function closure(g,call,count,rawType,initial=null){const t=table(),source=importer(t,g);let term,expected;
 if(initial){const visit=importer(t,initial);term=visit(initial.roots[0]);expected=visit(initial.roots[1]);}
 else{const type=importer(t,rawType);term=source(call.anchor.node);expected=type(rawType.roots[0]);}
 for(let i=call.context.length-1;i>=count;i--){const node=call.context[i].node,k=g.kind[node],p=g.payloads[node],cs=g.children[node];
  if(k===6||k===7){const domain=source(cs[0]);term=t.add(6,p,[domain,term]);expected=t.add(7,p,[domain,expected]);}
  else{assert.equal(k,8);const domain=source(cs[0]),value=source(cs[1]);term=t.add(8,p,[domain,value,term]);expected=t.add(8,p,[domain,value,expected]);}
 }return compact(t.g,[term,expected]);
}
function tuple(graphs,steps){const t=table(),ports=graphs.map(g=>{const visit=importer(t,g);return g.roots.map(visit);});
 let [term,type]=ports.at(-1);assert.equal(steps.length,ports.length-1);
 for(let i=ports.length-2;i>=0;i--){const step=steps.find(s=>s.ordinal===i);assert(step);const u=step.universes;
  assert.equal(u.roots.length,3);assert(u.roots.every(r=>u.kind[r]===3));const levels=u.roots.slice(0,2).map(r=>u.payloads[r].level);
  const head=(name,parts)=>t.add(4,{name,nameParts:parts.map(str=>({str})),levels});
  const app=(f,args)=>args.reduce((f,a)=>t.add(5,{},[f,a]),f);
  term=app(head('PProd.mk',['PProd','mk']),[ports[i][1],type,ports[i][0],term]);
  type=app(head('PProd',['PProd']),[ports[i][1],type]);
 }return compact(t.g,[term,type]);
}
function bindGroup(source,group,result){
 assert.equal(result.id,group.id);assert.equal(result.ports.length,group.calls.length);
 assert.deepEqual(group.commonContext,commonContext(group.calls));assert.deepEqual(result.commonContext,group.commonContext);
 for(const [i,call] of group.calls.entries()){
  const port=result.ports[i].port;assert.equal(port.call,call.id);
  assert.deepEqual(port.source,{...call.anchor,path:A.path(source,call.anchor.route)});
  assert.deepEqual(port.context,call.context);
 }
}
function thin(graph){return{canonicalSha256:digest(graph),typeGraph:compact(graph,[graph.roots[1]]),cells:graph.kind.length};}
const mode=process.argv[2]||'--check';assert(['--freeze','--check'].includes(mode));
let record;
if(mode==='--freeze'){
 const folder=process.argv[3];assert(folder);const plan=JSON.parse(fs.readFileSync(path.join(folder,'plan.json'))),verification=JSON.parse(fs.readFileSync(path.join(folder,'verification.json')));
 assert.equal(verification.status,'PASS');
 const profiles=plan.profiles.map((p,i)=>{
  let file=p.record.indexFile;
  if(!file){const packet=fs.readFileSync(p.packetFile);file='/'+base+'controls-'+p.source.indexSha256+'.json.gz';assert.equal(sha(packet),p.source.indexSha256);fs.writeFileSync(file.slice(1),z.gzipSync(packet));}
  const output=JSON.parse(fs.readFileSync(path.join(folder,'output-'+i+'.json')));assert.equal(sha(Buffer.from(JSON.stringify(output))),verification.profiles[i].outputSha256);
  assert.equal(digest(output),verification.profiles[i].outputSha256,'native JSON canonical order');
  const publicOutput=clone(output);for(const g of publicOutput.groups){for(const p of g.ports)p.graph=thin(p.graph);g.tupleGraph=thin(g.tupleGraph);}
  return{source:p.source,record:{...p.record,indexFile:file},originalNativeOwner:p.originalNativeOwner,
   groups:p.groups.map(g=>({...g,calls:g.calls.map(({oldTypeGraph,oldTypeRoot,...c})=>c)})),output:publicOutput};
 });record={format:'ProofAtlasCommonPrefixResultEvidence/1',verification,profiles};
}else record=JSON.parse(z.gunzipSync(fs.readFileSync(base+'native-check.json.gz')));
const published={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/library-manifest.js','utf8'),{window:published});
const modules=published.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15').modules;
for(const [file,hash] of Object.entries(record.verification.privateRiccatiSourceModules.inputs.sources))assert.equal(modules[file.replace('.lean','')].sha256,hash,'private support source agrees with published snapshot');
assert.equal(record.verification.status,'PASS');assert.equal(record.verification.groups,6);assert.equal(record.verification.ports,24);
for(const [file,hash] of Object.entries(record.verification.producerFiles))assert.equal(sha(fs.readFileSync(file)),hash,file);
assert.equal(record.verification.originalEnvironmentIdentityVerified,false);assert.equal(record.verification.dependencyRecovery.independentlyRebuilt,false);
const report={status:'RUNNING',profiles:0,groups:0,ports:0,lambdaSlots:0,letSlots:0,nativeWrongTypeRefusals:0,metadataRefusals:0,resultBindingRefusals:0,compositionChecks:0,nontrivialCompositions:0,sharedClosureCases:[],sourceSizes:[],rows:[]};
for(const [profileIndex,p] of record.profiles.entries()){
 const packet=z.gunzipSync(fs.readFileSync('.'+p.record.indexFile));assert.equal(sha(packet),p.source.indexSha256);const source=JSON.parse(packet);
 report.sourceSizes.push({source:p.source,storedNodes:source.kind.length,bodyOccurrences:source.expanded[source.roots[1]]});
 assert.equal(source.declaration.name,p.source.name);assert.equal(source.declaration.kernelCheck,'PASS');
 let old=null;if(p.originalNativeOwner){const b=z.gunzipSync(fs.readFileSync('.'+p.originalNativeOwner.file));assert.equal(sha(b),p.originalNativeOwner.sha256);old=JSON.parse(b);}
 const full=clone(p.output);assert.deepEqual(full.source,p.source);assert.equal(full.closedPacketKernelTyping,'PASS');
 assert.deepEqual(full.laws.map(l=>l.name),['AtlasResultClosureLaws.wrapper_append','AtlasResultClosureLaws.term_append','AtlasResultClosureLaws.type_append']);for(const [i,law] of full.laws.entries()){assert.equal(law.kernelTyping,'PASS');assert.deepEqual(law.axioms,i===0?[]:['propext']);}
 for(const key of ['originalDeclarationImported','originalModuleImported','privateRiccatiModulesImported','recompiledOriginalTypeAndBodyMatch'])assert.equal(full[key],profileIndex===0,key);
 assert.equal(p.groups.length,full.groups.length);
 for(const [j,group] of p.groups.entries()){
  const result=full.groups[j];bindGroup(source,group,result);assert.equal(result.id,group.id);assert.equal(result.isIndependentBoundaryFunction,false);assert.equal(result.tupleTyping,'PASS');assert.equal(result.ports.length,group.calls.length);
  for(const call of group.calls)assert.deepEqual(sourceContext(source,call.anchor),call.context);
  const common=commonContext(group.calls);assert.deepEqual(group.commonContext,common);assert.deepEqual(result.commonContext,common);
  const header=common.at(-1),prefix=header?{root:header.route.root,slots:[...header.route.slots,header.kind==='letE'?2:1]}:{root:group.calls[0].anchor.route.root,slots:[]};
  assert.deepEqual(group.prefixRoute,prefix);assert.deepEqual(result.prefixRoute,prefix);
  for(const change of [r=>r.ports.shift(),r=>r.ports.push(clone(r.ports[0])),r=>[r.ports[0],r.ports[1]]=[r.ports[1],r.ports[0]],r=>{r.ports[1].port.source=clone(r.ports[0].port.source);r.ports[1].port.context=clone(r.ports[0].port.context);}]){
   const bad=clone(result);change(bad);assert.throws(()=>bindGroup(source,group,bad));report.resultBindingRefusals++;
  }
  const graphs=[];
  for(const [i,call] of group.calls.entries()){
   const entry=result.ports[i],port=entry.port;assert.equal(port.call,call.id);assert.deepEqual(port.source,{...call.anchor,path:A.path(source,call.anchor.route)});assert.deepEqual(port.context,call.context);
   assert.equal(port.commonContextLength,common.length);assert.equal(port.suffixLength,call.context.length-common.length);
   const lets=call.context.slice(common.length).map(h=>h.kind==='letE');assert.deepEqual(port.letSlots,lets);assert.equal(port.argumentCount,lets.filter(x=>!x).length);
   if(old){const junction=old.entries.find(e=>e.id===call.id+':0').junction;
    assert.deepEqual(junction.consumer.anchor,call.anchor);assert.deepEqual(junction.consumer.context,call.context);
    assert.deepEqual(compact(junction.graph,[junction.roots.consumerType]),port.originalType);assert.equal(junction.resultRole,port.originalRole);
   }
   const reconstructed=closure(source,call,common.length,port.originalType);assert.equal(digest(reconstructed),entry.graph.canonicalSha256);assert.equal(reconstructed.kind.length,entry.graph.cells);assert.deepEqual(compact(reconstructed,[reconstructed.roots[1]]),entry.graph.typeGraph);
   const middle=common.length+Math.floor((call.context.length-common.length)/2),composition=port.composition;
   assert.equal(composition.middleContextLength,middle);assert.equal(composition.nontrivial,common.length<middle&&middle<call.context.length);
   for(const key of ['termStructuralEquality','typeStructuralEquality','intermediatePrefixTyping','targetPrefixTyping'])assert.equal(composition[key],'PASS');
   const inner=closure(source,call,middle,port.originalType),staged=closure(source,{...call,context:call.context.slice(0,middle)},common.length,port.originalType,inner);
   assert.deepEqual(staged,reconstructed);report.compositionChecks++;if(composition.nontrivial)report.nontrivialCompositions++;
   entry.graph=canonical(reconstructed);graphs.push(reconstructed);
   for(const k of ['projectionTyping','projectionConversion','instantiationTyping','instantiationConversion'])assert.equal(entry.checks[k],'PASS');assert.equal(entry.checks.wrongTypeRejected,true);
   assert.equal(port.literalReopening,'PASS');assert.equal(port.suffixSupportClosed,'PASS');
   report.ports++;report.nativeWrongTypeRefusals++;report.letSlots+=lets.filter(Boolean).length;report.lambdaSlots+=lets.filter(x=>!x).length;
  }
  const rebuiltTuple=tuple(graphs,result.tupleSteps);assert.equal(digest(rebuiltTuple),result.tupleGraph.canonicalSha256);assert.equal(rebuiltTuple.kind.length,result.tupleGraph.cells);assert.deepEqual(compact(rebuiltTuple,[rebuiltTuple.roots[1]]),result.tupleGraph.typeGraph);result.tupleGraph=canonical(rebuiltTuple);
  for(let i=0;i<graphs.length;i++)for(let k=i+1;k<graphs.length;k++)if(same(graphs[i],graphs[k])){
   const a=group.calls[i],b=group.calls[k];assert.notDeepEqual(a.anchor.route,b.anchor.route);report.sharedClosureCases.push({source:p.source.name,ports:[a.id,b.id],sameStoredSourceNode:a.anchor.node===b.anchor.node,distinctOriginalContexts:!same(a.context,b.context),closureSha256:digest(graphs[i])});
  }
  const validatePlan=g=>{g.calls.forEach(c=>assert.deepEqual(sourceContext(source,c.anchor),c.context));assert.deepEqual(g.commonContext,commonContext(g.calls));};
  for(const change of [g=>g.calls[0].anchor.node++,g=>g.calls[0].anchor.route.slots.push(0),g=>g.calls[0].context[0].node++,g=>g.commonContext.pop(),g=>g.commonContext.push(g.calls[0].context.at(-1))]){
   const bad=clone(group);change(bad);assert.throws(()=>validatePlan(bad));report.metadataRefusals++;
  }
  report.rows.push({source:p.source,id:group.id,commonContext:common,ports:group.calls.map((c,i)=>({call:c.id,source:c.anchor,originalContextLength:c.context.length,suffix:result.ports[i].port.letSlots})),tupleCells:rebuiltTuple.kind.length,tupleSha256:digest(rebuiltTuple)});report.groups++;
 }
 assert.equal(digest(full),record.verification.profiles[profileIndex].outputSha256,'complete native output reconstructed');report.profiles++;
}
report.uniqueSourceCalls=new Set(report.rows.flatMap(row=>row.ports.map(p=>row.source.indexSha256+':'+p.source.route.root+':'+p.source.route.slots.join('.')))).size;assert.equal(report.uniqueSourceCalls,23);
assert.equal(report.profiles,5);assert.equal(report.groups,6);assert.equal(report.ports,24);assert.equal(report.nativeWrongTypeRefusals,24);assert.equal(report.resultBindingRefusals,24);assert.equal(report.compositionChecks,24);assert.equal(report.nontrivialCompositions,14);
const shared=report.sharedClosureCases.find(c=>c.source==='AtlasRegionClosureControls.siblings');assert(shared&&shared.sameStoredSourceNode&&shared.distinctOriginalContexts);
report.status='PASS';report.scope='Exact source contexts and canonical reconstruction of all 24 lambda/let closures, six typed PProd tuple expressions and their complete native outputs. The general wrapper-composition law has no axiom dependencies; its two Expr-specific corollaries record propext; 24 finite two-stage checks include 14 nontrivial intermediates. Native typing/instantiation is fresh finite evidence; no independent boundary-input function or quotient substitution theorem.';
const files=['Controls.lean','prepare-controls.py','prepare.cjs','Laws.lean','ResultClosures.lean','verify.py','check.cjs'].map(n=>base+n);files.push('public/data/proof-atlas/library-manifest.js');
report.files=Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(f))]));
if(mode==='--freeze'){fs.writeFileSync(base+'native-check.json.gz',z.gzipSync(JSON.stringify(record)));fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(JSON.stringify(report,null,2)+'\n'));}
else assert.deepEqual(report,JSON.parse(z.gunzipSync(fs.readFileSync(base+'model-check.json.gz'))));
console.log(JSON.stringify({...report,files:undefined,rows:undefined}));
