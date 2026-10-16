/* Optional application types over source anchors. This is not a materialized typing provider. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-application-transport'):host.ProofAtlasApplicationTransport,L=node?require('./proof-atlas-context-views'):host.ProofAtlasContextViews;
const demand=(v,m)=>{if(!v)throw Error('Application types: '+m);},key=r=>r.root+':'+r.slots.join('.');
const fields={'application-function-type':'before','application-pi-type':'pi','application-argument-type':'actual','application-domain':'domain','application-result-type':'after','application-substitution-type':'substituted','argument-type':'actual','expected-domain':'domain'};
function componentIndex(e,c){if(c.kind==='subject-type')return 1;demand(Object.hasOwn(fields,c.kind)&&Number.isInteger(c.slot)&&c.slot>=1&&c.slot<=e.stages.length,'type component');return e.stages[c.slot-1].components[fields[c.kind]];}
function aborted(signal){if(signal?.aborted)throw signal.reason||Error('Application types cancelled');}
async function wait(job,signal){aborted(signal);let cancel;try{await Promise.race([job.catch(()=>{}),...(signal?[new Promise((_,reject)=>{cancel=()=>reject(signal.reason||Error('Application types cancelled'));signal.addEventListener('abort',cancel,{once:true});})]:[])]);}finally{if(cancel)signal.removeEventListener('abort',cancel);}}
async function provider(pkg,data,record,sha256,file,{signal}={}){
 demand(pkg.format==='ProofAtlasApplicationTransportPackage/1'&&pkg.nativeDagMatchesPacket===true&&pkg.kernelDeclarationTyping==='PASS'&&pkg.leanVersion==='4.33.1','native package');
 demand(pkg.source?.name===record.name&&pkg.source.indexSha256===record.indexSha256&&pkg.source.sourceSha256===record.sourceSha256&&pkg.source.edition==='goedel-sample-4331','source identity');
 demand(/^[a-f0-9]{64}$/.test(sha256)&&/^[a-f0-9]{64}$/.test(pkg.producerSha256)&&/^[a-f0-9]{64}$/.test(pkg.requestSha256),'producer identity');
 const env=pkg.environment,origin=record.origin;demand(env?.kind==='existing-compiled-ai-application/1'&&env.module===record.module&&env.sourceSha256===record.sourceSha256&&/^[a-f0-9]{64}$/.test(env.compiledModuleSha256)&&/^[a-f0-9]{64}$/.test(env.lakeManifestSha256)&&env.compiler?.includes('version 4.33.1,')&&env.dependencyRevisions?.mathlib==='0df444a360eaa60ab8c11dca51a86af692955474','native environment');
 demand(origin?.kind==='publisher-attributed-ai-source'&&origin.dataset==='Goedel-LM/Lean-workbook-proofs'&&origin.revision==='b731852af8d8ab11498fda27bce9020738c01c59','sample provenance');
 demand(Array.isArray(pkg.entries)&&pkg.entries.length>0&&pkg.entries.length<=512,'query inventory');
 const index=new Map();let cache=null,pendingPrepare=null;
 for(let j=0;j<pkg.entries.length;j++){aborted(signal);const e=pkg.entries[j],k=key(e.route);demand(!index.has(k),'duplicate exact query');await P.prepare(e,data,record,{evidenceSha256:sha256});aborted(signal);index.set(k,{index:j,node:e.node,route:e.route,stages:e.stages.length});}
 async function getPrepared(route,{signal}={}){
  aborted(signal);const k=key(route),summary=index.get(k);if(!summary)return null;
  while(pendingPrepare){await wait(pendingPrepare,signal);aborted(signal);}
  if(cache?.key===k)return cache.value;
  const job=(async()=>{const entry=pkg.entries[summary.index],prepared=await P.prepare(entry,data,record,{evidenceSha256:sha256});aborted(signal);const value={entry,prepared};cache={key:k,value};return value;})();pendingPrepare=job;try{return await job;}finally{if(pendingPrepare===job)pendingPrepare=null;}
 }
 return{source:pkg.source,sha256,file,checked:index.size,get:route=>index.get(key(route))||null,getPrepared,state:()=>({retainedRecords:cache?1:0,activePreparation:pendingPrepare!==null})};
}
let pending=null;
async function open(d,data,record,{signal}={}){
 aborted(signal);demand(d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256&&/^[a-f0-9]{64}$/.test(d.sha256)&&Number.isInteger(d.decodedBytes)&&d.decodedBytes>0&&d.decodedBytes<=16*1024**2,'descriptor bounds/identity');
 while(pending){await wait(pending,signal);aborted(signal);}
 const job=(async()=>{const pkg=await A.compressed(d.file,d.sha256,{maxBytes:16*1024**2,expectedBytes:d.decodedBytes,signal});aborted(signal);demand(pkg.source.edition===d.edition&&pkg.producerSha256===d.producerSha256&&pkg.requestSha256===d.requestSha256&&pkg.environment.compiledModuleSha256===d.compiledModuleSha256&&L.same(pkg.entries.map(e=>e.route),d.routes),'descriptor provenance/paths');const result=await provider(pkg,data,record,d.sha256,d.file,{signal});demand(result.checked===d.checked,'descriptor count');return result;})();pending=job;try{return await job;}finally{if(pending===job)pending=null;}
}
function mount(container,{selected,component,typing,data,record,onProofOccurrence,onComponentChange,attachUniverses}){
 const B=node?require('./proof-atlas-beta-reduction'):host.ProofAtlasBetaReduction,{entry,prepared}=selected,el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 container.replaceChildren();container.classList.add('pl-beta-reduction','pl-source-application-type');container.append(el('h4','Checked application type · source-backed'));
 const label=el('label','Type component '),select=el('select'),options=[{kind:'subject-type',title:'Selected expression’s type'}];select.setAttribute('aria-label','Checked type component');
 for(const s of entry.stages)for(const kind of Object.keys(fields).filter(k=>k.startsWith('application-')))options.push({kind,slot:s.slot,title:'Application stage '+s.slot+' · '+kind.slice(12).replaceAll('-',' ')});
 // The argument buttons use aliases for these same native stage components.
 const wanted=componentIndex(entry,component),initial=options.findIndex(c=>componentIndex(entry,c)===wanted);for(let i=0;i<options.length;i++){const o=el('option',options[i].title);o.value=String(i);select.append(o);}select.value=String(initial);label.append(select);container.append(label,el('p','Borrowed type regions retain their exact original occurrences. Computed parents have separate identities; native conversions concern complete roots.'));
 const download=el('a','Complete checked application data ↓');download.href=typing.file;container.append(download);const viewport=el('div');container.append(viewport);let view=null,part=null;
 function render(){const chosen=options[Number(select.value)];part=prepared.component(componentIndex(entry,chosen));view?.dispose();onComponentChange?.(chosen);view=B.mountComputed(viewport,{data,record,prepared:{computedData:part.computedData,entry,origin:part.provenance},namespace:'application-transport',domPrefix:'applicationtype',showExpression:true,attachUniverses,onProofOccurrence,createScene:part.scene,sourceReference:part.origin,provenanceTitle:'Application type provenance',provenance:s=>({source:s.source,sourceAnchors:entry.anchors,method:entry.conversions,substitutionComparisons:prepared.comparisons.map(c=>({stage:c.stage,derivationSha256:c.derivationSha256,substitution:c.substitution})),stats:prepared.stats()}),computedNote:'Other computed descendants have no original occurrence or separately inferred type. Γ links retain the source context. Inspecting this type keeps the selected proof occurrence fixed.'});}
 select.onchange=render;render();return{getScene:()=>view?.getScene()||null,getUniverseScene:()=>view?.getUniverseScene()||null,getPoint:()=>null,dispose:()=>{view?.dispose();view=null;select.onchange=null;container.classList.remove('pl-beta-reduction','pl-source-application-type');container.replaceChildren();}};
}
const api={provider,open,mount,componentIndex,supports:c=>c.kind==='subject-type'||Object.hasOwn(fields,c.kind),state:()=>({activeLoad:pending!==null})};if(node)module.exports=api;else host.ProofAtlasApplicationTypes=api;
})(typeof window==='undefined'?globalThis:window);
