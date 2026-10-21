/* Original occurrence windows with optional exact native typing attachments. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,action)=>{const n=el('button',text);n.type='button';n.onclick=action;return n;};
 const link=(text,href)=>{const n=el('a',text);n.href=href;return n;};
 const shortCount=s=>s.length<16?BigInt(s).toLocaleString('en-US'):s.slice(0,4)+'… ('+s.length+' digits)';
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 async function mount(root,library){
  const A=host.ProofAtlasLibraryData,P=host.ProofAtlasPackedRoutes,W=host.ProofAtlasOccurrenceWindow;
  const initial=new URL(location.href),status=el('p','Loading the original source packet…','pow-status');status.setAttribute('role','status');
  root.replaceChildren(status);root.setAttribute('aria-busy','true');
  let record,data,sourceBytes=null,edition,control=false,nativeControl=false,scene=null,selected=null,scale=1,disposed=false,representativeIndex=null,operation=0,activeJump=null;
  let nativePackage=null,nativeCase=null,nativeLoad=null,nativeError=null,typeView=null,typeScripts=null,inspection=0;
  let positionPage=0,positionFilter='',positionConstructionsOnly=false,selectedTyping=null;
  let constructionMode=initial.searchParams.get('diagram')==='construction',constructionView=null,constructionModel=null,constructionScripts=null,constructionSelection=0,constructionError=null;
  let constructionActivation=0,groupingError=null;
  let letSupplemented=false,letSupplementPromise=null,letSupplementError=null;
  let constructionGrouped=initial.searchParams.get('group')==='applications',groupingControl=null,groupingLabel=null;
  let constructionFramed=initial.searchParams.get('group')==='contexts',frameControl=null,frameLabel=null;
  const frameBudget=el('select');frameBudget.setAttribute('aria-label','Context frame members');for(const n of [1,4,13,32,64]){const o=el('option',String(n));o.value=n;frameBudget.append(o);}frameBudget.value=['1','4','13','32','64'].includes(initial.searchParams.get('members'))?initial.searchParams.get('members'):'32';
  const frameBudgetLabel=el('label','Frame members ');frameBudgetLabel.append(frameBudget);
  let initialConstructionFocus=constructionMode&&!initial.hash;
  let constructionButton=null,sourceButton=null,controlConstructionError=null,mounted=false,redrawSourcePaths=null;const observedTypes=new Map();
  const constructionHost=el('section');constructionHost.hidden=true;
  const nativeController=new AbortController(),typeHost=el('section');typeHost.hidden=true;
  const title=el('h1'),subtitle=el('p'),tools=el('div',undefined,'pow-tools'),viewport=el('div',undefined,'pow-viewport'),sizing=el('div',undefined,'pow-sizing'),stage=el('div',undefined,'pow-stage'),panel=el('section',undefined,'pow-inspector'),summary=el('p',undefined,'pow-summary');
  viewport.tabIndex=0;viewport.setAttribute('aria-label','Occurrence geometry. Scroll or drag empty space to pan.');viewport.append(sizing);sizing.append(stage);
  const nodeBudget=el('select'),depth=el('select');depth.setAttribute('aria-label','Diagram levels');for(const n of [1,7,13,25,32]){const o=el('option',String(n));o.value=n;nodeBudget.append(o);}nodeBudget.value='13';for(let i=0;i<=6;i++){const o=el('option',String(i));o.value=i;depth.append(o);}depth.value=/^[0-6]$/.test(initial.searchParams.get('levels')||'')?initial.searchParams.get('levels'):'2';
  let stageWidth=0,stageHeight=0;
  function scaled(){stage.style.transform='scale('+scale+')';sizing.style.width=stageWidth*scale+'px';sizing.style.height=stageHeight*scale+'px';constructionView?.setScale(scale);}
  function backURL(route){
   const u=new URL(location.href);u.searchParams.delete('view');u.searchParams.delete('control');u.searchParams.delete('loading');u.searchParams.delete('diagram');u.searchParams.delete('group');u.searchParams.delete('levels');u.searchParams.delete('members');u.hash='';
   if(control){u.searchParams.delete('proof');u.searchParams.delete('edition');return u.pathname+u.search;}
   if(route&&route.depth<=512){const bytes=P.parse(route),slots=[];for(let i=0;i<route.depth;i++)slots.push((bytes[i>>2]>>((i%4)*2))&3);u.searchParams.set('route',route.root+':'+slots.join('.'));u.hash='expr-'+P.resolve(data,route).node;}else u.searchParams.delete('route');
   return u.pathname+u.search+u.hash;
  }
  function writeAddress(route,replace=false){const u=new URL(location.href);u.searchParams.set('view','occurrence');u.searchParams.delete('route');u.searchParams.delete('loading');if(constructionMode)u.searchParams.set('diagram','construction');else u.searchParams.delete('diagram');if(constructionMode&&constructionFramed){u.searchParams.set('group','contexts');u.searchParams.set('members',frameBudget.value);u.searchParams.delete('levels');}else if(constructionMode&&constructionGrouped){u.searchParams.set('group','applications');u.searchParams.set('levels',depth.value);u.searchParams.delete('members');}else{u.searchParams.delete('group');u.searchParams.delete('levels');u.searchParams.delete('members');}u.hash='occurrence='+W.token(record,route);history[replace?'replaceState':'pushState']({},'',u);}
  function describe(n){try{return A.describe(data,n.node);}catch{return n.kind+' · e'+n.node+' · original payload available in the packet';}}
  async function component(name,url){if(!host[name])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Native record component unavailable'));};document.head.append(script);});}
  async function constructionSupplement(){await component('PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS','/public/data/proof-atlas/occurrence-constructions-manifest.js?v=1');let d;try{d=host.ProofAtlasDeepContext.constructionDescriptor(host.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS);}catch(error){delete host.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS;throw error;}return host.ProofAtlasDeepContext.prepareConstructions(await A.compressed(d.file,d.sha256,{maxBytes:8388608,expectedBytes:d.decodedBytes,signal:nativeController.signal}),d);}
  async function nativeReady(){
   await component('ProofAtlasDeepContext','/public/js/proof-atlas-deep-context.js?v=4');
   if(record&&!control){
    const d=host.PROOF_ATLAS_OCCURRENCE_TYPES?.records.find(d=>d.edition===edition.id&&d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256);
    if(!d)return {cases:[],attach:async()=>null};
    await component('ProofAtlasOccurrenceTypes','/public/js/proof-atlas-occurrence-types.js?v=12');
    await component('ProofAtlasLibraryBytes','/public/js/proof-atlas-library-bytes.js?v=1');
    sourceBytes??=await host.ProofAtlasLibraryBytes.compressedBytes(record.indexFile,record.indexSha256,{maxBytes:67108864,signal:nativeController.signal});
    const bytes=await host.ProofAtlasLibraryBytes.compressedBytes(d.file,d.sha256,{maxBytes:67108864,signal:nativeController.signal});
    if(disposed)throw Error('Native record request cancelled');
    return host.ProofAtlasDeepContext.recorded(sourceBytes,bytes,d,record);
   }
   await component('PROOF_ATLAS_DEEP_TYPING','/public/data/proof-atlas/deep-typing-manifest.js?v=1');
   if(disposed)throw Error('Native record request cancelled');const d=host.ProofAtlasDeepContext.descriptor(host.PROOF_ATLAS_DEEP_TYPING);
   const baseline=await host.ProofAtlasDeepContext.prepare(await A.compressed(d.file,d.sha256,{maxBytes:8388608,expectedBytes:d.decodedBytes,signal:nativeController.signal}),d);
   try{return host.ProofAtlasDeepContext.mergeControls(baseline,await constructionSupplement());}
   catch(error){controlConstructionError=error.message;return baseline;}
  }
  async function loadTyping(){
   nativeError=null;nativeLoad??=nativeReady();if(selected&&scene)inspect(selected);
   try{nativePackage=await nativeLoad;if(disposed)return;nativeCase=await nativePackage.attach(data,record);}
   catch(error){if(disposed)return;nativeError=error.message;nativeLoad=null;nativeCase=null;nativePackage=null;}
   if(!disposed&&selected&&scene)inspect(selected);
  }
  async function loadLetTyping(){
   if(control||letSupplemented||!nativePackage||!nativeCase)return;
   letSupplementPromise??=(async()=>{
    await component('PROOF_ATLAS_LET_REDUCTIONS','/public/data/proof-atlas/let-result-pools-manifest.js?v=1');
    const descriptor=host.PROOF_ATLAS_LET_REDUCTIONS?.records.find(d=>d.edition===edition.id&&d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256);
    if(!descriptor){letSupplemented=true;return;}
    if(descriptor.storage!=='bounded-result-pools/1')throw Error('Bounded local-definition metadata unavailable');
    await component('ProofAtlasBetaReduction','/public/js/proof-atlas-beta-reduction.js?v=13');
    await component('ProofAtlasLetReduction','/public/js/proof-atlas-let-reduction.js?v=3');
    await component('ProofAtlasLetPools','/public/js/proof-atlas-let-pools.js?v=2');
    const bytes=await host.ProofAtlasLibraryBytes.compressedBytes(descriptor.file,descriptor.sha256,{maxBytes:8388608,expectedBytes:descriptor.decodedBytes,signal:nativeController.signal});
    const supplement=await host.ProofAtlasDeepContext.recordedLets(sourceBytes,bytes,descriptor,record);
    if(disposed)return;
    const combined=host.ProofAtlasDeepContext.mergeRecorded(nativePackage,supplement),matched=await combined.attach(data,record);
    if(!matched)throw Error('Local-definition metadata belongs to a different source');
    nativePackage=combined;nativeCase=matched;letSupplemented=true;letSupplementError=null;
   })().catch(error=>{if(!disposed)letSupplementError=error.message;letSupplementPromise=null;});
   await letSupplementPromise;
  }
  const originLabel=q=>q.recording?.kind==='application-trace-observation'?'application observation':q.recording?.kind==='lambda-introduction-observation'?'introduction observation':q.recording?.kind==='construction-premise-observation'?'construction observation':q.recording?.kind==='let-premise-observation'?'local-definition observation':'direct query';
  function positions(selectedEntry){
   const details=el('details'),list=el('ol'),filter=el('input'),label=el('label','Filter positions '),count=el('p'),paging=el('div',undefined,'pow-tools');details.dataset.nativePositions='';details.append(el('summary','Recorded positions · '+nativeCase.entries.length));
   filter.type='search';filter.value=positionFilter;filter.placeholder='Role, origin, rule, node, depth';filter.dataset.nativeFilter='';label.append(filter);
   const only=el('input'),onlyLabel=el('label','Recorded constructions only ');only.type='checkbox';only.checked=positionConstructionsOnly;only.dataset.nativeConstructionsOnly='';onlyLabel.append(only);details.append(label,onlyLabel,count,list,paging);
   const records=nativeCase.entries.map((q,index)=>{const rule=host.ProofAtlasDeepContext.construction(q,data)?.rule;return{q,index,rule,text:'Position '+(index+1)+' · '+q.role+' · e'+q.node+' · depth '+q.route.depth+' · '+originLabel(q)+(rule?' · '+rule:'')};});
   const prev=button('Previous positions',()=>{positionPage--;update();}),next=button('Next positions',()=>{positionPage++;update();});paging.append(prev,next);
   let first=true;
   function update(){
    const words=positionFilter.toLowerCase().trim().split(/\s+/),matches=records.filter(r=>(!positionConstructionsOnly||r.rule)&&words.every(w=>r.text.toLowerCase().includes(w)));
    if(first&&selectedEntry){const index=matches.findIndex(r=>r.q===selectedEntry);if(index>=0)positionPage=Math.floor(index/20);}first=false;
    const pages=Math.max(1,Math.ceil(matches.length/20));positionPage=Math.min(positionPage,pages-1);const start=positionPage*20;
    count.textContent=matches.length?(start+1)+'–'+Math.min(start+20,matches.length)+' of '+matches.length+' matching positions':'No matching recorded positions';count.dataset.nativePage='';count.setAttribute('role','status');list.start=start+1;list.replaceChildren();
    for(const r of matches.slice(start,start+20)){const item=el('li'),b=button(r.text,()=>safe(()=>navigate(r.q.route)));b.dataset.nativeQuery=r.index;item.append(b);list.append(item);}
    prev.disabled=positionPage===0;next.disabled=positionPage===pages-1;
   }
   filter.oninput=()=>{positionFilter=filter.value;positionPage=0;update();};only.onchange=()=>{positionConstructionsOnly=only.checked;positionPage=0;update();};update();return details;
  }
  function inspect(n,observation=null){
   const serial=++inspection;
   typeView?.dispose();typeView=null;typeHost.hidden=true;typeHost.replaceChildren();
   selected=n;for(const b of stage.querySelectorAll('[data-occurrence-node]'))b.setAttribute('aria-pressed',String(b.dataset.occurrenceNode===n.id));
   const heading=el('h2',n.glyph+' '+n.kind+' · e'+n.node),context=el('p','Original root '+n.route.root+' · depth '+n.route.depth+' · '+n.scopeDepth+' enclosing binders'),term=el('pre',describe(n));term.tabIndex=0;
   const focus=button('Focus this occurrence',()=>safe(()=>navigate(n.route)));focus.dataset.occurrenceFocus='';
   const entry=observation||nativeCase?.get(n.route)||observedTypes.get(W.id(n.route));selectedTyping=entry||null;const native=el('section',undefined,'pow-native-record'),message=el('p');message.setAttribute('role','status');
   native.dataset.nativeState=entry?'checked':nativeError?'error':nativePackage?'unrecorded':nativeLoad?'loading':'unloaded';
   if(entry){
    message.textContent=(entry.recording?.observation==='meta'?'Native extraction · Meta-inferred argument type':'Native Lean 4.33.1 record · '+originLabel(entry))+' · '+entry.role+' · original Γ'+entry.contextLength;
    const judgment=el('pre','Γ'+entry.contextLength+' ⊢ e'+n.node+' : '+(entry.typeText||A.describe(entry.typeData,entry.typeData.roots[0])));judgment.tabIndex=0;judgment.dataset.nativeJudgment='';
    const toggle=button('Show recorded type',async()=>{if(typeView){typeView.dispose();typeView=null;toggle.textContent='Show recorded type';toggle.setAttribute('aria-expanded','false');return;}toggle.disabled=true;try{if(!host.ProofAtlasCompactTypeView){typeScripts??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/js/proof-atlas-compact-type-view.js?v=4';script.onload=resolve;script.onerror=()=>{script.remove();typeScripts=null;reject(Error('Recorded type renderer unavailable'));};document.head.append(script);});await typeScripts;}if(disposed||serial!==inspection||!scene||!selected)return;typeView=host.ProofAtlasCompactTypeView.mount(typeHost,entry,data,route=>safe(()=>navigate(route)));toggle.textContent='Hide recorded type';toggle.setAttribute('aria-expanded','true');}catch(error){if(!disposed&&serial===inspection)message.textContent='Native typing record retained; type diagram unavailable: '+error.message;}finally{toggle.disabled=false;}});toggle.dataset.showRecordedType='';toggle.setAttribute('aria-expanded','false');
    native.append(message,judgment,el('p',entry.recording?.observation==='meta'?'Meta-inferred type recorded in the original context. Kernel conversion records remain separate; the browser does not rerun Lean.':'Recorded kernel typing in the original context. The browser checks correspondence; it does not rerun Lean.'),toggle);
    if(entry.recording?.kind!=='primary-query'&&entry.recording){const parent=button('Go to recording query',()=>safe(()=>navigate(entry.recording.queryRoute)));parent.dataset.recordingQuery='';native.append(el('p','This '+originLabel(entry)+' was recorded in '+(entry.recording.stage?'stage '+entry.recording.stage+' · ':'')+(entry.recording.part||entry.recording.field)+(entry.recording.slot?' '+entry.recording.slot:'')+' of query e'+entry.recording.queryNode+'.'),parent);}
    if(entry.typeText)native.append(el('p',entry.recording?.presentation==='compiled-constructor-summary'?'This type label is a constructor summary; inspect the recorded graph for its full structure.':'Type text is a presentation; the diagram retains the recorded expression fields.'));
    const provenance=el('details');provenance.append(el('summary','Native record provenance'),el('pre',JSON.stringify({evidenceSha256:entry.evidenceSha256,sourceIndexSha256:entry.sourceIndexSha256,sourceRoute:entry.route,...host.ProofAtlasDeepContext.typeIdentity(entry),originalContextLength:entry.contextLength,recording:entry.recording,baselineAxioms:entry.baselineAxioms,sourceModuleBytesVerified:false,...(nativeCase.provenance?{extraction:nativeCase.provenance}:{})},null,2)),link('Native term and judgment data ↓',entry.evidenceFile||host.PROOF_ATLAS_DEEP_TYPING.file));native.append(provenance);
   }else{
    message.textContent=nativeError?'Native record unavailable: '+nativeError:nativePackage?'No recorded native typing at this exact source position.':nativeLoad?'Loading hash-bound native records…':'No native typing query is loaded in this source view.';
    native.append(message);if(!nativePackage){const load=button(nativeError?'Retry recorded types':'Load recorded types',loadTyping);load.disabled=!!nativeLoad;load.dataset.loadRecordedTypes='';native.append(load);}
   }
   if(nativeCase){if(nativeCase.stats)native.append(el('p',nativeCase.stats.primaryQueries+' direct queries + '+nativeCase.stats.explicitObservations+' explicit observations. '+nativeCase.stats.unavailableQueries+' unavailable queries. '+(nativeCase.stats.supplementalLetQueries?nativeCase.stats.supplementalLetQueries+' additional local-definition queries + '+nativeCase.stats.supplementalLetObservations+' observations; '+nativeCase.stats.supplementalLetOverlap+' shared positions. ':'')+'Other source positions have no recorded type.'));native.append(positions(entry));}
   panel.replaceChildren(heading,context,term,native,focus);
   if(!control)panel.append(link(n.route.depth<=512?'Open this occurrence in the proof reader':'Open declaration in the proof reader',backURL(n.route)));
   const ports=el('ol');for(const port of n.ports){const li=el('li'),b=button(port.kernelField+' → e'+port.node,()=>safe(()=>navigate(port.route)));b.dataset.occurrencePort=port.slot;li.append(b,el('small',(port.displayed?'Shown':'Collapsed')+' · '+shortCount(port.expanded)+' occurrences'));ports.append(li);}if(n.ports.length)panel.append(el('h3','Ordered source fields'),ports);
   if(n.binding){const b=button('Go to binder · e'+n.binding.node,()=>safe(()=>navigate(n.binding.route)));b.dataset.occurrenceBinder='';panel.append(el('h3','Lexical connection'),el('p','Bound to the original binder at depth '+n.binding.route.depth+'.'),b);}
   else if(n.kind==='bvar')panel.append(el('p','This index has no enclosing binder in the selected source root.'));
   const exact=el('details'),label=el('summary','Exact source address and accounting');exact.append(label,el('pre',JSON.stringify({source:scene.source,route:n.route,expandedOccurrences:n.expanded},null,2)));panel.append(exact);
   const payload=el('details');payload.append(el('summary','Original constructor payload'));const raw=JSON.stringify(data.payloads[n.node],null,2);payload.append(el('pre',raw.length>12000?raw.slice(0,12000)+'\n… display truncated; complete payload is in the source packet.':raw));panel.append(payload);
  }
  function rememberType(entry){const key=W.id(entry.route);observedTypes.delete(key);observedTypes.set(key,entry);while(observedTypes.size>4)observedTypes.delete(observedTypes.keys().next().value);}
  function sourcePoint(route){return W.create(data,record,route,{maxNodes:1,maxDepth:0}).nodes[0];}
  function modeControls(){
   if(frameLabel)frameLabel.hidden=!constructionMode;if(frameControl)frameControl.checked=constructionFramed;frameBudgetLabel.hidden=!constructionMode||!constructionFramed;nodeBudget.disabled=depth.disabled=constructionMode&&constructionFramed;
   if(groupingLabel)groupingLabel.hidden=!constructionMode;if(groupingControl)groupingControl.checked=constructionGrouped;
   constructionButton?.setAttribute('aria-pressed',String(constructionMode));sourceButton?.setAttribute('aria-pressed',String(!constructionMode));
   for(const option of nodeBudget.options)option.disabled=constructionMode&&Number(option.value)>13;
   for(const option of depth.options)option.disabled=constructionMode&&Number(option.value)>4;
   if(constructionMode&&Number(nodeBudget.value)>13)nodeBudget.value='13';if(constructionMode&&Number(depth.value)>4)depth.value='4';
   if(nodeBudget.parentElement)nodeBudget.parentElement.firstChild.textContent=constructionMode?'Construction nodes ':'Source nodes ';
  }
  function renderConstructions(){
   constructionSelection++;constructionView?.dispose();constructionView=null;
   if(!constructionMode||!constructionModel||!scene){viewport.hidden=false;summary.hidden=false;constructionHost.hidden=true;redrawSourcePaths?.();return;}
   modeControls();const rule=nativeCase.get(scene.root.route),canFrame=constructionFramed&&rule&&['Pi-introduction','let-binding'].includes(host.ProofAtlasDeepContext.construction(rule,data)?.rule);
   const model=canFrame?constructionModel:constructionFramed?host.ProofAtlasOccurrenceConstructions.open(nativeCase):constructionModel;
   const cut=model.create(scene.root.route,canFrame?{maxMembers:Number(frameBudget.value)}:{maxNodes:Number(nodeBudget.value),maxDepth:Number(depth.value)});
   constructionView=(canFrame?host.ProofAtlasOccurrenceContextFrameView:host.ProofAtlasOccurrenceConstructionView).mount(constructionHost,model,data,cut,{
    onSource:route=>safe(()=>navigate(route)),
    onSelect:async(route,pending)=>{const epoch=++constructionSelection;inspect(sourcePoint(route));if(!pending)return;try{const entry=await pending;if(disposed||epoch!==constructionSelection||!constructionMode)return;rememberType(entry);inspect(sourcePoint(route),entry);}catch(error){if(epoch===constructionSelection)status.textContent=error.message;}},
    onType:async(route,entry)=>{const epoch=++constructionSelection;rememberType(entry);inspect(sourcePoint(route),entry);const serial=inspection;try{await component('ProofAtlasCompactTypeView','/public/js/proof-atlas-compact-type-view.js?v=4');if(disposed||epoch!==constructionSelection||serial!==inspection)return;typeView=host.ProofAtlasCompactTypeView.mount(typeHost,entry,data,r=>safe(()=>navigate(r)));const toggle=panel.querySelector('[data-show-recorded-type]');if(toggle){toggle.textContent='Hide recorded type';toggle.setAttribute('aria-expanded','true');}}catch(error){if(epoch===constructionSelection)status.textContent=error.message;}}
   });
   constructionView.setScale(scale);viewport.hidden=true;summary.hidden=true;constructionHost.hidden=false;constructionView.select(selected?.route||scene.root.route);
   if(constructionFramed&&!canFrame)constructionHost.prepend(el('p','No recorded context chain at this exact occurrence. The available construction cut is shown.','pow-status'));
   subtitle.textContent=(canFrame?'Recorded context frame · ':'Recorded construction geometry · ')+(nativeControl?'synthetic core control':(edition.label||edition.id));
  }
  async function setConstructionMode(enabled){
   const activation=++constructionActivation;constructionMode=enabled;constructionError=null;groupingError=null;modeControls();
   if(!enabled){constructionButton.disabled=false;constructionSelection++;constructionView?.dispose();constructionView=null;constructionHost.hidden=true;viewport.hidden=false;summary.hidden=false;redrawSourcePaths?.();subtitle.textContent=nativeControl?'Synthetic core control · selected native records':control?'Serialized syntax control · original producer made no typing claim':'Source occurrence geometry · '+(edition.label||edition.id);status.textContent='Original occurrence structure. Native records retain their exact source positions.';if(scene)writeAddress(scene.root.route,true);return;}
   constructionButton.disabled=true;status.textContent='Loading recorded construction interfaces…';
   try{
    if(!nativePackage)await loadTyping();if(disposed||!constructionMode||activation!==constructionActivation)return;
    if(!nativeCase)throw Error('No native record package is available for this declaration');
    await loadLetTyping();if(disposed||!constructionMode||activation!==constructionActivation)return;
    if(nativeControl&&controlConstructionError){nativePackage=host.ProofAtlasDeepContext.mergeControls(nativePackage,await constructionSupplement());nativeCase=nativePackage.case(record.name);controlConstructionError=null;const choice=root.querySelector('[data-native-control-choice]');if(choice){choice.replaceChildren(...nativePackage.cases.map(c=>{const option=el('option',c.name);option.value=c.name;return option;}));choice.value=record.name;}}
    constructionScripts??=(async()=>{await component('ProofAtlasOccurrenceConstructions','/public/js/proof-atlas-occurrence-constructions.js?v=2');await component('ProofAtlasOccurrenceConstructionView','/public/js/proof-atlas-occurrence-construction-view.js?v=3');})();
    await constructionScripts;if(disposed||!constructionMode||activation!==constructionActivation)return;
    if(constructionFramed){try{await component('ProofAtlasOccurrenceContextFrame','/public/js/proof-atlas-occurrence-context-frame.js?v=1');await component('ProofAtlasOccurrenceContextFrameView','/public/js/proof-atlas-occurrence-context-frame-view.js?v=1');}catch(error){if(disposed||!constructionMode||activation!==constructionActivation)return;constructionFramed=false;groupingError='Context frames unavailable: '+error.message;modeControls();}}
    if(constructionGrouped){try{await component('ProofAtlasOccurrenceApplicationFold','/public/js/proof-atlas-occurrence-application-fold.js?v=2');}catch(error){if(disposed||!constructionMode||activation!==constructionActivation)return;constructionGrouped=false;groupingError=error.message;modeControls();}}
    if(disposed||!constructionMode||activation!==constructionActivation)return;constructionModel=(constructionFramed?host.ProofAtlasOccurrenceContextFrame:constructionGrouped?host.ProofAtlasOccurrenceApplicationFold:host.ProofAtlasOccurrenceConstructions).open(nativeCase);
    if(initialConstructionFocus){initialConstructionFocus=false;const current=nativeCase.get(scene.root.route);if(!current||!host.ProofAtlasDeepContext.construction(current,data)){const first=nativeCase.entries.find(e=>host.ProofAtlasDeepContext.construction(e,data));if(first)navigate(first.route,true,true);}}
    renderConstructions();if(scene)writeAddress(scene.root.route,true);
    status.textContent=groupingError?'Grouping unavailable: '+groupingError+'. Individual recorded stages remain available.':'Recorded constructions in their original source context. '+(letSupplementError?'Local definitions unavailable: '+letSupplementError+'. ':'')+'Unrecorded positions remain boundaries.';
   }catch(error){if(disposed||activation!==constructionActivation)return;constructionScripts=null;constructionError=error.message;constructionMode=false;modeControls();renderConstructions();status.textContent='Construction view unavailable: '+error.message+'. Source structure and existing native types remain available.';}
   finally{if(activation===constructionActivation)constructionButton.disabled=false;}
  }
  function draw(next){
   constructionSelection++;constructionView?.dispose();constructionView=null;
   scene=next;stage.replaceChildren();const cols=Math.max(...scene.nodes.map(n=>n.depth))+1,rows=Math.max(...scene.nodes.map(n=>n.row))+1;subtitle.textContent=nativeControl?'Synthetic core control · selected native records':control?'Serialized syntax control · original producer made no typing claim':(scene.namespace==='kernel-rule'?'Kernel reduction-rule syntax':'Source occurrence geometry')+' · '+(edition.label||edition.id);
   tools.querySelector('[data-window-parent]').disabled=next.root.route.depth===0;tools.querySelector('[data-window-root]').disabled=false;
   const external=[...new Map(scene.links.filter(l=>l.boundary).map(l=>[l.to,l])).values()];
   stageWidth=(cols+(external.length?1:0))*330+30;stageHeight=Math.max(rows*260,external.length*180)+30;stage.style.width=stageWidth+'px';stage.style.height=stageHeight+'px';viewport.style.height=Math.min(650,Math.max(310,stageHeight+20))+'px';
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width',stageWidth);svg.setAttribute('height',stageHeight);svg.setAttribute('aria-hidden','true');svg.classList.add('pow-edges');stage.append(svg);
   const positions=new Map(scene.nodes.map(n=>[n.id,{x:20+n.depth*330,y:20+n.row*260}])),cards=new Map();
   for(const n of scene.nodes){
    const pos=positions.get(n.id),card=el('article',undefined,'pow-card'),ports=[];let binderButton=null;card.style.left=pos.x+'px';card.style.top=pos.y+'px';card.dataset.constructor=n.kind;
    const pick=button(n.glyph+' '+n.kind+' · e'+n.node,()=>inspect(n)),formula=el('p',describe(n),'pow-formula');formula.tabIndex=0;pick.dataset.occurrenceNode=n.id;pick.setAttribute('aria-pressed','false');pick.append(el('small','Γ'+n.scopeDepth+' · depth '+n.route.depth));card.append(pick,formula);cards.set(n.id,{card,pick,ports,get binder(){return binderButton;}});
    for(const port of n.ports){const b=button(port.kernelField+' · '+(port.displayed?'shown':shortCount(port.expanded)+' hidden'),()=>safe(()=>navigate(port.route)));b.dataset.windowField=port.slot;b.className=port.displayed?'pow-port':'pow-port pow-frontier';card.append(b);ports.push(b);}
    if(n.binding){const external=scene.links.find(l=>l.from===n.id).boundary,b=button('↪ '+(external?'outside binder':'binder')+' e'+n.binding.node,()=>safe(()=>navigate(n.binding.route)));b.dataset.windowBinding='';b.className='pow-binding';card.append(b);binderButton=b;}
    stage.append(card);
   }
   external.forEach((ref,i)=>{const pos={x:20+cols*330,y:20+i*180},card=el('article',undefined,'pow-context-card'),payload=data.payloads[ref.node],kind=W.kinds[data.kind[ref.node]];positions.set(ref.to,pos);card.style.left=pos.x+'px';card.style.top=pos.y+'px';card.append(el('small','CONTEXT · OUTSIDE THIS CUT'));const pick=button(kind+' '+(payload.binderName||payload.declName||'_')+' · e'+ref.node,()=>safe(()=>navigate(ref.route)));pick.dataset.contextReference=ref.to;card.append(pick,el('p','Original binder at depth '+ref.route.depth+'. Not included in the subtree count.'));stage.append(card);cards.set(ref.to,{card,pick});});
   function paths(){
    if(viewport.hidden)return;
    svg.replaceChildren();
    function line(from,to,control,cls,slot){const a=positions.get(from),b=positions.get(to),target=cards.get(to).pick,right=b.x>=a.x,sx=right?a.x+245:a.x,sy=a.y+control.offsetTop+control.offsetHeight/2,tx=right?b.x:b.x+245,ty=b.y+target.offsetTop+target.offsetHeight/2,p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d','M '+sx+' '+sy+' C '+(sx+(right?40:-40))+' '+sy+' '+(tx+(right?-40:40))+' '+ty+' '+tx+' '+ty);if(cls)p.classList.add(cls);p.dataset.relation=cls?'source-bound-to':'source-field';if(slot!==undefined)p.dataset.slot=slot;svg.append(p);}
    for(const edge of scene.edges)line(edge.from,edge.to,cards.get(edge.from).ports[edge.slot],null,edge.slot);
    for(const binding of scene.links)line(binding.from,binding.to,cards.get(binding.from).binder,'pow-binding-edge');
   }
   redrawSourcePaths=paths;paths();document.fonts?.ready.then(()=>{if(scene===next&&!disposed)paths();});
   summary.textContent=scene.stats.retained+' retained + '+shortCount(scene.stats.hidden)+' hidden = '+shortCount(scene.stats.represented)+' occurrences. '+external.length+' context references lie outside this count.';
   inspect(scene.nodes[0]);scaled();viewport.scrollTo(0,0);status.textContent='Original occurrence structure. '+(nativeControl?'Synthetic core control; native typing is available only at recorded positions.':control?'Serialized syntax control; original producer typing is not claimed.':'Compiled declaration; mathematical interpretation and typing queries are separate.');if(constructionMode&&constructionModel)renderConstructions();
  }
  function safe(action){try{action();}catch(error){status.textContent=error.message;}}
  function navigate(route,write=true,replace=false){
   operation++;if(write&&!replace)initialConstructionFocus=false;if(disposed)return;
   const next=W.create(data,record,route,{maxNodes:Number(nodeBudget.value),maxDepth:Number(depth.value)});
   if(disposed)return;const hadFocus=root.contains(document.activeElement);draw(next);if(hadFocus)(constructionView?constructionHost.querySelector('[data-construction-point]'):stage.querySelector('[data-occurrence-node]'))?.focus({preventScroll:true});if(write)writeAddress(route,replace);
  }
  function fromLocation(){
   operation++;
   try{const u=new URL(location.href);constructionMode=u.searchParams.get('diagram')==='construction';constructionGrouped=u.searchParams.get('group')==='applications';constructionFramed=u.searchParams.get('group')==='contexts';frameBudget.value=['1','4','13','32','64'].includes(u.searchParams.get('members'))?u.searchParams.get('members'):'32';if(/^[0-6]$/.test(u.searchParams.get('levels')||''))depth.value=u.searchParams.get('levels');if(nativeCase)constructionModel=(constructionFramed?(host.ProofAtlasOccurrenceContextFrameView&&host.ProofAtlasOccurrenceContextFrame):constructionGrouped?host.ProofAtlasOccurrenceApplicationFold:host.ProofAtlasOccurrenceConstructions)?.open(nativeCase)||null;modeControls();if(!u.hash.startsWith('#occurrence='))throw Error('No original occurrence address in this link');const route=W.fromToken(record,u.hash.slice(12));navigate(route,false);if(constructionMode&&!constructionModel&&mounted)setConstructionMode(true);else if(!constructionMode)renderConstructions();}
   catch(error){scene=null;selected=null;constructionSelection++;constructionView?.dispose();constructionView=null;constructionHost.hidden=true;typeView?.dispose();typeView=null;typeHost.hidden=true;stage.replaceChildren();panel.replaceChildren();summary.textContent='';for(const b of tools.querySelectorAll('[data-window-parent],[data-window-root]'))b.disabled=true;status.textContent='Occurrence unavailable: '+error.message;}
  }
  try{
   if(initial.searchParams.get('control')==='checked-context'){
    nativePackage=await nativeReady();if(disposed)return;nativeCase=nativePackage.case(initial.searchParams.get('case')||'deep-reflexivity');if(!nativeCase)throw Error('Native control is not in the checked inventory');
    data=nativeCase.data;record=nativeCase.record;control=true;nativeControl=true;
   }else if(initial.searchParams.get('control')==='deep-syntax'){
    const d=host.PROOF_ATLAS_LARGE_SOURCE_CUT_CHECKS;
    if(d?.format!=='ProofAtlasLargeSourceCutInventory/1'||d.decodedBytes>1048576||d.file!=='/public/data/proof-atlas/large-source-cuts/'+d.sha256+'.json.gz')throw Error('Deep control inventory unavailable');
    const evidence=await A.compressed(d.file,d.sha256,{maxBytes:1048576,expectedBytes:d.decodedBytes}),rows=evidence.positive?.rows;
    if(evidence.format!=='ProofAtlasLargeSourceCutEvidence/1'||!Array.isArray(rows)||rows.length!==5||evidence.mathematicalTypingChecked!==false)throw Error('Deep control evidence unavailable');
    const row=rows.find(r=>r.origin==='own-serialized-syntax-control-no-typing-claim');
    if(!row||row.sourcePacket!=='/public/data/proof-atlas/large-source-cuts/deep-'+row.source.indexSha256+'.json.gz')throw Error('Deep control source identity');
    record={...row.source,indexFile:row.sourcePacket};data=await A.compressed(record.indexFile,record.indexSha256,{maxBytes:67108864});
    if(data.declaration.kernelCheck!=='not-claimed')throw Error('Deep syntax control status');control=true;
   }else{
    edition=library.editions.find(e=>e.id===initial.searchParams.get('edition'))||library.editions.find(e=>e.id===library.defaultEdition)||library.editions[0];record=edition.declarations.find(r=>r.name===initial.searchParams.get('proof'));
    if(!record)throw Error('Declaration unavailable; choose an occurrence from the library');
    if(record.uniqueNodes>P.limits.sourceNodes)throw Error('This occurrence profile supports at most '+P.limits.sourceNodes+' stored source nodes');
    try{await component('ProofAtlasLibraryBytes','/public/js/proof-atlas-library-bytes.js?v=1');}catch(error){nativeError=error.message;}
    if(host.ProofAtlasLibraryBytes){sourceBytes=await host.ProofAtlasLibraryBytes.compressedBytes(record.indexFile,record.indexSha256,{maxBytes:67108864,signal:nativeController.signal});data=A.validateIndex(JSON.parse(new TextDecoder().decode(sourceBytes)),record);}
    else data=A.validateIndex(await A.compressed(record.indexFile,record.indexSha256,{maxBytes:67108864,signal:nativeController.signal}),record);
   }
   W.validateSource(data,record);if(disposed)return;
   const header=el('header',undefined,'pow-header');title.textContent=record.name;subtitle.textContent=control?'Serialized syntax control · no kernel typing claim':'Source occurrence geometry · '+(edition.label||edition.id);
   header.append(el('p','PROOF ATLAS / OCCURRENCE GEOMETRY'),title,subtitle,link('Declaration library',backURL()),link(nativeControl?'Control and judgment packet ↓':'Original term packet ↓',record.indexFile),link('Native context controls (synthetic)','/projects/proof-atlas/library/?view=occurrence&control=checked-context&case=deep-reflexivity'));
   if(nativeControl){const label=el('label','Native context control '),choice=el('select');choice.dataset.nativeControlChoice='';for(const c of nativePackage.cases){const option=el('option',c.name);option.value=c.name;choice.append(option);}choice.value=nativeCase.name;choice.onchange=()=>{const u=new URL(location.href);u.searchParams.set('case',choice.value);u.hash='';location.assign(u);};label.append(choice);header.append(label);}
   const countLabel=el('label','Source nodes ');countLabel.append(nodeBudget);const depthLabel=el('label','Levels ');depthLabel.append(depth);
   const jump=el('input');jump.type='number';jump.min='0';jump.max=String(record.uniqueNodes-1);jump.step='1';jump.setAttribute('aria-label','Stored source node number');jump.placeholder='Node number';jump.style.width='9rem';
   const jumpButton=button('Go to node',async()=>{const epoch=++operation;activeJump=epoch;root.setAttribute('aria-busy','true');status.textContent='Resolving a representative occurrence…';try{await new Promise(resolve=>requestAnimationFrame(resolve));if(disposed||epoch!==operation)return;if(jump.value.trim()==='')throw Error('Enter a stored source node number');representativeIndex??=W.representatives(data);navigate(representativeIndex.route(Number(jump.value)));}catch(error){status.textContent=error.message;}finally{if(activeJump===epoch){activeJump=null;root.setAttribute('aria-busy','false');}}});
   const parent=button('Parent occurrence',()=>safe(()=>navigate(P.prefix(scene.root.route,scene.root.route.depth-1)))),original=button('Original root',()=>safe(()=>navigate(P.encode(scene.root.route.root,[]))));parent.dataset.windowParent='';original.dataset.windowRoot='';
   tools.append(countLabel,depthLabel,button('−',()=>{scale=Math.max(.25,scale/1.25);scaled();}),button('+',()=>{scale=Math.min(2,scale*1.25);scaled();}),button('Reset zoom',()=>{scale=1;scaled();}),parent,original,jump,jumpButton);
   tools.querySelectorAll('button')[0].setAttribute('aria-label','Zoom out');tools.querySelectorAll('button')[1].setAttribute('aria-label','Zoom in');
   const modes=el('div',undefined,'pow-tools');modes.setAttribute('role','group');modes.setAttribute('aria-label','Diagram representation');sourceButton=button('Source occurrences',()=>setConstructionMode(false));sourceButton.dataset.sourceMode='';constructionButton=button('Proof constructions',()=>setConstructionMode(true));constructionButton.dataset.constructionMode='';groupingControl=el('input');groupingControl.type='checkbox';groupingControl.dataset.constructionGroup='';groupingLabel=el('label');groupingLabel.append(groupingControl,document.createTextNode('Group applications'));groupingControl.onchange=()=>{constructionGrouped=groupingControl.checked;if(constructionGrouped)constructionFramed=false;setConstructionMode(true);};frameControl=el('input');frameControl.type='checkbox';frameControl.dataset.constructionFrame='';frameLabel=el('label');frameLabel.append(frameControl,document.createTextNode('Context frame'));frameControl.onchange=()=>{constructionFramed=frameControl.checked;if(constructionFramed)constructionGrouped=false;setConstructionMode(true);};frameBudget.onchange=()=>{if(scene)safe(()=>navigate(scene.root.route,true,true));};modes.append(sourceButton,constructionButton,groupingLabel,frameLabel,frameBudgetLabel);tools.append(modes);modeControls();
   const help=el('p','Scroll or drag empty space to pan. Solid lines follow source fields; dashed lines reference binders. A node number chooses one representative path; a shared node can have other uses.','pow-help'),layout=el('div',undefined,'pow-layout'),drawing=el('section');drawing.setAttribute('aria-label','Source occurrence diagram');drawing.append(tools,help,viewport,summary,constructionHost,typeHost);layout.append(drawing,panel);root.replaceChildren(header,status,layout);root.classList.add('pow-shell');
   nodeBudget.onchange=depth.onchange=()=>{if(!scene){status.textContent='Choose a source node or restore a valid occurrence link.';return;}safe(()=>navigate(scene.root.route,constructionMode&&constructionGrouped,true));};
   if(location.hash)fromLocation();else{const body=data.declaration.rootPaths.indexOf('root.value');navigate(P.encode(body<0?0:body,[]),true,true);}
   if(constructionMode&&!constructionModel)await setConstructionMode(true);
   let drag=null;viewport.addEventListener('pointerdown',event=>{if(event.target.closest('.pow-card,button,a,input,select'))return;drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);});viewport.addEventListener('pointermove',event=>{if(drag)viewport.scrollTo(drag.left+drag.x-event.clientX,drag.top+drag.y-event.clientY);});viewport.addEventListener('pointerup',()=>{drag=null;});viewport.addEventListener('pointercancel',()=>{drag=null;});
   host.addEventListener('popstate',fromLocation);host.addEventListener('hashchange',fromLocation);
   const api={getSnapshot:()=>{if(!selected||!scene)return null;const q=selectedTyping;return {source:scene.source,namespace:scene.namespace,category:scene.root.category,node:selected.node,route:selected.route,scopeDepth:selected.scopeDepth,binding:selected.binding,typing:q?'checked-native-record':'not-queried',...(q?{native:{role:q.role,evidenceSha256:q.evidenceSha256,...host.ProofAtlasDeepContext.typeIdentity(q),contextLength:q.contextLength,...(q.recording?{recording:q.recording}:{})}}:{})};},getScene:()=>scene,getNativeState:()=>({loaded:!!nativePackage,pending:!!nativeLoad&&!nativePackage,matched:!!nativeCase,error:nativeError,...(nativeCase?.stats?{inventory:nativeCase.stats}:{})}),getConstructionScene:()=>constructionView?.getScene()||null,getConstructionState:()=>({enabled:constructionMode,grouped:constructionGrouped,framed:constructionFramed,ready:!!constructionView,error:constructionError,groupingError,localDefinitions:{loaded:letSupplemented&&!!nativeCase?.stats?.supplementalLetQueries,queries:nativeCase?.stats?.supplementalLetQueries||0,error:letSupplementError}}),getTypeScene:()=>typeView?.getScene()||null,getTypeSnapshot:()=>typeView?.getSnapshot()||null,getIndexState:()=>representativeIndex?.state||null,focus:route=>navigate(route),dispose:()=>{disposed=true;constructionSelection++;constructionView?.dispose();observedTypes.clear();nativeController.abort();sourceBytes=null;typeView?.dispose();host.removeEventListener('popstate',fromLocation);host.removeEventListener('hashchange',fromLocation);}};
   mounted=true;host.ProofAtlasOccurrenceView=api;return api;
  }catch(error){status.textContent='Occurrence view unavailable: '+error.message;root.append(link('Open declaration library',backURL()));}
  finally{root.setAttribute('aria-busy','false');}
 }
 host.ProofAtlasOccurrenceWindowView={mount};
})(typeof window==='undefined'?globalThis:window);
