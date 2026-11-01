/* A closure application has assumption arguments and retained definitions.
   The caller supplies an authenticated, prepared context-module observation. */
(function(host){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
function demand(ok,message){if(!ok)throw Error('Context module use: '+message);}
function freeze(x){if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;}
function route(r){return Number.isInteger(r?.root)&&r.root>=0&&Array.isArray(r.slots)&&r.slots.length<=512&&r.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2);}
function create({record,entry,origin,payloads,kinds}){
 demand(hash(record?.indexSha256)&&hash(record.sourceSha256)&&typeof record.name==='string','source identity');
 demand(same(origin?.source,{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256})&&hash(origin.evidenceSha256)&&hash(origin.nativeOutputSha256),'prepared evidence owner');
 demand(['source-backed-context-module','source-projected-context-module','checked-context-module'].includes(origin.namespace),'computed namespace');
 demand(route(entry?.state?.route)&&Number.isInteger(entry.node)&&entry.node>=0&&Array.isArray(entry.recipe)&&entry.recipe.length<=512,'selected observation');
 demand(entry.status==='checked'&&(!('node' in entry.state)||entry.state.node===entry.node),'checked exact observation');
 for(const key of['kernelOriginalTermTyping','kernelClosedTermTyping','kernelClosedTypeTyping','kernelClosedConversion'])demand(entry[key]==='PASS','closed root checks');
 demand(Number.isInteger(entry.actualContextDepth)&&entry.actualContextDepth>=entry.recipe.length&&entry.discardedPrefix===entry.actualContextDepth-entry.recipe.length,'original context depth');
 const reduced=origin.namespace!=='source-backed-context-module',r=entry.reducedContext;
 const slots=reduced?r?.slots:entry.recipe.map((_,j)=>j);
 demand(Array.isArray(slots)&&slots.every((j,i)=>Number.isInteger(j)&&j>=0&&j<entry.recipe.length&&(i===0||slots[i-1]<j)),'ordered retained context');
 if(reduced){demand(r.status==='checked'&&origin.moduleId===r.module.id&&origin.contextEntryCount===slots.length&&same(origin.letSlots,r.module.letSlots)&&origin.argumentCount===r.module.argumentCount,'reduced observation owner');for(const key of['closedTermTyping','closedTypeTyping','closedExpectedConversion','appliedClosureTyping','instantiatedTermConversion','sourceTypeRoundtrip'])demand(r[key]==='PASS','native reduced use');}
 demand(payloads.length===entry.recipe.length&&kinds.length===entry.recipe.length,'prepared header metadata');
 demand(Array.isArray(origin.letSlots)&&origin.letSlots.length===slots.length,'computed wrapper count');
 const original=freeze({...clone(origin.source),namespace:'original-packet',node:entry.node,route:clone(entry.state.route)}),ports=[];let argumentsUsed=0,prefix=[];
 const ref=(node,at)=>({...clone(origin.source),namespace:'original-packet',node,route:at});
 for(const [position,slot]of slots.entries()){
  const h=entry.recipe[slot],kind=kinds[slot],payload=payloads[slot],isLet=h.value!==null;
  demand(h.slot===slot&&route(h.sourceRoute)&&h.sourceRoute.root===original.route.root&&same(h.sourceRoute.slots,original.route.slots.slice(0,h.sourceRoute.slots.length))&&h.sourceRoute.slots.length<original.route.slots.length,'header is an original ancestor');
  demand(['lam','forallE','letE'].includes(kind)&&isLet===(kind==='letE')&&origin.letSlots[position]===isLet,'assumption/definition partition');
  demand(original.route.slots[h.sourceRoute.slots.length]===(isLet?2:1),'binder body owns this use');
  demand(Number.isInteger(h.node)&&h.node>=0&&Number.isInteger(h.domain)&&h.domain>=0&&(!isLet||Number.isInteger(h.value)&&h.value>=0),'source header fields');
  const argument=isLet?null:argumentsUsed++;
  ports.push({position,recipeSlot:slot,sourceSlot:entry.discardedPrefix+slot,kind:isLet?'definition':'argument',argument,name:payload.binderName||payload.declName||'_',sourceConstructor:kind,
   sourceBinder:ref(h.node,clone(h.sourceRoute)),sourceDomain:ref(h.domain,{root:h.sourceRoute.root,slots:[...h.sourceRoute.slots,0]}),
   sourceValue:isLet?ref(h.value,{root:h.sourceRoute.root,slots:[...h.sourceRoute.slots,1]}):null,
   computedBinders:Object.fromEntries(['term','type'].map(part=>[part,{namespace:origin.namespace,evidenceSha256:origin.evidenceSha256,route:{root:part==='term'?0:1,slots:[...prefix]},constructor:isLet?'letE':part==='term'?'lam':'forallE',...(isLet?{nondep:false}:{})}]))});
  prefix.push(isLet?2:1);
 }
 demand(argumentsUsed===origin.argumentCount,'callable arity');
 let conversion={status:'derived-structural-use',nativeApplicationQuery:false};
 if(reduced)conversion={status:'recorded-kernel-conversion',nativeApplicationQuery:true,method:'closed-context-instantiation/1'};
 else if(entry.selectedTargetTransport?.status==='kernel-compared-at-selected-target'){
  const t=entry.selectedTargetTransport;demand(t.method==='closed-lambda-let-instantiation/1'&&t.nativeHeaderStructuralMatch===true&&same(t.canonicalRoute,origin.nativeObservation.route)&&t.kernelAppliedClosureTyping==='PASS'&&t.kernelInstantiatedTermConversion==='PASS'&&t.kernelTargetAtCanonicalType==='PASS','native target application');
  conversion={status:'recorded-kernel-conversion',nativeApplicationQuery:true,method:t.method};
 }
 return freeze({format:'ProofAtlasContextModuleUse/1',source:original,module:{namespace:origin.namespace,evidenceSha256:origin.evidenceSha256,nativeOutputSha256:origin.nativeOutputSha256,moduleId:origin.moduleId??null,canonicalRoute:clone((reduced?r.module.canonicalRoute:origin.nativeObservation?.route)||origin.canonicalObservation||entry.state.route),environment:origin.environment?.kind||'recorded-compiled-environment'},ports,context:{actualDepth:entry.actualContextDepth,recordedDepth:entry.recipe.length,discardedPrefix:entry.discardedPrefix},argumentCount:argumentsUsed,definitionCount:ports.length-argumentsUsed,bodySlots:prefix,conversion,
  guarantee:'Derived application of an existing closed context module. Assumptions become ordered arguments; retained lets stay internal definitions. Links identify exact original binders, not original application-use edges. Native conversion is claimed only where separately recorded. No descendant typing, arbitrary input replacement or comprehension claim.'});
}
function fromSource(current,record){const p=current.prepared,contexts=p.context?.model?.contexts;return create({record,entry:current.entry,origin:p.origin,payloads:current.entry.recipe.map(h=>contexts?contexts[h.slot].payload:p.data.payloads[h.node]),kinds:current.entry.recipe.map(h=>contexts?contexts[h.slot].constructor:['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj'][p.data.kind[h.node]])});}
function fromMaterialized(prepared,record,origin){return create({record,entry:prepared.entry,origin,payloads:prepared.interface.contexts.map(h=>h.payload),kinds:prepared.interface.contexts.map(h=>h.constructor)});}
function page(model,{offset=0,limit=4}={}){demand(model?.format==='ProofAtlasContextModuleUse/1','model');demand(Number.isInteger(offset)&&offset>=0&&offset<=model.ports.length&&Number.isInteger(limit)&&limit>=1&&limit<=4,'page bounds');return freeze({offset,total:model.ports.length,ports:model.ports.slice(offset,offset+limit),remaining:Math.max(0,model.ports.length-offset-limit)});}
function mount(container,{model,part='term',initialOffset=0,onOriginalOccurrence,onWrapper}){
 demand(['term','type'].includes(part),'module component');
 const doc=container.ownerDocument,el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};let disposed=false,generation=0,offset=Math.min(Math.max(0,Math.floor(initialOffset/4)*4),Math.max(0,Math.floor((model.ports.length-1)/4)*4));
 const button=(text,fn)=>{const b=el('button',text),owner=generation;b.type='button';b.onclick=()=>{if(!disposed&&owner===generation)fn();};return b;};
 container.replaceChildren();container.classList.add('pl-module-use');container.dataset.moduleUse='true';
 const diagram=el('div',undefined,'pl-module-use-diagram'),pager=el('div',undefined,'pl-actions'),caption=el('p');caption.setAttribute('role','status');
 container.append(el('h5','Apply the context module'),el('p',part==='term'?'Dashed connections supply original assumptions to the derived module. Retained let definitions stay inside it; they are not independent arguments.':'These are the expected-type binders for the module’s term application. Retained let definitions stay inside both components.'),diagram,pager,caption);
 function draw(focus=null){generation++;const window=page(model,{offset});diagram.replaceChildren();pager.replaceChildren();const labels=el('div',undefined,'pl-module-use-row');labels.append(el('strong','Original context'),el('span','Derived use'),el('strong',part==='term'?'Module M inputs':'Expected-type binders of M'));diagram.append(labels);
  for(const p of window.ports){const row=el('div',undefined,'pl-module-use-row');row.dataset.moduleUsePosition=String(p.position);row.dataset.moduleUseKind=p.kind;
   const original=el('div',undefined,'pl-module-use-origin'),middle=el('span',p.kind==='argument'?'argument '+(p.argument+1):'retained let','pl-module-use-wire'),computed=el('div',undefined,'pl-module-use-port');
   const binder=button(p.name+' · source slot '+(p.sourceSlot+1),()=>onOriginalOccurrence(p.sourceBinder.node,p.sourceBinder.route)),domain=button('Original type of '+p.name,()=>onOriginalOccurrence(p.sourceDomain.node,p.sourceDomain.route)),wrapper=button(p.kind==='argument'?(part==='term'?'Module parameter ':'Expected-type binder ')+(p.argument+1):(part==='term'?'Internal definition ':'Expected-type let ')+p.name,()=>onWrapper(p.computedBinders[part].route.slots));binder.dataset.moduleUseTarget='binder';domain.dataset.moduleUseTarget='domain';wrapper.dataset.moduleUseTarget='wrapper';original.append(binder,domain);computed.append(wrapper);
   if(p.kind==='definition'){middle.classList.add('pl-module-use-fixed');const value=button('Original let value '+p.name,()=>onOriginalOccurrence(p.sourceValue.node,p.sourceValue.route));value.dataset.moduleUseTarget='value';computed.append(value);}
   row.append(original,middle,computed);diagram.append(row);
  }
  if(!window.total)diagram.append(el('p','This closed module has no context arguments or retained definitions.'));
  const previous=button('Previous module bindings',()=>{offset=Math.max(0,offset-4);draw('previous');}),next=button('Next module bindings',()=>{offset+=4;draw('next');});previous.disabled=offset===0;next.disabled=!window.remaining;
  pager.append(previous,el('span',window.total?(offset+1)+'–'+(offset+window.ports.length)+' / '+window.total+' bindings':'0 bindings'),next,button('Open original module result',()=>onOriginalOccurrence(model.source.node,model.source.route)));
  if(focus)(focus==='next'&&!next.disabled?next:previous.disabled?next:previous).focus();
  caption.textContent=model.argumentCount+' assumption arguments; '+model.definitionCount+' retained definitions. '+(model.conversion.nativeApplicationQuery?'For the term application, kernel conversion to this exact original result was recorded.':'The term application is structurally derived; no separate native application query is recorded here.');
 }
 draw();return{getState:()=>({offset,part,visible:Math.min(4,model.ports.length-offset),source:model.source,module:model.module,conversion:model.conversion}),dispose(){disposed=true;container.replaceChildren();delete container.dataset.moduleUse;container.classList.remove('pl-module-use');}};
}
const api={create,fromSource,fromMaterialized,page,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasContextModuleUse=api;
})(typeof window==='undefined'?globalThis:window);
