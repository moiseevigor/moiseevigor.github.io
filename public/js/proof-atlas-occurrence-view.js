/* Original occurrence windows with optional exact native typing attachments. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,action)=>{const n=el('button',text);n.type='button';n.onclick=action;return n;};
 const link=(text,href)=>{const n=el('a',text);n.href=href;return n;};
 const shortCount=s=>s.length<16?BigInt(s).toLocaleString('en-US'):s.slice(0,4)+'… ('+s.length+' digits)';
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 let disposeActive=null;
 const componentLoads=new Map();
 async function mount(root,library){
  disposeActive?.();
  if(host.ProofAtlasOccurrenceView?.dispose){host.ProofAtlasOccurrenceView.dispose();delete host.ProofAtlasOccurrenceView;}
  const A=host.ProofAtlasLibraryData,P=host.ProofAtlasPackedRoutes,W=host.ProofAtlasOccurrenceWindow;
  const initial=new URL(location.href),status=el('p','Loading the original source packet…','pow-status');status.setAttribute('role','status');
  root.replaceChildren(status);root.setAttribute('aria-busy','true');
  const paged=initial.searchParams.get('loading')==='paged';
  let retiredResidency=null;
  let sourceCursor=null,sourceModel=null,displayData=null,queryRegistry=null,queryLoad=null,queryMissing=false,pagedSession=null,pagedController=null,navigationController=null,pagedError=null,pagedPending=false;
  let record,data,sourceBytes=null,edition,control=false,nativeControl=false,scene=null,selected=null,scale=1,disposed=false,representativeIndex=null,operation=0,activeJump=null;
  let nativePackage=null,nativeCase=null,nativeLoad=null,nativeError=null,typeView=null,typeScripts=null,inspection=0;
  let positionPage=0,positionFilter='',positionConstructionsOnly=false,selectedTyping=null;
  let constructionMode=initial.searchParams.get('diagram')==='construction',constructionView=null,constructionModel=null,constructionScripts=null,constructionSelection=0,constructionError=null;
  let constructionActivation=0,groupingError=null;
  let constructionRegistry=null,constructionRegistryLoad=null,constructionRenderController=null,constructionRender=0,constructionPresentation=null,captionPresentation=null,captionState={status:"idle"};
  let letSupplemented=false,letSupplementPromise=null,letSupplementError=null,letUnionQueries=null;
  let constructionGrouped=initial.searchParams.get('group')==='applications',groupingControl=null,groupingLabel=null;
  let constructionFramed=initial.searchParams.get('group')==='contexts',frameControl=null,frameLabel=null;
  let constructionInterfaces=initial.searchParams.get('group')==='interfaces',interfaceRules=null,interfaceRulesLabel=null;
  let sourceUseView=null,sourceUseButton=null,sourceUseController=null,sourceUseEpoch=0,sourceUseAction=0,sourceUseLoading=false,sourceUseError=null,sourceUseLayout=null;
  let syntaxEnabled=initial.searchParams.get('counts')==='syntax',syntaxToggle=null,syntaxLabel=null,syntaxRetry=null,syntaxProvider=null,syntaxLoad=null,syntaxController=null,syntaxEpoch=0,sourceCountTargets=null,constructionCountTargets=null;
  let syntaxState={loading:false,error:null,annotations:[]};
  let constructionDefinitions=initial.searchParams.get('group')==='definitions',definitionControl=null,definitionLabel=null,definitionModel=null;
  const frameBudget=el('select');frameBudget.setAttribute('aria-label','Context frame members');for(const n of [1,4,8,13,32,64]){const o=el('option',String(n));o.value=n;frameBudget.append(o);}frameBudget.value=['1','4','8','13','32','64'].includes(initial.searchParams.get('members'))?initial.searchParams.get('members'):'32';
  const frameBudgetLabel=el('label','Frame members ');frameBudgetLabel.append(frameBudget);
  let initialConstructionFocus=constructionMode&&!initial.hash;
  let constructionButton=null,sourceButton=null,controlConstructionError=null,mounted=false,redrawSourcePaths=null;const observedTypes=new Map();
  const constructionHost=el('section');constructionHost.hidden=true;
  const nativeController=new AbortController(),typeHost=el('section');typeHost.hidden=true;
  function dispose(){
   if(disposed)return;retireSyntaxAnnotations();syntaxProvider?.dispose();syntaxProvider=null;syntaxLoad=null;sourceCountTargets=constructionCountTargets=null;retireSourceUses();disposed=true;pagedController?.abort();navigationController?.abort();constructionRenderController?.abort();nativeController.abort();pagedSession?.cursor.dispose();queryRegistry?.dispose();constructionRegistry?.dispose();sourceCursor?.dispose();
   if(paged)retiredResidency={disposed:true,display:null,source:sourceCursor?.state(),query:queryRegistry?.state(),construction:constructionRegistry?.state(),type:pagedSession?.cursor.state()||null,activeTypeTables:0};
   pagedPending=false;constructionSelection++;constructionView?.dispose();typeView?.dispose();observedTypes.clear();host.removeEventListener('popstate',fromLocation);host.removeEventListener('hashchange',fromLocation);
   pagedSession=null;queryRegistry=null;queryLoad=null;constructionRegistry=null;constructionRegistryLoad=null;constructionPresentation=null;captionPresentation=null;captionState={status:"disposed"};sourceCursor=null;sourceModel=null;displayData=null;sourceBytes=null;nativePackage=null;nativeCase=null;nativeLoad=null;constructionModel=null;constructionView=null;definitionModel=null;typeView=null;representativeIndex=null;scene=null;selected=null;selectedTyping=null;if(disposeActive===dispose)disposeActive=null;
  }
  disposeActive=dispose;
  const title=el('h1'),subtitle=el('p'),tools=el('div',undefined,'pow-tools'),viewport=el('div',undefined,'pow-viewport'),sizing=el('div',undefined,'pow-sizing'),stage=el('div',undefined,'pow-stage'),panel=el('section',undefined,'pow-inspector'),summary=el('p',undefined,'pow-summary');
  viewport.tabIndex=0;viewport.setAttribute('aria-label','Occurrence geometry. Scroll or drag empty space to pan.');viewport.append(sizing);sizing.append(stage);
  const nodeBudget=el('select'),depth=el('select');depth.setAttribute('aria-label','Diagram levels');for(const n of [1,7,13,25,32]){const o=el('option',String(n));o.value=n;nodeBudget.append(o);}nodeBudget.value='13';for(let i=0;i<=6;i++){const o=el('option',String(i));o.value=i;depth.append(o);}depth.value=/^[0-6]$/.test(initial.searchParams.get('levels')||'')?initial.searchParams.get('levels'):'2';
  let stageWidth=0,stageHeight=0;
  function scaled(){stage.style.transform='scale('+scale+')';sizing.style.width=stageWidth*scale+'px';sizing.style.height=stageHeight*scale+'px';constructionView?.setScale(scale);}
  function backURL(route){
   const u=new URL(location.href);u.searchParams.delete('view');u.searchParams.delete('control');u.searchParams.delete('loading');u.searchParams.delete('diagram');u.searchParams.delete('group');u.searchParams.delete('levels');u.searchParams.delete('members');u.searchParams.delete('counts');u.hash='';
   if(control){u.searchParams.delete('proof');u.searchParams.delete('edition');return u.pathname+u.search;}
   if(route&&route.depth<=512){const bytes=P.parse(route),slots=[];for(let i=0;i<route.depth;i++)slots.push((bytes[i>>2]>>((i%4)*2))&3);u.searchParams.set('route',route.root+':'+slots.join('.'));const node=paged?(selected&&W.id(selected.route)===W.id(route)?selected.node:scene?.nodes.find(n=>W.id(n.route)===W.id(route))?.node):P.resolve(data,route).node;if(node!==undefined)u.hash='expr-'+node;}else u.searchParams.delete('route');
   return u.pathname+u.search+u.hash;
  }
  function writeAddress(route,replace=false){const u=new URL(location.href);u.searchParams.set('view','occurrence');u.searchParams.delete('route');if(paged)u.searchParams.set('loading','paged');else u.searchParams.delete('loading');if(constructionMode)u.searchParams.set('diagram','construction');else u.searchParams.delete('diagram');if(constructionMode&&(constructionDefinitions||constructionInterfaces)){u.searchParams.set('group',constructionInterfaces?'interfaces':'definitions');u.searchParams.set('members',frameBudget.value);u.searchParams.delete('levels');}else if(constructionMode&&constructionFramed){u.searchParams.set('group','contexts');u.searchParams.set('members',frameBudget.value);u.searchParams.delete('levels');}else if(constructionMode&&constructionGrouped){u.searchParams.set('group','applications');u.searchParams.set('levels',depth.value);u.searchParams.delete('members');}else{u.searchParams.delete('group');u.searchParams.delete('levels');u.searchParams.delete('members');}u.hash='occurrence='+W.token(record,route);history[replace?'replaceState':'pushState']({},'',u);const switcher=root.querySelector('[data-loading-switch]');if(switcher){const target=new URL(u);if(paged){target.searchParams.delete('loading');target.searchParams.set('diagram','construction');}else target.searchParams.set('loading','paged');switcher.href=target.pathname+target.search+target.hash;}}
  function describe(n,source=displayData||data){try{return A.describe(source,n.node);}catch{return n.kind+' · e'+n.node+' · original payload available in the packet';}}
  async function component(name,url){
   if(host[name])return;let pending=componentLoads.get(url);
   if(!pending){pending=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Native record component unavailable'));};document.head.append(script);});componentLoads.set(url,pending);}
   try{await pending;if(!host[name])throw Error('Native record component did not initialize');}finally{if(componentLoads.get(url)===pending)componentLoads.delete(url);}
  }
  async function constructionSupplement(){await component('PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS','/public/data/proof-atlas/occurrence-constructions-manifest.js?v=1');let d;try{d=host.ProofAtlasDeepContext.constructionDescriptor(host.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS);}catch(error){delete host.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS;throw error;}return host.ProofAtlasDeepContext.prepareConstructions(await A.compressed(d.file,d.sha256,{maxBytes:8388608,expectedBytes:d.decodedBytes,signal:nativeController.signal}),d);}
  async function pagedRegistry(){
   if(queryRegistry||queryMissing)return queryRegistry;
   queryLoad??=(async()=>{await component('PROOF_ATLAS_TYPE_QUERY_PAGES','/public/data/proof-atlas/type-query-pages-manifest.js?v=4');await component('ProofAtlasTypePages','/public/js/proof-atlas-type-pages.js?v=2');await component('ProofAtlasTypeQueryPages','/public/js/proof-atlas-type-query-pages.js?v=2');const inventory=host.PROOF_ATLAS_TYPE_QUERY_PAGES;if(inventory?.format!=='ProofAtlasTypeQueryInventory/1'||!Array.isArray(inventory.records)||inventory.records.length>512){delete host.PROOF_ATLAS_TYPE_QUERY_PAGES;throw Error('Recorded type inventory is invalid');}const d=inventory.records.find(d=>d.edition===edition.id&&d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256);if(!d){queryMissing=true;return null;}return host.ProofAtlasTypeQueryPages.open(d,record,{signal:nativeController.signal});})();
   try{const registry=await queryLoad;if(disposed){registry?.dispose();return null;}queryRegistry=registry;return registry;}catch(error){queryLoad=null;throw error;}
  }
  function pagedPositions(registry,signal,serial){
   const details=el('details'),list=el('ol'),count=el('p'),controls=el('div',undefined,'pow-tools'),previous=button('Previous positions',()=>{positionPage--;update();}),next=button('Next positions',()=>{positionPage++;update();});details.dataset.nativePositions='';details.append(el('summary','Recorded positions · '+registry.manifest.observations),count,list,controls);controls.append(previous,next);let epoch=0;
   async function update(){const current=++epoch;details.setAttribute('aria-busy','true');previous.disabled=next.disabled=true;count.textContent='Loading recorded positions…';try{const page=await registry.page({offset:positionPage*16,limit:16,signal});if(disposed||signal.aborted||serial!==inspection||current!==epoch)return;list.replaceChildren();list.start=page.offset+1;count.textContent=(page.offset+1)+'–'+(page.offset+page.rows.length)+' of '+page.total+' recorded positions';for(const [i,r]of page.rows.entries()){const item=el('li'),pick=button('Position '+(page.offset+i+1)+' · '+r.role+' · e'+r.node+' · depth '+r.route.depth+' · '+originLabel({recording:{kind:r.origin}}),()=>safe(()=>navigate(r.route)));pick.dataset.nativeQuery=page.offset+i;item.append(pick);list.append(item);}previous.disabled=positionPage===0;next.disabled=page.offset+16>=page.total;}catch(error){if(!signal.aborted&&current===epoch)count.textContent='Recorded positions unavailable: '+error.message;}finally{if(current===epoch)details.setAttribute('aria-busy','false');}}
   details.ontoggle=()=>{if(details.open)update();};return details;
  }
  function showPagedObservation(n,native,message,session,serial,signal){
   const live=()=>!disposed&&!signal.aborted&&serial===inspection;
   const o=session.observation;if(o.sourceNode!==n.node||o.contextLength!==n.scopeDepth)throw Error('Recorded source occurrence/context differs');
   pagedSession=session;selectedTyping={...o,route:o.sourceRoute,recording:o.origin.recording};pagedError=null;native.dataset.nativeState='checked';message.textContent='Producer-validated native '+o.role+' observation · original Γ'+o.contextLength;
   const toggle=button('Show recorded type',async()=>{if(typeView){typeView.dispose();typeView=null;toggle.textContent='Show recorded type';toggle.setAttribute('aria-expanded','false');return;}toggle.disabled=true;try{await component('ProofAtlasCompactTypeView','/public/js/proof-atlas-compact-type-view.js?v=5');if(!live())return;typeView=host.ProofAtlasCompactTypeView.mountPaged(typeHost,session.cursor,o,sourceCursor,r=>safe(()=>navigate(r)));toggle.textContent='Hide recorded type';toggle.setAttribute('aria-expanded','true');}catch(error){if(live())message.textContent='Type diagram unavailable: '+error.message;}finally{toggle.disabled=false;}});toggle.dataset.showRecordedType='';toggle.setAttribute('aria-expanded','false');
   native.append(link('Original native evidence ↓',o.evidenceFile),el('p','Original recorded type root e'+o.root+'. The browser verifies the transported record and source context; it does not rerun Lean.'),toggle);
   const provenance=el('details');provenance.append(el('summary','Native record provenance'),el('pre',JSON.stringify({origin:o.origin,transportTable:session.cursor.manifest.typeTableSha256,sourceModuleBytesVerified:false,scope:'Producer-validated native observation; type descendants have no additional typing judgment'},null,2)));native.append(provenance);
   if(o.origin.recording?.queryRoute){const parent=button('Go to recording query',()=>safe(()=>navigate(o.origin.recording.queryRoute)));parent.dataset.recordingQuery='';native.append(parent);}
  }
  async function loadPagedNative(n,native,message,serial,signal){
   pagedPending=true;pagedError=null;let session=null;
   const live=()=>!disposed&&!signal.aborted&&serial===inspection&&native.isConnected;
   try{const registry=await pagedRegistry();if(!live())return;if(!registry){native.dataset.nativeState='unrecorded';message.textContent='No recorded type profile for this declaration in paged mode.';return;}
    native.append(pagedPositions(registry,signal,serial));const row=await registry.lookup(n.route,{signal});if(!live())return;if(!row){native.dataset.nativeState='unrecorded';message.textContent='No recorded native type at this exact occurrence in this finite profile.';return;}
    session=await registry.selected(row,{signal});if(!live()){session.cursor.dispose();return;}showPagedObservation(n,native,message,session,serial,signal);
   }catch(error){session?.cursor.dispose();if(!live())return;pagedSession=null;selectedTyping=null;pagedError=error.message;queryRegistry?.dispose();queryRegistry=null;queryLoad=null;native.dataset.nativeState='error';message.textContent='Recorded type unavailable: '+error.message;native.append(button('Retry recorded type',()=>inspect(n)));}
   finally{if(serial===inspection)pagedPending=false;}
  }
  async function pagedConstructionRegistry(){
   if(constructionRegistry)return constructionRegistry;
   constructionRegistryLoad??=(async()=>{await component('PROOF_ATLAS_CONSTRUCTION_PAGES','/public/data/proof-atlas/construction-pages-manifest.js?v=5');await component('ProofAtlasSourcePages','/public/js/proof-atlas-source-pages.js?v=3');await component('ProofAtlasCursorWindow','/public/js/proof-atlas-cursor-window.js?v=1');await component('ProofAtlasTypePages','/public/js/proof-atlas-type-pages.js?v=2');await component('ProofAtlasConstructionPages','/public/js/proof-atlas-construction-pages.js?v=3');await component('ProofAtlasCursorConstructions','/public/js/proof-atlas-cursor-constructions.js?v=1');const inventory=host.PROOF_ATLAS_CONSTRUCTION_PAGES;if(inventory?.format!=='ProofAtlasConstructionInventory/1'||!Array.isArray(inventory.records)||inventory.records.length>512){delete host.PROOF_ATLAS_CONSTRUCTION_PAGES;throw Error('Construction inventory is invalid');}const d=inventory.records.find(d=>d.edition===edition.id&&d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256);if(!d)throw Error('No sparse construction profile for this declaration');return host.ProofAtlasConstructionPages.open(d,record,{signal:nativeController.signal});})();
   try{const registry=await constructionRegistryLoad;if(disposed){registry.dispose();return null;}constructionRegistry=registry;return registry;}catch(error){constructionRegistryLoad=null;throw error;}
  }
  async function nativeReady(){
   if(paged)throw Error('Complete native archives are not loaded in paged source/type mode');
   await component('ProofAtlasDeepContext','/public/js/proof-atlas-deep-context.js?v=5');
   if(record&&!control){
    await component('PROOF_ATLAS_RECORDED_UNIONS','/public/data/proof-atlas/recorded-unions-manifest.js?v=1');
    const inventory=host.PROOF_ATLAS_RECORDED_UNIONS;if(inventory?.format!=='ProofAtlasRecordedUnionInventory/1'||!Array.isArray(inventory.records)||inventory.records.length>512)throw Error('Recorded union inventory is invalid');
    const d=inventory.records.find(d=>d.edition===edition.id&&d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256);
    if(!d)return{cases:[],attach:async()=>null};if(!Array.isArray(d.inputs)||d.inputs.length<1||d.inputs.length>8)throw Error('Recorded union input bound');
    await component('ProofAtlasOccurrenceTypes','/public/js/proof-atlas-occurrence-types.js?v=13');
    await component('ProofAtlasLibraryBytes','/public/js/proof-atlas-library-bytes.js?v=1');
    if(d.inputs.some(p=>p.kind==='let')){await component('ProofAtlasBetaReduction','/public/js/proof-atlas-beta-reduction.js?v=13');await component('ProofAtlasLetReduction','/public/js/proof-atlas-let-reduction.js?v=3');await component('ProofAtlasLetPools','/public/js/proof-atlas-let-pools.js?v=2');}
    sourceBytes??=await host.ProofAtlasLibraryBytes.compressedBytes(record.indexFile,record.indexSha256,{maxBytes:67108864,signal:nativeController.signal});const inputs=[];
    for(const p of d.inputs){const bytes=await host.ProofAtlasLibraryBytes.compressedBytes(p.descriptor.file,p.descriptor.sha256,{maxBytes:p.kind==='let'?8388608:67108864,signal:nativeController.signal});if(disposed)throw Error('Native record request cancelled');inputs.push({kind:p.kind,package:await (p.kind==='let'?host.ProofAtlasDeepContext.recordedLets:host.ProofAtlasDeepContext.recorded)(sourceBytes,bytes,p.descriptor,record)});}
    const union=host.ProofAtlasDeepContext.unionRecorded(inputs);letUnionQueries=inputs.find(p=>p.kind==='let')?.package.cases[0].stats.primaryQueries||0;letSupplemented=true;return union;
   }
   await component('PROOF_ATLAS_DEEP_TYPING','/public/data/proof-atlas/deep-typing-manifest.js?v=1');
   if(disposed)throw Error('Native record request cancelled');const d=host.ProofAtlasDeepContext.descriptor(host.PROOF_ATLAS_DEEP_TYPING);
   const baseline=await host.ProofAtlasDeepContext.prepare(await A.compressed(d.file,d.sha256,{maxBytes:8388608,expectedBytes:d.decodedBytes,signal:nativeController.signal}),d);
   try{return host.ProofAtlasDeepContext.mergeControls(baseline,await constructionSupplement());}
   catch(error){controlConstructionError=error.message;return baseline;}
  }
  async function loadTyping(){
   nativeError=null;nativeLoad??=nativeReady();if(selected&&scene)inspect(selected);
   try{const loaded=await nativeLoad;if(disposed)return;nativePackage=loaded;nativeCase=await nativePackage.attach(data,record);if(disposed){nativePackage=null;nativeCase=null;return;}}
   catch(error){if(disposed)return;nativeError=error.message;nativeLoad=null;nativeCase=null;nativePackage=null;}
   if(!disposed&&selected&&scene)inspect(selected);
  }
  async function loadLetTyping(){
   if(control||letSupplemented||nativeCase?.provenance.recordedUnion||!nativePackage||!nativeCase)return;
   letSupplementPromise??=(async()=>{
    await component('PROOF_ATLAS_LET_REDUCTIONS','/public/data/proof-atlas/let-result-pools-manifest.js?v=3');
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
  function inspect(n,observation=null,pointData=null,fromUse=false){
   if(!fromUse){sourceUseAction++;sourceUseView?.clearSelection();}
   const serial=++inspection;if(paged){pagedController?.abort();if(pagedSession?.cursor!==observation?.cursor)pagedSession?.cursor.dispose();if(!observation?.construction)constructionRegistry?.releaseType();pagedSession=null;selectedTyping=null;pagedPending=false;pagedController=new AbortController();}
   typeView?.dispose();typeView=null;typeHost.hidden=true;typeHost.replaceChildren();
   selected=n;for(const b of stage.querySelectorAll('[data-occurrence-node]'))b.setAttribute('aria-pressed',String(b.dataset.occurrenceNode===n.id));
   const heading=el('h2',n.glyph+' '+n.kind+' · e'+n.node),context=el('p','Original root '+n.route.root+' · depth '+n.route.depth+' · '+n.scopeDepth+' enclosing binders'),term=el('pre',describe(n,pointData||displayData||data));term.tabIndex=0;
   const focus=button('Focus this occurrence',()=>safe(()=>navigate(n.route)));focus.dataset.occurrenceFocus='';
   const entry=paged?null:observation||nativeCase?.get(n.route)||observedTypes.get(W.id(n.route));selectedTyping=entry||null;const native=el('section',undefined,'pow-native-record'),message=el('p');message.setAttribute('role','status');
   native.dataset.nativeState=entry?'checked':nativeError?'error':nativePackage?'unrecorded':nativeLoad?'loading':'unloaded';
   if(entry){
    message.textContent=(entry.recording?.observation==='meta'?'Native extraction · Meta-inferred argument type':'Native Lean 4.33.1 record · '+originLabel(entry))+' · '+entry.role+' · original Γ'+entry.contextLength;
    const judgment=el('pre','Γ'+entry.contextLength+' ⊢ e'+n.node+' : '+(entry.typeText||A.describe(entry.typeData,entry.typeData.roots[0])));judgment.tabIndex=0;judgment.dataset.nativeJudgment='';
    const toggle=button('Show recorded type',async()=>{if(typeView){typeView.dispose();typeView=null;toggle.textContent='Show recorded type';toggle.setAttribute('aria-expanded','false');return;}toggle.disabled=true;try{if(!host.ProofAtlasCompactTypeView){typeScripts??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/js/proof-atlas-compact-type-view.js?v=5';script.onload=resolve;script.onerror=()=>{script.remove();typeScripts=null;reject(Error('Recorded type renderer unavailable'));};document.head.append(script);});await typeScripts;}if(disposed||serial!==inspection||!scene||!selected)return;typeView=host.ProofAtlasCompactTypeView.mount(typeHost,entry,data,route=>safe(()=>navigate(route)));toggle.textContent='Hide recorded type';toggle.setAttribute('aria-expanded','true');}catch(error){if(!disposed&&serial===inspection)message.textContent='Native typing record retained; type diagram unavailable: '+error.message;}finally{toggle.disabled=false;}});toggle.dataset.showRecordedType='';toggle.setAttribute('aria-expanded','false');
    native.append(message,judgment,el('p',entry.recording?.observation==='meta'?'Meta-inferred type recorded in the original context. Kernel conversion records remain separate; the browser does not rerun Lean.':'Recorded kernel typing in the original context. The browser checks correspondence; it does not rerun Lean.'),toggle);
    if(entry.recording?.kind!=='primary-query'&&entry.recording){const parent=button('Go to recording query',()=>safe(()=>navigate(entry.recording.queryRoute)));parent.dataset.recordingQuery='';native.append(el('p','This '+originLabel(entry)+' was recorded in '+(entry.recording.stage?'stage '+entry.recording.stage+' · ':'')+(entry.recording.part||entry.recording.field)+(entry.recording.slot?' '+entry.recording.slot:'')+' of query e'+entry.recording.queryNode+'.'),parent);}
    if(entry.typeText)native.append(el('p',entry.recording?.presentation==='compiled-constructor-summary'?'This type label is a constructor summary; inspect the recorded graph for its full structure.':'Type text is a presentation; the diagram retains the recorded expression fields.'));
    const provenance=el('details');provenance.append(el('summary','Native record provenance'),el('pre',JSON.stringify({evidenceSha256:entry.evidenceSha256,sourceIndexSha256:entry.sourceIndexSha256,sourceRoute:entry.route,...host.ProofAtlasDeepContext.typeIdentity(entry),originalContextLength:entry.contextLength,recording:entry.recording,baselineAxioms:entry.baselineAxioms,sourceModuleBytesVerified:false,...(nativeCase.provenance?{extraction:nativeCase.provenance}:{})},null,2)),link('Native term and judgment data ↓',entry.evidenceFile||host.PROOF_ATLAS_DEEP_TYPING.file));native.append(provenance);
   }else{
    message.textContent=nativeError?'Native record unavailable: '+nativeError:nativePackage?'No recorded native typing at this exact source position.':nativeLoad?'Loading hash-bound native records…':'No native typing query is loaded in this source view.';
    native.append(message);if(!nativePackage){const load=button(nativeError?'Retry recorded types':'Load recorded types',loadTyping);load.disabled=!!nativeLoad;load.dataset.loadRecordedTypes='';native.append(load);}
   }
   if(paged){native.replaceChildren(message);if(observation){showPagedObservation(n,native,message,observation,serial,pagedController.signal);if(queryRegistry)native.prepend(pagedPositions(queryRegistry,pagedController.signal,serial));}else{message.textContent='Loading the recorded-position index…';native.dataset.nativeState='loading';loadPagedNative(n,native,message,serial,pagedController.signal);}}
   if(nativeCase){if(nativeCase.stats)native.append(el('p',nativeCase.stats.primaryQueries+' direct queries + '+nativeCase.stats.explicitObservations+' explicit observations. '+nativeCase.stats.unavailableQueries+' unavailable queries. '+(nativeCase.stats.supplementalLetQueries?nativeCase.stats.supplementalLetQueries+' additional local-definition queries + '+nativeCase.stats.supplementalLetObservations+' observations; '+nativeCase.stats.supplementalLetOverlap+' shared positions. ':'')+'Other source positions have no recorded type.'));native.append(positions(entry));}
   panel.replaceChildren(heading,context,term,native,focus);
   if(!control)panel.append(link(n.route.depth<=512?'Open this occurrence in the proof reader':'Open declaration in the proof reader',backURL(n.route)));
   const ports=el('ol');for(const port of n.ports){const li=el('li'),b=button(port.kernelField+' → e'+port.node,()=>safe(()=>navigate(port.route)));b.dataset.occurrencePort=port.slot;li.append(b,el('small',(port.displayed?'Shown':'Collapsed')+' · '+shortCount(port.expanded)+' occurrences'));ports.append(li);}if(n.ports.length)panel.append(el('h3','Ordered source fields'),ports);
   if(n.binding){const b=button('Go to binder · e'+n.binding.node,()=>safe(()=>navigate(n.binding.route)));b.dataset.occurrenceBinder='';panel.append(el('h3','Lexical connection'),el('p','Bound to the original binder at depth '+n.binding.route.depth+'.'),b);}
   else if(n.kind==='bvar')panel.append(el('p','This index has no enclosing binder in the selected source root.'));
   const exact=el('details'),label=el('summary','Exact source address and accounting');exact.append(label,el('pre',JSON.stringify({source:scene.source,route:n.route,expandedOccurrences:n.expanded},null,2)));panel.append(exact);
   const payload=el('details');payload.append(el('summary','Original constructor payload'));const raw=JSON.stringify((pointData||displayData||data).payloads[n.node],null,2);payload.append(el('pre',raw.length>12000?raw.slice(0,12000)+'\n… display truncated; complete payload is in the source packet.':raw));panel.append(payload);
  }
  function rememberType(entry){const key=W.id(entry.route);observedTypes.delete(key);observedTypes.set(key,entry);while(observedTypes.size>4)observedTypes.delete(observedTypes.keys().next().value);}
  function sourcePoint(route){return W.create(data,record,route,{maxNodes:1,maxDepth:0}).nodes[0];}
  function retireSyntaxAnnotations(){
   syntaxEpoch++;syntaxController?.abort();syntaxController=null;syntaxState={loading:false,error:null,annotations:[]};
   root.querySelectorAll('[data-syntax-count-note]').forEach(n=>n.remove());root.querySelectorAll('[data-syntax-counts-active]').forEach(n=>delete n.dataset.syntaxCountsActive);
   root.querySelectorAll('[data-scalar-count-text]').forEach(n=>n.textContent=n.dataset.scalarCountText);
  }
  async function syntaxCursor(){
   if(syntaxProvider)return syntaxProvider;
   if(control||!edition)throw Error('No syntax-count profile for this synthetic source control');
   syntaxLoad??=(async()=>{await component('ProofAtlasSyntaxCounts','/public/js/proof-atlas-syntax-counts.js?v=1');await component('PROOF_ATLAS_SYNTAX_COUNTS','/public/data/proof-atlas/syntax-counts-manifest.js?v=1');
    const inventory=host.PROOF_ATLAS_SYNTAX_COUNTS;if(inventory?.format!=='ProofAtlasSyntaxCountInventory/1'||inventory.algorithm!==host.ProofAtlasSyntaxCounts.algorithm||!Array.isArray(inventory.records)||inventory.records.length>4096){delete host.PROOF_ATLAS_SYNTAX_COUNTS;throw Error('Invalid syntax-count inventory');}
    const d=inventory.records.find(d=>d.edition===edition.id&&d.name===record.name&&d.indexSha256===record.indexSha256);if(!d)throw Error('No syntax-count profile for this compiled source');
    return host.ProofAtlasSyntaxCounts.open(d,record,{signal:nativeController.signal});})();
   try{const cursor=await syntaxLoad;if(disposed){cursor.dispose();throw Error('Reader retired');}syntaxProvider=cursor;return cursor;}catch(error){syntaxLoad=null;throw error;}
  }
  function syntaxTargets(){return constructionMode?(constructionDefinitions||constructionInterfaces?constructionCountTargets:null):sourceCountTargets;}
  async function refreshSyntaxCounts(){
   retireSyntaxAnnotations();modeControls();const targets=syntaxTargets();if(!syntaxEnabled||!targets||!targets.items.length||disposed)return;
   const epoch=syntaxEpoch,originalScene=scene;syntaxController=new AbortController();const signal=syntaxController.signal,live=()=>!disposed&&!signal.aborted&&epoch===syntaxEpoch&&syntaxEnabled&&scene===originalScene&&syntaxTargets()===targets;
   syntaxState={loading:true,error:null,annotations:[]};const notes=targets.items.map(item=>{const note=el('p','Loading syntax count…','pow-syntax-count');note.dataset.syntaxCountNote='';item.holder.dataset.syntaxCountsActive='true';item.holder.querySelectorAll('[data-recorded-use-label]').forEach(n=>n.textContent=n.dataset.recordedUseLabel);item.holder.append(note);return note;});
   try{const cursor=await syntaxCursor();if(!live())return;
    for(const [i,item]of targets.items.entries()){
     const snapshot=item.point?{point:item.point}:await targets.pointFor(item.route,signal);if(!live())return;
     const annotation=await cursor.forPoint(snapshot.point,targets.source,{signal});if(!live())return;
     const note=notes[i];note.dataset.countStatus=annotation?.status||'unavailable';note.dataset.countMethod=host.ProofAtlasSyntaxCounts.algorithm;
     note.textContent=annotation?.status==='complete'?'Syntax uses in body: '+shortCount(annotation.count):'Syntax count unavailable';note.title='Expanded source-syntax multiplicity. This does not count recorded type judgments or necessary assumptions.';
     if(annotation){syntaxState.annotations.push(annotation);const details=el('details');details.dataset.syntaxCountNote='';details.append(el('summary','Count provenance'),el('pre',JSON.stringify(annotation,null,2)));item.holder.append(details);}
    }
   }catch(error){if(live()){syntaxState.error=error.message;notes.forEach(n=>{n.dataset.countStatus='unavailable';n.textContent='Syntax count unavailable';n.title=error.message;});}}
   finally{if(live()){syntaxState.loading=false;modeControls();redrawSourcePaths?.();}}
  }
  function modeControls(){
   if(syntaxLabel)syntaxLabel.hidden=constructionMode&&!constructionDefinitions&&!constructionInterfaces;if(syntaxToggle)syntaxToggle.checked=syntaxEnabled;if(syntaxRetry)syntaxRetry.hidden=!syntaxEnabled||!syntaxState.error||syntaxLabel.hidden;
   if(sourceUseButton){sourceUseButton.hidden=constructionMode;sourceUseButton.disabled=sourceUseLoading;sourceUseButton.setAttribute('aria-expanded',String(!!sourceUseView));sourceUseButton.textContent=sourceUseLoading?'Loading recorded uses…':sourceUseView?'Hide recorded variable uses':sourceUseError?'Retry recorded variable uses':'Recorded variable uses';}
   if(definitionLabel)definitionLabel.hidden=!constructionMode;if(definitionControl)definitionControl.checked=constructionDefinitions||constructionInterfaces;if(interfaceRulesLabel)interfaceRulesLabel.hidden=!constructionMode||(!constructionDefinitions&&!constructionInterfaces);if(interfaceRules)interfaceRules.value=constructionInterfaces?'interfaces':constructionDefinitions?'definitions':interfaceRules.value;
   for(const o of frameBudget.options)o.disabled=(constructionDefinitions||constructionInterfaces)&&Number(o.value)>8;if((constructionDefinitions||constructionInterfaces)&&Number(frameBudget.value)>8)frameBudget.value='4';frameBudgetLabel.firstChild.textContent=constructionInterfaces?'Interfaces per chunk ':constructionDefinitions?'Definitions per chunk ':'Frame members ';
   if(frameLabel)frameLabel.hidden=!constructionMode;if(frameControl)frameControl.checked=constructionFramed;frameBudgetLabel.hidden=!constructionMode||(!constructionFramed&&!constructionDefinitions&&!constructionInterfaces);nodeBudget.disabled=depth.disabled=constructionMode&&(constructionFramed||constructionDefinitions||constructionInterfaces);
   if(groupingLabel)groupingLabel.hidden=!constructionMode||paged;if(groupingControl)groupingControl.checked=constructionGrouped;
   constructionButton?.setAttribute('aria-pressed',String(constructionMode));sourceButton?.setAttribute('aria-pressed',String(!constructionMode));
   for(const option of nodeBudget.options)option.disabled=constructionMode&&Number(option.value)>13;
   for(const option of depth.options)option.disabled=constructionMode&&Number(option.value)>4;
   if(constructionMode&&Number(nodeBudget.value)>13)nodeBudget.value='13';if(constructionMode&&Number(depth.value)>4)depth.value='4';
   if(nodeBudget.parentElement)nodeBudget.parentElement.firstChild.textContent=constructionMode?'Construction nodes ':'Source nodes ';
  }
  async function annotateConstructions(view,model,cut,signal){
   const live=()=>!disposed&&!signal.aborted&&constructionMode&&constructionView===view;
   if(control||!live())return;
   captionState={status:'loading',sourceIndexSha256:cut.source.indexSha256,root:cut.root.route};view.setCaptionPending?.();
   try{
    const registry=await pagedConstructionRegistry();if(!live())return;
    if(registry?.manifest.captionFormat!=='ProofAtlasConstructionCaptions/1'){captionState={status:'unavailable',reason:'This profile has no caption metadata'};view.setCaptionError?.('This profile has no caption metadata');return;}
    await component('ProofAtlasRecordedCaptions','/public/js/proof-atlas-recorded-captions.js?v=1');if(!live())return;
    await component('ProofAtlasConstructionCaptions','/public/js/proof-atlas-construction-captions.js?v=1');if(!live())return;
    const result=await host.ProofAtlasConstructionCaptions.prepare(registry,model,cut,{signal});if(!live())return;
    view.setCaptions(result,()=>annotateConstructions(view,model,cut,signal));captionPresentation=result;captionState={status:'ready',...result.counts,decodedBytes:result.decodedBytes,byteLimit:result.byteLimit,sourceIndexSha256:cut.source.indexSha256,root:cut.root.route};
   }catch(error){if(!live())return;captionState={status:'error',error:error.message};view.setCaptionError?.(error.message,()=>annotateConstructions(view,model,cut,signal));}
  }
  async function selectPagedConstruction(model,route,pending,showType,signal,requireConstruction=true,current=()=>true){
   const epoch=++constructionSelection,live=()=>!disposed&&!signal.aborted&&epoch===constructionSelection&&(requireConstruction?constructionMode:!constructionMode)&&current();
   try{const snapshot=await model.sourcePoint(route,{signal});if(!live())return;let session=null;
    if(typeof pending==='function'){inspect(snapshot.point,null,snapshot.data,!requireConstruction);session=await pending();}
    else session=pending;
    if(!live()){if(session?.cursor){session.cursor.dispose();constructionRegistry?.releaseType(session.cursor);}return;}
    if(session){session={...session,construction:true};inspect(snapshot.point,session,snapshot.data,!requireConstruction);}else inspect(snapshot.point,null,snapshot.data,!requireConstruction);
    if(showType&&session){const serial=inspection;await component('ProofAtlasCompactTypeView','/public/js/proof-atlas-compact-type-view.js?v=5');if(!live()||serial!==inspection)return;typeView=host.ProofAtlasCompactTypeView.mountPaged(typeHost,session.cursor,session.observation,sourceCursor,r=>safe(()=>navigate(r)));const toggle=panel.querySelector('[data-show-recorded-type]');if(toggle){toggle.textContent='Hide recorded type';toggle.setAttribute('aria-expanded','true');}}
    if(live()&&session)status.textContent='Recorded '+(requireConstruction?'construction ':'source ')+session.observation.role+' observation in its original source context.';
    if(live()&&showType&&session)return typeView;
   }catch(error){if(live()){pagedError=error.message;status.textContent='Construction observation unavailable: '+error.message;}}
  }
  async function renderLocalDefinitions(){
   retireSyntaxAnnotations();constructionCountTargets=null;
   const mixed=constructionInterfaces,title=mixed?'Context interfaces':'Local-definition interfaces';
   const epoch=++constructionRender;constructionSelection++;constructionRenderController?.abort();constructionRenderController=new AbortController();const signal=constructionRenderController.signal;
   constructionView?.dispose();constructionView=null;definitionModel=null;constructionPresentation=null;captionPresentation=null;captionState={status:'idle'};
   if(!constructionMode||!constructionModel||!scene){viewport.hidden=false;summary.hidden=false;constructionHost.hidden=true;redrawSourcePaths?.();if(!constructionMode)refreshSyntaxCounts();return;}
   modeControls();initialConstructionFocus=false;const sourceScene=scene,live=()=>!disposed&&!signal.aborted&&epoch===constructionRender&&constructionMode&&(mixed?constructionInterfaces:constructionDefinitions)&&constructionInterfaces===mixed&&scene===sourceScene;
   status.textContent='Loading '+title.toLowerCase()+' from recorded source and type components…';
   try{
    const registry=await pagedConstructionRegistry();if(!live())return;
    if(!registry)throw Error('No construction profile for this declaration');
    await component('ProofAtlasRecordedCaptions','/public/js/proof-atlas-recorded-captions.js?v=1');
    await component(mixed?'ProofAtlasMixedInterfaceView':'ProofAtlasLocalDefinitionView',mixed?'/public/js/proof-atlas-mixed-interface-view.js?v=3':'/public/js/proof-atlas-local-definition-view.js?v=2');if(!live())return;
    let model;
    if(paged){
     await component('ProofAtlasCursorContextFrame','/public/js/proof-atlas-cursor-context-frame.js?v=1');
     await component('ProofAtlasCursorLocalDefinitions','/public/js/proof-atlas-cursor-local-definitions.js?v=1');if(!live())return;
     if(mixed)await component('ProofAtlasCursorMixedInterfaces','/public/js/proof-atlas-cursor-mixed-interfaces.js?v=1');if(!live())return;
     model=(mixed?host.ProofAtlasCursorMixedInterfaces:host.ProofAtlasCursorLocalDefinitions).open(sourceCursor,registry,record,edition.id);
    }else{
     await component('ProofAtlasOccurrenceContextFrame','/public/js/proof-atlas-occurrence-context-frame.js?v=1');
     await component('ProofAtlasLocalDefinitionUnit','/public/js/proof-atlas-local-definition-unit.js?v=1');
     await component(mixed?'ProofAtlasMixedInterfaces':'ProofAtlasLocalDefinitionFrame',mixed?'/public/js/proof-atlas-mixed-interfaces.js?v=1':'/public/js/proof-atlas-local-definition-frame.js?v=1');if(!live())return;
     const captions={create:async entry=>{const row=await registry.lookup(entry.route,{signal});if(!row?.construction)throw Error('No caption origin for this local definition');return registry.captionsFor(row,{signal});}};
     model=(mixed?host.ProofAtlasMixedInterfaces:host.ProofAtlasLocalDefinitionFrame).open(nativeCase,captions,edition.id);
    }
    const cut=await model.create(sourceScene.root.route,{maxUnits:Number(frameBudget.value),signal});if(!live())return;
    const adapter={...model,typeFor:(value,address,observation='kernel')=>model.typeFor(value,address,observation,{signal})};
    const onSelect=async(route,pending)=>{if(paged)return selectPagedConstruction(model,route,pending,false,signal);const serial=++constructionSelection;inspect(sourcePoint(route));if(!pending)return;try{const entry=await pending;if(live()&&serial===constructionSelection){rememberType(entry);inspect(sourcePoint(route),entry);}}catch(error){if(live()&&serial===constructionSelection)status.textContent=error.message;}};
    const onType=async(route,entry,typeRoute)=>{if(paged){const view=await selectPagedConstruction(model,route,entry,true,signal);if(typeRoute&&live())view?.focus(typeRoute);return;}const serial=++constructionSelection;rememberType(entry);inspect(sourcePoint(route),entry);const selectedAt=inspection;try{await component('ProofAtlasCompactTypeView','/public/js/proof-atlas-compact-type-view.js?v=5');if(!live()||serial!==constructionSelection||selectedAt!==inspection)return;typeView=host.ProofAtlasCompactTypeView.mount(typeHost,entry,data,r=>safe(()=>navigate(r)));if(typeRoute)typeView.focus(typeRoute);const toggle=panel.querySelector('[data-show-recorded-type]');if(toggle){toggle.textContent='Hide recorded type';toggle.setAttribute('aria-expanded','true');}}catch(error){if(live())status.textContent=error.message;}};
    const checkUse=async ref=>{const U=host.ProofAtlasVariableUses,point=paged?(await model.sourcePoint(ref.use.route,{signal})).point:sourcePoint(ref.use.route);U.verifySource(ref,point,cut.source);return point;};
    const useCallbacks=mixed?{
     loadUses:async useSignal=>{
      const combined=host.AbortSignal.any([signal,useSignal]);
      await component('ProofAtlasVariableUses','/public/js/proof-atlas-variable-uses.js?v=2');await component('ProofAtlasVariableUseView','/public/js/proof-atlas-variable-use-view.js?v=3');await component('PROOF_ATLAS_VARIABLE_USES','/public/data/proof-atlas/variable-uses-manifest.js?v=1');
      if(!live())throw Error('Context frame changed');const inventory=host.PROOF_ATLAS_VARIABLE_USES;
      if(inventory?.format!=='ProofAtlasVariableUseInventory/1'||!Array.isArray(inventory.records)||inventory.records.length>512){delete host.PROOF_ATLAS_VARIABLE_USES;throw Error('Invalid variable-use inventory');}
      const d=inventory.records.find(d=>d.name===record.name&&d.edition===edition.id&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256);if(!d)throw Error('No recorded-use profile for this declaration');
      const source=Object.fromEntries(['name','edition','indexSha256','sourceGraphSha256'].map(k=>[k,cut.source[k]])),provider=await host.ProofAtlasVariableUses.open(d,source,{signal:combined});if(!live()){provider.dispose();throw Error('Context frame changed');}return provider;
     },
     onUseSource:async(ref,current)=>{await checkUse(ref);if(live()&&current())await onSelect(ref.use.route,null);},
     onUseBinder:async(ref,current)=>{const route=ref.use.binder.route,point=paged?(await model.sourcePoint(route,{signal})).point:sourcePoint(route);if(point.node!==ref.use.binder.node||point.scopeDepth!==ref.use.binder.contextLength)throw Error('Original binder differs');if(live()&&current())await onSelect(route,null);},
     typeForUse:async(ref,choice,current)=>{
      const valid=()=>{if(!live()||!current())throw Error('Recorded-use selection changed');};await checkUse(ref);valid();const o=ref.use.observations[choice];if(!o)throw Error('No selected native observation');let entry;
      if(paged){const row=await registry.lookup(o.owner.route,{signal});valid();if(!row)throw Error('No original recording owner');entry=await registry.typeFor(row,o.field,'kernel',{signal});}
      else{const owner=nativeCase.get(o.owner.route);if(!owner)throw Error('No original recording owner');entry=o.field==='recorded'?owner:await host.ProofAtlasDeepContext.constructionType(owner,data,o.field);}
      try{valid();host.ProofAtlasVariableUses.verifyObservation(ref,choice,entry);return entry;}catch(error){model.releaseType?.(entry);throw error;}
     }
    }:{};
    constructionView=(mixed?host.ProofAtlasMixedInterfaceView:host.ProofAtlasLocalDefinitionView).mount(constructionHost,adapter,null,cut,{
     ...useCallbacks,lazyTypes:paged,onSelect,onType,onSource:route=>safe(()=>navigate(route)),onRender:()=>queueMicrotask(()=>{if(live()&&constructionView?.getScene()===cut){constructionCountTargets={source:cut.source,items:cut.units.map((u,i)=>({route:u.root.route,holder:constructionHost.querySelector('[data-definition-unit="'+i+'"] .pdu-binding')})),pointFor:async(route,s)=>paged?model.sourcePoint(route,{signal:s}):{point:sourcePoint(route)}};refreshSyntaxCounts();}}),
     onOriginalSource:route=>safe(async()=>{await setConstructionMode(false);await navigate(route);}),
     onTypeStart:()=>{constructionSelection++;inspection++;pagedController?.abort();pagedSession?.cursor.dispose();pagedSession=null;registry.releaseType();selectedTyping=null;pagedPending=false;typeView?.dispose();typeView=null;typeHost.hidden=true;typeHost.replaceChildren();}
    });
    definitionModel=model;constructionView.setScale(scale);viewport.hidden=true;summary.hidden=true;constructionHost.hidden=false;constructionView.select(selected?.route||scene.root.route);
    captionState={status:'ready',shown:4*cut.units.length,sourceHeaders:cut.units.length,inferredTypes:3*cut.units.length,decodedBytes:new TextEncoder().encode(JSON.stringify(cut)).length,byteLimit:524288,sourceIndexSha256:cut.source.indexSha256,root:cut.root.route};
    constructionError=null;subtitle.textContent=title+' · '+(edition.label||edition.id);status.textContent=mixed?'Recorded context interfaces and actual body joins. Expected expressions retain separate origins.':'Recorded local definitions and exact body joins. Source and type origins remain separately selectable.';
   }catch(error){if(!live())return;constructionError=error.message;constructionHost.hidden=false;constructionHost.replaceChildren(el('p',title+' unavailable: '+error.message),button(mixed?'Retry context interfaces':'Retry local definitions',()=>safe(()=>renderLocalDefinitions())));viewport.hidden=false;summary.hidden=false;status.textContent='Local-definition evidence is unavailable here; original source fields remain available.';}
  }
  async function renderPagedConstructions(){
   if(constructionDefinitions||constructionInterfaces)return renderLocalDefinitions();definitionModel=null;
   const epoch=++constructionRender;constructionSelection++;constructionRenderController?.abort();constructionRenderController=new AbortController();const signal=constructionRenderController.signal;
   constructionView?.dispose();constructionView=null;constructionPresentation=null;captionPresentation=null;captionState={status:"idle"};
   if(!constructionMode||!constructionModel||!scene){viewport.hidden=false;summary.hidden=false;constructionHost.hidden=true;redrawSourcePaths?.();if(!constructionMode)refreshSyntaxCounts();return;}
   modeControls();let model=constructionModel;const sourceScene=scene,live=()=>!disposed&&!signal.aborted&&epoch===constructionRender&&constructionMode&&scene===sourceScene;
   status.textContent='Loading bounded construction interfaces…';
   try{
    if(initialConstructionFocus){initialConstructionFocus=false;const current=await constructionRegistry.lookup(sourceScene.root.route,{signal});if(!live())return;if(!current?.construction&&constructionRegistry.manifest.firstConstruction){const first=await constructionRegistry.lookup(constructionRegistry.manifest.firstConstruction,{signal});if(!first?.construction)throw Error('Initial construction is not in the sparse profile');if(!live())return;await navigate(constructionRegistry.manifest.firstConstruction,true,true);return;}}
    let canFrame=false;
    if(constructionFramed){const row=await constructionRegistry.lookup(sourceScene.root.route,{signal});if(!live())return;canFrame=['Pi-introduction','let-binding'].includes(row?.construction?.rule);if(canFrame){await component('ProofAtlasCursorContextFrame','/public/js/proof-atlas-cursor-context-frame.js?v=1');await component('ProofAtlasOccurrenceContextFrameView','/public/js/proof-atlas-occurrence-context-frame-view.js?v=4');if(!live())return;model=host.ProofAtlasCursorContextFrame.open(sourceCursor,constructionRegistry);}}
    const cut=await model.create(sourceScene.root.route,canFrame?{maxMembers:Number(frameBudget.value),signal}:{maxNodes:Number(nodeBudget.value),maxDepth:Number(depth.value),signal}),labels=await model.presentation(cut,{signal});if(!live())return;constructionPresentation=labels;
    const adapter={...model,typeFor:(cut,id,observation='kernel')=>model.typeFor(cut,id,observation,{signal})};
    constructionView=(canFrame?host.ProofAtlasOccurrenceContextFrameView:host.ProofAtlasOccurrenceConstructionView).mount(constructionHost,adapter,null,cut,{
     lazyTypes:true,onSource:route=>safe(()=>navigate(route)),
     onSelect:(route,pending)=>selectPagedConstruction(model,route,pending,false,signal),
     onTypeStart:()=>{constructionSelection++;inspection++;pagedController?.abort();pagedSession?.cursor.dispose();pagedSession=null;constructionRegistry.releaseType();selectedTyping=null;pagedPending=false;typeView?.dispose();typeView=null;typeHost.hidden=true;typeHost.replaceChildren();status.textContent='Loading the selected construction type…';},
     onType:(route,session)=>selectPagedConstruction(model,route,session,true,signal)
    },labels);
    constructionView.setScale(scale);viewport.hidden=true;summary.hidden=true;constructionHost.hidden=false;constructionView.select(selected?.route||scene.root.route);annotateConstructions(constructionView,model,cut,signal);subtitle.textContent=(canFrame?'Recorded context frame · ':'Recorded construction geometry · ')+(edition.label||edition.id);if(constructionFramed&&!canFrame)constructionHost.prepend(el('p','No recorded context chain at this exact occurrence. The available construction cut is shown.','pow-status'));constructionError=null;status.textContent='Bounded native constructions in their original source context. Unrecorded positions remain boundaries.';
   }catch(error){if(!live())return;constructionError=error.message;constructionHost.hidden=false;constructionHost.replaceChildren(el('p','Construction view unavailable: '+error.message),button('Retry construction view',()=>safe(()=>renderPagedConstructions())));viewport.hidden=false;summary.hidden=false;status.textContent='Construction evidence unavailable; original source fields remain available.';}
  }
  async function setPagedConstructionMode(enabled){
   const activation=++constructionActivation;constructionMode=enabled;constructionError=null;constructionGrouped=false;modeControls();
   if(!enabled){renderPagedConstructions();if(scene)writeAddress(scene.root.route,true);return;}
   constructionButton.disabled=true;status.textContent='Loading the sparse construction profile…';
   try{const registry=await pagedConstructionRegistry();if(disposed||activation!==constructionActivation||!constructionMode)return;await component('ProofAtlasOccurrenceConstructionView','/public/js/proof-atlas-occurrence-construction-view.js?v=5');if(disposed||activation!==constructionActivation||!constructionMode)return;constructionModel=host.ProofAtlasCursorConstructions.open(sourceCursor,registry);await renderPagedConstructions();if(!disposed&&activation===constructionActivation&&scene)writeAddress(scene.root.route,true);}
   catch(error){if(disposed||activation!==constructionActivation)return;constructionRegistry?.dispose();constructionRegistry=null;constructionRegistryLoad=null;constructionModel=null;constructionError=error.message;constructionMode=false;modeControls();renderPagedConstructions();status.textContent='Sparse constructions unavailable: '+error.message+'. Source fields and recorded types remain available.';}
   finally{if(!disposed&&activation===constructionActivation)constructionButton.disabled=false;}
  }
  function renderConstructions(){
   if(constructionDefinitions||constructionInterfaces)return renderLocalDefinitions();definitionModel=null;
   if(paged){renderPagedConstructions();return;}
   constructionRenderController?.abort();constructionRenderController=new AbortController();const signal=constructionRenderController.signal;captionPresentation=null;captionState={status:"idle"};
   constructionSelection++;constructionView?.dispose();constructionView=null;
   if(!constructionMode||!constructionModel||!scene){viewport.hidden=false;summary.hidden=false;constructionHost.hidden=true;redrawSourcePaths?.();if(!constructionMode)refreshSyntaxCounts();return;}
   modeControls();const rule=nativeCase.get(scene.root.route),canFrame=constructionFramed&&rule&&['Pi-introduction','let-binding'].includes(host.ProofAtlasDeepContext.construction(rule,data)?.rule);
   const model=canFrame?constructionModel:constructionFramed?host.ProofAtlasOccurrenceConstructions.open(nativeCase):constructionModel;
   const cut=model.create(scene.root.route,canFrame?{maxMembers:Number(frameBudget.value)}:{maxNodes:Number(nodeBudget.value),maxDepth:Number(depth.value)});
   constructionView=(canFrame?host.ProofAtlasOccurrenceContextFrameView:host.ProofAtlasOccurrenceConstructionView).mount(constructionHost,model,data,cut,{
    onSource:route=>safe(()=>navigate(route)),
    onSelect:async(route,pending)=>{const epoch=++constructionSelection;inspect(sourcePoint(route));if(!pending)return;try{const entry=await pending;if(disposed||epoch!==constructionSelection||!constructionMode)return;rememberType(entry);inspect(sourcePoint(route),entry);}catch(error){if(epoch===constructionSelection)status.textContent=error.message;}},
    onType:async(route,entry)=>{const epoch=++constructionSelection;rememberType(entry);inspect(sourcePoint(route),entry);const serial=inspection;try{await component('ProofAtlasCompactTypeView','/public/js/proof-atlas-compact-type-view.js?v=5');if(disposed||epoch!==constructionSelection||serial!==inspection)return;typeView=host.ProofAtlasCompactTypeView.mount(typeHost,entry,data,r=>safe(()=>navigate(r)));const toggle=panel.querySelector('[data-show-recorded-type]');if(toggle){toggle.textContent='Hide recorded type';toggle.setAttribute('aria-expanded','true');}}catch(error){if(epoch===constructionSelection)status.textContent=error.message;}}
   });
   constructionView.setScale(scale);viewport.hidden=true;summary.hidden=true;constructionHost.hidden=false;constructionView.select(selected?.route||scene.root.route);annotateConstructions(constructionView,model,cut,signal);
   if(constructionFramed&&!canFrame)constructionHost.prepend(el('p','No recorded context chain at this exact occurrence. The available construction cut is shown.','pow-status'));
   subtitle.textContent=(canFrame?'Recorded context frame · ':'Recorded construction geometry · ')+(nativeControl?'synthetic core control':(edition.label||edition.id));
  }
  async function setConstructionMode(enabled){
   retireConstructionView();
   if(paged)return setPagedConstructionMode(enabled);
   const activation=++constructionActivation;constructionMode=enabled;constructionError=null;groupingError=null;modeControls();
   if(!enabled){constructionRenderController?.abort();captionPresentation=null;captionState={status:"idle"};constructionButton.disabled=paged;constructionSelection++;constructionView?.dispose();constructionView=null;constructionHost.hidden=true;viewport.hidden=false;summary.hidden=false;redrawSourcePaths?.();subtitle.textContent=nativeControl?'Synthetic core control · selected native records':control?'Serialized syntax control · original producer made no typing claim':'Source occurrence geometry · '+(edition.label||edition.id);status.textContent='Original occurrence structure. Native records retain their exact source positions.';if(scene)writeAddress(scene.root.route,true);refreshSyntaxCounts();return;}
   constructionButton.disabled=true;status.textContent='Loading recorded construction interfaces…';
   try{
    if(!nativePackage)await loadTyping();if(disposed||!constructionMode||activation!==constructionActivation)return;
    if(!nativeCase)throw Error('No native record package is available for this declaration');
    await loadLetTyping();if(disposed||!constructionMode||activation!==constructionActivation)return;
    if(nativeControl&&controlConstructionError){nativePackage=host.ProofAtlasDeepContext.mergeControls(nativePackage,await constructionSupplement());nativeCase=nativePackage.case(record.name);controlConstructionError=null;const choice=root.querySelector('[data-native-control-choice]');if(choice){choice.replaceChildren(...nativePackage.cases.map(c=>{const option=el('option',c.name);option.value=c.name;return option;}));choice.value=record.name;}}
    constructionScripts??=(async()=>{await component('ProofAtlasOccurrenceConstructions','/public/js/proof-atlas-occurrence-constructions.js?v=2');await component('ProofAtlasOccurrenceConstructionView','/public/js/proof-atlas-occurrence-construction-view.js?v=5');})();
    await constructionScripts;if(disposed||!constructionMode||activation!==constructionActivation)return;
    if(constructionFramed){try{await component('ProofAtlasOccurrenceContextFrame','/public/js/proof-atlas-occurrence-context-frame.js?v=1');await component('ProofAtlasOccurrenceContextFrameView','/public/js/proof-atlas-occurrence-context-frame-view.js?v=4');}catch(error){if(disposed||!constructionMode||activation!==constructionActivation)return;constructionFramed=false;groupingError='Context frames unavailable: '+error.message;modeControls();}}
    if(constructionGrouped){try{await component('ProofAtlasOccurrenceApplicationFold','/public/js/proof-atlas-occurrence-application-fold.js?v=2');}catch(error){if(disposed||!constructionMode||activation!==constructionActivation)return;constructionGrouped=false;groupingError=error.message;modeControls();}}
    if(disposed||!constructionMode||activation!==constructionActivation)return;constructionModel=(constructionFramed?host.ProofAtlasOccurrenceContextFrame:constructionGrouped?host.ProofAtlasOccurrenceApplicationFold:host.ProofAtlasOccurrenceConstructions).open(nativeCase);
    if(initialConstructionFocus){initialConstructionFocus=false;const current=nativeCase.get(scene.root.route);if(!current||!host.ProofAtlasDeepContext.construction(current,data)){const first=nativeCase.entries.find(e=>host.ProofAtlasDeepContext.construction(e,data));if(first)navigate(first.route,true,true);}}
    renderConstructions();if(scene)writeAddress(scene.root.route,true);
    status.textContent=groupingError?'Grouping unavailable: '+groupingError+'. Individual recorded stages remain available.':'Recorded constructions in their original source context. '+(letSupplementError?'Local definitions unavailable: '+letSupplementError+'. ':'')+'Unrecorded positions remain boundaries.';
   }catch(error){if(disposed||activation!==constructionActivation)return;constructionScripts=null;constructionError=error.message;constructionMode=false;modeControls();renderConstructions();status.textContent='Construction view unavailable: '+error.message+'. Source structure and existing native types remain available.';}
   finally{if(activation===constructionActivation)constructionButton.disabled=false;}
  }
  function retireSourceUses(){
   sourceUseEpoch++;sourceUseAction++;sourceUseController?.abort();sourceUseController=null;
   sourceUseView?.clearSelection();sourceUseView?.dispose();sourceUseView=null;sourceUseLoading=false;sourceUseError=null;modeControls();
  }
  async function toggleSourceUses(){
   if(sourceUseView){retireSourceUses();return;}
   if(disposed||constructionMode||!scene||sourceUseLoading)return;
   const cut=scene,layout=sourceUseLayout,epoch=++sourceUseEpoch;sourceUseAction++;sourceUseLoading=true;sourceUseError=null;
   sourceUseController?.abort();sourceUseController=new AbortController();const signal=AbortSignal.any([nativeController.signal,sourceUseController.signal]);
   const live=()=>!disposed&&!signal.aborted&&epoch===sourceUseEpoch&&!constructionMode&&scene===cut;
   const current=action=>live()&&action===sourceUseAction;
   modeControls();let provider=null;
   try{
    await component('ProofAtlasVariableUses','/public/js/proof-atlas-variable-uses.js?v=2');await component('ProofAtlasVariableUseView','/public/js/proof-atlas-variable-use-view.js?v=3');await component('PROOF_ATLAS_VARIABLE_USES','/public/data/proof-atlas/variable-uses-manifest.js?v=1');if(!live())return;
    const inventory=host.PROOF_ATLAS_VARIABLE_USES;
    if(inventory?.format!=='ProofAtlasVariableUseInventory/1'||!Array.isArray(inventory.records)||inventory.records.length>512){delete host.PROOF_ATLAS_VARIABLE_USES;throw Error('Invalid variable-use inventory');}
    const descriptor=inventory.records.find(d=>d.name===record.name&&d.edition===edition.id&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256);
    if(!descriptor)throw Error('No recorded variable-use profile for this declaration; its source graph remains available');
    const registry=await pagedConstructionRegistry();if(!live())return;
    const identity=host.ProofAtlasConstructionPages.identity(registry),source=Object.fromEntries(['name','edition','indexSha256','sourceGraphSha256'].map(k=>[k,k==='edition'?edition.id:identity[k]]));
    let model;
    if(paged)model=host.ProofAtlasCursorConstructions.open(sourceCursor,registry);
    else{await loadTyping();if(!live())return;await loadLetTyping();if(!live())return;if(!nativeCase)throw Error(nativeError||'Original native recording is unavailable');const actual=host.ProofAtlasDeepContext.sourceIdentity(data,record);if(['name','indexSha256','sourceGraphSha256'].some(k=>actual[k]!==source[k]))throw Error('Original source identity differs');model={sourcePoint:async route=>({point:sourcePoint(route),data})};}
    provider=await host.ProofAtlasVariableUses.open(descriptor,source,{signal});if(!live()){provider.dispose();return;}
    const U=host.ProofAtlasVariableUses;
    async function usePoint(ref,action){const snapshot=await model.sourcePoint(ref.use.route,{signal});if(!current(action))throw Error('Recorded-use selection changed');U.verifySource(ref,snapshot.point,source);return snapshot;}
    const clearType=()=>{constructionSelection++;inspection++;pagedController?.abort();pagedSession?.cursor.dispose();pagedSession=null;registry.releaseType();selectedTyping=null;pagedPending=false;typeView?.dispose();typeView=null;typeHost.hidden=true;typeHost.replaceChildren();};
    const callbacks={onPick:()=>{sourceUseAction++;},onReset:()=>{sourceUseAction++;},
     onSource:async ref=>{const action=sourceUseAction,snapshot=await usePoint(ref,action);if(current(action))inspect(snapshot.point,null,snapshot.data,true);},
     onBinder:async ref=>{const action=sourceUseAction;await usePoint(ref,action);const snapshot=await model.sourcePoint(ref.use.binder.route,{signal});if(!current(action))return;if(snapshot.point.node!==ref.use.binder.node||snapshot.point.scopeDepth!==ref.use.binder.contextLength)throw Error('Original binder differs');inspect(snapshot.point,null,snapshot.data,true);},
     onType:async(ref,choice)=>{
      const action=sourceUseAction;clearType();await usePoint(ref,action);const o=ref.use.observations[choice];if(!o)throw Error('No selected native observation');let entry;
      if(paged){const row=await registry.lookup(o.owner.route,{signal});if(!current(action))return;if(!row)throw Error('No original recording owner');entry=await registry.typeFor(row,o.field,'kernel',{signal});}
      else{const owner=nativeCase.get(o.owner.route);if(!owner)throw Error('No original recording owner');entry=o.field==='recorded'?owner:await host.ProofAtlasDeepContext.constructionType(owner,data,o.field);}
      if(!current(action)){if(paged)registry.releaseType(entry?.cursor);return;}
      try{U.verifyObservation(ref,choice,entry);}catch(error){if(paged)registry.releaseType(entry?.cursor);throw error;}
      if(paged){await selectPagedConstruction(model,ref.use.route,entry,true,signal,false,()=>current(action));return;}
      rememberType(entry);inspect(sourcePoint(ref.use.route),entry,null,true);const serial=inspection;await component('ProofAtlasCompactTypeView','/public/js/proof-atlas-compact-type-view.js?v=5');if(!current(action)||serial!==inspection)return;
      typeView=host.ProofAtlasCompactTypeView.mount(typeHost,entry,data,r=>safe(()=>navigate(r)));const toggle=panel.querySelector('[data-show-recorded-type]');if(toggle){toggle.textContent='Hide recorded type';toggle.setAttribute('aria-expanded','true');}
     },onFocus:route=>safe(()=>navigate(route))};
    sourceUseView=host.ProofAtlasVariableUseView.mount(typeHost.parentElement,stage,cut,provider,callbacks,layout);provider=null;
    await sourceUseView.setFilter(null);if(live())status.textContent='Recorded variable uses reference original source binders. The source cut and its accounting are unchanged.';
   }catch(error){provider?.dispose();if(live()){sourceUseError=error.message;status.textContent='Recorded uses unavailable: '+error.message+'. Source fields and existing recorded types remain available.';}}
   finally{if(live()){sourceUseLoading=false;modeControls();}}
  }
  function draw(next){
   retireSyntaxAnnotations();
   retireSourceUses();
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
   external.forEach((ref,i)=>{const pos={x:20+cols*330,y:20+i*180},card=el('article',undefined,'pow-context-card'),payload=(displayData||data).payloads[ref.node],kind=W.kinds[(displayData||data).kind[ref.node]];positions.set(ref.to,pos);card.style.left=pos.x+'px';card.style.top=pos.y+'px';card.append(el('small','CONTEXT · OUTSIDE THIS CUT'));const pick=button(kind+' '+(payload.binderName||payload.declName||'_')+' · e'+ref.node,()=>safe(()=>navigate(ref.route)));pick.dataset.contextReference=ref.to;card.append(pick,el('p','Original binder at depth '+ref.route.depth+'. Not included in the subtree count.'));stage.append(card);cards.set(ref.to,{card,pick});});
   function paths(){
    if(viewport.hidden||scene!==next)return;
    svg.replaceChildren();
    function line(from,to,control,cls,slot){const a=positions.get(from),b=positions.get(to),target=cards.get(to).pick,right=b.x>=a.x,s=stage.getBoundingClientRect(),factor=s.width/stageWidth,sourceBox=cards.get(from).card.getBoundingClientRect(),targetBox=cards.get(to).card.getBoundingClientRect(),c=control.getBoundingClientRect(),t=target.getBoundingClientRect(),sx=((right?sourceBox.right:sourceBox.left)-s.left)/factor,sy=(c.top+c.height/2-s.top)/factor,tx=((right?targetBox.left:targetBox.right)-s.left)/factor,ty=(t.top+t.height/2-s.top)/factor,p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d','M '+sx+' '+sy+' C '+(sx+(right?40:-40))+' '+sy+' '+(tx+(right?-40:40))+' '+ty+' '+tx+' '+ty);if(cls)p.classList.add(cls);p.dataset.relation=cls?'source-bound-to':'source-field';p.dataset.sourceFrom=from;p.dataset.sourceTo=to;if(slot!==undefined)p.dataset.slot=slot;svg.append(p);}
    for(const edge of scene.edges)line(edge.from,edge.to,cards.get(edge.from).ports[edge.slot],null,edge.slot);
    for(const binding of scene.links)line(binding.from,binding.to,cards.get(binding.from).binder,'pow-binding-edge');
    sourceUseView?.redraw();
   }
   for(const {card}of cards.values())card.addEventListener('scroll',paths);
   const baseWidth=stageWidth,baseHeight=stageHeight;
   const retainedBinders=scene.nodes.filter(n=>['lam','forallE','letE'].includes(n.kind)).map(n=>({root:{route:n.route,node:n.node},binding:{name:(displayData||data).payloads[n.node].binderName||(displayData||data).payloads[n.node].declName||'_'}}));
   const endpoint=ref=>{if(ref.sourceUseId)return cards.get(ref.sourceUseId)?.pick;for(const n of next.nodes){const port=n.ports.find(p=>W.id(p.route)===W.id(ref.region.route));if(port)return cards.get(n.id).ports[port.slot];}return null;};
   const target=ref=>cards.get(W.id(ref.use.binder.route))?.pick||null;
   sourceUseLayout={binders:retainedBinders,before:typeHost,binder:u=>cards.get(W.id(u.root.route)).card,endpoint,target,
    prepareTarget:node=>{node.style.position='absolute';node.style.left=baseWidth+'px';node.style.top='20px';node.style.width='245px';},
    showTarget:shown=>{if(scene!==next)return;stageWidth=baseWidth+(shown?330:0);stage.style.width=stageWidth+'px';scaled();},
    bindingEdge:ref=>[...svg.querySelectorAll('[data-relation="source-bound-to"]')].find(p=>p.dataset.sourceFrom===ref.existingBindingEdge?.from&&p.dataset.sourceTo===ref.existingBindingEdge?.to),
    reveal:(ref,mode)=>{const node=mode==='binder'?target(ref):endpoint(ref),card=node?.closest('.pow-card');if(card){const top=node.offsetTop,bottom=top+node.offsetHeight;if(top<card.scrollTop)card.scrollTop=top;if(bottom>card.scrollTop+card.clientHeight-8)card.scrollTop=Math.max(0,bottom-card.clientHeight+8);}paths();},
    dispose:()=>{if(scene===next){stageWidth=baseWidth;stageHeight=baseHeight;stage.style.width=stageWidth+'px';scaled();}}
   };
   sourceCountTargets={source:next.source,items:next.nodes.filter(n=>['lam','forallE','letE'].includes(n.kind)).map(n=>({point:n,route:n.route,holder:cards.get(n.id).card}))};redrawSourcePaths=paths;paths();document.fonts?.ready.then(()=>{if(scene===next&&!disposed)paths();});if(!constructionMode)refreshSyntaxCounts();
   summary.textContent=scene.stats.retained+' retained + '+shortCount(scene.stats.hidden)+' hidden = '+shortCount(scene.stats.represented)+' occurrences. '+external.length+' source-context cards lie outside this count.';
   inspect(scene.nodes[0]);scaled();viewport.scrollTo(0,0);status.textContent='Original occurrence structure. '+(nativeControl?'Synthetic core control; native typing is available only at recorded positions.':control?'Serialized syntax control; original producer typing is not claimed.':'Compiled declaration; mathematical interpretation and typing queries are separate.');if(constructionMode&&constructionModel)renderConstructions();
  }
  function retireConstructionView(){
   retireSyntaxAnnotations();constructionCountTargets=null;
   retireSourceUses();
   constructionRenderController?.abort();constructionRender++;constructionSelection++;
   constructionView?.dispose();constructionView=null;definitionModel=null;
   typeView?.dispose();typeView=null;typeHost.hidden=true;typeHost.replaceChildren();
   constructionRegistry?.releaseType();constructionHost.hidden=true;viewport.hidden=false;summary.hidden=false;redrawSourcePaths?.();
  }
  function safe(action){try{const result=action();if(result?.then)result.catch(error=>{status.textContent=error.message;});}catch(error){status.textContent=error.message;}}
  function navigate(route,write=true,replace=false){
   if(disposed)return;const hadFocus=root.contains(document.activeElement);retireConstructionView();
   if(paged){const epoch=++operation;constructionRenderController?.abort();constructionSelection++;navigationController?.abort();navigationController=new AbortController();root.setAttribute('aria-busy','true');status.textContent='Loading original source fields…';return sourceModel.create(route,{maxNodes:Number(nodeBudget.value),maxDepth:Number(depth.value),signal:navigationController.signal}).then(next=>{if(disposed||epoch!==operation)return;displayData=sourceModel.snapshot(next);draw(next);if(write)writeAddress(route,replace);}).catch(error=>{if(disposed||epoch!==operation)return;scene=null;selected=null;constructionView?.dispose();constructionView=null;constructionHost.hidden=true;constructionRegistry?.releaseType();pagedController?.abort();pagedSession?.cursor.dispose();pagedSession=null;typeView?.dispose();typeView=null;stage.replaceChildren();panel.replaceChildren(button('Retry source occurrence',()=>safe(()=>navigate(route,write,replace))));summary.textContent='';status.textContent='Source occurrence unavailable: '+error.message;}).finally(()=>{if(!disposed&&epoch===operation)root.setAttribute('aria-busy','false');});}
   operation++;if(write&&!replace)initialConstructionFocus=false;if(disposed)return;
   const next=W.create(data,record,route,{maxNodes:Number(nodeBudget.value),maxDepth:Number(depth.value)});
   if(disposed)return;draw(next);if(hadFocus)(constructionView?constructionHost.querySelector('[data-construction-point]'):stage.querySelector('[data-occurrence-node]'))?.focus({preventScroll:true});if(write)writeAddress(route,replace);
  }
  function fromLocation(){
   retireSyntaxAnnotations();
   operation++;
   try{const u=new URL(location.href);syntaxEnabled=u.searchParams.get('counts')==='syntax';constructionMode=u.searchParams.get('diagram')==='construction';constructionGrouped=!paged&&u.searchParams.get('group')==='applications';constructionFramed=u.searchParams.get('group')==='contexts';constructionDefinitions=u.searchParams.get('group')==='definitions';constructionInterfaces=u.searchParams.get('group')==='interfaces';frameBudget.value=['1','4','8','13','32','64'].includes(u.searchParams.get('members'))?u.searchParams.get('members'):'32';if(/^[0-6]$/.test(u.searchParams.get('levels')||''))depth.value=u.searchParams.get('levels');if(nativeCase)constructionModel=(constructionFramed?(host.ProofAtlasOccurrenceContextFrameView&&host.ProofAtlasOccurrenceContextFrame):constructionGrouped?host.ProofAtlasOccurrenceApplicationFold:host.ProofAtlasOccurrenceConstructions)?.open(nativeCase)||null;modeControls();if(!u.hash.startsWith('#occurrence='))throw Error('No original occurrence address in this link');const route=W.fromToken(record,u.hash.slice(12));navigate(route,false);if(constructionMode&&!constructionModel&&mounted)setConstructionMode(true);else if(!constructionMode)renderConstructions();}
   catch(error){scene=null;selected=null;constructionSelection++;constructionView?.dispose();constructionView=null;constructionHost.hidden=true;typeView?.dispose();typeView=null;typeHost.hidden=true;stage.replaceChildren();panel.replaceChildren();summary.textContent='';for(const b of tools.querySelectorAll('[data-window-parent],[data-window-root]'))b.disabled=true;status.textContent='Occurrence unavailable: '+error.message;}
  }
  try{
   if(paged&&initial.searchParams.has('control'))throw Error('This paged profile covers recorded project and publisher-attributed source declarations. Synthetic controls use the complete reader.');
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
    if(!paged&&record.uniqueNodes>P.limits.sourceNodes)throw Error('This occurrence profile supports at most '+P.limits.sourceNodes+' stored source nodes');
    if(paged){await component('PROOF_ATLAS_SOURCE_PAGES','/public/data/proof-atlas/source-pages-manifest.js?v=3');await component('ProofAtlasSourcePages','/public/js/proof-atlas-source-pages.js?v=3');await component('ProofAtlasCursorWindow','/public/js/proof-atlas-cursor-window.js?v=1');const descriptor=host.PROOF_ATLAS_SOURCE_PAGES?.records.find(d=>d.edition===edition.id&&d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256);if(!descriptor)throw Error('No paged source profile for this declaration');sourceCursor=await host.ProofAtlasSourcePages.open(descriptor,record,{signal:nativeController.signal});if(disposed){sourceCursor.dispose();sourceCursor=null;return;}sourceModel=host.ProofAtlasCursorWindow.open(sourceCursor);data=sourceCursor.data;constructionGrouped=false;}
    else{
    try{await component('ProofAtlasLibraryBytes','/public/js/proof-atlas-library-bytes.js?v=1');}catch(error){nativeError=error.message;}
    if(host.ProofAtlasLibraryBytes){sourceBytes=await host.ProofAtlasLibraryBytes.compressedBytes(record.indexFile,record.indexSha256,{maxBytes:67108864,signal:nativeController.signal});data=A.validateIndex(JSON.parse(new TextDecoder().decode(sourceBytes)),record);}
    else data=A.validateIndex(await A.compressed(record.indexFile,record.indexSha256,{maxBytes:67108864,signal:nativeController.signal}),record);
    }
   }
   if(!paged)W.validateSource(data,record);if(disposed)return;
   const header=el('header',undefined,'pow-header');title.textContent=record.name;subtitle.textContent=control?'Serialized syntax control · no kernel typing claim':'Source occurrence geometry · '+(edition.label||edition.id);
   header.append(el('p','PROOF ATLAS / OCCURRENCE GEOMETRY'),title,subtitle,link('Declaration library',backURL()),link(nativeControl?'Control and judgment packet ↓':'Original term packet ↓',record.indexFile),link('Native context controls (synthetic)','/projects/proof-atlas/library/?view=occurrence&control=checked-context&case=deep-reflexivity'));
   const loadingLink=link(paged?'Complete source and constructions':'Paged source, types and constructions',location.pathname);loadingLink.dataset.loadingSwitch='';header.append(loadingLink);
   if(nativeControl){const label=el('label','Native context control '),choice=el('select');choice.dataset.nativeControlChoice='';for(const c of nativePackage.cases){const option=el('option',c.name);option.value=c.name;choice.append(option);}choice.value=nativeCase.name;choice.onchange=()=>{const u=new URL(location.href);u.searchParams.set('case',choice.value);u.hash='';location.assign(u);};label.append(choice);header.append(label);}
   const countLabel=el('label','Source nodes ');countLabel.append(nodeBudget);const depthLabel=el('label','Levels ');depthLabel.append(depth);
   const jump=el('input');jump.type='number';jump.min='0';jump.max=String(record.uniqueNodes-1);jump.step='1';jump.setAttribute('aria-label','Stored source node number');jump.placeholder='Node number';jump.style.width='9rem';
   const jumpButton=button('Go to node',async()=>{const epoch=++operation;activeJump=epoch;root.setAttribute('aria-busy','true');status.textContent='Resolving a representative occurrence…';try{await new Promise(resolve=>requestAnimationFrame(resolve));if(disposed||epoch!==operation)return;if(jump.value.trim()==='')throw Error('Enter a stored source node number');representativeIndex??=W.representatives(data);navigate(representativeIndex.route(Number(jump.value)));}catch(error){status.textContent=error.message;}finally{if(activeJump===epoch){activeJump=null;root.setAttribute('aria-busy','false');}}});
   const parent=button('Parent occurrence',()=>safe(()=>navigate(P.prefix(scene.root.route,scene.root.route.depth-1)))),original=button('Original root',()=>safe(()=>navigate(P.encode(scene.root.route.root,[]))));parent.dataset.windowParent='';original.dataset.windowRoot='';
   tools.append(countLabel,depthLabel,button('−',()=>{scale=Math.max(.25,scale/1.25);scaled();}),button('+',()=>{scale=Math.min(2,scale*1.25);scaled();}),button('Reset zoom',()=>{scale=1;scaled();}),parent,original,jump,jumpButton);
   if(paged){jump.hidden=true;jumpButton.hidden=true;}
   tools.querySelectorAll('button')[0].setAttribute('aria-label','Zoom out');tools.querySelectorAll('button')[1].setAttribute('aria-label','Zoom in');
   const modes=el('div',undefined,'pow-tools');modes.setAttribute('role','group');modes.setAttribute('aria-label','Diagram representation');sourceButton=button('Source occurrences',()=>setConstructionMode(false));sourceButton.dataset.sourceMode='';constructionButton=button('Proof constructions',()=>setConstructionMode(true));constructionButton.dataset.constructionMode='';groupingControl=el('input');groupingControl.type='checkbox';groupingControl.dataset.constructionGroup='';groupingLabel=el('label');groupingLabel.append(groupingControl,document.createTextNode('Group applications'));groupingControl.onchange=()=>{constructionGrouped=groupingControl.checked;if(constructionGrouped){constructionFramed=false;constructionDefinitions=false;constructionInterfaces=false;}setConstructionMode(true);};frameControl=el('input');frameControl.type='checkbox';frameControl.dataset.constructionFrame='';frameLabel=el('label');frameLabel.append(frameControl,document.createTextNode('Context frame'));frameControl.onchange=()=>{constructionFramed=frameControl.checked;if(constructionFramed){constructionGrouped=false;constructionDefinitions=false;constructionInterfaces=false;}setConstructionMode(true);};frameBudget.onchange=()=>{if(scene)safe(()=>navigate(scene.root.route,true,true));};definitionControl=el('input');definitionControl.type='checkbox';definitionControl.dataset.definitionMode='';definitionLabel=el('label');definitionLabel.append(definitionControl,document.createTextNode('Typed interfaces'));definitionControl.onchange=()=>{constructionInterfaces=definitionControl.checked&&interfaceRules.value==='interfaces';constructionDefinitions=definitionControl.checked&&!constructionInterfaces;if(definitionControl.checked){constructionFramed=false;constructionGrouped=false;}setConstructionMode(true);};
   interfaceRules=el('select');interfaceRules.dataset.interfaceRules='';for(const[value,text]of [['interfaces','Introductions + definitions'],['definitions','Local definitions']]){const option=el('option',text);option.value=value;interfaceRules.append(option);}interfaceRules.value=constructionDefinitions?'definitions':'interfaces';interfaceRulesLabel=el('label','Interface rules ');interfaceRulesLabel.append(interfaceRules);interfaceRules.onchange=()=>{constructionInterfaces=interfaceRules.value==='interfaces';constructionDefinitions=!constructionInterfaces;constructionFramed=false;constructionGrouped=false;setConstructionMode(true);}
;syntaxToggle=el('input');syntaxToggle.type='checkbox';syntaxToggle.dataset.syntaxCounts='';syntaxLabel=el('label');syntaxLabel.append(syntaxToggle,document.createTextNode(' Syntax use counts'));syntaxToggle.onchange=()=>{syntaxEnabled=syntaxToggle.checked;const u=new URL(location.href);if(syntaxEnabled)u.searchParams.set('counts','syntax');else u.searchParams.delete('counts');history.replaceState({},'',u);refreshSyntaxCounts();};syntaxRetry=button('Retry syntax counts',()=>{syntaxProvider?.dispose();syntaxProvider=null;syntaxLoad=null;refreshSyntaxCounts();});syntaxRetry.dataset.syntaxCountRetry='';syntaxRetry.hidden=true;sourceUseButton=button('Recorded variable uses',()=>safe(toggleSourceUses));sourceUseButton.dataset.sourceUseActivate='';sourceUseButton.setAttribute('aria-expanded','false');modes.append(sourceButton,constructionButton,sourceUseButton,syntaxLabel,syntaxRetry,groupingLabel,frameLabel,definitionLabel,interfaceRulesLabel,frameBudgetLabel);tools.append(modes);if(paged){constructionButton.title='Bounded source, type and construction records';const complete=new URL(location.href);complete.searchParams.delete('loading');modes.append(link('Complete constructions',complete.pathname+complete.search+complete.hash),el('span','Paged source, types and recorded context frames. Grouped applications use the complete reader.','pow-help'));}modeControls();
   const help=el('p',paged?'Scroll or drag empty space to pan. Source fields and recorded positions use exact occurrence routes. Solid lines follow source fields; dashed lines reference binders.':'Scroll or drag empty space to pan. Solid lines follow source fields; dashed lines reference binders. A node number chooses one representative path; a shared node can have other uses.','pow-help'),layout=el('div',undefined,'pow-layout'),drawing=el('section');drawing.setAttribute('aria-label','Source occurrence diagram');drawing.append(tools,help,viewport,summary,constructionHost,typeHost);layout.append(drawing,panel);root.replaceChildren(header,status,layout);root.classList.add('pow-shell');
   nodeBudget.onchange=depth.onchange=()=>{if(!scene){status.textContent='Choose a source node or restore a valid occurrence link.';return;}safe(()=>navigate(scene.root.route,constructionMode&&constructionGrouped,true));};
   if(loadingLink){const target=new URL(location.href);if(paged){target.searchParams.delete('loading');target.searchParams.set('diagram','construction');}else target.searchParams.set('loading','paged');loadingLink.href=target.pathname+target.search+target.hash;}
   if(location.hash)fromLocation();else{const body=data.declaration.rootPaths.indexOf('root.value');navigate(P.encode(body<0?0:body,[]),true,true);}
   if(constructionMode&&!constructionModel)await setConstructionMode(true);
   let drag=null;viewport.addEventListener('pointerdown',event=>{if(event.target.closest('.pow-card,button,a,input,select'))return;drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);});viewport.addEventListener('pointermove',event=>{if(drag)viewport.scrollTo(drag.left+drag.x-event.clientX,drag.top+drag.y-event.clientY);});viewport.addEventListener('pointerup',()=>{drag=null;});viewport.addEventListener('pointercancel',()=>{drag=null;});
   host.addEventListener('popstate',fromLocation);host.addEventListener('hashchange',fromLocation);
   const api={getSnapshot:()=>{if(!selected||!scene)return null;const q=selectedTyping;return {source:scene.source,namespace:scene.namespace,category:scene.root.category,node:selected.node,route:selected.route,scopeDepth:selected.scopeDepth,binding:selected.binding,typing:q?'checked-native-record':'not-queried',...(q?{native:{role:q.role,evidenceSha256:q.evidenceSha256,...(paged?q.origin:host.ProofAtlasDeepContext.typeIdentity(q)),contextLength:q.contextLength,...(q.recording?{recording:q.recording}:{})}}:{})};},getScene:()=>scene,getResidency:()=>retiredResidency|| (paged?{disposed,display:scene?sourceModel.state(scene):null,source:sourceCursor?.state(),query:queryRegistry?.state(),construction:constructionRegistry?.state(),constructionPresentation:constructionPresentation?{decodedBytes:constructionPresentation.decodedBytes,byteLimit:constructionPresentation.byteLimit}:null,type:pagedSession?.cursor.state()||null,activeTypeTables:pagedSession?1:0}:null),getNativeState:()=>paged?({loaded:!!queryRegistry||!!constructionRegistry,pending:pagedPending,matched:!!pagedSession,error:pagedError,missingProfile:queryMissing}):({loaded:!!nativePackage,pending:!!nativeLoad&&!nativePackage,matched:!!nativeCase,error:nativeError,...(nativeCase?.stats?{inventory:nativeCase.stats}:{})}),getConstructionScene:()=>constructionView?.getScene()||null,getConstructionState:()=>({enabled:constructionMode,grouped:constructionGrouped,framed:constructionFramed,definitions:constructionDefinitions,interfaces:constructionInterfaces,ready:!!constructionView,error:constructionError,groupingError,localDefinitions:paged?{loaded:constructionRegistry?.manifest.version===2,queries:null,scope:'Sparse recorded local definitions; reduced pools are not loaded'}:{loaded:letSupplemented&&!!(letUnionQueries??nativeCase?.stats?.supplementalLetQueries),queries:(letUnionQueries??nativeCase?.stats?.supplementalLetQueries)||0,error:letSupplementError}}),getDefinitionSelection:()=>constructionDefinitions?constructionView?.getSelection?.()||null:null,getDefinitionState:()=>({enabled:constructionDefinitions,ready:constructionDefinitions&&constructionView?.getScene()?.format==='ProofAtlasLocalDefinitionFramePrototype/1',model:definitionModel?.state?.()||null}),getVariableUseState:()=>constructionInterfaces?constructionView?.getVariableUseState?.()||null:null,getSourceVariableUseState:()=>({enabled:!!sourceUseView,loading:sourceUseLoading,error:sourceUseError,...(sourceUseView?.getState()||{})}),getInterfaceSelection:()=>constructionInterfaces?constructionView?.getSelection?.()||null:null,getInterfaceState:()=>({enabled:constructionInterfaces,ready:constructionInterfaces&&constructionView?.getScene()?.format==='ProofAtlasMixedInterfaceFramePrototype/1',model:definitionModel?.state?.()||null}),getSyntaxCountState:()=>({enabled:syntaxEnabled,...syntaxState,residency:syntaxProvider?.state()||null}),getCaptionState:()=>({...captionState}),getTypeScene:()=>typeView?.getScene()||null,getTypeSnapshot:()=>typeView?.getSnapshot()||null,getIndexState:()=>representativeIndex?.state||null,focus:route=>navigate(route),dispose};
   mounted=true;host.ProofAtlasOccurrenceView=api;return api;
  }catch(error){if(!disposed){status.textContent='Occurrence view unavailable: '+error.message;root.append(link('Open declaration library',backURL()));}}
  finally{if(!disposed)root.setAttribute('aria-busy','false');}
 }
 host.ProofAtlasOccurrenceWindowView={mount};
})(typeof window==='undefined'?globalThis:window);
