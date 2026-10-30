/* Recorded output tuples. Source groups, native types and computed closures
   keep separate identities; the browser never performs Lean kernel checking. */
(function(host){
 'use strict';const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts;
 const R=node?require('./proof-atlas-application-regions'):host.ProofAtlasApplicationRegions,C=node?require('./proof-atlas-region-contexts'):host.ProofAtlasRegionContexts;
 const P=node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages,S=node?require('./proof-atlas-source-comparison'):host.ProofAtlasSourceComparison;
 const T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes,G=node?require('./proof-atlas-computed-type-neighborhood'):host.ProofAtlasComputedTypeNeighborhood;
 const copy=x=>JSON.parse(JSON.stringify(x)),size=x=>new TextEncoder().encode(JSON.stringify(x)).length,same=M.same;
 const limits=Object.freeze({indexBytes:262144,typeBytes:1048576,graphRows:2048,contextBytes:1048576,work:262144,pairs:8192,path:512});
 const demand=(ok,m)=>{if(!ok)throw Error('Region outputs: '+m);},freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
 const leases=new WeakMap();
 const plain=f=>({node:f.address.node,kind:f.kind,route:f.address.route});
 function available(d,inventory=host.PROOF_ATLAS_REGION_OUTPUTS){
  if(d.mode!=='native')return[];demand(inventory?.format==='ProofAtlasRegionOutputInventory/1'&&Array.isArray(inventory.records)&&inventory.records.length<=64,'inventory unavailable');
  return inventory.records.filter(r=>same(r.source,d.source)&&r.originalNativeOwner===d.owner?.sha256).map(copy);
 }
 function asset(d,limit){demand(/^[a-f0-9]{64}$/.test(d?.sha256)&&d.file==='/public/data/proof-atlas/region-output-types/'+d.sha256+'.json.gz'&&Number.isInteger(d.bytes)&&d.bytes>0&&d.bytes<=limit,'bounded asset descriptor');}
 function graph(g,scope){demand(g?.serialization==='ExprDAG/1'&&Array.isArray(g.roots)&&g.roots.length===1&&g.kind?.length<=limits.graphRows&&g.expanded?.every(s=>typeof s==='string'&&s.length<=512),'type graph/count bounds');T.validateExpressionGraph(g,g.roots,scope,limits.graphRows);return S.sealGraph(g);}
 function equal(a,x,b,y){const todo=[[x,y]],seen=new Set();while(todo.length){demand(todo.length<=limits.pairs&&seen.size<limits.pairs,'type comparison bound');const [i,j]=todo.pop(),key=i+':'+j;if(seen.has(key))continue;seen.add(key);demand(a.kind[i]===b.kind[j]&&a.children[i].length===b.children[j].length&&A.payloadKey(a.kind[i],a.payloads[i])===A.payloadKey(b.kind[j],b.payloads[j])&&a.expanded[i]===b.expanded[j]&&a.neededScope[i]===b.neededScope[j],'unwrapped result type differs');a.children[i].forEach((c,s)=>todo.push([c,b.children[j][s]]));}}
 async function open(inputModel,unitId,inputDescriptor,options={}){
  if(options.signal?.aborted)throw options.signal.reason||Error('Output load cancelled');
  const model=copy(inputModel),d=copy(inputDescriptor);await R.unfold(model);
  demand(d.record.name===d.source.name&&d.record.indexSha256===d.source.indexSha256&&d.record.sourceSha256===d.source.sourceSha256,'source record identity');
  demand(same(d.source,model.identity.source)&&d.mode===model.mode&&(d.owner?.sha256||null)===model.identity.nativeOwner&&same({scope:d.scope,headerSha256:d.pages.sha256},model.identity.inventory),'source/region/inventory identity');
  const unit=unitId?model.units.find(u=>u.id===unitId):null;demand(!unitId||unit,'region absent');const members=unit?unit.members:model.records.map(c=>c.index);
  const candidates=available(d,options.inventory).filter(r=>same(r.members,[...members].sort((a,b)=>a-b)));demand(candidates.length<=1,'ambiguous collection');
  if(!candidates.length)return Object.freeze({status:'unavailable',reason:d.mode==='native'?'No recorded output tuple for these exact result occurrences.':'Per-result native output types are unavailable for this source-only cut.'});
  const descriptor=candidates[0];asset(descriptor,limits.indexBytes);
  const controller=new AbortController();let disposed=false,serial=0,typeController=null,selected=null,workingGraphs=null,activeCursor=null,loading=false,index=null,frames=new Map(),contextState=null;
  const check=()=>{if(disposed||controller.signal.aborted||options.signal?.aborted)throw options.signal?.reason||Error('Output collection retired');};
  const dispose=()=>{if(disposed)return;disposed=true;serial++;controller.abort();typeController?.abort();activeCursor?.dispose();activeCursor=null;selected=null;workingGraphs=null;index=null;frames.clear();options.signal?.removeEventListener('abort',dispose);};options.signal?.addEventListener('abort',dispose,{once:true});
  try{
   check();index=await A.compressed(descriptor.file,descriptor.sha256,{signal:controller.signal,maxBytes:limits.indexBytes,expectedBytes:descriptor.bytes});check();
   demand(index.format==='ProofAtlasRegionOutputIndex/1'&&same(index.source,d.source)&&index.originalNativeOwner===d.owner.sha256&&index.tupleTyping==='PASS'&&index.tupleNamespace==='common-prefix-result-tuple'&&index.isIndependentBoundaryFunction===false,'native collection identity/typing');
   demand(Array.isArray(index.ports)&&same(index.ports.map(p=>p.call),descriptor.members)&&index.ports.length<=8,'ordered output positions');
   demand(index.provenance?.originalEnvironmentIdentityVerified===false&&index.provenance.dependencyRecovery?.allBinaryHashesVerified===true&&index.provenance.dependencyRecovery.independentlyRebuilt===false,'checking environment qualification');
   // Source contexts are authenticated independently of the native type files.
   if(unitId||model.units.length===1){
    const contexts=await C.open(model,unitId||model.units[0].id,d,{signal:controller.signal});
    try{frames=new Map(members.map(id=>[id,contexts.context(id)]));contextState=contexts.state();}finally{contexts.dispose();}
   }else{
    demand(d.sourcePages?.file==='/public/data/proof-atlas/source-pages/'+d.source.indexSha256+'/manifest-'+d.sourcePages.sha256+'.json.gz','source manifest');
    const cursor=await P.open(d.sourcePages,d.record,{signal:controller.signal,pageLimit:1,indexLimit:2});
    try{demand(P.identity(cursor).name===d.source.name&&P.identity(cursor).indexSha256===d.source.indexSha256&&P.identity(cursor).sourceSha256===d.source.sourceSha256,'source cursor identity');
     const lease=await C.derive(d.source,cursor.data.roots,members.map(call=>{const c=model.records.find(c=>c.index===call);return{call,anchor:c.anchor,contextLength:c.result.contextLength};}),id=>cursor.run(()=>P.fields.map(f=>cursor.data[f][id]),{signal:controller.signal}),{signal:controller.signal});
     try{frames=new Map(members.map(id=>[id,lease.context(id)]));contextState={...lease.state(),sourcePages:cursor.state()};}finally{lease.dispose();}
    }finally{cursor.dispose();}
   }
   check();demand(size([...frames])<=limits.contextBytes,'context metadata bound');
   let common=frames.get(members[0]).map(plain);for(const id of members){const ctx=frames.get(id).map(plain);let n=0;while(n<common.length&&n<ctx.length&&same(common[n],ctx[n]))n++;common=common.slice(0,n);}
   demand(same(common,index.commonContext.map(({path,...f})=>f))&&common.length===descriptor.commonContextLength,'exact common source prefix');
   const last=common.at(-1),prefix=last?{root:last.route.root,slots:[...last.route.slots,last.kind==='letE'?2:1]}:{root:index.ports[0].source.route.root,slots:[]};demand(same(index.prefixRoute,prefix),'prefix occurrence');
   for(const [ordinal,p] of index.ports.entries()){
    const c=model.records.find(c=>c.index===p.call),ctx=frames.get(p.call);demand(c&&same(c.anchor,{node:p.source.node,route:p.source.route})&&same(ctx.map(plain),p.context.map(({path,...f})=>f))&&c.result.contextLength===ctx.length&&c.result.role===p.originalRole,'original result/context');
    demand(p.commonContextLength===common.length&&p.suffixLength===ctx.length-common.length&&same(p.letSlots,ctx.slice(common.length).map(f=>f.kind==='letE'))&&p.argumentCount===p.letSlots.filter(v=>!v).length,'closure frames');
    demand(same(p.projection,{snd:ordinal,fst:ordinal+1<index.ports.length})&&p.literalReopening==='PASS'&&p.suffixSupportClosed==='PASS'&&['projectionTyping','projectionConversion','instantiationTyping','instantiationConversion'].every(k=>p.checks[k]==='PASS')&&p.checks.wrongTypeRejected===true,'native projection/instantiation');asset(p.type,limits.typeBytes);
   }
   const identity=freeze({namespace:'common-prefix-result-tuple',source:copy(d.source),nativeGroupSha256:descriptor.sha256,nativeBundleSha256:index.nativeBundleSha256,originalNativeOwner:d.owner.sha256,regionId:unitId||null,partitionSha256:model.identity.derivationSha256,members:copy(descriptor.members),commonContext:copy(index.commonContext)});
   const receipts=new WeakSet();let peakGraphRows=0,peakWork=0;
   async function select(call){
    check();demand(!loading,'another output type is loading');const port=index.ports.find(p=>p.call===call);demand(port,'output outside collection');typeController?.abort();typeController=new AbortController();const signal=typeController.signal,version=++serial;selected=null;loading=true;
    const current=()=>{check();if(signal.aborted||version!==serial)throw Error('Output type selection retired');};
    let cursor=null;
    try{const raw=await A.compressed(port.type.file,port.type.sha256,{signal,maxBytes:limits.typeBytes,expectedBytes:port.type.bytes});current();
     demand(raw.format==='ProofAtlasRegionOutputType/1'&&same(raw.source,index.source)&&raw.originalNativeOwner===index.originalNativeOwner&&raw.nativeBundleSha256===index.nativeBundleSha256&&raw.group===index.group&&same(raw.port,Object.fromEntries(Object.entries(port).filter(([k])=>!['type','checks','projection'].includes(k))))&&same(raw.checks,port.checks),'selected native type owner');
     const ambient=frames.get(call),graphs={originalResultType:graph(raw.graphs.originalResultType,ambient.length),closedResultType:graph(raw.graphs.closedResultType,common.length)};
     workingGraphs=graphs;cursor=await P.open(d.sourcePages,d.record,{signal,pageLimit:1,indexLimit:2});activeCursor=cursor;current();
     const closed=graphs.closedResultType;let at=closed.roots[0],slots=[],work=0;const headerLinks=[];
     for(const frame of ambient.slice(common.length)){
      current();const source=await cursor.run(()=>P.fields.map(f=>cursor.data[f][frame.address.node]),{signal});
      const kind=frame.kind==='letE'?8:7;demand(closed.kind[at]===kind&&source[0]===A.kinds.indexOf(frame.kind)&&A.payloadKey(kind,closed.payloads[at])===A.payloadKey(kind,source[2]),'wrapper header source fields');
      headerLinks.push({slots:copy(slots),source:copy(frame.address)});
      for(let field=0;field<(kind===8?2:1);field++){
       demand(work<limits.work,'aggregate source comparison bound');const receipt=await S.compare(cursor,source[1][field],closed,closed.children[at][field],0,{signal,workLimit:limits.work-work});S.accepts(receipt,cursor,source[1][field],closed,closed.children[at][field],0,d.record);work+=receipt.state.pairs;
      }
      const body=kind===8?2:1;at=closed.children[at][body];slots.push(body);
     }
     equal(closed,at,graphs.originalResultType,graphs.originalResultType.roots[0]);current();peakWork=Math.max(peakWork,work);peakGraphRows=Math.max(peakGraphRows,Object.values(graphs).reduce((n,g)=>n+g.kind.length,0));
     const receipt=freeze({format:'ProofAtlasRegionOutputSelection/1',identity,call,source:{namespace:'source-expression',name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,node:port.source.node,route:copy(port.source.route)},originalContextLength:ambient.length,commonContextLength:common.length,suffixLength:port.suffixLength,letSlots:copy(port.letSlots),argumentCount:port.argumentCount,projection:copy(port.projection),originalTypeText:port.originalTypeText,closedTypeText:port.closedTypeText,nativeTypeSha256:port.type.sha256,sourceHeaderComparisons:work,checks:copy(port.checks)});
     receipts.add(receipt);selected={receipt,graphs,headerLinks};workingGraphs=null;return receipt;
    }finally{cursor?.dispose();if(activeCursor===cursor)activeCursor=null;if(version===serial){loading=false;workingGraphs=null;}}
   }
   function owned(receipt){check();demand(receipts.has(receipt)&&selected?.receipt===receipt,'owned current output selection');return selected;}
   function neighborhood(receipt,component,slots=[]){const {graphs}=owned(receipt);demand(['originalResultType','closedResultType'].includes(component)&&Array.isArray(slots)&&slots.length<=limits.path,'type component/path');const g=graphs[component];let id=g.roots[0];for(const slot of slots){demand(Number.isInteger(slot)&&slot>=0&&slot<g.children[id].length,'type field');id=g.children[id][slot];}
    const ambient=frames.get(receipt.call).slice(0,component==='originalResultType'?receipt.originalContextLength:receipt.commonContextLength).map(f=>({...plain(f),name:f.name}));
    const address={namespace:'common-prefix-output-types',evidenceSha256:receipt.nativeTypeSha256,nativeGroupSha256:descriptor.sha256,sourceIndexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,call:receipt.call,component,node:id,route:{root:component,slots:copy(slots)}};
    return G.create(g,{[component]:g.roots[0]},address,ambient,receipt.source);
   }
   function sourceHeader(receipt,address){const value=owned(receipt);demand(address?.namespace==='common-prefix-output-types'&&address.evidenceSha256===receipt.nativeTypeSha256&&address.call===receipt.call,'type header owner');demand(same(neighborhood(receipt,address.component,address.route.slots).root.address,address),'exact type address');if(address.component!=='closedResultType')return null;return copy(value.headerLinks.find(h=>same(h.slots,address.route.slots))?.source||null);}
   const lease=Object.freeze({status:'recorded',identity,releaseTypes(){check();demand(!loading,'type load active');serial++;typeController?.abort();selected=null;workingGraphs=null;},summary:()=>{check();return copy({commonContextLength:common.length,ports:index.ports.map(p=>({call:p.call,originalContextLength:p.context.length,suffixLength:p.suffixLength,argumentCount:p.argumentCount})),provenance:index.provenance});},select,neighborhood,sourceHeader,
    state:()=>({disposed,loading,indexBytes:disposed?0:descriptor.bytes,contextBytes:disposed?0:size([...frames]),residentTypeGraphs:selected||workingGraphs?2:0,residentGraphRows:selected||workingGraphs?Object.values(selected?.graphs||workingGraphs).reduce((n,g)=>n+g.kind.length,0):0,peakGraphRows,peakWork,sourceCursorClosed:!activeCursor,contextSourceRows:0,peakContextSourceRows:contextState.peakSourceRows,sourcePageLimit:1}),dispose});
   leases.set(lease,{live:check,signal:controller.signal,snapshot:()=>{check();return copy({identity,ports:index.ports.map(p=>({call:p.call,source:{namespace:'source-expression',name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,node:p.source.node,route:p.source.route},context:frames.get(p.call),originalRole:p.originalRole,originalTypeText:p.originalTypeText,closedTypeText:p.closedTypeText}))});}});return lease;
  }catch(error){dispose();throw error;}
 }
 function owned(lease){const entry=leases.get(lease);demand(entry,'owned output collection');entry.live();return entry;}
 const scope=lease=>owned(lease).snapshot(),signal=lease=>owned(lease).signal;
 const api={available,open,limits,scope,signal};if(node)module.exports=api;else host.ProofAtlasRegionOutputs=api;
})(typeof window==='undefined'?globalThis:window);
