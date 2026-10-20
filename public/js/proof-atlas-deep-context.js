/* Exact finite native records; computed type cuts retain the original source Γ. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes;
 const W=node?require('./proof-atlas-occurrence-window'):host.ProofAtlasOccurrenceWindow;
 const limits=Object.freeze({bytes:8388608,sourceNodes:131072,queries:256,context:131072,typeNodes:13,typeDepth:3});
 const demand=(ok,message)=>{if(!ok)throw Error('Native context record: '+message);};
 const natural=n=>Number.isSafeInteger(n)&&n>=0,hash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
 const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 const digest=text=>A.digest(new TextEncoder().encode(text));
 const routeKey=r=>r.root+':'+r.depth+':'+r.slots;
 const graphFields=['children','expanded','kind','neededScope','payloads','roots','serialization'];
 const graph=data=>Object.fromEntries(graphFields.map(k=>[k,data[k]]));
 const attestedEntries=new WeakSet(),acceptedSources=new WeakMap();
 function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;}
 function descriptor(d){
  demand(d?.format==='ProofAtlasDeepContextTypingInventory/1'&&hash(d.sha256)&&d.file==='/public/data/proof-atlas/deep-typing/'+d.sha256+'.json.gz','inventory identity');
  demand(natural(d.decodedBytes)&&d.decodedBytes>0&&d.decodedBytes<=limits.bytes&&d.packets===9&&d.queries===27,'inventory bounds');
  return d;
 }
 function table(raw,name,sourceSha256,indexSha256,labels){
  demand(raw?.serialization==='ExprDAG/1'&&raw.kind?.length>0&&raw.kind.length<=limits.sourceNodes,'expression table bound');
  const data={...graph(raw),declaration:{name,rootPaths:labels}},record={name,uniqueNodes:raw.kind.length,indexSha256,sourceSha256};
  W.validateSource(data,record);
  for(let i=0;i<data.kind.length;i++){demand(data.kind[i]!==1&&data.kind[i]!==2,'unresolved local or metavariable');A.payloadKey(data.kind[i],data.payloads[i]);}
  return {data,record};
 }
 async function prepare(input,d){
  descriptor(d);
  const encoded=canonical(input)+'\n';demand(new TextEncoder().encode(encoded).length===d.decodedBytes&&await digest(encoded)===d.sha256,'compiled evidence hash');
  const e=freeze(JSON.parse(encoded));
  demand(e.format==='ProofAtlasDeepContextTypingEvidence/1'&&e.producer?.toolchain==='leanprover/lean4:v4.33.1','evidence format/compiler');
  demand(e.queryAlgorithmFormallyVerified===false&&e.sourceModuleBytesVerified===false&&e.originalMathematicalModulesImported===false,'evidence scope');
  demand(e.nativeResult?.status==='PASS'&&e.nativeResult.cases?.length===8&&await digest(canonical(e.nativeResult))===e.nativeResultSha256,'native observation hash');
  const replay=e.originalPublicReplay;
  demand(replay?.status==='PASS'&&replay.originalProducerClaimUnchanged===true&&hash(replay.inputPacketSha256)&&replay.originalDeclaration?.kernelCheck==='not-claimed','original public replay');
  const rows=[...e.nativeResult.cases,replay.record],cases=[],byName=new Map();let queries=0;
  const generator=e.producer.sourceFiles['research/proof-atlas/deep-typing/Controls.lean'];demand(hash(generator),'control generator identity');
  for(const row of rows){
   demand(typeof row.name==='string'&&!byName.has(row.name)&&row.sourcePacketExactRoundtrip===true&&row.rootTypeKernelChecked===true&&row.rootValueConversionKernelChecked===true,'checked case identity');
   demand(Array.isArray(row.baselineAxioms)&&!row.baselineAxioms.includes('sorryAx')&&Array.isArray(row.queries)&&row.queries.length<=limits.queries,'native dependencies/queries');
   const sourceGraphSha256=await digest(canonical(graph(row.source))),original=row===replay.record;
   const sourceSha=original?replay.inputPacketSha256:sourceGraphSha256;
   if(original)demand(row.name===replay.originalDeclaration.name&&canonical(replay.originalDeclaration.rootPaths)===canonical(['root.type','root.value']),'original public namespace');
   const owner=table(row.source,row.name,generator,sourceSha,['root.type','root.value']);
   if(original)owner.data.declaration={...replay.originalDeclaration};
   demand(owner.data.roots.length===2&&owner.data.roots.every(r=>owner.data.neededScope[r]===0),'closed type/value roots');
   const entries=new Map(),list=[];
   for(const q of row.queries){
    demand(natural(q.root)&&q.root===1&&Array.isArray(q.slots)&&q.slots.length<=P.limits.depth&&q.slots.every(s=>natural(s)&&s<3),'query route');
    demand(Array.isArray(q.binderDepths)&&q.binderDepths.length<=limits.context&&['proof','type','value'].includes(q.role)&&q.typeNamespace==='computed-native-type'&&q.typeContextRoundtrip===true,'query context/type');
    const route=P.encode(q.root,q.slots),resolved=P.resolve(owner.data,route),contextNodes=new Uint32Array(q.binderDepths.length);
    let current=owner.data.roots[q.root],ordinal=0;
    for(let depth=0;depth<q.slots.length;depth++){
     const k=owner.data.kind[current],s=q.slots[depth];
     if((k===6||k===7)&&s===1||k===8&&s===2){demand(q.binderDepths[ordinal]===depth,'original context prefix');contextNodes[ordinal++]=current;}
     current=owner.data.children[current][s];
    }
    demand(ordinal===q.binderDepths.length&&q.node===resolved.node&&(resolved.binding?.route.depth??null)===q.bindingTargetDepth,'original occurrence/binder');
    const typeGraphSha256=await digest(canonical(graph(q.typeGraph)));
    const type=table(q.typeGraph,row.name+' / recorded type',generator,typeGraphSha256,['computed.native.type']);
    demand(type.data.roots.length===1&&type.data.neededScope[type.data.roots[0]]<=ordinal,'type context scope');
    const key=routeKey(route),contextDepths=q.binderDepths;demand(!entries.has(key),'duplicate native query');
    const entry=Object.freeze({format:'ProofAtlasDeepTypingAttachment/1',evidenceSha256:d.sha256,caseName:row.name,sourceIndexSha256:sourceSha,sourceGraphSha256,route:freeze(route),node:q.node,role:q.role,contextLength:ordinal,typeGraphSha256,
     typeData:freeze(type.data),typeRecord:freeze(type.record),baselineAxioms:row.baselineAxioms,
     contextAt:index=>{demand(natural(index)&&index<ordinal,'context ordinal');const depth=contextDepths[index];return {ordinal:index,node:contextNodes[index],route:P.prefix(route,depth)};}});
    attestedEntries.add(entry);
    entries.set(key,entry);list.push(entry);queries++;
   }
   const value=Object.freeze({name:row.name,originalPublicPacket:original,sourceGraphSha256,data:freeze(owner.data),record:freeze({...owner.record,indexFile:d.file,syntheticControl:true}),entries:Object.freeze(list),get:route=>{P.parse(route);return entries.get(routeKey(route))||null;}});
   acceptedSources.set(value.data,{sourceGraphSha256,sourceSha,caseName:row.name});
   byName.set(row.name,value);cases.push(value);
  }
  demand(queries===d.queries,'native query inventory');
  return Object.freeze({evidenceSha256:d.sha256,cases:Object.freeze(cases),case:name=>byName.get(name)||null,
   attach:async(data,record)=>{const found=cases.find(c=>c.name===record.name&&c.record.indexSha256===record.indexSha256);if(!found)return null;freeze(data);demand(record.uniqueNodes===found.record.uniqueNodes&&canonical(data.declaration)===canonical(found.data.declaration)&&await digest(canonical(graph(data)))===found.sourceGraphSha256,'selected source table differs');acceptedSources.set(data,{sourceGraphSha256:found.sourceGraphSha256,sourceSha:record.indexSha256,caseName:record.name});return found;}});
 }
 // Existing extraction profiles retain their native provenance and shared type roots.
 async function recorded(sourceBytes,evidenceBytes,d,record){
  demand(sourceBytes?.byteLength>0&&sourceBytes.byteLength<=67108864&&evidenceBytes?.byteLength>0&&evidenceBytes.byteLength<=67108864,'recorded input byte bound');
  const capture=b=>{demand(b instanceof ArrayBuffer||ArrayBuffer.isView(b),'recorded byte buffer');const view=b instanceof ArrayBuffer?new Uint8Array(b):new Uint8Array(b.buffer,b.byteOffset,b.byteLength);demand(view.buffer instanceof ArrayBuffer,'recorded non-shared byte buffer');return view.slice();};
  sourceBytes=capture(sourceBytes);evidenceBytes=capture(evidenceBytes);d=JSON.parse(JSON.stringify(d));record=JSON.parse(JSON.stringify(record));
  demand(hash(d?.sha256)&&hash(record?.indexSha256)&&hash(record.sourceSha256)&&d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256,'recorded descriptor identity');
  demand(natural(record.uniqueNodes)&&record.uniqueNodes>0&&record.uniqueNodes<=P.limits.sourceNodes,'recorded source bound');
  demand(typeof d.edition==='string'&&typeof d.file==='string'&&/^\/public\/data\/proof-atlas\/(occurrence-types|goedel-sample)\/[A-Za-z0-9_.-]+\.json\.gz$/.test(d.file),'recorded evidence location');
  demand(await A.digest(sourceBytes)===record.indexSha256&&await A.digest(evidenceBytes)===d.sha256,'recorded input hash');
  const source=A.validateIndex(JSON.parse(new TextDecoder().decode(sourceBytes)),record),e=JSON.parse(new TextDecoder().decode(evidenceBytes));
  demand(source.kind.length<=P.limits.sourceNodes,'recorded source bound');
  const O=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes;
  demand(O?.validate&&O?.indexObservations,'existing native profile validator');O.validate(e,source,record);demand(e.source.edition===d.edition,'recorded edition');
  const indexed=O.indexObservations(e,source),sourceGraphSha256=await digest(canonical(graph(source))),pools=new Map(),entries=new Map(),list=[];
  freeze(source);
  for(const q of indexed.lookup.values()){
   if(q.status!=='checked')continue;
   demand(list.length<4096,'recorded occurrence inventory bound');
   const route=P.encode(q.route.root,q.route.slots),resolved=P.resolve(source,route),contextDepths=[],contextNodes=new Uint32Array(q.context.length);
   demand(q.context.length<=512&&resolved.node===q.node&&resolved.scopeDepth===q.context.length,'recorded occurrence context');
   q.context.forEach((b,index)=>{demand(b.route.root===q.route.root&&b.route.slots.length<q.route.slots.length&&b.route.slots.every((s,j)=>s===q.route.slots[j])&&P.resolve(source,P.encode(b.route.root,b.route.slots)).node===b.node,'recorded binder prefix');contextDepths.push(b.route.slots.length);contextNodes[index]=b.node;});
   const g=q.typeGraph;let pool=pools.get(g);
   if(!pool){
    // Validate the shared storage once, not once for every recorded root.
    const storage=table({...g,serialization:'ExprDAG/1',roots:[q.typeRoot]},record.name+' / recorded type',record.sourceSha256,d.sha256,['computed.native.type']);
    pool={sha256:await digest(canonical(g)),roots:new Map(),storage:freeze(storage.data)};pools.set(g,pool);
   }
   let component=pool.roots.get(q.typeRoot);
   if(!component){
    const identity={format:'ProofAtlasRecordedTypeComponent/1',evidenceSha256:d.sha256,typeTableSha256:pool.sha256,typeTableRoot:q.typeRoot},componentHash=await digest(canonical(identity));
    component={data:freeze({...pool.storage,roots:[q.typeRoot]}),record:freeze({name:record.name+' / recorded type',uniqueNodes:g.kind.length,indexSha256:componentHash,sourceSha256:record.sourceSha256}),sha256:componentHash};pool.roots.set(q.typeRoot,component);
   }
   demand(component.data.neededScope[q.typeRoot]<=q.context.length,'recorded type context');
   const primary=indexed.entries.get(q.route.root+':'+q.route.slots.join('.'))?.status==='checked',origin=primary?null:q.typingOrigin;
   demand(primary||['application-trace-observation','lambda-introduction-observation'].includes(origin?.kind),'recorded observation origin');
   const queryRoute=primary?route:P.encode(origin.query.route.root,origin.query.route.slots),query=primary?q:indexed.entries.get(origin.query.route.root+':'+origin.query.route.slots.join('.'));
   demand(query?.status==='checked'&&P.resolve(source,queryRoute).node===(primary?q.node:origin.query.node),'recording parent query');
   const recording=freeze({kind:primary?'primary-query':origin.kind,queryRoute,queryNode:query.node,...(origin?{part:origin.part,...(origin.slot?{slot:origin.slot}:{})}:{})});
   const contextLength=q.context.length;
   const entry=Object.freeze({format:'ProofAtlasDeepTypingAttachment/2',profile:'native-extraction-record',evidenceSha256:d.sha256,evidenceFile:d.file,caseName:record.name,sourceIndexSha256:record.indexSha256,sourceGraphSha256,route:freeze(route),node:q.node,role:q.role,contextLength,
    typeTableSha256:pool.sha256,typeTableRoot:q.typeRoot,typeComponentSha256:component.sha256,typeData:component.data,typeRecord:component.record,typeText:q.typeText,recording,
    producerSourceModuleHashVerified:e.sourceModuleHashVerified===true,readerSourceModuleBytesVerified:false,
    contextAt:index=>{demand(natural(index)&&index<contextLength,'recorded context ordinal');return {ordinal:index,node:contextNodes[index],route:P.prefix(route,contextDepths[index])};}});
   attestedEntries.add(entry);entries.set(routeKey(route),entry);list.push(entry);
  }
  demand(list.length===[...indexed.lookup.values()].filter(q=>q.status==='checked').length,'recorded checked inventory');
  const value=Object.freeze({name:record.name,data:source,record:freeze({...record}),sourceGraphSha256,entries:Object.freeze(list),get:route=>{P.parse(route);return entries.get(routeKey(route))||null;},
   provenance:freeze({profile:'native-extraction-record',nativeFormat:e.format,environment:e.environment,packing:e.packing||null,source:e.source,publisherOrigin:record.origin||null,producerSourceModuleHashVerified:e.sourceModuleHashVerified===true,readerSourceModuleBytesVerified:false}),
   stats:Object.freeze({primaryQueries:[...indexed.entries.values()].filter(q=>q.status==='checked').length,unavailableQueries:[...indexed.entries.values()].filter(q=>q.status==='unavailable').length,explicitObservations:indexed.observed,typedOccurrences:list.length,sharedTypeTables:pools.size,typeComponents:[...pools.values()].reduce((s,p)=>s+p.roots.size,0),storedTypeNodes:[...pools.keys()].reduce((s,g)=>s+g.kind.length,0)})});
  acceptedSources.set(source,{sourceGraphSha256,sourceSha:record.indexSha256,caseName:record.name});
  return Object.freeze({evidenceSha256:d.sha256,cases:Object.freeze([value]),case:name=>name===record.name?value:null,
   attach:async(data,target)=>{if(target.name!==record.name||target.indexSha256!==record.indexSha256||target.sourceSha256!==record.sourceSha256)return null;freeze(data);demand(target.uniqueNodes===record.uniqueNodes&&canonical(data.declaration)===canonical(source.declaration)&&await digest(canonical(graph(data)))===sourceGraphSha256,'recorded source table differs');acceptedSources.set(data,{sourceGraphSha256,sourceSha:record.indexSha256,caseName:record.name});return value;}});
 }
 function typeIdentity(entry){return entry.typeTableSha256?{typeTableSha256:entry.typeTableSha256,typeTableRoot:entry.typeTableRoot,typeComponentSha256:entry.typeComponentSha256}:{typeGraphSha256:entry.typeGraphSha256};}
 function typeScene(entry,sourceData,route=P.encode(0,[]),options={}){
  demand(attestedEntries.has(entry)&&['ProofAtlasDeepTypingAttachment/1','ProofAtlasDeepTypingAttachment/2'].includes(entry?.format)&&hash(entry.evidenceSha256),'record attachment');
  const accepted=acceptedSources.get(sourceData);demand(accepted?.sourceGraphSha256===entry.sourceGraphSha256&&accepted.sourceSha===entry.sourceIndexSha256&&accepted.caseName===entry.caseName,'original source attachment');
  demand((options.maxNodes??9)<=limits.typeNodes&&(options.maxDepth??2)<=limits.typeDepth,'type display bounds');
  const raw=W.create(entry.typeData,entry.typeRecord,route,{maxNodes:options.maxNodes??9,maxDepth:options.maxDepth??2,maxLayerNodes:3});
  const nodes=raw.nodes.map(n=>{
   let binding=null;
   if(n.binding)binding={namespace:'computed-native-type',node:n.binding.node,route:n.binding.route};
   else if(n.kind==='bvar'){
    const index=entry.typeData.payloads[n.node].index-n.scopeDepth,ordinal=entry.contextLength-1-index;
    demand(ordinal>=0&&ordinal<entry.contextLength,'recorded ambient type index');const target=entry.contextAt(ordinal);
    demand(P.resolve(sourceData,target.route).node===target.node,'original Γ target');binding={namespace:'original-source-context',...target};
   }
   return {...n,payload:entry.typeData.payloads[n.node],namespace:'computed-native-type',binding,typeStatus:'type-syntax-only'};
  });
  const scene={format:'ProofAtlasCompactTypeScene/1',namespace:'computed-native-type',origin:{evidenceSha256:entry.evidenceSha256,sourceIndexSha256:entry.sourceIndexSha256,sourceRoute:entry.route,...typeIdentity(entry),contextLength:entry.contextLength,...(entry.recording?{recording:entry.recording}:{})},
   root:{node:raw.root.node,route:raw.root.route,category:'recorded-type-expression'},nodes,edges:raw.edges,links:nodes.filter(n=>n.binding).map(n=>({from:n.id,...n.binding})),stats:raw.stats,
   guarantee:'Structure of a recorded native type in its original context. Type descendants have no additional typing judgments.'};
  demand(new TextEncoder().encode(JSON.stringify(scene)).length<=W.limits.metadataBytes,'type scene metadata bound');
  return scene;
 }
 const api={limits,descriptor,prepare,recorded,typeIdentity,typeScene};if(node)module.exports=api;else host.ProofAtlasDeepContext=api;
})(typeof window==='undefined'?globalThis:window);
