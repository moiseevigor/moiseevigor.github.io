/* Independent source fields, contexts, scope targets and source-partition audit. */
'use strict';
const fs=require('fs'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict'),path=require('path'),M=require('./model.cjs');
const root=path.resolve(__dirname,'../../..'),folder=process.argv[2]?path.resolve(process.argv[2]):null;
let input,raw,summary,frozenAudit=null;
if(folder){input=fs.readFileSync(folder+'/input.json');raw=fs.readFileSync(folder+'/result.json');summary=JSON.parse(fs.readFileSync(folder+'/summary.json'));}
else{
 const h={};vm.runInNewContext(fs.readFileSync(root+'/public/data/proof-atlas/occurrence-constructions-manifest.js','utf8'),{window:h});
 const d=h.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS;assert.equal(d.format,'ProofAtlasOccurrenceConstructionInventory/1');assert.match(d.sha256,/^[a-f0-9]{64}$/);assert.equal(d.file,'/public/data/proof-atlas/occurrence-constructions/'+d.sha256+'.json.gz');
 const bytes=z.gunzipSync(fs.readFileSync(root+d.file),{maxOutputLength:8388608});assert.equal(bytes.length,d.decodedBytes);assert.equal(M.hash(bytes),d.sha256);
 const e=JSON.parse(bytes);assert.equal(e.format,'ProofAtlasOccurrenceConstructionEvidence/1');assert.equal(e.originalMathematicalModulesImported,false);assert.equal(e.sourceModuleBytesVerified,false);assert.equal(e.queryAlgorithmFormallyVerified,false);assert.equal(e.browserIntegrated,false);
 summary=e.producer;input=Buffer.from(e.inputJson);raw=Buffer.from(e.nativeJson);frozenAudit=e.independentAudit;
 assert.equal(d.packets,summary.cases);assert.equal(d.observations,summary.observations);assert.equal(d.sourceCuts,frozenAudit.compactConstructionCuts);
 assert.equal(d.maxQueryDepth,frozenAudit.maxQueryRouteDepth);assert.equal(d.maxPremiseDepth,frozenAudit.maxPremiseRouteDepth);assert.equal(d.maxQueryContext,frozenAudit.maxQueryContext);assert.equal(d.maxPremiseContext,frozenAudit.maxPremiseContext);assert.equal(d.browserIntegrated,false);assert.equal(d.sourceModuleBytesVerified,false);
}
const A=require('../../../public/js/proof-atlas-library-data');
const producerFile=name=>folder&&fs.existsSync(folder+'/producer/'+name)?folder+'/producer/'+name:__dirname+'/'+name;
assert.equal(M.hash(input),summary.inputSha256);assert.equal(M.hash(raw),summary.resultSha256);assert.equal(M.hash(fs.readFileSync(producerFile('Construction.lean'))),summary.prototypeSha256);assert.equal(summary.frozenRuntimeSha256,'572004714398a6ff2e3639e4477e4a4815cb81c33a924ba057a29529d41bcecc');assert.equal(summary.toolchain,'leanprover/lean4:v4.33.1');assert.equal(summary.compilerCommit,'819816b2e0a3bf405af45ae5c7af2491d8f5bee6');assert.equal(summary.inputsUnchangedDuringReplay,true);
for(const [relative,digest]of Object.entries(summary.sourceFiles)){assert(!path.isAbsolute(relative)&&!relative.split('/').includes('..'));assert.equal(M.hash(fs.readFileSync(root+'/'+relative)),digest,relative);}
const rows=JSON.parse(input),result=JSON.parse(raw),h={};vm.runInNewContext(fs.readFileSync(__dirname+'/../../../public/data/proof-atlas/deep-typing-manifest.js','utf8'),{window:h});const d=h.PROOF_ATLAS_DEEP_TYPING;assert.equal(summary.originalEvidenceSha256,d.sha256);const originalRaw=z.gunzipSync(fs.readFileSync(__dirname+'/../../..'+d.file));assert.equal(M.hash(originalRaw),d.sha256);const original=JSON.parse(originalRaw),sources=[...original.nativeResult.cases,original.originalPublicReplay.record];
const unpack=r=>{const b=Buffer.from(r.slots,'base64url');return Array.from({length:r.depth},(_,i)=>(b[i>>2]>>((i%4)*2))&3);};
function at(g,root,slots){let node=g.roots[root];const binders=[];slots.forEach((s,depth)=>{if((g.kind[node]===6||g.kind[node]===7)&&s===1||g.kind[node]===8&&s===2)binders.push({node,depth});node=g.children[node][s];assert.notEqual(node,undefined);});return{node,binders};}
const nodeHash=(kind,payload,children)=>M.hash(M.canonical([kind,A.payloadKey(kind,payload),children]));
function hashes(g){const out=[];g.kind.forEach((kind,n)=>out.push(nodeHash(kind,g.payloads[n],g.children[n].map(c=>out[c]))));return out;}
// Independent, iterative substitution of the current Pi binder. Internal binders
// increase the cutoff; inserting an ambient source argument lifts its free indices.
function substitutionFingerprint(g,body,source,argument){
 const memo=new Map(),id=s=>[s.mode,s.node,s.depth,s.amount||0].join(':'),stack=[{mode:'sub',node:body,depth:0}],sourceHashes=hashes(source);let lifted=0;
 while(stack.length){const s=stack.pop(),key=id(s);if(memo.has(key))continue;const table=s.mode==='sub'?g:source,kind=table.kind[s.node],payload=table.payloads[s.node];
  if(s.mode==='shift'&&s.amount===0){memo.set(key,sourceHashes[s.node]);continue;}
  if(kind===0){const index=payload.index;
   if(s.mode==='sub'&&index===s.depth){const insert={mode:'shift',node:argument,depth:0,amount:s.depth};if(memo.has(id(insert)))memo.set(key,memo.get(id(insert)));else stack.push(s,insert);continue;}
   const changed=s.mode==='sub'?index>s.depth?index-1:index:index>=s.depth?index+s.amount:index;if(s.mode==='shift'&&changed!==index)lifted++;
   memo.set(key,nodeHash(kind,{...payload,index:changed},[]));continue;
  }
  const children=table.children[s.node].map((node,slot)=>({...s,node,depth:s.depth+(((kind===6||kind===7)&&slot===1||kind===8&&slot===2)?1:0)}));
  if(children.every(c=>memo.has(id(c))))memo.set(key,nodeHash(kind,payload,children.map(c=>memo.get(id(c)))));else stack.push(s,...children.filter(c=>!memo.has(id(c))));
 }
 return{fingerprint:memo.get('sub:'+body+':0:0'),lifted};
}
const k=r=>r.root+':'+unpack(r).join('.');
function audit(scene,source,observations){
 const points=[...scene.nodes,...scene.frontiers],covered=new Set();let represented=0n;
 for(const p of points){assert.equal(p.typeReference.namespace,'computed-native-type');assert.equal(p.typeReference.graphSha256,p.typeGraphSha256);assert.equal(p.typeReference.root,p.typeRoot);assert.deepEqual(p.typeReference.contextSourceRoute,p.route);assert(!('sourceNode'in p.typeReference));}
 for(const n of scene.nodes){const original=at(source,n.route.root,unpack(n.route));assert.equal(n.node,original.node);assert.equal(n.contextLength,original.binders.length);assert.equal(n.expanded,source.expanded[n.node]);assert.equal(source.kind[n.node],n.rule==='Pi-introduction'?6:5);assert(!covered.has(k(n.route)));covered.add(k(n.route));represented++;}
 for(const f of scene.frontiers){const original=at(source,f.route.root,unpack(f.route));assert.equal(f.node,original.node);assert.equal(f.contextLength,original.binders.length);assert.equal(f.expanded,source.expanded[f.node]);assert(!covered.has(k(f.route)));covered.add(k(f.route));represented+=BigInt(f.expanded);
  const query=observations.find(q=>q.source.root===f.recording.queryRoute.root&&JSON.stringify(q.source.slots)===JSON.stringify(unpack(f.recording.queryRoute)));assert(query);const names=query.typeRoots;const kind=f.recording.kind;
  if(kind==='primary-query'){assert.equal(f.typeRoot,query.typeGraph.roots[0]);assert.equal(f.role,query.role);assert.deepEqual(unpack(f.route),query.source.slots);}
  else{const intro=kind==='lambda-introduction-observation',slot=intro?f.field==='binderType'?0:1:f.field==='fn'?0:1,point=query[intro?slot===0?'domain':'body':slot===0?'function':'argument'];assert.equal(f.node,point.node);assert.deepEqual(unpack(f.route),[...query.source.slots,slot]);const component=intro?slot===0?'domain-type':'body-type':slot===0?'function-type':'argument-type';assert.equal(f.typeRoot,query.typeGraph.roots[names.indexOf(component)]);assert.equal(f.role,intro?slot===0?query.domainRole:query.bodyRole:slot===0?query.functionRole:query.argumentRole);}
 }
 assert.equal(represented,BigInt(source.expanded[scene.root.node]));assert.equal(BigInt(scene.stats.retained)+BigInt(scene.stats.hidden),represented);assert.equal(BigInt(scene.stats.retained),BigInt(scene.nodes.length));
 const frontier=scene.frontiers.map(f=>unpack(f.route));for(let i=0;i<frontier.length;i++)for(let j=0;j<frontier.length;j++)if(i!==j)assert.notDeepEqual(frontier[i].slice(0,frontier[j].length),frontier[j]);
 for(const n of scene.nodes){const slots=unpack(n.route);for(const slot of [0,1]){const target={root:n.route.root,slots:[...slots,slot]};assert.equal(points.filter(p=>p.route.root===target.root&&JSON.stringify(unpack(p.route))===JSON.stringify(target.slots)).length,1);}}
 const expectedLinks=scene.frontiers.filter(f=>source.kind[f.node]===0).map(f=>{const original=at(source,f.route.root,unpack(f.route)),target=original.binders.at(-1-source.payloads[f.node].index);assert(target);return{from:k(f.route),node:target.node,root:f.route.root,slots:unpack(f.route).slice(0,target.depth)};});
 assert.equal(scene.links.length,expectedLinks.length);for(const link of scene.links){const expected=expectedLinks.find(x=>x.from===k(link.from));assert(expected);assert.equal(link.namespace,'original-source-context');assert.equal(link.node,expected.node);assert.deepEqual(unpack(link.target),expected.slots);assert.equal(link.countContribution,'0');assert.equal(link.targetDisplayed,scene.nodes.some(n=>k(n.route)===k(link.target)));}
 assert(Buffer.byteLength(JSON.stringify(scene))<=65536);return scene.links.length;
}
let cuts=0,relativeCuts=0,links=0,maxBytes=0,maxRelativeBytes=0,maxDepth=0,maxPremiseDepth=0,maxContext=0,maxQueryContext=0,rejections=0,substitutions=0,liftedVariables=0;const pkg=M.prepare(input,raw,summary);
for(const c of pkg.cases){const row=rows.find(r=>r.name===c.name),native=result.cases.find(r=>r.name===c.name),prior=sources.find(r=>r.name===c.name);
 if(prior)assert.deepEqual(row.source,prior.source);else if(c.name==='AtlasConstructionControl.dependent_argument'){
  assert.equal(M.hash(fs.readFileSync(producerFile('run.py'))),summary.sourceGeneratorSha256);assert.equal(M.hash(M.canonical(row.source)),summary.ownControlSourceGraphSha256);
  const g=row.source,lambda=g.roots[1],app=g.children[lambda][1],fn=g.children[app][0],inner=g.children[fn][1],argument=g.children[app][1];assert.equal(g.kind[lambda],6);assert.equal(g.kind[app],5);assert.equal(g.kind[fn],6);assert.equal(g.kind[inner],6);assert.equal(g.kind[argument],0);assert.equal(g.payloads[argument].index,0);assert.equal(g.children[inner][0],argument);assert.equal(g.children[inner][1],argument);
 }else{
  assert.equal(c.name,'AtlasConstructionControl.deep_dependent_context');assert.equal(M.hash(fs.readFileSync(producerFile('run.py'))),summary.sourceGeneratorSha256);assert.equal(M.hash(M.canonical(row.source)),summary.deepDependentSourceGraphSha256);
  let node=row.source.roots[1],count=0;while(row.source.kind[node]===6){node=row.source.children[node][1];count++;}assert.equal(count,10001);assert.equal(row.source.kind[node],0);assert.equal(row.source.payloads[node].index,9999);
  const q=native.observations[0];assert.equal(q.domain.node,q.body.node);assert.equal(q.domainRole,'type');assert.equal(q.bodyRole,'value');assert.equal(q.contextLength,10000);assert.equal(q.bodyContextLength,10001);assert.equal(q.typeGraph.kind[q.typeGraph.roots[5]],0);assert.equal(q.typeGraph.payloads[q.typeGraph.roots[5]].index,10000);
  const s=c.scene(c.entries[0]),domain=s.frontiers.find(f=>f.field==='binderType'),body=s.frontiers.find(f=>f.field==='body');assert.equal(domain.binding.route.depth,0);assert.equal(body.binding.route.depth,1);const typeOrdinal=q.bodyContextLength-1-q.typeGraph.payloads[q.typeGraph.roots[5]].index;assert.equal(typeOrdinal,0);assert.equal(q.bodyBinderDepths[typeOrdinal],0);
 }
 for(const e of c.entries){const q=native.observations.find(q=>JSON.stringify(q.source.slots)===JSON.stringify(unpack(e.route))),source=at(row.source,e.route.root,unpack(e.route));assert.equal(e.node,source.node);assert.deepEqual(q.binderDepths,source.binders.map(b=>b.depth));assert.equal(q.contextLength,source.binders.length);assert.equal(q.sourceTermContextRoundtrips,true);assert.equal(q.typeContextRoundtrips,true);
  for(const maxNodes of [1,2,7])for(const maxDepth of [0,1,3]){const scene=c.scene(e,{maxNodes,maxDepth}),relative=c.scene(e,{maxNodes,maxDepth,addressing:'query-relative'});assert.equal(scene.source.caseName,c.name);assert.equal(scene.source.sourceGraphSha256,M.hash(M.canonical(row.source)));assert.equal(scene.source.evidenceSha256,summary.resultSha256);assert.equal(c.validateScene(relative),true);assert.deepEqual(c.expandReferences(relative),scene);links+=audit(scene,row.source,native.observations);cuts++;relativeCuts++;maxBytes=Math.max(maxBytes,Buffer.byteLength(JSON.stringify(scene)));maxRelativeBytes=Math.max(maxRelativeBytes,Buffer.byteLength(JSON.stringify(relative)));}
  maxDepth=Math.max(maxDepth,e.route.depth);maxPremiseDepth=Math.max(maxPremiseDepth,...e.premises.map(p=>p.route.depth));maxContext=Math.max(maxContext,q.bodyContextLength||q.contextLength);maxQueryContext=Math.max(maxQueryContext,q.contextLength);
  const h=hashes(q.typeGraph);
  if(q.rule==='Pi-application'){const pi=q.typeGraph.roots[2],body=q.typeGraph.children[pi][1],computed=substitutionFingerprint(q.typeGraph,body,row.source,q.argument.node);assert.equal(computed.fingerprint,h[q.typeGraph.roots[5]]);substitutions++;liftedVariables+=computed.lifted;}
  else{const pi=q.typeGraph.roots[4],domain=q.typeGraph.children[pi][0],body=q.typeGraph.children[pi][1];assert.equal(h[domain],hashes(row.source)[q.domain.node]);assert.equal(h[body],h[q.typeGraph.roots[6]]);}
 }
}
function reject(action){assert.throws(action);rejections++;}
reject(()=>M.prepare(input,Buffer.from('{}'),summary));reject(()=>M.prepare(Buffer.from('[]'),raw,summary));
for(const change of [q=>q.source.node++,q=>q.domain.node++,q=>q.bodyContextLength--,q=>q.bodyBinderDepths.pop(),q=>q.kernelBodyConversion='MISSING',q=>q.domainBeforeBinder=false,q=>q.typeGraph.roots[5]=q.typeGraph.kind.length,q=>q.sourceTermContextRoundtrips=false]){const r=structuredClone(result);change(r.cases[0].observations[0]);const bytes=Buffer.from(JSON.stringify(r));reject(()=>M.prepare(input,bytes,{...summary,resultSha256:M.hash(bytes)}));}
const deep=pkg.cases.find(c=>c.name==='deep-shadowed-context'),scene=deep.scene(deep.entries[0]);assert.equal(deep.entries[0].contextLength,9999);assert.equal(scene.frontiers.find(f=>f.field==='body').contextLength,10000);assert.equal(scene.links[0].target.depth,0);
const changed=structuredClone(scene);assert.equal(deep.data.kind[deep.entries[0].node],6);assert.equal(deep.data.children[deep.entries[0].node][0],deep.data.children[scene.links[0].node][0]);changed.links[0].target=deep.entries[0].route;changed.links[0].node=deep.entries[0].node;reject(()=>audit(changed,deep.data,result.cases.find(c=>c.name===deep.name).observations));
reject(()=>deep.scene({...deep.entries[0]}));reject(()=>deep.scene(deep.entries[0],{maxNodes:14}));
for(const ref of [{query:-1},{query:deep.entries.length},{query:0,prefixDepth:-1},{query:0,prefixDepth:deep.entries[0].route.depth+1},{query:0,slots:[2]},{query:0,slots:[0,1]},{query:0,root:1},{query:0,prefixDepth:0,slots:[0]}])reject(()=>deep.resolveReference(ref));
const compact=deep.scene(deep.entries[0],{addressing:'query-relative'});for(const change of [s=>s.source.caseName+='other',s=>s.source.inputSha256='0'.repeat(64),s=>s.nodes[0].role='proof',s=>s.frontiers[0].typeReference.namespace='source-expression',s=>s.links[0].target={query:0}]){const bad=structuredClone(compact);change(bad);reject(()=>deep.expandReferences(bad));}
reject(()=>pkg.cases[0].expandReferences(compact));assert(maxRelativeBytes<maxBytes);assert.equal(relativeCuts,cuts);
// The caller cannot change the accepted hashes or native bytes after preparation.
const mutableInput=Buffer.from(input),mutableOutput=Buffer.from(raw),mutableExpected=structuredClone(summary),captured=M.prepare(mutableInput,mutableOutput,mutableExpected),before=captured.cases[0].scene(captured.cases[0].entries[0]);
mutableInput.fill(0);mutableOutput.fill(0);mutableExpected.inputSha256='0'.repeat(64);mutableExpected.resultSha256='0'.repeat(64);
assert.deepEqual(captured.cases[0].scene(captured.cases[0].entries[0]),before);
reject(()=>M.prepare(input.toString(),raw,summary));reject(()=>M.prepare(input,new Uint8Array(new SharedArrayBuffer(raw.length)),summary));
assert.equal(cuts,summary.observations*9);assert.equal(maxDepth,summary.deepDependentSourceGraphSha256?10001:10000);assert.equal(maxContext,summary.deepDependentSourceGraphSha256?10001:10000);assert(links>0);if(summary.ownControlSourceGraphSha256)assert(liftedVariables>0);
const report={status:'PASS',cases:pkg.cases.length,nativeObservations:summary.observations,compactConstructionCuts:cuts,queryRelativeCuts:relativeCuts,originalContextLinks:links,captureAvoidingTypeSubstitutions:substitutions,liftedArgumentVariables:liftedVariables,maxQueryRouteDepth:maxDepth,maxPremiseRouteDepth:maxPremiseDepth,maxQueryContext,maxPremiseContext:maxContext,maxPackedSceneBytes:maxBytes,maxRelativeSceneBytes:maxRelativeBytes,consumerRejections:rejections,nativeRejections:result.negativeControls.length,nativeResultSha256:summary.resultSha256,consumerModelSha256:M.hash(fs.readFileSync(__dirname+'/model.cjs')),consumerAuditSha256:M.hash(fs.readFileSync(__filename)),relativeReferencesRecoverExactSource:true,sourceFrontiersPartitionExactly:true,primaryAndPremiseOriginsDistinguished:true,wrongGenuineSameTypedBinderRejected:true,deepTypeAndValueUsesOfSameNodeChecked:!!summary.deepDependentSourceGraphSha256,inputsCapturedBeforePreparation:true,wholeDeclarationConstructionCoverage:false,browserIntegration:false,semanticCompressionMeasured:false,formallyVerifiedConsumer:false};
if(frozenAudit)assert.deepEqual(report,frozenAudit);if(folder)fs.writeFileSync(folder+'/independent-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
