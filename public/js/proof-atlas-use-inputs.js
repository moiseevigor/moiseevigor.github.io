/* Source use -> recorded Pi input. Containment never supplies intermediate typing. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes;
 const C=node?require('./proof-atlas-source-corridor'):host.ProofAtlasSourceCorridor;
 const J=node?require('./proof-atlas-application-judgment'):host.ProofAtlasApplicationJudgment;
 const pages=()=>node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages;
 const owners=new WeakMap(),issued=new WeakSet(),limits=Object.freeze({sourceSteps:32768,nativeDepth:512,providers:6,lookups:4096,bytes:262144,text:512});
 const demand=(ok,m)=>{if(!ok)throw Error('Use input: '+m);},identity=r=>({name:r.name,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256}),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const slot=(bytes,i)=>(bytes[i>>2]>>((i%4)*2))&3,binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 const packed=r=>P.encode(r.root,r.slots),freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
 function sourceUse(w){
  demand(w?.format==='ProofAtlasUseWitness/1'&&w.status==='found'&&w.witness.namespace==='selected-binder-body-relative','source-use receipt');const bytes=P.parse(w.witness.relative);demand(w.witness.relative.root===0,'relative namespace');
  const suffix=Array.from({length:w.witness.relative.depth},(_,i)=>slot(bytes,i));
  return{node:w.witness.node,route:P.append(w.selection.route,[w.body.slot,...suffix]),source:w.source,binder:{node:w.selection.node,route:w.selection.route},boundIndex:w.witness.index};
 }
 function open(data,record,providers,options={}){
  demand(data.serialization==='ExprDAG/1'&&data.kind.length===record.uniqueNodes&&data.declaration.name===record.name&&(!data.declaration.sourceSha256||data.declaration.sourceSha256===record.sourceSha256),'source identity');
  return own(data,record,providers,id=>Promise.resolve([data.kind[id],data.children[id],data.payloads[id]]),C.open(data,record),options);
 }
 function paged(cursor,native){
  const id=pages().identity(cursor),record=cursor.record;demand(same(identity(record),{name:id.name,indexSha256:id.indexSha256,sourceSha256:id.sourceSha256}),'paged source identity');
  return own(cursor.data,record,Object.values(native.providers), (id,signal)=>cursor.run(()=>[cursor.data.kind[id],cursor.data.children[id],cursor.data.payloads[id]],{signal}),C.paged(cursor),{runNative:(work,{signal})=>cursor.run(()=>native.run(work,{signal}),{signal})});
 }
 function own(data,record,providers,read,corridor,options){
  demand(Array.isArray(providers)&&providers.length<=limits.providers&&providers.every(p=>same(identity(p.source),identity(record))&&/^[a-f0-9]{64}$/.test(p.sha256)&&typeof p.get==='function'),'native owners');
  const owner=Object.freeze({}),state={data,record,providers:[...providers].sort((a,b)=>a.sha256.localeCompare(b.sha256)),read,corridor,runNative:options.runNative||((work)=>Promise.resolve(work())),disposed:false};owners.set(owner,state);return owner;
 }
 function dispose(owner){const own=owners.get(owner);demand(own,'owner');own.disposed=true;}
 async function find(owner,use,options={}){
  const o=owners.get(owner);demand(o,'owner');const {data,record,providers}=o,bytes=P.parse(use.route),source=identity(record),steps=options.sourceSteps??limits.sourceSteps;let lookups=0,checkedQueries=0,candidates=0,sourceSteps=0;
  demand(Number.isSafeInteger(steps)&&steps>0&&steps<=limits.sourceSteps,'source step bound');
  const live=()=>{demand(!o.disposed,'disposed owner');if(options.signal?.aborted)throw options.signal.reason||Error('Cancelled');};
  const stats=()=>({sourceSteps,nativeLookups:lookups,checkedQueries,candidates,providers:providers.length});
  try{
   live();demand(!use.source||same(identity(use.source),source),'foreign use source');demand(use.route.root<data.roots.length&&use.route.depth<=steps,'source traversal budget');
   async function row(id){live();demand(Number.isInteger(id)&&id>=0&&id<record.uniqueNodes,'source node');const [kind,children,payload]=await o.read(id,options.signal);live();demand(Number.isInteger(kind)&&kind>=0&&kind<12&&Array.isArray(children)&&children.length===(A.fields[A.kinds[kind]]||[]).length&&children.every(c=>Number.isInteger(c)&&c>=0&&c<id),'source row');return{kind,children,payload};}
   let id=data.roots[use.route.root];const bindings=[];
   for(let depth=0;depth<use.route.depth;depth++){const r=await row(id),s=slot(bytes,depth);demand(s<r.children.length,'use source route');if(binds(r.kind,s))bindings.push({node:id,depth});id=r.children[s];sourceSteps++;}
   const variable=await row(id);demand(id===use.node&&variable.kind===0&&Number.isSafeInteger(variable.payload.index)&&variable.payload.index>=0,'not this source bvar');const index=variable.payload.index,target=bindings.at(-1-index);demand(target,'unbound index has no original source binder');
   const binder={node:target.node,route:P.prefix(use.route,target.depth)};demand(!use.binder||same(use.binder,binder),'foreign binder occurrence');demand(use.boundIndex===undefined||use.boundIndex===index,'changed source index');
   if(!providers.length)throw Error('No loaded native evidence packages');
   const contains=r=>r.root===use.route.root&&r.slots.length<=use.route.depth&&r.slots.every((s,i)=>s===slot(bytes,i));let best=null;
   // Only original queries are considered. Derived prefix observations are
   // represented by their original query and actual application stage.
   for(let depth=Math.min(use.route.depth-1,limits.nativeDepth);depth>=0;depth--){
    const route={root:use.route.root,slots:Array.from({length:depth},(_,i)=>slot(bytes,i))};
    for(const provider of providers){
     live();demand(++lookups<=limits.lookups,'native lookup budget');
     const candidate=await o.runNative(()=>{
      const e=(provider.getQuery||provider.get)(route);if(e?.status!=='checked'||e.typingOrigin||e.applicationJudgment?.status!=='checked')return null;
      checkedQueries++;const trace=e.applicationJudgment;let result=null;
      for(const s of trace.stages){for(const kind of ['argument','function']){
       const r=kind==='argument'?e.arguments[s.slot-1].route:{root:s.route.root,slots:[...s.route.slots,0]};if(!contains(r))continue;candidates++;
       if((!best||r.slots.length>best.depth)&&(!result||r.slots.length>result.depth))result={depth:r.slots.length,kind,stage:s.slot,route};
      }}return result;
     },{signal:options.signal});live();if(candidate)best={...candidate,provider};
    }
   }
   const selected={node:use.node,route:{...use.route},index,contextDepth:bindings.length,binder};
   if(!best)return freeze({format:'ProofAtlasUseInput/1',status:'not-recorded',source,use:selected,stats:stats(),scope:'No containing application input in the loaded original native query packages, through source prefix depth 512. This does not establish that no construction consumes the use.'});
   const rule=await o.runNative(()=>J.create(data,record,best.provider,best.route,best.stage),{signal:options.signal});live();const input=rule[best.kind];demand(rule.context.length===bindings.filter(b=>b.depth<input.route.slots.length).length,'input native/source context');demand(contains(input.route)&&input.route.slots.length===best.depth,'input source containment');
   const operandRow=await row(input.node),head=await o.runNative(()=>{const e=(best.provider.getQuery||best.provider.get)(best.route);return{node:e.applicationJudgment.head.node,route:e.applicationJudgment.head.route};},{signal:options.signal}),headRow=await row(head.node);
   const point=p=>({node:p.node,route:packed(p.route),role:p.role,typeRoot:p.typeRoot,text:p.text.slice(0,limits.text)+(p.text.length>limits.text?'…':''),textTruncated:p.text.length>limits.text});
   const gapDepth=use.route.depth-input.route.slots.length,gap={depth:gapDepth,relation:gapDepth===0?'direct-input':'inside-input',contextExtensions:bindings.filter(b=>b.depth>=input.route.slots.length).length,binderLocation:target.depth<input.route.slots.length?'ambient-input-context':'introduced-inside-input',intermediateTyping:'not-inferred',corridorStatus:'unavailable',corridorReason:'The source-context protocol has a separate 512-slot absolute route bound.'};let corridor=null;
   if(use.route.depth<=C.limits.route){try{corridor=await C.create(o.corridor,input.route,{root:use.route.root,slots:Array.from({length:use.route.depth},(_,i)=>slot(bytes,i))},{signal:options.signal});live();gap.corridorStatus='available';delete gap.corridorReason;}catch(error){live();gap.corridorReason=String(error.message).slice(0,256);}}
   const scene={format:'ProofAtlasUseInput/1',status:'found',source,evidencePackages:providers.map(p=>({sha256:p.sha256,file:p.file})),use:selected,query:{node:rule.source.judgment.node,route:packed(best.route),evidenceSha256:best.provider.sha256,file:best.provider.file,...(best.provider.recording?{recording:best.provider.recording}:{})},head:{node:head.node,route:packed(head.route),label:headRow.kind===4?String(headRow.payload.name).slice(0,96):'Source e'+head.node},input:best.kind,stage:rule.stage,stages:rule.stages,nativeContextDepth:rule.context.length,binder:rule.binder,function:{...point(rule.function),piRoot:rule.function.piRoot},argument:{...point(rule.argument),domainRoot:rule.argument.domainRoot,domainText:rule.argument.domainText.slice(0,limits.text)+(rule.argument.domainText.length>limits.text?'…':''),domainTextTruncated:rule.argument.domainText.length>limits.text},result:{...point(rule.result),substitutedRoot:rule.result.substitutedRoot},conversions:rule.conversions,gap,corridor,stats:stats(),guarantee:'The selected source occurrence lies in this exact recorded application input. Native typing applies to the input and application stage in their original context. A nonempty gap is source containment only; type text is bounded presentation. No typing of intermediate constructors, logical necessity, saturation or semantic explanation is inferred.'};
   demand(operandRow.kind>=0&&new TextEncoder().encode(JSON.stringify(scene)).length<=limits.bytes,'metadata byte bound');freeze(scene);issued.add(scene);return scene;
  }catch(error){return freeze({format:'ProofAtlasUseInput/1',status:'unavailable',source,reason:String(error.message||error).slice(0,256),stats:stats()});}
 }
 function mount(container,{scene,onSource}){
  demand(issued.has(scene),'unissued input diagram');const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(tag==='pre')e.tabIndex=0;return e;},jump=(label,p)=>{const b=el('button',label+' · e'+p.node);b.type='button';b.onclick=()=>onSource({node:p.node,route:p.route});return b;};
  container.className='pl-use-input';container.append(el('h5',scene.gap.relation==='direct-input'?'Direct recorded input':'Inside a recorded input'),el('p','Π application · '+scene.head.label+' · stage '+scene.stage+' of '+scene.stages));
  const bridge=el('div');bridge.className='pl-use-input-bridge';const binding=el('div'),containment=el('div');binding.className=containment.className='pl-use-input-link';binding.append(jump('Binder',scene.use.binder),el('span','← binds ←'),jump('Selected use',scene.use));containment.append(jump('Selected use',scene.use),el('span',scene.gap.depth===0?'= exact input =':scene.gap.depth+' fields →'),jump('Recorded '+scene.input,scene[scene.input]));bridge.append(binding,containment);container.append(bridge);
  function typeText(card,label,text,expanded=false){const d=el('details');d.open=expanded;d.append(el('summary',label),el('pre',text));card.append(d);}
  const premises=el('div');premises.className='pl-rule-premises';for(const kind of ['function','argument']){const p=scene[kind],card=el('section');card.className='pl-rule-premise';if(kind===scene.input)card.dataset.selectedInput='';card.append(el('h6',(kind==='function'?'Γ ⊢ f : τ':'Γ ⊢ a : A′')+' · '+p.role),jump(kind==='function'?'Function input':'Argument '+scene.stage,p));typeText(card,'Recorded type',p.text,kind===scene.input);if(kind==='argument'){card.append(el('p','Parameter '+scene.binder.name.slice(0,96)+' · '+scene.binder.info),el('p','A′ ≡ A · recorded conversion')); if(p.typeRoot!==p.domainRoot)typeText(card,'Expected domain A',p.domainText);}premises.append(card);}const bar=el('div','Π application · recorded kernel conversions');bar.className='pl-rule-bar';container.append(premises,bar);const result=el('section');result.className='pl-rule-result';result.append(el('h6','Γ ⊢ f a : B[a/x] · '+scene.result.role),jump('Application result',scene.result));typeText(result,'Recorded result type',scene.result.text);container.append(result);
  if(scene.gap.depth)container.append(el('p','The selected use is inside the '+scene.input+' region. The intervening '+scene.gap.depth+' source fields have no new typing judgments.'));
  if(scene.corridor){const d=el('details'),body=el('div');d.append(el('summary','Source context · '+scene.gap.depth+' fields · '+scene.corridor.root.occurrences+' occurrences'),body);container.append(d);C.mount(body,{scene:scene.corridor,onSource:(node,route)=>onSource({node,route:packed(route)})});}else container.append(el('p','Source context diagram unavailable: '+scene.gap.corridorReason));
  const details=el('details');details.append(el('summary','Exact source and native evidence'),el('pre',JSON.stringify({source:scene.source,query:scene.query,use:scene.use,input:scene.input,stage:scene.stage,gap:scene.gap,binder:scene.binder,conversions:scene.conversions},null,2)));container.append(details);return{dispose:()=>container.replaceChildren()};
 }
 function control(container,{getUse,prepare,onSource,navigation}){
  const button=document.createElement('button'),status=document.createElement('p'),panel=document.createElement('div');button.type='button';button.textContent='Inspect recorded application input';button.dataset.useInputInspect='';button.setAttribute('aria-expanded','false');status.setAttribute('aria-live','polite');panel.hidden=true;container.append(button,status,panel);let controller=null,scene=null,view=null,disposed=false,epoch=0;
  function reset(){epoch++;controller?.abort();view?.dispose();view=null;scene=null;panel.replaceChildren();panel.hidden=true;status.textContent='';button.disabled=false;button.setAttribute('aria-expanded','false');}
  const navigationButtons=navigation?[...navigation.querySelectorAll('[data-use-direction]')]:[];navigationButtons.forEach(b=>b.addEventListener('click',reset));
  const live=(receipt,token)=>!disposed&&token===epoch&&getUse()===receipt;
  button.onclick=async()=>{reset();const receipt=getUse();if(!receipt){status.textContent='Select a source use first.';return;}const token=epoch;controller=new AbortController();const active=controller;button.disabled=true;status.textContent='Finding a recorded application input…';try{const result=await prepare(receipt,active.signal);if(!live(receipt,token)||active.signal.aborted)return;if(result.status!=='found'){status.textContent=result.status==='not-recorded'?result.scope:'Recorded input unavailable: '+result.reason;return;}scene=result;panel.hidden=false;view=mount(panel,{scene,onSource:at=>{if(live(receipt,token))onSource(at);}});button.setAttribute('aria-expanded','true');status.textContent=result.gap.relation==='direct-input'?'Exact input occurrence recorded.':'Source containment in a recorded input; intermediate typing is not inferred.';}catch(error){if(live(receipt,token)&&!active.signal.aborted)status.textContent='Recorded input unavailable: '+error.message;}finally{if(!disposed&&token===epoch)button.disabled=false;}};
  return{getScene:()=>scene,reset,dispose:()=>{reset();disposed=true;navigationButtons.forEach(b=>b.removeEventListener('click',reset));container.replaceChildren();}};
 }
 const api={open,paged,find,sourceUse,dispose,mount,control,limits};if(node)module.exports=api;else host.ProofAtlasUseInputs=api;
})(typeof window==='undefined'?globalThis:window);
