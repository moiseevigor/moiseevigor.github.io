/* Checked closed modules and per-use inverse maps; source occurrences stay distinct. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes,P=node?require('./proof-atlas-context-types'):host.ProofAtlasContextTypes;
class ContextModuleError extends Error{constructor(m){super('Context module: '+m);}}
const demand=(v,m)=>{if(!v)throw new ContextModuleError(m);},hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),clone=x=>JSON.parse(JSON.stringify(x)),key=r=>r.root+':'+r.slots.join('.');
function dataFor(record,module,evidence){
 demand(Number.isInteger(module?.id)&&module.id>=0&&Number.isInteger(module.contextEntryCount)&&module.contextEntryCount>=0&&module.contextEntryCount<=512&&Array.isArray(module.letSlots)&&module.letSlots.length===module.contextEntryCount&&module.letSlots.every(x=>typeof x==='boolean')&&module.argumentCount===module.letSlots.filter(x=>!x).length,'module boundary');
 T.validateExpressionGraph(module.moduleGraph,[module.moduleTermRoot,module.moduleTypeRoot],0,32768);const stem='module.'+evidence.sha256+'.'+module.id;
 return {...module.moduleGraph,serialization:'ExprDAG/1',roots:[module.moduleTermRoot,module.moduleTypeRoot],declaration:{name:record.name,rootPaths:[stem+'.term',stem+'.type']}};
}
function origin(record,module,evidence,part){
 demand(['term','type'].includes(part),'module part');for(const field of ['sha256','producerSha256','requestSha256','nativeOutputSha256','compiledModuleSha256'])demand(hash(evidence[field]),'evidence identity');
 demand(evidence.name===record.name&&evidence.indexSha256===record.indexSha256&&evidence.sourceSha256===record.sourceSha256,'source identity');
 return {kind:'checked-context-module',namespace:'checked-context-module',method:'closed-source-context/1',status:'native-checked',nativeJudgmentScope:'complete-module-root',moduleId:module.id,part,evidenceSha256:evidence.sha256,producerSha256:evidence.producerSha256,requestSha256:evidence.requestSha256,nativeOutputSha256:evidence.nativeOutputSha256,compiledModuleSha256:evidence.compiledModuleSha256,source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},contextEntryCount:module.contextEntryCount,argumentCount:module.argumentCount,letSlots:[...module.letSlots]};
}
function scene(record,module,evidence,part,options={}){return G.createModule(dataFor(record,module,evidence),record,origin(record,module,evidence,part),options);}
function validateUse(source,record,module,entry){
 const use=entry?.reducedContext,ref=use?.module;demand(entry.status==='checked'&&use.status==='checked'&&ref?.namespace==='checked-context-module'&&ref.id===module.id,'native use');
 P.validate(entry,source);
 demand(Array.isArray(use.slots)&&use.slots.length===module.contextEntryCount&&use.slots.every((s,j)=>Number.isInteger(s)&&s>=0&&s<entry.recipe.length&&(j===0||use.slots[j-1]<s)),'ordered module context');
 demand(ref.contextEntryCount===module.contextEntryCount&&ref.argumentCount===module.argumentCount&&JSON.stringify(ref.letSlots)===JSON.stringify(module.letSlots)&&JSON.stringify(use.slots.map(s=>source.kind[entry.recipe[s].node]===8))===JSON.stringify(module.letSlots),'module argument/let boundary');
 for(const field of ['closedTermTyping','closedTypeTyping','closedExpectedConversion','appliedClosureTyping','instantiatedTermConversion','sourceTypeRoundtrip'])demand(use[field]==='PASS','reduced native judgment');
 demand(key(ref.canonicalRoute)===key(module.canonicalRoute),'module representative');
 if(ref.status==='checked-instantiation'){demand(ref.closedTermStructuralMatch===true&&ref.closedTypeStructuralMatch===true&&ref.kernelInstantiationTyping==='PASS'&&ref.kernelInstantiationConversion==='PASS','native module instantiation');}else demand(ref.status==='first-checked-module'&&key(module.canonicalRoute)===key(entry.state.route),'first module occurrence');
 demand(A.walk(source,entry.state.route)===entry.node,'original use route');return use;
}
function locate(source,record,module,entry,evidence,part,slots=[]){
 demand(Array.isArray(slots)&&slots.length<=512&&slots.every(s=>Number.isInteger(s)&&s>=0),'computed route bounds');const data=dataFor(record,module,evidence),root=part==='term'?0:1,o=origin(record,module,evidence,part),route={root,slots:[...slots]},computedNode=A.walk(data,route),computed={namespace:o.namespace,evidenceSha256:evidence.sha256,moduleId:module.id,part,node:computedNode,route,path:A.path(data,route)},use=validateUse(source,record,module,entry);
 const sourceRef=(r,relation,contextEntry=null)=>({relation,contextEntry,computed,originalUse:{node:entry.node,route:clone(entry.state.route)},target:{namespace:'original-packet',name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,node:A.walk(source,r),route:r,path:A.path(source,r)}});
 let offset=0,current=data.roots[root];for(let pos=0;pos<use.slots.length;pos++){
  const originalSlot=use.slots[pos],header=entry.recipe[originalSlot],isLet=module.letSlots[pos],expectedKind=isLet?8:part==='term'?6:7;demand(data.kind[current]===expectedKind,'closed module wrapper');
  if(offset===slots.length)return sourceRef(clone(header.sourceRoute),'new-wrapper-from-source-header',originalSlot);
  const slot=slots[offset++],body=isLet?2:1;
  if(slot<body)return sourceRef({root:header.sourceRoute.root,slots:[...header.sourceRoute.slots,slot,...slots.slice(offset)]},'context-header-reindexing',originalSlot);
  demand(slot===body,'module wrapper field');current=data.children[current][body];
 }
 const tail=slots.slice(offset);if(part==='term')return sourceRef({root:entry.state.route.root,slots:[...entry.state.route.slots,...tail]},'selected-term-reindexing');
 const raw={...entry.graph,roots:[entry.typeRoot],declaration:{rootPaths:['native-context.type']}},typeRoute={root:0,slots:tail};return {relation:'recorded-type-reindexing',computed,originalUse:{node:entry.node,route:clone(entry.state.route)},target:{namespace:'native-closed-context-type',evidenceSha256:evidence.sha256,originalRoute:clone(entry.state.route),graphRoot:entry.typeRoot,node:A.walk(raw,typeRoute),route:typeRoute,path:A.path(raw,typeRoute)}};
}
const api={dataFor,origin,scene,validateUse,locate,ContextModuleError};if(node)module.exports=api;else host.ProofAtlasContextModules=api;
})(typeof window==='undefined'?globalThis:window);
