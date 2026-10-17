/* Full recorded-context closures borrow source pages; paths remain computed paths. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry,P=node?require('./proof-atlas-context-types'):host.ProofAtlasContextTypes,L=node?require('./proof-atlas-context-views'):host.ProofAtlasContextViews;
class SourceContextModuleError extends Error{constructor(message){super('Source context module: '+message);}}
const demand=(ok,message)=>{if(!ok)throw new SourceContextModuleError(message);},fields=['kind','payloads','children','expanded','neededScope'],hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),key=r=>r.root+':'+r.slots.join('.'),clone=x=>JSON.parse(JSON.stringify(x)),binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
function freeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const child of Object.values(value))freeze(child);return Object.freeze(value);}
function route(value){return Number.isInteger(value?.root)&&value.root>=0&&Array.isArray(value.slots)&&value.slots.length<=512&&value.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2);}
function identity(record,entry,evidence){
 demand(evidence?.name===record.name&&evidence.indexSha256===record.indexSha256&&evidence.sourceSha256===record.sourceSha256,'source identity');
 for(const f of ['sha256','producerSha256','requestSha256','nativeOutputSha256','nativePacketSha256','compiledModuleSha256','environmentSha256'])demand(hash(evidence[f]),'evidence identity');
 demand(route(entry?.state?.route)&&Array.isArray(entry.recipe)&&entry.recipe.length<=512,'native route/context bounds');
 return {kind:'native-source-context-module',namespace:'source-backed-context-module',method:'full-recorded-source-context/1',status:'native-closure-record',nativeJudgmentScope:'complete-closed-roots',source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},nativeObservation:{namespace:'closed-context-judgment',route:clone(entry.state.route),node:entry.node,role:entry.role},evidenceSha256:evidence.sha256,producerSha256:evidence.producerSha256,requestSha256:evidence.requestSha256,nativeOutputSha256:evidence.nativeOutputSha256,compiledModuleSha256:evidence.compiledModuleSha256,environmentSha256:evidence.environmentSha256,retainedContextDepth:entry.recipe.length,actualContextDepth:entry.actualContextDepth,discardedPrefix:entry.discardedPrefix,argumentCount:entry.recipe.filter(h=>h.value===null).length,letSlots:entry.recipe.map(h=>h.value!==null),nativeClosureChecks:{originalTermTyping:entry.kernelOriginalTermTyping,closedTermTyping:entry.kernelClosedTermTyping,closedTypeTyping:entry.kernelClosedTypeTyping,closedConversion:entry.kernelClosedConversion,inferredExpectedSyntaxMatch:entry.closedTypesStructurallyEqual},nativeTargetTransport:clone(entry.selectedTargetTransport),typingAtOtherRoutes:'not-derived-by-this-operation',reducedContextTyping:'not-derived-by-this-operation'};
}
// No source/state enumeration. A read captures a whole authenticated tuple while
// its page is resident; sealing removes access to the source proxy altogether.
function graph(source,record,entry,evidence,{snapshotLimit=4096,snapshotByteLimit=8*1024**2}={}){
 const origin=identity(record,entry,evidence);demand(source.serialization==='ExprDAG/1'&&source.declaration.name===record.name,'source graph identity');P.validate(entry,source);freeze(entry);freeze(evidence);
 demand(Number.isInteger(snapshotLimit)&&snapshotLimit>=1&&snapshotLimit<=4096&&Number.isInteger(snapshotByteLimit)&&snapshotByteLimit>=1&&snapshotByteLimit<=8*1024**2,'snapshot bound');
 const n=source.kind.length,t=entry.graph.kind.length;demand(Number.isInteger(n)&&n===record.uniqueNodes&&n>=1&&n<=2147483647&&t>=1&&t<=32768,'borrowed graph bounds');
 const captured=new Map(),rows=[];let sourceAccess=source,sealed=false,decodedBytes=0;
 function get(field,id){
  demand(Number.isInteger(id)&&id>=0&&id<n+t+rows.length,'computed node identity');
  if(id<n){if(!captured.has(id)){demand(!sealed&&sourceAccess,'source read outside prepared cut');demand(captured.size<snapshotLimit,'prepared source tuple bound');const tuple={};for(const f of fields)tuple[f]=sourceAccess[f][id];const text=JSON.stringify(tuple),bytes=new TextEncoder().encode(text).length;demand(decodedBytes+bytes<=snapshotByteLimit,'prepared source byte bound');captured.set(id,freeze(JSON.parse(text)));decodedBytes+=bytes;}return captured.get(id)[field];}
  if(id<n+t){const at=id-n;return field==='children'?Object.freeze(entry.graph.children[at].map(c=>n+c)):entry.graph[field][at];}
  return rows[id-n-t][field];
 }
 function add(kind,payload,children){const row={kind,payloads:clone(payload),children:[...children]};row.expanded=(1n+children.reduce((sum,c)=>sum+BigInt(get('expanded',c)),0n)).toString();row.neededScope=Math.max(0,...children.map((c,s)=>get('neededScope',c)-(binds(kind,s)?1:0)));const id=n+t+rows.length;demand(rows.length<1024,'wrapper bound');rows.push(freeze(row));return id;}
 let term=entry.node,type=n+entry.typeRoot;
 for(let j=entry.recipe.length-1;j>=0;j--){const h=entry.recipe[j],kind=get('kind',h.node),payload=get('payloads',h.node);demand(get('neededScope',h.domain)<=j,'header pre-binder context');if(h.value===null){term=add(6,payload,[h.domain,term]);type=add(7,payload,[h.domain,type]);}else {demand(kind===8&&get('neededScope',h.value)<=j,'let pre-binder context');term=add(8,{...payload,nondep:false},[h.domain,h.value,term]);type=add(8,{...payload,nondep:false},[h.domain,h.value,type]);}}
 demand(get('neededScope',term)===0&&get('neededScope',type)===0,'closed root scope');
 const stem='sourceContext.'+evidence.sha256+'.'+key(entry.state.route),data={serialization:'ExprDAG/1',declaration:{name:record.name,rootPaths:[stem+'.term',stem+'.type']},roots:Object.freeze([term,type])};
 for(const field of fields)data[field]=new Proxy([],{get(_,p){if(p==='length')return n+t+rows.length;demand(typeof p==='string'&&/^(0|[1-9]\d*)$/.test(p),'indexed graph access only');return get(field,Number(p));},has(_,p){return p==='length'||typeof p==='string'&&/^(0|[1-9]\d*)$/.test(p)&&Number(p)<n+t+rows.length;},set(){throw new SourceContextModuleError('immutable computed graph');},ownKeys(){throw new SourceContextModuleError('whole graph enumeration unavailable');}});
 return Object.freeze({data:freezeMetadata(data),origin:freeze(origin),entry,seal(){sealed=true;sourceAccess=null;},state:()=>({sealed,preparedSourceTuples:captured.size,sourceSnapshotLimit:snapshotLimit,preparedSourceDecodedBytes:decodedBytes,sourceSnapshotByteLimit:snapshotByteLimit,newWrappers:rows.length,borrowedTypeNodes:t,wholeSourceCopied:false})});
}
function freezeMetadata(data){Object.freeze(data.declaration.rootPaths);Object.freeze(data.declaration);return Object.freeze(data);}
function scene(prepared,record,part,{slots=[],maxNodes=32,maxDepth=3,...options}={}){
 demand(prepared.origin.source.name===record.name&&prepared.origin.source.indexSha256===record.indexSha256&&prepared.origin.source.sourceSha256===record.sourceSha256,'prepared source identity');demand(part==='term'||part==='type','module component');demand(Array.isArray(slots)&&slots.length<=512&&slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2),'computed route bounds');demand(Number.isInteger(maxNodes)&&maxNodes>=1&&maxNodes<=64&&Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=6,'scene bounds');
 const root=part==='term'?0:1,s=G.create(prepared.data,record,{...options,route:{root,slots:[...slots]},maxNodes,maxDepth,foldBinders:options.foldBinders!==false,foldApplications:options.foldApplications!==false,maxLayerNodes:options.maxLayerNodes??6,maxApplicationChildren:options.maxApplicationChildren??4});
 s.coreFormat=s.format;s.format='ProofAtlasSourceContextModuleScene/1';s.source={...s.source,...prepared.origin,part};s.root.category=part==='term'?'source-backed-module-term':'source-backed-module-type';s.root.nativeJudgment=slots.length?'not-recorded-for-this-cut-root':part==='term'?'native-closed-term-judgment':'native-closed-type-judgment';s.guarantee='Bounded structural cut of the native full-recorded-context closure. Computed wrapper paths remain distinct from original source occurrences. The original native observation covers complete closed roots; descendants receive no new typing. No reduced interface, arbitrary target transport, semantic compression or comprehension claim.';return s;
}
function locateKnown(source,record,entry,evidence,part,slots=[],canonicalEntry=entry){
 const origin=identity(record,canonicalEntry,evidence);demand(part==='term'||part==='type','module component');demand(Array.isArray(slots)&&slots.length<=512&&slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2),'computed route bounds');
 const computed={namespace:origin.namespace,evidenceSha256:evidence.sha256,canonicalObservation:clone(canonicalEntry.state.route),route:{root:part==='term'?0:1,slots:[...slots]}},sourceRef=(r,relation,slot=null)=>({computed,originalUse:{node:entry.node,route:clone(entry.state.route)},relation,contextSlot:slot,target:{namespace:'original-packet',name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,node:A.walk(source,r),route:r,path:A.path(source,r)}});
 let at=0;for(let j=0;j<entry.recipe.length;j++){const h=entry.recipe[j];if(at===slots.length)return sourceRef(clone(h.sourceRoute),'new-wrapper-from-source-header',j);const port=slots[at++],body=h.value===null?1:2;if(port<body)return sourceRef({root:h.sourceRoute.root,slots:[...h.sourceRoute.slots,port,...slots.slice(at)]},'original-full-context-header',j);demand(port===body,'module wrapper field');}
 const tail=slots.slice(at);if(part==='term')return sourceRef({root:entry.state.route.root,slots:[...entry.state.route.slots,...tail]},'original-selected-term');const raw={...entry.graph,roots:[entry.typeRoot],declaration:{name:record.name,rootPaths:['native-context.type']}},r={root:0,slots:tail};return {computed,originalUse:{node:entry.node,route:clone(entry.state.route)},relation:'recorded-type-body',target:{namespace:'native-closed-context-type',evidenceSha256:evidence.sha256,originalRoute:clone(entry.state.route),graphRoot:entry.typeRoot,node:A.walk(raw,r),route:r,path:A.path(raw,r)}};
}
function validateCanonical(source,entry,canonicalEntry){
 const selected=P.validate(entry,source);if(entry===canonicalEntry)return;const canonical=P.validate(canonicalEntry,source);
 demand(selected.signature===canonical.signature&&entry.role===canonicalEntry.role&&L.equal(entry.graph,entry.typeRoot,canonicalEntry.graph,canonicalEntry.typeRoot).equal,'canonical closed-module syntax');
 const transport=entry.selectedTargetTransport;demand(canonicalEntry.selectedTargetTransport.status==='first-class-observation'&&transport.status==='kernel-compared-at-selected-target'&&key(transport.canonicalRoute)===key(canonicalEntry.state.route),'recorded canonical module instantiation');
}
function locate(source,record,entry,evidence,part,slots=[],canonicalEntry=entry){validateCanonical(source,entry,canonicalEntry);return locateKnown(source,record,entry,evidence,part,slots,canonicalEntry);}
function prepareCut(source,record,entry,evidence,part,options={},canonicalEntry=entry){
 validateCanonical(source,entry,canonicalEntry);
 const prepared=graph(source,record,canonicalEntry,evidence,options),cut=scene(prepared,record,part,options),locations={};
 for(const n of cut.nodes){A.describe(prepared.data,n.node);locations[n.id]=locateKnown(source,record,entry,evidence,part,n.route.slots,canonicalEntry);const regions=n.abstraction==='binder-telescope'?[...n.regions,n.continuation]:n.abstraction==='application-spine'?n.regions:n.ports.map((_,slot)=>({route:{root:n.route.root,slots:[...n.route.slots,slot]}}));for(const r of regions)A.path(prepared.data,r.route);}
 for(const link of cut.links)if(link.relation==='bound-to'){A.describe(prepared.data,link.node);locations[link.target]=locateKnown(source,record,entry,evidence,part,link.route.slots,canonicalEntry);}
 // Raw-type Γ labels refer to this use's original headers, which need not be
 // the canonical source binder nodes. Capture them before the source is sealed.
 for(const header of entry.recipe)prepared.data.payloads[header.node];
 prepared.seal();return Object.freeze({prepared,scene:freeze(cut),locations:freeze(locations)});
}
const api={identity,graph,scene,locate,prepareCut,SourceContextModuleError};if(node)module.exports=api;else host.ProofAtlasSourceContextModules=api;
})(typeof window==='undefined'?globalThis:window);
