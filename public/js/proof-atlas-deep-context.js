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
 const attestedEntries=new WeakSet(),acceptedSources=new WeakMap(),constructionRecords=new WeakMap(),contextDescriptors=new WeakMap(),controlPackages=new WeakMap(),recordedPackages=new WeakSet();
 function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;}
 function expressionEqual(g,a,h,b){
  const todo=[[a,b]],seen=new Set();while(todo.length){const [x,y]=todo.pop(),key=x+':'+y;if(seen.has(key))continue;seen.add(key);
   if(g.kind[x]!==h.kind[y]||A.payloadKey(g.kind[x],g.payloads[x])!==A.payloadKey(h.kind[y],h.payloads[y]))return false;
   if(g.children[x].length!==h.children[y].length)return false;g.children[x].forEach((child,i)=>todo.push([child,h.children[y][i]]));
  }return true;
 }
 function sourceAccepted(entry,source){
  demand(attestedEntries.has(entry),'record attachment');const a=acceptedSources.get(source);
  demand(a?.sourceGraphSha256===entry.sourceGraphSha256&&a.sourceSha===entry.sourceIndexSha256&&a.caseName===entry.caseName,'original source attachment');
 }
 function sourceIdentity(source,record){const a=acceptedSources.get(source);demand(a&&a.caseName===record.name&&a.sourceSha===record.indexSha256&&record.uniqueNodes===source.kind.length,'accepted source identity');return Object.freeze({name:a.caseName,indexSha256:a.sourceSha,sourceGraphSha256:a.sourceGraphSha256});}
 function contextSlot(signature,index){if(signature.base)return index===signature.length-1&&signature.extra?signature.extra:contextSlot(signature.base,index);return{depth:signature.depths[index],node:signature.nodes[index]};}
 function saveConstruction(entry,source,rule,parts,checks,components,recording=entry.recording){
  const intro=rule==='Pi-introduction',definition=rule==='let-binding';demand(intro||definition||rule==='Pi-application','construction rule');
  const fields=definition?['type','value','body']:intro?['binderType','body']:['fn','arg'];
  demand(source.kind[entry.node]===(definition?8:intro?6:5)&&parts.length===fields.length&&parts.every((p,i)=>p.field===fields[i]),'construction source');
  const premises=parts.map((part,slot)=>{
   const route=P.append(entry.route,[slot]),resolved=P.resolve(source,route),contextLength=entry.contextLength+((intro&&slot===1||definition&&slot===2)?1:0);
   demand(resolved.node===source.children[entry.node][slot]&&resolved.scopeDepth===contextLength,'construction field/context');
   demand(['proof','type','value'].includes(part.role)&&entry.typeData.neededScope[part.typeRoot]<=contextLength,'construction premise type');
   const contextAt=index=>{demand(natural(index)&&index<contextLength,'premise context ordinal');return index<entry.contextLength?entry.contextAt(index):{ordinal:index,node:entry.node,route:entry.route};};
   return freeze({...part,node:resolved.node,route,contextLength,contextAt});
  });
  demand(Object.values(checks).every(x=>x==='PASS'),'construction conversions');
  if(definition)demand(Object.values(components).every(root=>natural(root)&&entry.typeData.neededScope[root]<=entry.contextLength),'local-definition component scope');
  const value=freeze({rule,entry,premises,checks,components,recording,...(definition?{contextExtension:{kind:'local-definition',binderName:source.payloads[entry.node].declName,nondep:source.payloads[entry.node].nondep,typeField:'type',valueField:'value',bodyField:'body'}}:{})});constructionRecords.set(entry,value);return value;
 }
 function construction(entry,source){sourceAccepted(entry,source);return constructionRecords.get(entry)||null;}
 async function constructionType(entry,source,field,observation='kernel'){
  const c=construction(entry,source);demand(c,'no native construction record');
  const p=field==='conclusion'?{node:c.entry.node,route:c.entry.route,role:c.entry.role,contextLength:c.entry.contextLength,contextAt:c.entry.contextAt,typeRoot:c.entry.typeData.roots[0]}:c.premises.find(p=>p.field===field);
  demand(p&&['kernel','meta'].includes(observation),'construction type observation');
  const root=observation==='meta'?p.alternateTypeRoot:p.typeRoot;demand(natural(root)&&c.entry.typeData.neededScope[root]<=p.contextLength,'construction type scope');
  const identity={format:'ProofAtlasConstructionTypeComponent/1',evidenceSha256:c.entry.evidenceSha256,...typeIdentity(c.entry),root},componentHash=await digest(canonical(identity));
  const result=Object.freeze({...c.entry,node:p.node,route:p.route,role:p.role,contextLength:p.contextLength,contextAt:p.contextAt,
   typeText:field==='conclusion'?c.entry.typeText:observation==='kernel'?p.typeText:undefined,
   typeData:freeze({...c.entry.typeData,roots:[root]}),typeRecord:freeze({...c.entry.typeRecord,indexSha256:componentHash}),
   ...(c.entry.typeTableSha256?{typeTableRoot:root,typeComponentSha256:componentHash}:{typeComponentRoot:root}),
   recording:freeze({kind:'construction-premise-observation',queryRoute:c.recording?.queryRoute||entry.route,queryNode:c.recording?.queryNode??entry.node,constructionRoute:entry.route,constructionNode:entry.node,field,observation,...(p.typePresentation?{presentation:p.typePresentation}:{}),...(c.recording?.stage?{stage:c.recording.stage}:{}),nativeRecording:c.recording})});
  attestedEntries.add(result);const prior=contextDescriptors.get(c.entry);if(prior)contextDescriptors.set(result,p.contextLength===c.entry.contextLength?prior:{base:prior,length:p.contextLength,extra:{depth:c.entry.route.depth,node:c.entry.node}});return result;
 }
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
  d=JSON.parse(JSON.stringify(d));
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
    attestedEntries.add(entry);contextDescriptors.set(entry,{depths:contextDepths,nodes:contextNodes});
    entries.set(key,entry);list.push(entry);queries++;
   }
   const value=Object.freeze({name:row.name,originalPublicPacket:original,sourceGraphSha256,data:freeze(owner.data),record:freeze({...owner.record,indexFile:d.file,syntheticControl:true}),entries:Object.freeze(list),get:route=>{P.parse(route);return entries.get(routeKey(route))||null;}});
   acceptedSources.set(value.data,{sourceGraphSha256,sourceSha,caseName:row.name});
   byName.set(row.name,value);cases.push(value);
  }
  demand(queries===d.queries,'native query inventory');
  const pkg=Object.freeze({evidenceSha256:d.sha256,cases:Object.freeze(cases),case:name=>byName.get(name)||null,
   attach:async(data,record)=>{record=JSON.parse(JSON.stringify(record));const found=cases.find(c=>c.name===record.name&&c.record.indexSha256===record.indexSha256);if(!found)return null;freeze(data);demand(record.uniqueNodes===found.record.uniqueNodes&&canonical(data.declaration)===canonical(found.data.declaration)&&await digest(canonical(graph(data)))===found.sourceGraphSha256,'selected source table differs');acceptedSources.set(data,{sourceGraphSha256:found.sourceGraphSha256,sourceSha:record.indexSha256,caseName:record.name});return found;}});
  controlPackages.set(pkg,'context');return pkg;
 }
 // The construction control package is separate from the earlier contextual
 // records. Its historical producer/browser flags remain unchanged.
 function constructionDescriptor(d){
  d=JSON.parse(JSON.stringify(d));
  demand(d?.format==='ProofAtlasOccurrenceConstructionInventory/1'&&hash(d.sha256)&&d.file==='/public/data/proof-atlas/occurrence-constructions/'+d.sha256+'.json.gz','construction inventory');
  demand(natural(d.decodedBytes)&&d.decodedBytes<=limits.bytes&&d.packets===8&&d.observations===12,'construction inventory bounds');
  return freeze(d);
 }
 async function prepareConstructions(input,d){
  d=constructionDescriptor(d);
  const encoded=canonical(input)+'\n';demand(new TextEncoder().encode(encoded).length===d.decodedBytes&&await digest(encoded)===d.sha256,'construction evidence hash');
  const e=freeze(JSON.parse(encoded)),producer=e.producer;
  demand(e.format==='ProofAtlasOccurrenceConstructionEvidence/1'&&producer?.toolchain==='leanprover/lean4:v4.33.1'&&producer.compilerCommit==='819816b2e0a3bf405af45ae5c7af2491d8f5bee6','construction compiler/profile');
  demand(e.originalMathematicalModulesImported===false&&e.sourceModuleBytesVerified===false&&e.queryAlgorithmFormallyVerified===false&&e.browserIntegrated===false&&producer.inputsUnchangedDuringReplay===true,'construction producer scope');
  demand(await digest(e.inputJson)===producer.inputSha256&&await digest(e.nativeJson)===producer.resultSha256,'exact construction native bytes');
  const rows=JSON.parse(e.inputJson),native=JSON.parse(e.nativeJson),cases=[],byName=new Map();let count=0;
  demand(native.status==='PASS'&&native.format==='ProofAtlasDeepConstructionPrototype/1'&&native.cases.length===8&&rows.length===8,'construction native envelope');
  demand(native.originalMathematicalModulesImported===false&&native.sourceModuleBytesVerified===false&&native.queryAlgorithmFormallyVerified===false,'construction native scope');
  const generator=producer.sourceGeneratorSha256;demand(hash(generator),'construction generator');
  for(const row of rows){
   const result=native.cases.find(c=>c.name===row.name);demand(result&&!byName.has(row.name)&&result.rootTypeKernelChecked===true&&result.rootValueConversionKernelChecked===true,'construction checked roots');
   demand(Array.isArray(result.baselineAxioms)&&!result.baselineAxioms.includes('sorryAx')&&result.observations.length===row.requests.length&&result.observations.length<=limits.queries,'construction inventory/dependencies');
   const sourceGraphSha256=await digest(canonical(graph(row.source))),owner=table(row.source,row.name,generator,sourceGraphSha256,['root.type','root.value']);
   demand(owner.data.roots.length===2&&owner.data.roots.every(r=>owner.data.neededScope[r]===0),'construction closed source roots');
   freeze(owner.data);acceptedSources.set(owner.data,{sourceGraphSha256,sourceSha:sourceGraphSha256,caseName:row.name});
   const entries=new Map(),list=[];
   for(let index=0;index<result.observations.length;index++){
    const q=result.observations[index],request=row.requests[index],intro=q.rule==='Pi-introduction';
    demand(intro||q.rule==='Pi-application','construction kind');
    demand(q.rule===request.rule&&q.source.root===1&&canonical(q.source.slots)===canonical(request.slots),'construction request');
    demand(q.sourceTermContextRoundtrips===true&&q.typeContextRoundtrips===true&&q.precedingQueryAgreement===true&&['proof','type','value'].includes(q.role),'construction context roundtrips');
    const route=P.encode(1,q.source.slots),selected=P.resolve(owner.data,route),depths=q.binderDepths,nodes=new Uint32Array(depths.length);let current=owner.data.roots[1],ordinal=0;
    demand(depths.length<=limits.context&&q.contextLength===depths.length&&selected.node===q.source.node&&selected.scopeDepth===depths.length,'construction original occurrence');
    for(let depth=0;depth<q.source.slots.length;depth++){const slot=q.source.slots[depth],kind=owner.data.kind[current];if((kind===6||kind===7)&&slot===1||kind===8&&slot===2){demand(depths[ordinal]===depth,'construction original binder');nodes[ordinal++]=current;}current=owner.data.children[current][slot];}
    demand(ordinal===depths.length,'construction original context');
    const g=q.typeGraph,labels=intro?['lambda-type','domain-expression','domain-type','domain-sort','pi-type','body-type','expected-body-type']:['result-type','function-type','pi-type','expected-domain','argument-type','substituted-result'];
    demand(canonical(q.typeRoots)===canonical(labels)&&g.roots.length===labels.length,'construction type components');
    const graphSha=await digest(canonical(graph(g))),type=table({...g,roots:[g.roots[0]]},row.name+' / construction type',generator,graphSha,['computed.native.type']);
    g.roots.forEach((root,j)=>demand(natural(root)&&root<g.kind.length&&g.neededScope[root]<=depths.length+(intro&&j>=5?1:0),'construction type component scope'));
    const entry=Object.freeze({format:'ProofAtlasDeepTypingAttachment/1',profile:'core-construction-replay',evidenceSha256:d.sha256,evidenceFile:d.file,caseName:row.name,sourceIndexSha256:sourceGraphSha256,sourceGraphSha256,route,node:q.source.node,role:q.role,contextLength:ordinal,typeGraphSha256:graphSha,typeComponentRoot:g.roots[0],typeData:freeze(type.data),typeRecord:freeze(type.record),baselineAxioms:result.baselineAxioms,
     recording:freeze({kind:'primary-query',queryRoute:route,queryNode:q.source.node,nativeProfile:native.format}),
     contextAt:i=>{demand(natural(i)&&i<ordinal,'construction context ordinal');return {ordinal:i,node:nodes[i],route:P.prefix(route,depths[i])};}});
    attestedEntries.add(entry);contextDescriptors.set(entry,{depths,nodes});
    const checkPoint=(point,slot)=>demand(point.root===1&&point.node===owner.data.children[entry.node][slot]&&canonical(point.slots)===canonical([...q.source.slots,slot]),'construction recorded source field');
    if(intro){
     checkPoint(q.domain,0);checkPoint(q.body,1);
     demand(q.domainBeforeBinder===true&&q.bodyContextExtended===true&&q.bodyContextLength===ordinal+1&&canonical(q.bodyBinderDepths)===canonical([...depths,route.depth])&&q.domainRole==='type','construction introduction context');
     demand(g.kind[g.roots[3]]===3&&g.kind[g.roots[4]]===7&&expressionEqual(owner.data,q.domain.node,g,g.roots[1])&&expressionEqual(g,g.children[g.roots[4]][0],g,g.roots[1]),'construction introduction domain');
     saveConstruction(entry,owner.data,q.rule,[{field:'binderType',role:q.domainRole,typeRoot:g.roots[2]},{field:'body',role:q.bodyRole,typeRoot:g.roots[5]}],Object.fromEntries(['kernelDomainSort','kernelBinderConversion','kernelBodyConversion','kernelFunctionConversion'].map(k=>[k,q[k]])),{pi:g.roots[4],domainExpression:g.roots[1],domainSort:g.roots[3],expectedDomain:g.children[g.roots[4]][0],expectedBody:g.roots[6]},entry.recording);
    }else{
     checkPoint(q.function,0);checkPoint(q.argument,1);demand(g.kind[g.roots[2]]===7&&g.children[g.roots[2]][0]===g.roots[3],'construction application Pi');
     saveConstruction(entry,owner.data,q.rule,[{field:'fn',role:q.functionRole,typeRoot:g.roots[1]},{field:'arg',role:q.argumentRole,typeRoot:g.roots[4]}],Object.fromEntries(['kernelFunctionConversion','kernelDomainConversion','kernelResultConversion'].map(k=>[k,q[k]])),{pi:g.roots[2],expectedDomain:g.roots[3],substitutedResult:g.roots[5]},entry.recording);
    }
    demand(!entries.has(routeKey(route)),'duplicate construction source');entries.set(routeKey(route),entry);list.push(entry);count++;
   }
   for(const query of [...list])for(const part of constructionRecords.get(query).premises){if(entries.has(routeKey(part.route)))continue;const observation=await constructionType(query,owner.data,part.field);entries.set(routeKey(observation.route),observation);list.push(observation);}
   const c=Object.freeze({name:row.name,sourceGraphSha256,data:freeze(owner.data),record:freeze({...owner.record,indexFile:d.file,syntheticControl:true}),entries:Object.freeze(list),get:r=>{P.parse(r);return entries.get(routeKey(r))||null;},constructionProvenance:freeze({profile:'core-construction-replay',evidenceSha256:d.sha256,inputSha256:producer.inputSha256,nativeResultSha256:producer.resultSha256,originalMathematicalModulesImported:false,sourceModuleBytesVerified:false})});
   acceptedSources.set(c.data,{sourceGraphSha256,sourceSha:c.record.indexSha256,caseName:c.name});cases.push(c);byName.set(c.name,c);
  }
  demand(count===12,'construction total');
  const pkg=Object.freeze({evidenceSha256:d.sha256,cases:Object.freeze(cases),case:name=>byName.get(name)||null,attach:async(data,record)=>{record=JSON.parse(JSON.stringify(record));const c=byName.get(record.name);if(!c||record.indexSha256!==c.record.indexSha256)return null;freeze(data);demand(canonical(data.declaration)===canonical(c.data.declaration)&&await digest(canonical(graph(data)))===c.sourceGraphSha256,'construction selected source');acceptedSources.set(data,{sourceGraphSha256:c.sourceGraphSha256,sourceSha:record.indexSha256,caseName:c.name});return c;}});
  controlPackages.set(pkg,'construction');return pkg;
 }
 function mergeControls(baseline,supplement){
  demand(controlPackages.get(baseline)==='context'&&controlPackages.get(supplement)==='construction','sealed control packages');
  const cases=[],byName=new Map(),pendingConstructions=[];
  for(const original of baseline.cases){
   const extra=supplement.case(original.name);if(!extra){cases.push(original);byName.set(original.name,original);continue;}
   demand(extra.sourceGraphSha256===original.sourceGraphSha256,'control source correspondence');
   const entries=new Map(original.entries.map(e=>[routeKey(e.route),e]));
   for(const e of extra.entries){
    const alias=e.sourceIndexSha256===original.record.indexSha256?e:Object.freeze({...e,sourceIndexSha256:original.record.indexSha256});
    attestedEntries.add(alias);contextDescriptors.set(alias,contextDescriptors.get(e));
    const native=constructionRecords.get(e);
    if(alias!==e&&native)saveConstruction(alias,original.data,native.rule,native.premises,native.checks,native.components,native.recording);
    const previous=entries.get(routeKey(alias.route));
    if(previous){
     const a=contextDescriptors.get(previous),b=contextDescriptors.get(alias);
     demand(previous.node===alias.node&&previous.role===alias.role&&previous.contextLength===alias.contextLength&&expressionEqual(previous.typeData,previous.typeData.roots[0],alias.typeData,alias.typeData.roots[0]),'control query/type agreement');
     for(let i=0;i<previous.contextLength;i++){const x=contextSlot(a,i),y=contextSlot(b,i);demand(x.depth===y.depth&&x.node===y.node,'control ordered context agreement');}
     if(native)pendingConstructions.push([previous,constructionRecords.get(alias)]);
    }else entries.set(routeKey(alias.route),alias);
   }
   const c=Object.freeze({...original,entries:Object.freeze([...entries.values()]),get:r=>{P.parse(r);return entries.get(routeKey(r))||null;},constructionProvenance:extra.constructionProvenance});cases.push(c);byName.set(c.name,c);
  }
  for(const c of supplement.cases)if(!byName.has(c.name)){cases.push(c);byName.set(c.name,c);}
  for(const [entry,native]of pendingConstructions)constructionRecords.set(entry,native);
  return Object.freeze({cases:Object.freeze(cases),case:name=>byName.get(name)||null,attach:async(data,record)=>{const c=byName.get(record.name);if(!c)return null;const original=baseline.case(record.name);const found=await (original?baseline:supplement).attach(data,record);return found?c:null;}});
 }
 // Existing extraction profiles retain their native provenance and shared type roots.
 async function recorded(sourceBytes,evidenceBytes,d,record){return recordedProfile(sourceBytes,evidenceBytes,d,record,false);}
 async function recordedLets(sourceBytes,evidenceBytes,d,record){return recordedProfile(sourceBytes,evidenceBytes,d,record,true);}
 async function recordedProfile(sourceBytes,evidenceBytes,d,record,letMetadata){
  demand(sourceBytes?.byteLength>0&&sourceBytes.byteLength<=67108864&&evidenceBytes?.byteLength>0&&evidenceBytes.byteLength<=67108864,'recorded input byte bound');
  const capture=b=>{demand(b instanceof ArrayBuffer||ArrayBuffer.isView(b),'recorded byte buffer');const view=b instanceof ArrayBuffer?new Uint8Array(b):new Uint8Array(b.buffer,b.byteOffset,b.byteLength);demand(view.buffer instanceof ArrayBuffer,'recorded non-shared byte buffer');return view.slice();};
  sourceBytes=capture(sourceBytes);evidenceBytes=capture(evidenceBytes);d=JSON.parse(JSON.stringify(d));record=JSON.parse(JSON.stringify(record));
  demand(hash(d?.sha256)&&hash(record?.indexSha256)&&hash(record.sourceSha256)&&d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256,'recorded descriptor identity');
  demand(natural(record.uniqueNodes)&&record.uniqueNodes>0&&record.uniqueNodes<=P.limits.sourceNodes,'recorded source bound');
  const location=letMetadata?/^\/public\/data\/proof-atlas\/let-result-pools\/[A-Za-z0-9_.-]+\.index\.json\.gz$/:/^\/public\/data\/proof-atlas\/(occurrence-types|goedel-sample|eliminations|beta-reductions|packet-types|use-site-types|recursion-examples)\/[A-Za-z0-9_.-]+\.json\.gz$/;
  demand(typeof d.edition==='string'&&typeof d.file==='string'&&location.test(d.file),'recorded evidence location');
  demand(await A.digest(sourceBytes)===record.indexSha256&&await A.digest(evidenceBytes)===d.sha256,'recorded input hash');
  const source=A.validateIndex(JSON.parse(new TextDecoder().decode(sourceBytes)),record),e=JSON.parse(new TextDecoder().decode(evidenceBytes));
  demand(source.kind.length<=P.limits.sourceNodes,'recorded source bound');
  const O=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes;
  demand(O?.validate&&O?.indexObservations,'existing native profile validator');
  let indexed;
  if(letMetadata){
   const L=node?require('./proof-atlas-let-reduction'):host.ProofAtlasLetReduction,I=node?require('./proof-atlas-let-pools'):host.ProofAtlasLetPools;
   demand(L?.validateMetadata&&I?.validateIndex&&natural(d.decodedBytes)&&d.decodedBytes===evidenceBytes.byteLength&&d.decodedBytes<=8388608,'bounded let metadata profile');
   I.validateIndex(e,d,source,record,L.validateMetadata);
   const entries=new Map(e.entries.map(q=>[q.route.root+':'+q.route.slots.join('.'),q.status==='checked'?{...q,typeGraph:e.typeGraph}:q])),view=L.indexPremises([...entries.values()],source);
   indexed={entries,lookup:new Map(e.entries.filter(q=>q.status!=='checked').map(q=>[q.route.root+':'+q.route.slots.join('.'),q])),observed:view.observed};
   for(const q of view.observations)indexed.lookup.set(q.route.root+':'+q.route.slots.join('.'),q);
  }else{O.validate(e,source,record);indexed=O.indexObservations(e,source);}
  demand(e.source.edition===d.edition,'recorded edition');
  const sourceGraphSha256=await digest(canonical(graph(source))),pools=new Map(),entries=new Map(),list=[];
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
   demand(primary||['application-trace-observation','lambda-introduction-observation',...(letMetadata?['let-premise-observation']:[])].includes(origin?.kind),'recorded observation origin');
   const queryRoute=primary?route:P.encode(origin.query.route.root,origin.query.route.slots),query=primary?q:indexed.entries.get(origin.query.route.root+':'+origin.query.route.slots.join('.'));
   demand(query?.status==='checked'&&P.resolve(source,queryRoute).node===(primary?q.node:origin.query.node),'recording parent query');
   const nativeRecording=O.recording?.(e);
   const recording=freeze({kind:primary?'primary-query':origin.kind,queryRoute,queryNode:query.node,...(origin?{part:origin.part,...(origin.presentation?{presentation:origin.presentation}:{}),...(origin.slot?{slot:origin.slot}:{})}:{}),...(nativeRecording?{native:nativeRecording}:{})});
   const contextLength=q.context.length;
   const entry=Object.freeze({format:'ProofAtlasDeepTypingAttachment/2',profile:letMetadata?'native-let-extraction-record':'native-extraction-record',evidenceSha256:d.sha256,evidenceFile:d.file,caseName:record.name,sourceIndexSha256:record.indexSha256,sourceGraphSha256,route:freeze(route),node:q.node,role:q.role,contextLength,
    typeTableSha256:pool.sha256,typeTableRoot:q.typeRoot,typeComponentSha256:component.sha256,typeData:component.data,typeRecord:component.record,typeText:q.typeText,recording,
    producerSourceModuleHashVerified:e.sourceModuleHashVerified===true,readerSourceModuleBytesVerified:false,
    contextAt:index=>{demand(natural(index)&&index<contextLength,'recorded context ordinal');return {ordinal:index,node:contextNodes[index],route:P.prefix(route,contextDepths[index])};}});
   attestedEntries.add(entry);contextDescriptors.set(entry,{depths:contextDepths,nodes:contextNodes});entries.set(routeKey(route),entry);list.push(entry);
   if(letMetadata&&q.letJudgment?.status==='checked'){
    const z=q.letJudgment;
    saveConstruction(entry,source,'let-binding',[
     {field:'type',role:'type',typeRoot:z.type.typeRoot,typeText:A.describe(g,z.type.typeRoot),typePresentation:'compiled-constructor-summary'},
     {field:'value',role:z.value.role,typeRoot:z.value.typeRoot,typeText:z.value.typeText},
     {field:'body',role:z.body.role,typeRoot:z.body.typeRoot,typeText:z.body.typeText}
    ],Object.fromEntries(['kernelDomainSort','kernelValueConversion','kernelTermConversion','kernelResultTyping','kernelResultTypeConversion','kernelSubstitutedTypeConversion'].map(k=>[k,z[k]])),
    {declaredType:z.type.expressionRoot,declaredSort:z.type.sortRoot,expectedValueType:z.value.expectedRoot,substitutedBodyType:z.substitutedTypeRoot,reducedType:z.reducedTypeRoot},recording);
   }else if(q.lambdaJudgment?.status==='checked'){
    const t=q.lambdaJudgment;
    saveConstruction(entry,source,'Pi-introduction',[
     {field:'binderType',role:'type',typeRoot:t.domain.typeRoot,typeText:t.domain.typeText},
     {field:'body',role:t.body.role,typeRoot:t.body.typeRoot,typeText:t.body.text}
    ],Object.fromEntries(['kernelDomainSort','kernelBinderConversion','kernelBodyConversion','kernelFunctionConversion'].map(k=>[k,t[k]])),
    {pi:t.piRoot,domainExpression:t.domain.expressionRoot,domainSort:t.domain.sortRoot,expectedDomain:t.domain.piDomainRoot,expectedBody:t.body.expectedRoot},recording);
   }else if(q.applicationJudgment?.status==='checked'){
    const s=q.applicationJudgment.stages.at(-1),arg=q.arguments.at(-1);
    saveConstruction(entry,source,'Pi-application',[
     {field:'fn',role:s.functionRole,typeRoot:s.beforeRoot,typeText:s.beforeText},
     {field:'arg',role:arg.role,typeRoot:s.actualRoot,typeText:s.argumentText,alternateTypeRoot:arg.typeRoot,alternateObservation:'meta-inferred-argument'}
    ],Object.fromEntries(['kernelFunctionConversion','kernelDomainConversion','kernelResultConversion'].map(k=>[k,s[k]])),
    {pi:s.piRoot,expectedDomain:s.domainRoot,substitutedResult:s.substitutedRoot},freeze({...recording,stage:s.slot}));
   }
  }
  demand(list.length===[...indexed.lookup.values()].filter(q=>q.status==='checked').length,'recorded checked inventory');
  const value=Object.freeze({name:record.name,data:source,record:freeze({...record}),sourceGraphSha256,entries:Object.freeze(list),get:route=>{P.parse(route);return entries.get(routeKey(route))||null;},
   provenance:freeze({profile:letMetadata?'native-let-extraction-record':'native-extraction-record',...(letMetadata?{letPacking:{method:e.resultPacking.method,pools:e.resultPacking.pools.length,reducedPoolsLoaded:false}}:{}),nativeFormat:e.format,environment:e.environment,packing:e.packing||null,source:e.source,publisherOrigin:record.origin||null,producerSourceModuleHashVerified:e.sourceModuleHashVerified===true,readerSourceModuleBytesVerified:false}),
   stats:Object.freeze({primaryQueries:[...indexed.entries.values()].filter(q=>q.status==='checked').length,unavailableQueries:[...indexed.entries.values()].filter(q=>q.status==='unavailable').length,explicitObservations:indexed.observed,typedOccurrences:list.length,sharedTypeTables:pools.size,typeComponents:[...pools.values()].reduce((s,p)=>s+p.roots.size,0),storedTypeNodes:[...pools.keys()].reduce((s,g)=>s+g.kind.length,0)})});
  acceptedSources.set(source,{sourceGraphSha256,sourceSha:record.indexSha256,caseName:record.name});
  const pkg=Object.freeze({evidenceSha256:d.sha256,cases:Object.freeze([value]),case:name=>name===record.name?value:null,
   attach:async(data,target)=>{if(target.name!==record.name||target.indexSha256!==record.indexSha256||target.sourceSha256!==record.sourceSha256)return null;freeze(data);demand(target.uniqueNodes===record.uniqueNodes&&canonical(data.declaration)===canonical(source.declaration)&&await digest(canonical(graph(data)))===sourceGraphSha256,'recorded source table differs');acceptedSources.set(data,{sourceGraphSha256,sourceSha:record.indexSha256,caseName:record.name});return value;}});recordedPackages.add(pkg);return pkg;
 }
 function mergeRecorded(baseline,supplement){
  demand(recordedPackages.has(baseline)&&recordedPackages.has(supplement)&&baseline.cases.length===1&&supplement.cases.length===1,'sealed recorded packages');
  const original=baseline.cases[0],extra=supplement.cases[0];
  demand(extra.provenance.profile==='native-let-extraction-record'&&!original.provenance.supplementalLetMetadata,'one let metadata supplement');
  demand(original.name===extra.name&&original.provenance.source.edition===extra.provenance.source.edition&&original.record.indexSha256===extra.record.indexSha256&&original.record.sourceSha256===extra.record.sourceSha256&&original.sourceGraphSha256===extra.sourceGraphSha256,'let source correspondence');
  const entries=new Map(original.entries.map(e=>[routeKey(e.route),e])),pending=[];let overlap=0;
  for(const entry of extra.entries){
   const previous=entries.get(routeKey(entry.route));
   if(!previous){entries.set(routeKey(entry.route),entry);continue;}
   demand(previous.node===entry.node&&previous.role===entry.role&&previous.contextLength===entry.contextLength&&expressionEqual(previous.typeData,previous.typeData.roots[0],entry.typeData,entry.typeData.roots[0]),'let observation/type agreement');
   const a=contextDescriptors.get(previous),b=contextDescriptors.get(entry);
   for(let i=0;i<entry.contextLength;i++){const x=contextSlot(a,i),y=contextSlot(b,i);demand(x.depth===y.depth&&x.node===y.node,'let ordered context agreement');}
   const c=constructionRecords.get(entry);
   if(c){demand(!constructionRecords.has(previous),'duplicate native construction at source occurrence');pending.push([previous,c]);}overlap++;
  }
  const value=Object.freeze({...original,entries:Object.freeze([...entries.values()]),get:route=>{P.parse(route);return entries.get(routeKey(route))||null;},
   provenance:freeze({...original.provenance,supplementalLetMetadata:{evidenceSha256:supplement.evidenceSha256,...extra.provenance}}),
   stats:Object.freeze({...original.stats,typedOccurrences:entries.size,supplementalLetQueries:extra.stats.primaryQueries,supplementalLetObservations:extra.stats.explicitObservations,supplementalLetOverlap:overlap,sharedTypeTables:original.stats.sharedTypeTables+extra.stats.sharedTypeTables,typeComponents:original.stats.typeComponents+extra.stats.typeComponents,storedTypeNodes:original.stats.storedTypeNodes+extra.stats.storedTypeNodes})});
  // A refusal anywhere above leaves the original package's constructions intact.
  for(const [entry,c]of pending)constructionRecords.set(entry,c);
  const pkg=Object.freeze({cases:Object.freeze([value]),case:name=>name===value.name?value:null,attach:async(data,record)=>await baseline.attach(data,record)?value:null});
  recordedPackages.add(pkg);return pkg;
 }
 // A position, its type observation and its construction owner are separate.
 // Select a whole sealed entry instead of attaching another package's rule to
 // the former entry. Nothing in any input package is modified by this union.
 function unionRecorded(input){
  const order=['case','beta','let','primary','packet','useSites'];
  demand(Array.isArray(input)&&input.length>0&&input.length<=8,'recorded union package bound');
  const seen=new Set(),parts=input.map(p=>{demand(order.includes(p.kind)&&!seen.has(p.kind)&&recordedPackages.has(p.package)&&p.package.cases.length===1,'sealed distinct union inputs');seen.add(p.kind);return{kind:p.kind,package:p.package,value:p.package.cases[0]};}).sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind));
  const locations={case:/\/(eliminations|recursion-examples|goedel-sample)\//,beta:/\/beta-reductions\//,let:/\/let-result-pools\//,primary:/\/(occurrence-types|goedel-sample)\//,packet:/\/packet-types\//,useSites:/\/use-site-types\//};
  for(const part of parts)demand(hash(part.package.evidenceSha256)&&part.value.entries.every(e=>e.evidenceSha256===part.package.evidenceSha256&&locations[part.kind].test(e.evidenceFile)),'union input kind/owner');
  const first=parts[0].value,entries=new Map(),alternatives=new Map();let overlaps=0,total=0;
  for(const part of parts){const c=part.value;
   demand(c.name===first.name&&c.provenance.source.edition===first.provenance.source.edition&&c.record.indexSha256===first.record.indexSha256&&c.record.sourceSha256===first.record.sourceSha256&&c.sourceGraphSha256===first.sourceGraphSha256,'union source correspondence');
   for(const entry of c.entries){total++;demand(total<=32768&&attestedEntries.has(entry),'union observation bound/attachment');const key=routeKey(entry.route),previous=entries.get(key);
    if(previous){
     demand(previous.node===entry.node&&previous.role===entry.role&&previous.contextLength===entry.contextLength&&expressionEqual(previous.typeData,previous.typeData.roots[0],entry.typeData,entry.typeData.roots[0]),'union observation/type agreement');
     const a=contextDescriptors.get(previous),b=contextDescriptors.get(entry);demand(a&&b,'union ordered context descriptors');
     for(let i=0;i<entry.contextLength;i++){const x=contextSlot(a,i),y=contextSlot(b,i);demand(x.depth===y.depth&&x.node===y.node,'union ordered context agreement');}
     if(!constructionRecords.has(previous)&&constructionRecords.has(entry))entries.set(key,entry);overlaps++;
    }else{entries.set(key,entry);demand(entries.size<=4096,'union unique position bound');}
    if(!alternatives.has(key))alternatives.set(key,[]);alternatives.get(key).push(freeze({kind:part.kind,evidenceSha256:entry.evidenceSha256,evidenceFile:entry.evidenceFile,queryRoute:entry.recording.queryRoute,queryNode:entry.recording.queryNode,recordingKind:entry.recording.kind,type:typeIdentity(entry),hasConstruction:constructionRecords.has(entry)}));
   }
  }
  for(const [key,list]of alternatives){
   alternatives.set(key,Object.freeze(list));const original=entries.get(key),entry=Object.freeze({...original,recording:freeze({...original.recording,union:{format:'ProofAtlasPositionConsensus/1',method:'same-type-syntax-role-and-ordered-source-context',selection:'checked-primitive-before-observation/1',alternatives:list}})});
   attestedEntries.add(entry);contextDescriptors.set(entry,contextDescriptors.get(original));const construction=constructionRecords.get(original);if(construction)constructionRecords.set(entry,construction);entries.set(key,entry);
  }
  const value=Object.freeze({...first,entries:Object.freeze([...entries.values()]),get:route=>{P.parse(route);return entries.get(routeKey(route))||null;},alternatives:route=>{P.parse(route);return alternatives.get(routeKey(route))||Object.freeze([]);},
   provenance:freeze({...first.provenance,producerSourceModuleHashVerified:parts.every(p=>p.value.provenance.producerSourceModuleHashVerified===true),recordedUnion:{format:'ProofAtlasRecordedUnion/1',policy:'checked-primitive-before-observation/1',order:parts.map(p=>p.kind),inputs:parts.map(p=>({kind:p.kind,evidenceSha256:p.package.evidenceSha256,...p.value.provenance}))}}),
   stats:freeze({primaryQueries:parts.reduce((n,p)=>n+p.value.stats.primaryQueries,0),unavailableQueries:parts.reduce((n,p)=>n+p.value.stats.unavailableQueries,0),explicitObservations:parts.reduce((n,p)=>n+p.value.stats.explicitObservations,0),typedOccurrences:entries.size,unionInputObservations:total,unionOverlaps:overlaps,sharedTypeTables:parts.reduce((n,p)=>n+p.value.stats.sharedTypeTables,0),typeComponents:parts.reduce((n,p)=>n+p.value.stats.typeComponents,0),storedTypeNodes:parts.reduce((n,p)=>n+p.value.stats.storedTypeNodes,0)})});
  const pkg=Object.freeze({cases:Object.freeze([value]),case:name=>name===value.name?value:null,attach:async(data,record)=>await parts[0].package.attach(data,record)?value:null});recordedPackages.add(pkg);return pkg;
 }
 function typeIdentity(entry){return entry.typeTableSha256?{typeTableSha256:entry.typeTableSha256,typeTableRoot:entry.typeTableRoot,typeComponentSha256:entry.typeComponentSha256}:{typeGraphSha256:entry.typeGraphSha256,...(entry.typeComponentRoot!==undefined?{typeComponentRoot:entry.typeComponentRoot}:{})};}
 function typeScene(entry,sourceData,route=P.encode(0,[]),options={}){
  demand(attestedEntries.has(entry)&&['ProofAtlasDeepTypingAttachment/1','ProofAtlasDeepTypingAttachment/2'].includes(entry?.format)&&hash(entry.evidenceSha256),'record attachment');
  const accepted=acceptedSources.get(sourceData);demand(accepted?.sourceGraphSha256===entry.sourceGraphSha256&&accepted.sourceSha===entry.sourceIndexSha256&&accepted.caseName===entry.caseName,'original source attachment');
  demand((options.maxNodes??9)<=limits.typeNodes&&(options.maxDepth??2)<=limits.typeDepth,'type display bounds');
  const raw=W.create(entry.typeData,entry.typeRecord,route,{maxNodes:options.maxNodes??9,maxDepth:options.maxDepth??2,maxLayerNodes:3});
  const nodes=raw.nodes.map(n=>{
   let binding=null;
   if(n.binding)binding={namespace:'computed-native-type',node:n.binding.node,route:n.binding.route,...(entry.typeData.kind[n.binding.node]===8?{bindingClass:'local-definition'}:{})};
   else if(n.kind==='bvar'){
    const index=entry.typeData.payloads[n.node].index-n.scopeDepth,ordinal=entry.contextLength-1-index;
    demand(ordinal>=0&&ordinal<entry.contextLength,'recorded ambient type index');const target=entry.contextAt(ordinal);
    demand(P.resolve(sourceData,target.route).node===target.node,'original Γ target');binding={namespace:'original-source-context',...target,...(sourceData.kind[target.node]===8?{bindingClass:'local-definition'}:{})};
   }
   return {...n,payload:entry.typeData.payloads[n.node],namespace:'computed-native-type',binding,typeStatus:'type-syntax-only'};
  });
  const scene={format:'ProofAtlasCompactTypeScene/1',namespace:'computed-native-type',origin:{evidenceSha256:entry.evidenceSha256,sourceIndexSha256:entry.sourceIndexSha256,sourceRoute:entry.route,...typeIdentity(entry),contextLength:entry.contextLength,...(entry.recording?{recording:entry.recording}:{})},
   root:{node:raw.root.node,route:raw.root.route,category:'recorded-type-expression'},nodes,edges:raw.edges,links:nodes.filter(n=>n.binding).map(n=>({from:n.id,...n.binding})),stats:raw.stats,
   guarantee:'Structure of a recorded native type in its original context. Type descendants have no additional typing judgments.'};
  demand(new TextEncoder().encode(JSON.stringify(scene)).length<=W.limits.metadataBytes,'type scene metadata bound');
  return scene;
 }
 const api={limits,descriptor,constructionDescriptor,prepare,prepareConstructions,mergeControls,recorded,recordedLets,mergeRecorded,unionRecorded,typeIdentity,typeScene,construction,constructionType,expressionEqual,sourceIdentity};if(node)module.exports=api;else host.ProofAtlasDeepContext=api;
})(typeof window==='undefined'?globalThis:window);
