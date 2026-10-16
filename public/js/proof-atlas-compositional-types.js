/* Native lambda/type composition over exact contextual source regions. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,I=node?require('./proof-atlas-introduction-transport'):host.ProofAtlasIntroductionTransport,L=node?require('./proof-atlas-context-views'):host.ProofAtlasContextViews;
const demand=(x,m)=>{if(!x)throw Error('Compositional types: '+m);},key=r=>r.root+':'+r.slots.join('.');
async function provider(pkg,data,record,sha256,file,{signal}={}){
 demand(pkg.format==='ProofAtlasIntroductionTransportPackage/2'&&pkg.nativeDagMatchesPacket===true&&pkg.kernelDeclarationTyping==='PASS'&&pkg.leanVersion==='4.33.1','native package');
 demand(pkg.source?.name===record.name&&pkg.source.indexSha256===record.indexSha256&&pkg.source.sourceSha256===record.sourceSha256&&pkg.source.edition==='source-reference-controls','source identity');
 demand(/^[a-f0-9]{64}$/.test(sha256)&&/^[a-f0-9]{64}$/.test(pkg.producerSha256)&&/^[a-f0-9]{64}$/.test(pkg.requestSha256),'producer identity');
 const env=pkg.environment;demand(env?.kind==='fresh-compositional-control/1'&&record.module==='ReferenceFixture'&&env.module===record.module&&env.sourceSha256===record.sourceSha256&&/^[a-f0-9]{64}$/.test(env.compiledModuleSha256)&&env.compiler?.includes('version 4.33.1,')&&L.same(env.imports,['Lean']),'native environment');
 demand(Array.isArray(pkg.entries)&&pkg.entries.length>0&&pkg.entries.length<=512,'query inventory');
 const index=new Map();let j=0,cache=null;
 for(const e of I.entries(pkg)){
  aborted(signal);const k=key(e.route);demand(!index.has(k),'duplicate exact query');
  const terminal=e.derivation.terminal;demand(await A.digest(new TextEncoder().encode(JSON.stringify(terminal.templateGraph)))===terminal.templateSha256,'terminal template hash');aborted(signal);
  I.validate(e,data,record,{evidenceSha256:sha256});index.set(k,{index:j++,node:e.node,route:e.route,steps:e.derivation.steps.length});
 }
 function getRecord(route){const summary=index.get(key(route));if(!summary)return null;if(cache?.key===key(route))return cache.value;
  const entry=I.entries({...pkg,entries:[pkg.entries[summary.index]]}).next().value,view=I.validate(entry,data,record,{evidenceSha256:sha256});cache={key:key(route),value:{entry,view}};return cache.value;}
 return{source:pkg.source,sha256,file,checked:index.size,kernelDeclarationTyping:pkg.kernelDeclarationTyping,get:route=>index.get(key(route))||null,getRecord,state:()=>({retainedRecords:cache?1:0})};
}
let pending=null;
function aborted(signal){if(signal?.aborted)throw signal.reason||Error('Compositional type load cancelled');}
async function wait(job,signal){aborted(signal);if(!signal){await job.catch(()=>{});return;}let cancel;try{await Promise.race([job.catch(()=>{}),new Promise((_,reject)=>{cancel=()=>reject(signal.reason||Error('Compositional type load cancelled'));signal.addEventListener('abort',cancel,{once:true});})]);}finally{signal.removeEventListener('abort',cancel);}}
async function open(d,data,record,{signal}={}){
 aborted(signal);demand(d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256&&/^[a-f0-9]{64}$/.test(d.sha256)&&Number.isInteger(d.decodedBytes)&&d.decodedBytes>0&&d.decodedBytes<=16*1024**2,'descriptor bounds/identity');
 while(pending){await wait(pending,signal);aborted(signal);}
 const job=(async()=>{const pkg=await A.compressed(d.file,d.sha256,{maxBytes:16*1024**2,expectedBytes:d.decodedBytes,signal});aborted(signal);demand(pkg.source.edition===d.edition&&pkg.producerSha256===d.producerSha256&&pkg.requestSha256===d.requestSha256&&L.same(pkg.entries.map(e=>e.route),d.routes),'descriptor provenance/paths');const result=await provider(pkg,data,record,d.sha256,d.file,{signal});demand(result.checked===d.checked,'descriptor count');return result;})();pending=job;try{return await job;}finally{if(pending===job)pending=null;}
}
function mount(container,{typing,route,record,data,onProofOccurrence}){
 const selected=typing.getRecord(route);demand(selected,'exact composition query');const{entry:e,view:p}=selected,B=node?require('./proof-atlas-beta-reduction'):host.ProofAtlasBetaReduction;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;},jump=(label,at)=>{const b=el('button',label+' · '+at.path);b.type='button';b.dataset.compositionSource=at.path;b.onclick=()=>onProofOccurrence(at.node,at.route);return b;};
 container.replaceChildren();container.classList.add('pl-beta-reduction');
 container.append(el('h4','Checked type composition'),el('p',e.derivation.steps.length+' checked '+(e.derivation.steps.length===1?'introduction':'introductions')+' · '+e.role+' · '+e.context.length+' enclosing binders.'),jump('Open recorded source expression',e));
 const native=el('details'),text=el('pre',e.typeText);text.tabIndex=0;const download=el('a','Complete checked type data ↓');download.href=typing.file;native.append(el('summary','Native type text · presentation'),text,download);container.append(native);
 if(e.derivation.steps.length){const rules=el('details'),list=el('ol');rules.append(el('summary','Checked introduction premises'),list);for(const s of e.derivation.steps){const item=el('li');item.append(jump('Source lambda',s.source),jump('Domain before its binder',s.domain),jump('Body under its binder',s.body));list.append(item);}container.append(rules);}
 container.append(el('p','Each recorded introduction links its computed function-type binder to its exact source lambda. Borrowed domains and type regions retain exact source routes. The inferred complete type can differ syntactically from the declaration’s written type; native declaration typing checks their conversion at the complete roots. Other computed descendants have no separately inferred typing judgment.'));
 const viewport=el('div'),message=el('p');message.setAttribute('role','status');container.append(message,viewport);
 return B.mountComputed(viewport,{data,record,onProofOccurrence,prepared:{computedData:p.computed,entry:e},domPrefix:'composition',namespace:'introduction-transport',showExpression:true,computedNote:'Source selection stays fixed while inspecting the computed type. Scope links follow its binders; original enclosing binders retain their source routes.',provenanceTitle:'Type-composition provenance',createScene:slots=>p.scene(slots),sourceReference:slots=>p.origin(slots),relatedSource:slots=>{const relation=p.binderCorrespondence(slots);return relation?{...relation.source,label:'Open corresponding source lambda',detail:'Checked lambda/Pi binder correspondence; the computed Pi is a separate type occurrence.'}:null;},provenance:s=>({source:s.source,context:s.ambientContext,nativeTyping:e.kernelOriginalTermTyping,nativeTypeTyping:e.kernelOriginalTypeTyping,declarationTypeConversion:typing.kernelDeclarationTyping,composition:e.reconstruction,stats:p.stats()}),onSceneError:error=>{message.textContent='Composed type unavailable: '+error.message;}});
}
const api={provider,open,mount,state:()=>({activeLoad:pending!==null})};if(node)module.exports=api;else host.ProofAtlasCompositionalTypes=api;
})(typeof window==='undefined'?globalThis:window);
