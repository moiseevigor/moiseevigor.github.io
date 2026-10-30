/* Typed output regrouping. Native judgments are recorded; source contexts are
   borrowed only from an owned, live result-closure session. */
(function(host){
 'use strict';const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts,O=node?require('./proof-atlas-region-outputs'):host.ProofAtlasRegionOutputs,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes,G=node?require('./proof-atlas-computed-type-neighborhood'):host.ProofAtlasComputedTypeNeighborhood;
 const copy=x=>JSON.parse(JSON.stringify(x)),same=M.same,bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length,hash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s),names=['flat','hierarchical','flatten','gather'],caseNames=['whole','scope-fibres','interleaved-reordered'];
 const limits=Object.freeze({indexBytes:262144,componentBytes:1048576,scopeBytes:2097152,graphRows:4096,path:512});
 const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
 const demand=(ok,m)=>{if(!ok)throw Error('Output composition: '+m);},plain=f=>({node:f.address.node,kind:f.kind,route:f.address.route}),raw=fs=>fs.map(({node,kind,route})=>({node,kind,route}));
 function common(contexts){let out=contexts[0].map(plain);for(const ctx of contexts){let n=0;while(n<out.length&&n<ctx.length&&same(out[n],plain(ctx[n])))n++;out=out.slice(0,n);}return out;}
 function prefix(ctx,root){const last=ctx.at(-1);return last?{root:last.route.root,slots:[...last.route.slots,last.kind==='letE'?2:1]}:{root,slots:[]};}
 function asset(d,max){demand(hash(d?.sha256)&&d.file==='/public/data/proof-atlas/output-compositions/'+d.sha256+'.json.gz'&&Number.isSafeInteger(d.bytes)&&d.bytes>0&&d.bytes<=max,'bounded content address');}
 function available(parent,inventory=host.PROOF_ATLAS_OUTPUT_COMPOSITIONS){const s=O.scope(parent);demand(inventory?.format==='ProofAtlasOutputCompositionInventory/1'&&Array.isArray(inventory.records)&&inventory.records.length<=64,'inventory unavailable');return inventory.records.filter(r=>same(r.source,s.identity.source)&&r.originalNativeOwner===s.identity.originalNativeOwner&&r.parentGroupSha256===s.identity.nativeGroupSha256&&r.parentNativeBundleSha256===s.identity.nativeBundleSha256&&same(r.members,s.identity.members)).map(copy);}
 async function open(parent,options={}){
  let scope=O.scope(parent);demand(bytes(scope)<=limits.scopeBytes,'scope metadata bound');const list=available(parent,options.inventory);demand(list.length<=1,'ambiguous collection');if(!list.length)return Object.freeze({status:'unavailable',reason:'No recorded grouping for this exact output collection.'});
  const d=list[0],parentSignal=O.signal(parent),controller=new AbortController();asset(d,limits.indexBytes);
  let disposed=false,index=null,selected=null,loading=false,serial=0,componentController=null,peakRows=0;
  const dispose=()=>{if(disposed)return;disposed=true;serial++;controller.abort();componentController?.abort();selected=null;scope=null;index=null;loading=false;parentSignal.removeEventListener('abort',dispose);options.signal?.removeEventListener('abort',dispose);};
  const current=()=>{demand(!disposed,'retired');O.signal(parent);if(options.signal?.aborted)throw options.signal.reason||Error('Output composition cancelled');};
  parentSignal.addEventListener('abort',dispose,{once:true});options.signal?.addEventListener('abort',dispose,{once:true});
  try{
   current();index=await A.compressed(d.file,d.sha256,{signal:controller.signal,maxBytes:limits.indexBytes,expectedBytes:d.bytes});current();
   demand(index.format==='ProofAtlasOutputCompositionIndex/1'&&same(index.source,d.source)&&index.originalNativeOwner===d.originalNativeOwner&&index.parentGroupSha256===d.parentGroupSha256&&index.parentNativeBundleSha256===d.parentNativeBundleSha256&&same(index.members,d.members)&&index.nativeEvidenceSha256===d.nativeEvidenceSha256&&hash(index.strictComparisonSha256)&&index.isIndependentBoundaryFunction===false,'source/native collection identity');
   demand(index.provenance?.originalEnvironmentIdentityVerified===false&&index.provenance.dependencyRecovery?.allBinaryHashesVerified===true&&index.provenance.dependencyRecovery.independentlyRebuilt===false,'checking environment boundary');
   demand(Array.isArray(index.cases)&&same(index.cases.map(c=>c.name),caseNames),'finite case inventory');
   const context=common(scope.ports.map(p=>p.context)),scopePorts=new Map(scope.ports.map(p=>[p.call,p]));
   demand(same(context,raw(scope.identity.commonContext)),'parent common context');
   for(const c of index.cases){
    demand(typeof c.id==='string'&&c.id.length<=256&&same(raw(c.commonContext),context)&&same(c.prefixRoute,prefix(context,scope.ports[0].source.route.root)),'exact common source prefix');
    demand(Array.isArray(c.ports)&&same(c.ports.map(p=>p.call),index.members),'original output order');
    for(const p of c.ports){const actual=scopePorts.get(p.call);demand(actual&&same(p.source,{node:actual.source.node,route:actual.source.route})&&same(raw(p.context),actual.context.map(plain)),'original source port/context');}
    demand(Array.isArray(c.groups)&&c.groups.length>0&&c.groups.length<=8&&c.groups.every(g=>Array.isArray(g.positions)&&g.positions.length>0),'bounded groups');
    const positions=c.groups.flatMap(g=>g.positions);demand(same(positions.slice().sort((a,b)=>a-b),index.members.map((_,i)=>i)),'each output position exactly once');
    for(const group of c.groups){const ctx=common(group.positions.map(i=>scopePorts.get(index.members[i]).context));demand(same(raw(group.context),ctx)&&same(group.prefixRoute,prefix(ctx,scope.ports[0].source.route.root)),'subgroup exact source prefix');}
    demand(c.comparison?.id===c.id&&c.comparison.comparisonStatus==='ok'&&typeof c.comparison.convertible==='boolean'&&same(raw(c.comparison.context),context),'explicit kernel comparison');
    demand(['flattenTyping','gatherTyping','sourceFlatRecovery','sourceHierarchicalRecovery','arbitraryFlatRoundTrip','arbitraryHierarchicalRoundTrip'].every(k=>c.checks?.[k]==='PASS'),'recorded native adapter checks');
    demand(same(Object.keys(c.components).sort(),names.slice().sort()),'component inventory');for(const name of names){const v=c.components[name];asset(v,limits.componentBytes);demand(Array.isArray(v.roots)&&v.roots.length===2&&v.roots.every(x=>Number.isInteger(x)&&x>=0&&x<limits.graphRows)&&Array.isArray(v.rootKinds)&&v.rootKinds.length===2,'recorded component roots');if(['flatten','gather'].includes(name))demand(same(v.rootKinds,[6,7]),'adapter lambda/Pi roots');}
   }
   demand(new Set(index.cases.map(c=>c.id)).size===3,'distinct cases');
   const identity=freeze({namespace:'scope-output-composition',source:copy(d.source),indexSha256:d.sha256,parentGroupSha256:d.parentGroupSha256,nativeEvidenceSha256:index.nativeEvidenceSha256,strictComparisonSha256:index.strictComparisonSha256});
   const receipts=new WeakSet();
   function getCase(id){current();const c=index.cases.find(c=>c.id===id||c.name===id);demand(c,'recorded case');return c;}
   function getPort(id){current();const p=scope.ports.find(p=>p.call===id);demand(p,'original output port');return p;}
   function scene(id){const c=getCase(id),commonLength=c.commonContext.length,contexts=[{id:'Γ',frames:raw(c.commonContext)}],contextId=frames=>{const found=contexts.find(x=>same(x.frames,frames));if(found)return found.id;const id='C'+contexts.length;contexts.push({id,frames});return id;};for(const p of scope.ports)contextId(p.context.map(plain));const ports=c.ports.map((p,position)=>{const original=getPort(p.call),group=c.groups.findIndex(g=>g.positions.includes(position));return{position,call:p.call,source:copy(original.source),originalContextId:contextId(original.context.map(plain)),originalContextLength:original.context.length,originalRole:original.originalRole,originalTypeText:original.originalTypeText,closedTypeText:original.closedTypeText,group,localPosition:c.groups[group].positions.indexOf(position)};});
    return copy({format:'ProofAtlasOutputCompositionScene/1',identity,case:c.id,name:c.name,commonContextLength:commonLength,ports,sharedFrames:scope.ports[0].context.slice(0,commonLength),groups:c.groups.map((g,ordinal)=>({ordinal,positions:g.positions,contextId:contextId(raw(g.context)),contextLength:g.context.length,frames:getPort(ports[g.positions[0]].call).context.slice(commonLength,g.context.length)})),comparison:c.comparison.convertible,checks:c.checks,provenance:index.provenance,guarantee:'Ordered source correspondence and recorded typed maps; no source-use edge or independent boundary-input function.'});
   }
   async function select(id,component){current();demand(!loading,'component load already active');const c=getCase(id);demand(names.includes(component),'component');selected=null;loading=true;componentController=new AbortController();const signal=componentController.signal,version=++serial;
    try{const spec=c.components[component],data=await A.compressed(spec.file,spec.sha256,{signal,maxBytes:limits.componentBytes,expectedBytes:spec.bytes});current();demand(!signal.aborted&&version===serial,'stale component');
     demand(data.format==='ProofAtlasOutputCompositionComponent/1'&&same(data.source,d.source)&&data.originalNativeOwner===d.originalNativeOwner&&data.parentGroupSha256===d.parentGroupSha256&&data.nativeEvidenceSha256===identity.nativeEvidenceSha256&&data.case===c.id&&data.component===component,'component evidence owner');const g=data.graph;
     demand(g?.serialization==='ExprDAG/1'&&g.kind?.length<=limits.graphRows&&same(g.roots,spec.roots)&&g.expanded?.every(s=>typeof s==='string'&&s.length<=512),'component graph/count bound');T.validateExpressionGraph(g,g.roots,c.commonContext.length,limits.graphRows);demand(same(g.roots.map(r=>g.kind[r]),spec.rootKinds),'component root kinds');
     if(['flatten','gather'].includes(component))demand(g.children[g.roots[0]][0]===g.children[g.roots[1]][0]&&A.payloadKey(6,g.payloads[g.roots[0]])===A.payloadKey(7,g.payloads[g.roots[1]]),'adapter input domain/binder');
     const receipt=freeze({format:'ProofAtlasOutputCompositionSelection/1',identity,case:c.id,name:c.name,component,componentSha256:spec.sha256,roots:copy(g.roots),contextLength:c.commonContext.length,typing:'recorded-native'});receipts.add(receipt);selected={receipt,graph:g};peakRows=Math.max(peakRows,g.kind.length);return receipt;
    }finally{if(version===serial)loading=false;}
   }
   function owned(receipt){current();demand(receipts.has(receipt)&&selected?.receipt===receipt,'owned current component');return selected.graph;}
   function neighborhood(receipt,part,slots=[],call=null){const g=owned(receipt);demand(['term','type'].includes(part)&&Array.isArray(slots)&&slots.length<=limits.path,'component field path');const p=getPort(call??scope.ports[0].call),key=receipt.component+'.'+part,roots={[key]:g.roots[part==='term'?0:1]};let node=roots[key];for(const slot of slots){demand(Number.isInteger(slot)&&slot>=0&&slot<g.children[node].length,'ordered field');node=g.children[node][slot];}
    const address={namespace:'scope-output-composition',evidenceSha256:receipt.componentSha256,nativeEvidenceSha256:identity.nativeEvidenceSha256,indexSha256:d.sha256,sourceIndexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,case:receipt.case,component:key,node,route:{root:key,slots:copy(slots)}};
    return G.create(g,roots,address,p.context.slice(0,receipt.contextLength).map(f=>({...plain(f),name:f.name})),p.source);
   }
   return Object.freeze({status:'recorded',identity,cases:()=>{current();return index.cases.map(c=>({id:c.id,name:c.name}));},scene,select,neighborhood,source:call=>copy(getPort(call).source),
    state:()=>({disposed,loading,indexBytes:disposed?0:d.bytes,scopeBytes:scope?bytes(scope):0,residentGraphs:selected?1:0,residentGraphRows:selected?.graph.kind.length||0,peakGraphRows:peakRows,graphRowLimit:limits.graphRows,sourceRows:0}),dispose});
  }catch(error){dispose();throw error;}
 }
 const api={available,open,limits};if(node)module.exports=api;else host.ProofAtlasOutputComposition=api;
})(typeof window==='undefined'?globalThis:window);
