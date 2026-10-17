/* Native reduced-context closures drawn through delayed ordered projection. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry,C=node?require('./proof-atlas-context-modules'):host.ProofAtlasContextModules,V=node?require('./proof-atlas-context-projection'):host.ProofAtlasContextProjection;
class ProjectedContextModuleError extends Error{constructor(message){super('Projected context module: '+message);}}
const demand=(ok,message)=>{if(!ok)throw new ProjectedContextModuleError(message);},clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),route=r=>Number.isInteger(r?.root)&&r.root>=0&&Array.isArray(r.slots)&&r.slots.length<=512&&r.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2);
function freeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const child of Object.values(value))freeze(child);return Object.freeze(value);}
function checkModel(source,record,module,entry,model){
 const use=C.validateUse(source,record,module,entry);
 demand(model?.format==='ProofAtlasDependentInterface/1'&&model.source.name===record.name&&model.source.indexSha256===record.indexSha256&&model.source.sourceSha256===record.sourceSha256&&model.source.node===entry.node&&same(model.source.route,entry.state.route),'interface source');
 demand(model.originalDepth===entry.recipe.length&&same(model.retainedSlots,use.slots)&&model.contexts.length===entry.recipe.length,'native retained slots');
 for(let j=0;j<entry.recipe.length;j++){const h=entry.recipe[j],c=model.contexts[j];demand(c.slot===j&&c.sourceBinder.node===h.node&&same(c.sourceBinder.route,h.sourceRoute)&&c.domain.node===h.domain&&(h.value===null?c.value===null:c.value.node===h.value),'interface header');}
 return use;
}
function checked(input){const {source,record,entry,evidence,model,canonicalEntry=entry,canonicalModel=model}=input,module=canonicalEntry?.reducedContext?.module;
 demand(module?.status==='first-checked-module'&&same(module.canonicalRoute,canonicalEntry.state.route),'native canonical module');
 demand(source.serialization==='ExprDAG/1'&&source.declaration.name===record.name&&source.kind.length===record.uniqueNodes,'source graph identity');
 C.origin(record,module,evidence,'term');checkModel(source,record,module,canonicalEntry,canonicalModel);checkModel(source,record,module,entry,model);
 return{source,record,entry,evidence,model,canonicalEntry,canonicalModel,module};
}
function graph(input,options={}){
 const context=checked(input),{source,record,evidence,canonicalEntry:e,canonicalModel:model,module}=context;
 const view=V.create(source,e.graph,options),slots=e.reducedContext.slots,depth=e.recipe.length;
 let term=view.root('source',e.node,depth,slots,model.termMask),type=view.root('type',e.typeRoot,depth,slots,model.typeMask);
 for(const j of [...slots].reverse()){const h=e.recipe[j],c=model.contexts[j],prefix=slots.filter(s=>s<j),domain=view.root('source',h.domain,j,prefix,c.domainMask),payload=view.originalPayload(h.node);
  if(h.value===null){term=view.wrapper(6,payload,[domain,term]);type=view.wrapper(7,payload,[domain,type]);}
  else {const value=view.root('source',h.value,j,prefix,c.valueMask);term=view.wrapper(8,{...payload,nondep:false},[domain,value,term]);type=view.wrapper(8,{...payload,nondep:false},[domain,value,type]);}
 }
 demand(view.graph.neededScope[term]===0&&view.graph.neededScope[type]===0,'closed projected roots');
 const base=C.origin(record,module,evidence,'term');delete base.part;const nativeChecks=Object.fromEntries(['closedTermTyping','closedTypeTyping','closedExpectedConversion','appliedClosureTyping','instantiatedTermConversion','sourceTypeRoundtrip'].map(k=>[k,e.reducedContext[k]]));const origin=freeze({...base,kind:'native-projected-context-module',namespace:'source-projected-context-module',method:'ordered-source-context-projection/1',canonicalObservation:clone(e.state.route),originalContextDepth:depth,retainedSlots:[...slots],nativeReducedChecks:nativeChecks,nativeRootFingerprints:module.fingerprintMethod?{method:module.fingerprintMethod,termSha256:module.nativeTermShapeSha256,expectedTypeSha256:module.nativeExpectedTypeShapeSha256}:{status:'not-exported-in-this-package'},nativeJudgmentScope:'complete-closed-roots',typingAtOtherRoutes:'not-derived-by-this-operation'}),stem='projectedContext.'+evidence.sha256+'.'+module.id;
 const data={...view.graph,serialization:'ExprDAG/1',declaration:freeze({name:record.name,rootPaths:[stem+'.term',stem+'.type']}),roots:Object.freeze([term,type])};
 return Object.freeze({data:Object.freeze(data),origin,context,view,seal:()=>view.seal(),state:()=>({...view.state(),newWrappers:slots.length*2,omittedContextEntries:depth-slots.length})});
}
function scene(prepared,record,part,{slots=[],maxNodes=32,maxDepth=3,...options}={}){
 demand(prepared.origin.source.name===record.name&&prepared.origin.source.indexSha256===record.indexSha256&&prepared.origin.source.sourceSha256===record.sourceSha256,'prepared source identity');
 demand(part==='term'||part==='type','module component');demand(route({root:0,slots}),'computed route');demand(Number.isInteger(maxNodes)&&maxNodes>=1&&maxNodes<=64&&Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=6,'scene bounds');
 const cut=G.create(prepared.data,record,{...options,route:{root:part==='term'?0:1,slots:[...slots]},maxNodes,maxDepth,foldBinders:options.foldBinders!==false,foldApplications:options.foldApplications!==false,maxLayerNodes:options.maxLayerNodes??6,maxApplicationChildren:options.maxApplicationChildren??4});
 const module=prepared.context.module,recordedCount=part==='term'?module.nativeTermOccurrences:module.nativeExpectedTypeOccurrences;if(!slots.length&&recordedCount!==undefined)demand(cut.stats.represented===recordedCount,'native closed-root occurrence count');
 cut.coreFormat=cut.format;cut.format='ProofAtlasProjectedContextModuleScene/1';cut.source={...cut.source,...prepared.origin,part};cut.root.category=part==='term'?'source-projected-module-term':'source-projected-module-type';cut.root.nativeJudgment=slots.length?'not-recorded-for-this-cut-root':part==='term'?'native-reduced-closed-term-judgment':'native-reduced-closed-type-judgment';cut.guarantee='Bounded constructor cut of a native checked reduced-context closure. Ordered projection changes outer variable indices, retaining internal binders and exact original-use maps. Native judgments cover complete closed roots only. No logical-necessity, cross-proof reuse, semantic compression or comprehension claim.';return cut;
}
function locateKnown(context,part,slots=[]){const {source,record,entry,evidence,module,canonicalEntry}=context,use=entry.reducedContext;
 demand(part==='term'||part==='type','module component');demand(route({root:0,slots}),'computed route');
 const computed={namespace:'source-projected-context-module',evidenceSha256:evidence.sha256,moduleId:module.id,canonicalObservation:clone(canonicalEntry.state.route),route:{root:part==='term'?0:1,slots:[...slots]}},originalUse={node:entry.node,route:clone(entry.state.route)},sourceRef=(r,relation,slot,map)=>({computed,originalUse,relation,contextSlot:slot,projection:clone(map),target:{namespace:'original-packet',name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,node:A.walk(source,r),route:r,path:A.path(source,r)}});
 let at=0;for(let pos=0;pos<use.slots.length;pos++){const j=use.slots[pos],h=entry.recipe[j];if(at===slots.length)return sourceRef(clone(h.sourceRoute),'new-wrapper-from-retained-header',j,{originalDepth:j,retainedSlots:use.slots.slice(0,pos)});const port=slots[at++],body=h.value===null?1:2;
  if(port<body)return sourceRef({root:h.sourceRoute.root,slots:[...h.sourceRoute.slots,port,...slots.slice(at)]},'retained-header-reindexing',j,{originalDepth:j,retainedSlots:use.slots.slice(0,pos)});demand(port===body,'retained wrapper field');
 }
 const tail=slots.slice(at),projection={originalDepth:entry.recipe.length,retainedSlots:[...use.slots]};if(part==='term')return sourceRef({root:entry.state.route.root,slots:[...entry.state.route.slots,...tail]},'selected-term-reindexing',null,projection);
 const raw={...entry.graph,roots:[entry.typeRoot],declaration:{name:record.name,rootPaths:['native-context.type']}},r={root:0,slots:tail};return{computed,originalUse,relation:'recorded-type-reindexing',projection,target:{namespace:'native-closed-context-type',evidenceSha256:evidence.sha256,originalRoute:clone(entry.state.route),graphRoot:entry.typeRoot,node:A.walk(raw,r),route:r,path:A.path(raw,r)}};
}
function locate(input,part,slots=[]){return locateKnown(checked(input),part,slots);}
function prepareCut(input,part,options={}){
 const prepared=graph(input,options),{context}=prepared,cut=scene(prepared,context.record,part,options),locations={};
 for(const n of cut.nodes){A.describe(prepared.data,n.node);locations[n.id]=locateKnown(context,part,n.route.slots);const regions=n.abstraction==='binder-telescope'?[...n.regions,n.continuation]:n.abstraction==='application-spine'?n.regions:n.ports.map((_,slot)=>({route:{root:n.route.root,slots:[...n.route.slots,slot]}}));for(const r of regions)A.path(prepared.data,r.route);}
 for(const link of cut.links)if(link.relation==='bound-to'){A.describe(prepared.data,link.node);locations[link.target]=locateKnown(context,part,link.route.slots);}
 for(const header of context.entry.recipe)prepared.view.originalPayload(header.node);
 prepared.seal();return Object.freeze({prepared,scene:freeze(cut),locations:freeze(locations)});
}
const api={graph,scene,locate,prepareCut,ProjectedContextModuleError};if(node)module.exports=api;else host.ProofAtlasProjectedContextModules=api;
})(typeof window==='undefined'?globalThis:window);
