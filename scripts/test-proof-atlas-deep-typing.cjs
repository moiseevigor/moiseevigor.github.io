/* Independent path/context/count checks against the emitted native observations.
   Does not import the native query producer or infer kernel types in JavaScript. */
'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),path=require('path');
const repo=path.resolve(__dirname,'..');
const P=require(repo+'/public/js/proof-atlas-packed-routes.js');
const W=require(repo+'/public/js/proof-atlas-occurrence-window.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const folder=process.argv[2]?path.resolve(process.argv[2]):null;
let raw,report,summary,replayRaw,replay;
if(folder){
 raw=fs.readFileSync(folder+'/result.json');report=JSON.parse(raw);
 summary=JSON.parse(fs.readFileSync(folder+'/summary.json'));
 replayRaw=fs.readFileSync(folder+'/public-replay.json');replay=JSON.parse(replayRaw);
}else{
 const host={};require('vm').runInNewContext(fs.readFileSync(repo+'/public/data/proof-atlas/deep-typing-manifest.js','utf8'),{window:host});
 const descriptor=host.PROOF_ATLAS_DEEP_TYPING;assert.equal(descriptor.format,'ProofAtlasDeepContextTypingInventory/1');
 assert.match(descriptor.sha256,/^[a-f0-9]{64}$/);assert.equal(descriptor.file,'/public/data/proof-atlas/deep-typing/'+descriptor.sha256+'.json.gz');
 assert(descriptor.decodedBytes<=8*1024*1024);
 const packed=require('zlib').gunzipSync(fs.readFileSync(repo+descriptor.file),{maxOutputLength:8*1024*1024});
 assert.equal(packed.length,descriptor.decodedBytes);assert.equal(sha(packed),descriptor.sha256);
 const evidence=JSON.parse(packed);assert.equal(evidence.format,'ProofAtlasDeepContextTypingEvidence/1');
 for(const [file,hash]of Object.entries(evidence.producer.sourceFiles))assert.equal(sha(fs.readFileSync(repo+'/'+file)),hash,file);
 assert.equal(sha(fs.readFileSync(repo+'/research/proof-atlas/deep-typing/pack.py')),evidence.producer.packerSha256);
 assert.equal(evidence.browserTypingAttached,false);assert.equal(evidence.queryAlgorithmFormallyVerified,false);
 assert.equal(evidence.sourceModuleBytesVerified,false);assert.equal(evidence.originalMathematicalModulesImported,false);
 report=evidence.nativeResult;raw=Buffer.from(JSON.stringify(report));
 replay=evidence.originalPublicReplay;replayRaw=Buffer.from(JSON.stringify(replay));
 summary={resultSha256:evidence.nativeResultSha256,publicReplay:{outputSha256:sha(replayRaw),packetSha256:replay.inputPacketSha256}};
}
assert.equal(sha(raw),summary.resultSha256);assert.equal(report.status,'PASS');
assert.equal(sha(replayRaw),summary.publicReplay.outputSha256);
assert.equal(replay.status,'PASS');assert.equal(replay.originalProducerClaimUnchanged,true);
assert.equal(replay.originalDeclaration.kernelCheck,'not-claimed');
const publicRaw=require('zlib').gunzipSync(fs.readFileSync(repo+'/'+replay.inputPacketFile));
assert.equal(sha(publicRaw),replay.inputPacketSha256);assert.equal(sha(publicRaw),summary.publicReplay.packetSha256);
const publicSource=JSON.parse(publicRaw);assert.deepEqual(publicSource.declaration,replay.originalDeclaration);
for(const key of ['kind','children','payloads','expanded','neededScope','roots'])assert.deepEqual(publicSource[key],replay.record.source[key]);
const arities=[0,0,0,0,0,2,2,2,3,0,1,1];
function table(data){
 const size=data.kind.length;assert(size>0&&size<=131072);
 for(const key of ['children','payloads','expanded','neededScope'])assert.equal(data[key].length,size);
 for(let i=0;i<size;i++){
  const kind=data.kind[i],cs=data.children[i];assert(kind>=0&&kind<12);assert.equal(cs.length,arities[kind]);
  assert(cs.every(c=>Number.isInteger(c)&&c>=0&&c<i));
  assert.equal(BigInt(data.expanded[i]),1n+cs.reduce((s,c)=>s+BigInt(data.expanded[c]),0n));
  let needed=kind===0?data.payloads[i].index+1:0;
  cs.forEach((c,slot)=>needed=Math.max(needed,data.neededScope[c]-(((kind===6||kind===7)&&slot===1||kind===8&&slot===2)?1:0)));
  assert.equal(data.neededScope[i],needed);
 }
 assert(data.roots.every(r=>Number.isInteger(r)&&r>=0&&r<size));
}
function inspect(data,q){
 let node=data.roots[q.root];const binders=[];
 q.slots.forEach((slot,depth)=>{
  const kind=data.kind[node];assert(Number.isInteger(slot)&&slot>=0&&slot<arities[kind]);
  if((kind===6||kind===7)&&slot===1||kind===8&&slot===2)binders.push({node,depth});
  node=data.children[node][slot];
 });
 const target=data.kind[node]===0?binders[binders.length-1-data.payloads[node].index]:null;
 return {node,binders,target};
}
function audit(data,q){
 const result=inspect(data,q);
 assert.equal(q.node,result.node);assert.deepEqual(q.binderDepths,result.binders.map(b=>b.depth));
 assert.equal(q.bindingTargetDepth,result.target?.depth??null);
 assert.equal(q.typeNamespace,'computed-native-type');assert.equal(q.typeContextRoundtrip,true);
 assert(['proof','type','value'].includes(q.role));
 if(data.declaration.name==='shadowed-shared-variable'&&data.kind[result.node]===0)assert.equal(q.role,'value','Known Nat variable control');
 table(q.typeGraph);assert.equal(q.typeGraph.roots.length,1);
 assert(q.typeGraph.neededScope[q.typeGraph.roots[0]]<=result.binders.length);
 return result;
}
let queries=0,cuts=0,bindings=0,maxDepth=0,maxContext=0;
const controls=new Map();
for(const c of [...report.cases,replay.record]){
 assert.equal(c.sourcePacketExactRoundtrip,true);assert.equal(c.rootTypeKernelChecked,true);assert.equal(c.rootValueConversionKernelChecked,true);
 assert(Array.isArray(c.baselineAxioms)&&!c.baselineAxioms.includes('sorryAx'));
 const data=c.source;table(data);assert.equal(data.roots.length,2);assert(data.roots.every(r=>data.neededScope[r]===0));
 data.declaration={name:c.name,rootPaths:['root.type','root.value']};
 const record={name:c.name,uniqueNodes:data.kind.length,indexSha256:sha(JSON.stringify(data)),sourceSha256:sha('synthetic-core-packet-control')};
 W.validateSource(data,record);
 for(const q of c.queries){
  const expected=audit(data,q),route=P.encode(q.root,q.slots),resolved=P.resolve(data,route);
  assert.equal(resolved.node,expected.node);assert.equal(resolved.scopeDepth,expected.binders.length);
  assert.equal(resolved.binding?.route.depth??null,expected.target?.depth??null);
  if(expected.target){assert.equal(resolved.binding.node,expected.target.node);bindings++;}
  for(const [maxNodes,maxDepth]of [[1,0],[13,2]]){
   const scene=W.create(data,record,route,{maxNodes,maxDepth});
   assert.equal(scene.root.node,expected.node);assert.equal(scene.namespace,'source-expression');
   assert(scene.nodes.every(n=>n.typeStatus==='not-queried'),'Existing source scenes must not inherit a new typing attestation');
   assert.equal(BigInt(scene.stats.retained)+BigInt(scene.stats.hidden),BigInt(data.expanded[expected.node]));cuts++;
  }
  maxDepth=Math.max(maxDepth,q.slots.length);maxContext=Math.max(maxContext,expected.binders.length);queries++;
 }
 controls.set(c.name,c);
}
const shadow=controls.get('shadowed-shared-variable'),outer=shadow.queries[1],inner=shadow.queries[2];
assert.deepEqual(controls.get('deep-reflexivity').queries.map(q=>q.role),['proof','proof','value','value']);
assert.deepEqual(controls.get('dependent-domain').queries.map(q=>q.role),['type','type','value']);
assert.equal(controls.get('forall-scope').queries[0].role,'type');
assert.equal(outer.node,inner.node);assert.notEqual(outer.bindingTargetDepth,inner.bindingTargetDepth);
assert.deepEqual(outer.typeGraph,inner.typeGraph,'These different binder targets deliberately have the same Nat type');
const dependent=controls.get('dependent-domain').queries.at(-1),typeRoot=dependent.typeGraph.roots[0];
assert.equal(dependent.typeGraph.kind[typeRoot],0);assert.equal(dependent.typeGraph.payloads[typeRoot].index,1);
const beforeLet=controls.get('let-value-before-binder').queries[1],afterLet=controls.get('let-value-before-binder').queries[2];
assert.equal(beforeLet.node,afterLet.node);assert.equal(beforeLet.binderDepths.length+1,afterLet.binderDepths.length);
let rejected=0;const refuses=action=>{assert.throws(action);rejected++;};
refuses(()=>audit(shadow.source,{...inner,bindingTargetDepth:outer.bindingTargetDepth}));
refuses(()=>audit(shadow.source,{...inner,binderDepths:outer.binderDepths}));
refuses(()=>audit(shadow.source,{...inner,node:shadow.source.roots[1]}));
refuses(()=>audit(shadow.source,{...inner,root:0}));
refuses(()=>audit(shadow.source,{...inner,typeNamespace:'original-source-occurrence'}));
refuses(()=>audit(shadow.source,{...inner,role:'proof'}));
refuses(()=>audit(shadow.source,{...inner,slots:[...inner.slots,0]}));
refuses(()=>audit(controls.get('let-value-before-binder').source,{...beforeLet,binderDepths:afterLet.binderDepths}));
refuses(()=>audit(shadow.source,{...inner,typeGraph:{...inner.typeGraph,neededScope:inner.typeGraph.neededScope.map(()=>100000)}}));
assert.equal(report.negativeControls.length,8);assert(report.negativeControls.every(n=>n.rejected===true));
const result={status:'PASS',format:'ProofAtlasDeepTypingIndependentAudit/1',nativeResultSha256:sha(raw),
 inputKind:folder?'native-workdir':'compiled-evidence',
 cases:report.cases.length+1,queries,cuts,bindings,maxDepth,maxContext,nativeRejections:8,alteredCorrespondenceRejections:rejected,
 sameSharedNodeAndTypeDifferentBinders:true,dependentTypeRetainsOriginalContext:true,
 letValueUsesPriorContext:true,computedTypeNamespaceSeparate:true,
 existingSourceScenesRemainWithoutTyping:true,javascriptKernelTyping:false,
 publicControlAdditionalNativeTypingReplay:true,publicControlOriginalClaimUnchanged:true,
 scope:'Finite core-only native replay plus independent structural correspondence. No generic corpus, browser typing or arbitrary-size guarantee.'};
if(folder)fs.writeFileSync(folder+'/independent-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
