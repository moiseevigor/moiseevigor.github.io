/* Authenticate existing native full-context observations without loading full source. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,C=node?require('./proof-atlas-source-context-modules'):host.ProofAtlasSourceContextModules,P=node?require('./proof-atlas-context-types'):host.ProofAtlasContextTypes,L=node?require('./proof-atlas-context-views'):host.ProofAtlasContextViews;
const demand=(ok,message)=>{if(!ok)throw Error('Source context module data: '+message);},hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),key=r=>r.root+':'+r.slots.join('.'),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),route=r=>Number.isInteger(r?.root)&&r.root>=0&&Array.isArray(r.slots)&&r.slots.length<=512&&r.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2);
function freeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const child of Object.values(value))freeze(child);return Object.freeze(value);}
function check(signal){if(signal?.aborted)throw signal.reason||Error('Source context module request cancelled');}
async function wait(job,signal){check(signal);let cancelled;try{await Promise.race([job.catch(()=>{}),...(signal?[new Promise((_,reject)=>{cancelled=()=>reject(signal.reason||Error('Source context module request cancelled'));signal.addEventListener('abort',cancelled,{once:true});})]:[])]);}finally{if(cancelled)signal.removeEventListener('abort',cancelled);}}
async function provider(pkg,descriptor,owner,record,{signal}={}){
 check(signal);demand(pkg?.format==='ProofAtlasContextTypePackage/1'&&pkg.nativeDagMatchesPacket===true&&pkg.kernelDeclarationTyping==='PASS'&&pkg.leanVersion==='4.33.1','native package');
 demand(same(pkg.source,{edition:descriptor.edition,name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256}),'source identity');
 for(const f of ['producerSha256','requestSha256','nativeOutputSha256','nativePacketSha256'])demand(hash(pkg[f])&&pkg[f]===descriptor[f],'native provenance');
 const env=pkg.environment;demand(env?.kind==='existing-compiled-context-types/1'&&env.module===record.module&&env.sourceSha256===record.sourceSha256&&hash(env.compiledModuleSha256)&&env.compiledModuleSha256===descriptor.compiledModuleSha256&&env.compiler?.includes('version 4.33.1,'),'native environment');
 if(descriptor.edition==='goedel-sample-4331')demand(record.origin?.kind==='publisher-attributed-ai-source'&&record.origin.dataset==='Goedel-LM/Lean-workbook-proofs'&&record.origin.revision==='b731852af8d8ab11498fda27bce9020738c01c59'&&env.dependencyRevisions?.mathlib==='0df444a360eaa60ab8c11dca51a86af692955474'&&hash(env.lakeManifestSha256),'frozen AI source provenance');
 else demand(descriptor.edition==='closed-context-controls'&&record.origin?.kind==='assistant-authored-synthetic-controls'&&env.module==='AtlasClosure.Controls'&&Object.keys(env.dependencyRevisions||{}).length===0,'own control provenance');
 demand(hash(descriptor.environmentSha256)&&await A.digest(new TextEncoder().encode(JSON.stringify(env)))===descriptor.environmentSha256,'environment hash');
 demand(Array.isArray(pkg.entries)&&pkg.entries.length>=1&&pkg.entries.length<=512&&pkg.entries.length===descriptor.checked&&same(pkg.entries.map(e=>e.state?.route),descriptor.routes),'native route inventory');
 const entries=new Map(),groups=new Map(),groupFor=new Map(),uses=new Map();let conversions=0,signatureCharacters=0;
 const run=(fn,s)=>owner.run?owner.run(fn,{signal:s||signal}):Promise.resolve().then(()=>{check(s||signal);return fn();});
 for(const entry of pkg.entries){check(signal);demand(route(entry.state?.route)&&!entries.has(key(entry.state.route)),'unique exact route');C.identity(record,entry,descriptor);const pattern=await run(()=>P.validate(entry,owner.data)),signature=pattern.signature;
  demand(signature.length<=1048576,'context signature bound');const old=groups.get(signature);let canonical;
  if(old){demand(entry.selectedTargetTransport.status==='kernel-compared-at-selected-target'&&same(entry.selectedTargetTransport.canonicalRoute,old.state.route)&&entry.role===old.role&&L.equal(old.graph,old.typeRoot,entry.graph,entry.typeRoot).equal,'recorded target instantiation');canonical=key(old.state.route);conversions++;}
  else {demand(entry.selectedTargetTransport.status==='first-class-observation','canonical native closure');signatureCharacters+=signature.length;demand(signatureCharacters<=4*1024**2,'context signature cache bound');groups.set(signature,entry);canonical=key(entry.state.route);uses.set(canonical,[]);}
  entries.set(key(entry.state.route),entry);groupFor.set(key(entry.state.route),canonical);uses.get(canonical).push(entry);if(entries.size%16===0)await new Promise(resolve=>setTimeout(resolve,0));
 }
 demand(groups.size===descriptor.classes&&conversions===descriptor.conversions,'native group inventory');check(signal);freeze(pkg);freeze(descriptor);for(const list of uses.values())Object.freeze(list);let disposed=false,cached=null,epoch=0;
 function live(s){check(signal);check(s);demand(!disposed,'disposed');}
 async function prepare(at,{part='term',slots=[],signal:s,...options}={}){live(s);if(!route(at)||!entries.has(key(at)))return null;const ticket=++epoch,entry=entries.get(key(at)),group=groupFor.get(key(at)),request=JSON.stringify([key(at),part,slots,options]);if(cached?.key===request)return cached.value;
  const canonicalEntry=entries.get(group),cut=await run(()=>{live(s);return C.prepareCut(owner.data,record,entry,descriptor,part,{...options,slots},canonicalEntry);},s);live(s);demand(ticket===epoch,'selection superseded');const value=Object.freeze({...cut,entry,uses:uses.get(group),canonicalRoute:canonicalEntry.state.route,originalObservation:freeze(C.identity(record,entry,descriptor)),evidence:descriptor,part});cached={key:request,value};return value;
 }
 return {kind:'native-source-context-module',prepare,has:at=>route(at)&&entries.has(key(at)),checked:entries.size,classes:groups.size,instantiations:conversions,record,sha256:descriptor.sha256,source:pkg.source,state:()=>({retainedSelections:cached?1:0,prepared:cached?.value.prepared.state()||null,exactNativeRoutes:entries.size,fullContextIndexBuilt:false,signatureCharacters,disposed}),dispose(){disposed=true;epoch++;cached=null;entries.clear();groups.clear();groupFor.clear();uses.clear();}};
}
let pending=null;
async function open(descriptor,owner,record,options={}){
 check(options.signal);demand(descriptor?.name===record.name&&descriptor.indexSha256===record.indexSha256&&descriptor.sourceSha256===record.sourceSha256&&hash(descriptor.sha256)&&descriptor.file.startsWith('/public/data/proof-atlas/context-types/')&&Number.isInteger(descriptor.decodedBytes)&&descriptor.decodedBytes>=1&&descriptor.decodedBytes<=8*1024**2,'descriptor bounds/identity');
 while(pending){await wait(pending,options.signal);check(options.signal);}const job=(async()=>{const pkg=await A.compressed(descriptor.file,descriptor.sha256,{maxBytes:8*1024**2,expectedBytes:descriptor.decodedBytes,signal:options.signal});check(options.signal);return provider(pkg,descriptor,owner,record,options);})();pending=job;try{return await job;}finally{if(pending===job)pending=null;}
}
const api={open,provider,state:()=>({activeLoad:pending!==null})};if(node)module.exports=api;else host.ProofAtlasSourceContextModuleData=api;
})(typeof window==='undefined'?globalThis:window);
