/* Authenticate reduced-context recipes and prepare cuts through one source cursor. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,C=node?require('./proof-atlas-projected-context-modules'):host.ProofAtlasProjectedContextModules,D=node?require('./proof-atlas-dependent-interface'):host.ProofAtlasDependentInterface,Q=node?require('./proof-atlas-scope-pages'):host.ProofAtlasScopePages,M=node?require('./proof-atlas-context-modules'):host.ProofAtlasContextModules;
const demand=(ok,message)=>{if(!ok)throw Error('Projected context data: '+message);},hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),key=r=>r.root+':'+r.slots.join('.'),route=r=>Number.isInteger(r?.root)&&r.root>=0&&Array.isArray(r.slots)&&r.slots.length<=512&&r.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2);
function check(signal){if(signal?.aborted)throw signal.reason||Error('Projected context request cancelled');}
async function wait(job,signal){check(signal);let cancelled;try{await Promise.race([job.catch(()=>{}),...(signal?[new Promise((_,reject)=>{cancelled=()=>reject(signal.reason||Error('Projected context request cancelled'));signal.addEventListener('abort',cancelled,{once:true});})]:[])]);}finally{if(cancelled)signal.removeEventListener('abort',cancelled);}}
function freeze(x){if(!x||typeof x!=='object'||Object.isFrozen(x))return x;for(const c of Object.values(x))freeze(c);return Object.freeze(x);}
async function provider(pkg,descriptor,owner,record,{signal,scope:sharedScope,scopeDescriptor}={}){
 check(signal);demand(pkg?.format==='ProofAtlasProjectedContextModulePackage/1'&&pkg.leanVersion==='4.33.1'&&pkg.nativeDagMatchesPacket===true&&pkg.kernelDeclarationTyping==='PASS','native package');
 demand(same(pkg.source,{edition:descriptor.edition,name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256}),'source identity');
 for(const f of ['producerSha256','requestSha256','nativeOutputSha256','compiledModuleSha256','nativePacketSha256','projectionProducerSha256','environmentSha256','projectionModelSha256','sceneModelSha256'])demand(hash(pkg[f])&&pkg[f]===descriptor[f],'native provenance');
 const env=pkg.environment,origin=record.origin;demand(descriptor.edition==='goedel-sample-4331'&&origin?.kind==='publisher-attributed-ai-source'&&origin.dataset==='Goedel-LM/Lean-workbook-proofs'&&origin.revision==='b731852af8d8ab11498fda27bce9020738c01c59','frozen AI origin');
 demand(env?.kind==='existing-compiled-reduced-context/1'&&env.module===record.module&&env.sourceSha256===record.sourceSha256&&env.compiledModuleSha256===descriptor.compiledModuleSha256&&env.compiler?.includes('version 4.33.1,')&&env.dependencyRevisions?.mathlib==='0df444a360eaa60ab8c11dca51a86af692955474'&&hash(env.lakeManifestSha256),'native environment');
 demand(await A.digest(new TextEncoder().encode(JSON.stringify(env)))===descriptor.environmentSha256,'environment hash');
 demand(Array.isArray(pkg.entries)&&pkg.entries.length>=1&&pkg.entries.length<=512&&pkg.entries.length===descriptor.checked&&same(pkg.entries.map(e=>e.state?.route),descriptor.routes),'exact native route inventory');
 return recipes(pkg,descriptor,owner,record,{signal,scope:sharedScope,scopeDescriptor});
}
// Shared recipe machinery is called only after a format-specific envelope check.
async function recipes(pkg,descriptor,owner,record,{signal,scope:sharedScope,scopeDescriptor}={}){
 let scope=sharedScope,ownScope=false,disposed=false,cached=null,epoch=0;const entries=new Map(),canonical=new Map(),models=new Map(),groups=new Map();
 const run=(fn,s)=>owner.run?owner.run(fn,{signal:s||signal}):Promise.resolve().then(()=>{check(s||signal);return fn();});
 try{
  if(!scope){demand(scopeDescriptor?.name===record.name&&scopeDescriptor.indexSha256===record.indexSha256,'scope descriptor');scope=await Q.open(scopeDescriptor,record,{signal});ownScope=true;}check(signal);
  for(const entry of pkg.entries){check(signal);demand(route(entry.state?.route)&&!entries.has(key(entry.state.route)),'unique exact route');const module=entry.reducedContext?.module;demand(module&&Number.isInteger(module.id)&&module.id>=0,'module identity');
   if(module.status==='first-checked-module'){demand(!canonical.has(module.id)&&!module.moduleGraph&&!('moduleTermRoot'in module)&&!('moduleTypeRoot'in module),'source-backed module representation');demand(module.closedRepresentation==='ordered-source-projection-recipe/1'&&module.fingerprintMethod==='expr-constructor-payload-ordered-children-count-scope/1'&&hash(module.nativeTermShapeSha256)&&hash(module.nativeExpectedTypeShapeSha256)&&/^[1-9]\d*$/.test(module.nativeTermOccurrences)&&/^[1-9]\d*$/.test(module.nativeExpectedTypeOccurrences),'native root fingerprints');canonical.set(module.id,entry);groups.set(module.id,[]);}
   const first=canonical.get(module.id);demand(first,'canonical observation precedes instantiations');M.origin(record,first.reducedContext.module,descriptor,'term');
   const plan=await run(()=>D.plan(owner.data,record,entry,descriptor)),summaries=[];for(const id of plan.requests)summaries.push(await scope.run(()=>scope.get(id),{signal}));const model=D.complete(plan,summaries);demand(same(model.retainedSlots,entry.reducedContext.slots),'native dependency interface');
   await run(()=>M.validateUse(owner.data,record,first.reducedContext.module,entry));entries.set(key(entry.state.route),entry);models.set(key(entry.state.route),model);groups.get(module.id).push(entry);
  }
  demand(canonical.size===descriptor.modules&&entries.size-canonical.size===descriptor.instantiations,'module inventory');freeze(pkg);freeze(descriptor);for(const list of groups.values())Object.freeze(list);
 }catch(error){if(ownScope)scope?.dispose();throw error;}
 function live(s){check(signal);check(s);demand(!disposed,'disposed');}
 async function prepare(at,{part='term',slots=[],signal:s,...options}={}){live(s);if(!route(at)||!entries.has(key(at)))return null;const ticket=++epoch,entry=entries.get(key(at)),moduleId=entry.reducedContext.module.id,first=canonical.get(moduleId),request=JSON.stringify([key(at),part,slots,options]);if(cached?.key===request)return cached.value;
  const cut=await run(()=>{live(s);return C.prepareCut({source:owner.data,record,entry,evidence:descriptor,model:models.get(key(at)),canonicalEntry:first,canonicalModel:models.get(key(first.state.route))},part,{...options,slots});},s);live(s);demand(ticket===epoch,'selection superseded');
  const nativeChecks=Object.fromEntries(['closedTermTyping','closedTypeTyping','closedExpectedConversion','appliedClosureTyping','instantiatedTermConversion','sourceTypeRoundtrip'].map(k=>[k,entry.reducedContext[k]])),use=entry.reducedContext.module;const value=Object.freeze({...cut,contextMode:'reduced',entry,uses:groups.get(moduleId),canonicalRoute:first.state.route,originalObservation:freeze({namespace:'native-reduced-context-observation',route:entry.state.route,node:entry.node,role:entry.role,nativeReducedChecks:nativeChecks,moduleUse:{status:use.status,canonicalRoute:use.canonicalRoute,...(use.status==='checked-instantiation'?{kernelInstantiationTyping:use.kernelInstantiationTyping,kernelInstantiationConversion:use.kernelInstantiationConversion}:{})}}),evidence:descriptor,part});cached={key:request,value};return value;
 }
 return{kind:'native-source-projected-context-module',record,checked:entries.size,classes:canonical.size,instantiations:entries.size-canonical.size,sha256:descriptor.sha256,source:pkg.source,prepare,has:at=>route(at)&&entries.has(key(at)),dropPrepared(){epoch++;cached=null;},state:()=>({retainedSelections:cached?1:0,prepared:cached?.value.prepared.state()||null,exactNativeRoutes:entries.size,fullContextIndexBuilt:false,scope:scope.state(),disposed}),dispose(){disposed=true;epoch++;cached=null;entries.clear();canonical.clear();models.clear();groups.clear();if(ownScope)scope.dispose();}};
}
let pending=null;
async function open(descriptor,owner,record,options={}){
 check(options.signal);demand(descriptor?.name===record.name&&descriptor.indexSha256===record.indexSha256&&descriptor.sourceSha256===record.sourceSha256&&hash(descriptor.sha256)&&descriptor.file.startsWith('/public/data/proof-atlas/projected-context-modules/')&&Number.isInteger(descriptor.decodedBytes)&&descriptor.decodedBytes>=1&&descriptor.decodedBytes<=8*1024**2,'descriptor identity/bounds');
 while(pending){await wait(pending,options.signal);check(options.signal);}const job=(async()=>{const pkg=await A.compressed(descriptor.file,descriptor.sha256,{maxBytes:8*1024**2,expectedBytes:descriptor.decodedBytes,signal:options.signal});check(options.signal);return provider(pkg,descriptor,owner,record,options);})();pending=job;try{return await job;}finally{if(pending===job)pending=null;}
}
const api={open,provider,recipes,state:()=>({activeLoad:pending!==null})};if(node)module.exports=api;else host.ProofAtlasProjectedContextModuleData=api;
})(typeof window==='undefined'?globalThis:window);
