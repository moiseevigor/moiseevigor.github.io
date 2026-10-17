/* Public-packet replay has its own provenance; never impersonate an imported module. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,L=node?require('./proof-atlas-context-views'):host.ProofAtlasContextViews,C=node?require('./proof-atlas-projected-context-module-data'):host.ProofAtlasProjectedContextModuleData;
const demand=(ok,message)=>{if(!ok)throw Error('Replay context data: '+message);},hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),same=(a,b)=>L.same(a,b),digest=x=>A.digest(new TextEncoder().encode(JSON.stringify(x)));
function check(signal){if(signal?.aborted)throw signal.reason||Error('Replay context request cancelled');}
function matches(d,full){return !!full&&d?.format==='ProofAtlasReducedReplayDescriptor/1'&&same(d.source,{edition:full.edition,name:full.name,indexSha256:full.indexSha256,sourceSha256:full.sourceSha256})&&d.nativeReducedContexts===full.checked;}
async function provider(pkg,d,owner,record,{signal,fullPackage,fullDescriptor,...options}={}){
 check(signal);demand(matches(d,fullDescriptor)&&hash(d.sha256)&&d.file==='/public/data/proof-atlas/reduced-replay/'+d.sha256+'.json.gz','descriptor source');
 demand(pkg?.format==='ProofAtlasReducedReplayEvidence/1'&&pkg.leanVersion==='4.33.1'&&same(pkg.source,d.source),'replay format/source');
 const env=pkg.environment,o=record.origin;
 demand(o?.kind==='publisher-attributed-ai-source'&&o.dataset==='Goedel-LM/Lean-workbook-proofs'&&o.revision==='b731852af8d8ab11498fda27bce9020738c01c59','frozen AI origin');
 demand(record.name===d.source.name&&record.indexSha256===d.source.indexSha256&&record.sourceSha256===d.source.sourceSha256,'source packet');
 demand(env?.kind==='public-packet-reduced-context/1'&&same(env.imports,['Mathlib','Aesop'])&&env.originalProofModulesImported===false&&env.privateProofProjectsOrDependenciesBuilt===false&&same(Object.keys(env).sort(),['kind','imports','lakeManifestSha256','dependencyRevisions','originalProofModulesImported','privateProofProjectsOrDependenciesBuilt'].sort()),'public-packet environment');
 demand(fullPackage?.format==='ProofAtlasContextTypePackage/1'&&same(fullPackage.source,pkg.source)&&fullPackage.environment?.kind==='existing-compiled-context-types/1','earlier input evidence');
 demand(same(env.dependencyRevisions,fullPackage.environment.dependencyRevisions)&&env.lakeManifestSha256===fullPackage.environment.lakeManifestSha256&&hash(env.lakeManifestSha256)&&env.dependencyRevisions.mathlib==='0df444a360eaa60ab8c11dca51a86af692955474','pinned dependencies');
 const input=pkg.sourceContextEvidence;demand(same(input,{file:fullDescriptor.file,sha256:fullDescriptor.sha256,decodedBytes:fullDescriptor.decodedBytes,checked:fullDescriptor.checked,compiledModuleSha256:fullDescriptor.compiledModuleSha256}),'earlier input hash');
 for(const f of ['nativeOutputSha256','queryInventorySha256','baselineProofSha256'])demand(hash(pkg[f]),'replay provenance');
 demand(hash(pkg.producer?.runtimeSha256)&&hash(pkg.producer.publisherSha256)&&same(Object.keys(pkg.producer.sourceFiles||{}).sort(),['reduced-replay/ReducedReplay.lean','reduced-replay/prepare.cjs','reduced-replay/verify.py','ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','context-modules/ExportContextModules.lean'].map(f=>'research/proof-atlas/'+f).sort())&&Object.values(pkg.producer.sourceFiles).every(hash),'producer identity');
 const b=pkg.baselineProof;demand(b?.name===record.name&&b.indexSha256===record.indexSha256&&b.storedNodes===record.uniqueNodes&&same([...b.axioms].sort(),[...record.axioms].sort())&&same(b.roundtripFields,['kind','children','payloads','expanded','neededScope','roots']),'baseline proof identity');
 for(const f of ['kernelExpectedType','kernelProof','kernelExpectedTypeIsProposition','kernelExpectedTypeConversion'])demand(b[f]==='PASS','baseline kernel checks');
 for(const f of ['originalTheoremAbsentFromEnvironment','originalModuleAbsentFromEnvironment','wrongProofRejectedByKernel','illTypedBinderRejectedByKernel'])demand(b[f]===true,'baseline controls');
 demand(await A.digest(new TextEncoder().encode(JSON.stringify(b)+'\n'))===pkg.baselineProofSha256,'baseline proof hash');check(signal);
 demand(Array.isArray(pkg.entries)&&pkg.entries.length>=1&&pkg.entries.length<=512&&pkg.entries.length===d.nativeReducedContexts&&pkg.entries.length===fullPackage.entries.length,'route inventory bound');
 const roles={},properRoles={},reuseRoles={};let proper=0,reuse=0;
 for(let j=0;j<pkg.entries.length;j++){
  const e=pkg.entries[j],old=fullPackage.entries[j];demand(same(Object.fromEntries(Object.entries(e).filter(([k])=>k!=='reducedContext')),old),'unchanged original observation');
  roles[e.role]=(roles[e.role]||0)+1;if(e.reducedContext?.slots?.length<e.recipe.length){proper++;properRoles[e.role]=(properRoles[e.role]||0)+1;}
  if(e.reducedContext?.module?.status==='checked-instantiation'){reuse++;reuseRoles[e.role]=(reuseRoles[e.role]||0)+1;}
 }
 const counts={nativeReducedContexts:pkg.entries.length,omissionControls:d.omissionControls,modules:d.modules,instantiations:reuse,properReductions:proper,roles,properRoles,reuseRoles,offlineNodeLimit:131072,publicMaterializedNodeLimitUnchanged:32768};
 demand(same(pkg.statistics,counts)&&Object.entries(counts).every(([k,v])=>same(d[k],v)),'replay inventory');
 const evidence={format:'ProofAtlasReplayContextModuleDescriptor/1',...pkg.source,sha256:d.sha256,file:d.file,decodedBytes:d.decodedBytes,checked:pkg.entries.length,modules:d.modules,instantiations:reuse,routes:pkg.entries.map(e=>e.state.route),producerRuntimeSha256:pkg.producer.runtimeSha256,queryInventorySha256:pkg.queryInventorySha256,nativeOutputSha256:pkg.nativeOutputSha256,baselineProofSha256:pkg.baselineProofSha256,environmentSha256:await digest(env),environment:env,sourceContextEvidence:{...input,status:'earlier-input-record-not-reverified-in-replay'}};
 check(signal);const result=await C.recipes(pkg,evidence,owner,record,{signal,...options});return{...result,kind:'native-replay-projected-context-module'};
}
let pending=null;
async function wait(job,signal){check(signal);let cancel;try{await Promise.race([job.catch(()=>{}),...(signal?[new Promise((_,reject)=>{cancel=()=>reject(signal.reason||Error('Replay context cancelled'));signal.addEventListener('abort',cancel,{once:true});})]:[])]);}finally{if(cancel)signal.removeEventListener('abort',cancel);}}
async function open(d,owner,record,options={}){
 check(options.signal);demand(matches(d,options.fullDescriptor)&&hash(d.sha256)&&d.file==='/public/data/proof-atlas/reduced-replay/'+d.sha256+'.json.gz'&&Number.isInteger(d.decodedBytes)&&d.decodedBytes>0&&d.decodedBytes<=8*1024**2,'descriptor bounds');
 while(pending){await wait(pending,options.signal);check(options.signal);}const job=(async()=>{const pkg=await A.compressed(d.file,d.sha256,{maxBytes:8*1024**2,expectedBytes:d.decodedBytes,signal:options.signal});check(options.signal);return provider(pkg,d,owner,record,options);})();pending=job;try{return await job;}finally{if(pending===job)pending=null;}
}
const api={matches,provider,open,state:()=>({activeLoad:pending!==null})};if(node)module.exports=api;else host.ProofAtlasReplayContextModuleData=api;
})(typeof window==='undefined'?globalThis:window);
