/* Every compiled local declaration and proof is reachable. Canvas collapse is visual only. */
(async function(){
 'use strict';
 const lib=window.PROOF_ATLAS_LIBRARY,A=window.ProofAtlasLibraryData,$=id=>document.getElementById(id);
 if(!$('pl-library')||!lib||!A)return;
 if(new URLSearchParams(location.search).get('view')==='occurrence'&&!document.getElementById('pa-sync-panel')){
  try{for(const [name,url]of [['ProofAtlasPackedRoutes','/public/js/proof-atlas-packed-routes.js?v=1'],['ProofAtlasGeometry','/public/js/proof-atlas-geometry-core.js?v=10'],['ProofAtlasOccurrenceWindow','/public/js/proof-atlas-occurrence-window.js?v=1'],['ProofAtlasOccurrenceWindowView','/public/js/proof-atlas-occurrence-view.js?v=33'],['PROOF_ATLAS_LARGE_SOURCE_CUT_CHECKS','/public/data/proof-atlas/large-source-cuts-manifest.js?v=1']])if(!window[name])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Occurrence component unavailable'));};document.head.append(script);});
   await new Promise((resolve,reject)=>{const css=document.createElement('link');css.rel='stylesheet';css.href='/public/css/proof-atlas-occurrence-window.css?v=12';css.onload=resolve;css.onerror=()=>{css.remove();reject(Error('Occurrence styles unavailable'));};document.head.append(css);});
   await window.ProofAtlasOccurrenceWindowView.mount($('pl-library'),lib);
  }catch(error){const status=$('pl-status')||$('pl-library').appendChild(document.createElement('p'));status.textContent='Occurrence view unavailable: '+error.message+'. ';const u=new URL(location.href);u.searchParams.delete('view');u.hash='';const a=document.createElement('a');a.href=u.pathname+u.search;a.textContent='Open declaration library';status.append(a);$('pl-library').setAttribute('aria-busy','false');}
  return;
 }
 if(new URLSearchParams(location.search).get('loading')==='paged'&&!document.getElementById('pa-sync-panel')){
  try{for(const [name,url]of [['PROOF_ATLAS_SOURCE_PAGES','/public/data/proof-atlas/source-pages-manifest.js?v=3'],['ProofAtlasSourcePages','/public/js/proof-atlas-source-pages.js?v=4'],['ProofAtlasJudgmentGeometry','/public/js/proof-atlas-judgment-geometry.js?v=16'],['PROOF_ATLAS_NATIVE_PAGES','/public/data/proof-atlas/native-query-pages-manifest.js?v=9'],['ProofAtlasNativePages','/public/js/proof-atlas-native-pages.js?v=5'],['ProofAtlasNativeSelection','/public/js/proof-atlas-native-selection.js?v=1'],['ProofAtlasPagedLibrary','/public/js/proof-atlas-paged-library.js?v=61']])if(!window[name])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Paged geometry module unavailable'));};document.head.append(script);});
   await window.ProofAtlasPagedLibrary.mount($('pl-library'),lib);
  }catch(error){$('pl-status').textContent='Paged geometry unavailable: '+error.message+'. ';$('pl-library').setAttribute('aria-busy','false');const link=document.createElement('a'),url=new URL(location.href);url.searchParams.delete('loading');link.href=url.pathname+url.search+url.hash;link.textContent='Open complete view';$('pl-status').append(link);}
  return;
 }

 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const number=n=>BigInt(n).toLocaleString('en-US'),link=(text,url)=>{const n=el('a',text);n.href=url;return n;};
 function compiledReplayLink(record){const m=window.PROOF_ATLAS_COMPILED_REPLAY,p=m?.package;if(m?.format!=='ProofAtlasCompiledReplayManifest/1'||m.edition!==edition?.id||!Array.isArray(m.records)||m.records.length>20||!m.records.some(r=>r?.name===record.name&&r.indexSha256===record.indexSha256)||!p||!Number.isInteger(p.decodedBytes)||p.decodedBytes<1||p.decodedBytes>1048576||!/^[a-f0-9]{64}$/.test(p.sha256)||p.file!=='/public/data/proof-atlas/compiled-replay/'+p.sha256+'.json.gz')return null;const a=link('Compiled-packet Lean replay evidence ↓',p.file);a.dataset.compiledReplayIndex=record.indexSha256;a.title='Recorded complete-packet checks, pinned dependencies, assumptions and decoder limits. Descendants receive no additional typing.';return a;}
 const drawing=window.ProofAtlasDrawingTheme?.read($('pl-canvas'))||{paper:'#ffffff',surface:'#f6f6f3',ink:'#1c1d1f',muted:'#3f4349',border:'#e6e5e1',accent:'#2d5b8c',selected:'#e9eff6',warm:'#b4652e',sans:'system-ui'};
 const palette=[drawing.accent,drawing.muted,drawing.warm,drawing.muted,drawing.accent,drawing.accent,drawing.warm,drawing.warm,drawing.warm,drawing.muted,drawing.muted,drawing.muted];
 const canvas=$('pl-canvas'),ctx=canvas.getContext('2d'),frame=canvas.parentElement;
 let localReaderLoad=null,localModel=null;
 async function localReaderReady(){if(window.ProofAtlasLocalReader)return;if(!localReaderLoad)localReaderLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/js/proof-atlas-local-reader.js?v=2';s.onload=resolve;s.onerror=()=>{s.remove();localReaderLoad=null;reject(Error('Local term reader unavailable'));};document.head.append(s);});await localReaderLoad;}
 function dependencyLayout(){
  const target=$('pl-dependency-view'),name=current.record.name,byName=new Map(edition.declarations.map(d=>[d.name,d]));target.replaceChildren(el('p','Direct named references in this edition. A reference can occur in a type or body; it does not establish a necessary mathematical premise.'));
  function group(title,records,local){const section=el('section'),list=el('ul'),more=el('button','Show next 12'),count=el('p');let shown=0;section.append(el('h3',title+' · '+records.length),count,list);function append(){for(const d of records.slice(shown,shown+12)){const li=el('li');li.append(local(d)?link(d.name,url(d.name)):el('code',d.name));li.append(el('small',local(d)?byName.get(d.name)?.kind||'local declaration':'External declaration · body outside this edition'));list.append(li);}shown=Math.min(shown+12,records.length);count.textContent=records.length?'Showing '+shown+' of '+records.length:'No direct references recorded.';more.hidden=shown>=records.length;}more.type='button';more.onclick=append;section.append(more);append();target.append(section);}
  group('Uses',current.data.dependencies,d=>d.local);group('Used by',edition.edges.filter(e=>e.to===name).map(e=>({name:e.from})),()=>true);
  $('pl-graph-note').textContent='Only direct references to and from '+name+' are listed. Select a local declaration to follow the next connection.';
 }
 let applicationTypes=null,applicationTypesLoad=null;
 let contextTypes=null,contextTypeView=null,contextTypesLoad=null;
 let contextModuleData=null,contextModuleDataLoad=null,contextModuleView=null,contextModuleController=null,contextModuleScripts=null,sourceContextModuleScripts=null;
 let referenceTyping=null,referenceView=null,referenceLoad=null,introductionTyping=null,introductionView=null,introductionLoad=null;
 let useSiteTyping=null;
 let edition,current,typing=null,packetTyping=null,packetCursor=null,packetPageLoad=null,boundaryLoad=null,localRefinementLoad=null,betaTyping=null,letTyping=null,caseTyping=null,caseView=null,conversionView=null,conversionLoad=null,judgmentView=null,judgmentLoad=null,constructorLoad=null,constructorPending=null,constructorCache=null,projectionTyping=null,projectionLoad=null,universeLoad=null,sourceUniverses=null,corridorControl=null,declarationLoading=false,universeDomId=0,bindingView=null,letView=null,letRequestController=null,letMetadataController=null,betaView=null,typeView=null,typeGeometryLoad=null,applicationView=null,applicationJudgmentLoad=null,lambdaView=null,lambdaJudgmentLoad=null,serial=0,selected=0,root=0,mode='term',foldBinders=false,foldApplications=false,scene=null,geometryLoad=null,points=[],world=[],edges=[],rowOffset=0,zoom=1,pan={x:0,y:0},drag=null,sourceCache=new Map(),selectedRoute=null,rowIds=[],selectionSerial=0,rowRoutes=new Map(),rootRoute=null;
 const rootLabel=(d,i)=>i===0?'Type':d.declaration.rootPaths[i]==='root.value'?(d.declaration.kind==='theorem'?'Complete proof':'Definition body'):'Reduction rule '+(i-(d.declaration.bodyAvailable?1:0));
 async function constructorProvider(id){
  if(!constructorLoad)constructorLoad=Promise.all([['PROOF_ATLAS_CONSTRUCTORS','/public/data/proof-atlas/constructors-manifest.js?v=1'],['ProofAtlasConstructors','/public/js/proof-atlas-constructors.js?v=2'],['ProofAtlasConstructorExpectations','/public/js/proof-atlas-constructor-expectations.js?v=2']].map(([name,url])=>window[name]?Promise.resolve():new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Constructor metadata module is unavailable'));};document.head.append(script);}))).catch(error=>{constructorLoad=null;throw error;});
  await constructorLoad;if(!window.PROOF_ATLAS_CONSTRUCTORS||!window.ProofAtlasConstructors)throw Error('Constructor metadata module is incomplete');
  while(constructorPending){await constructorPending;if(constructorCache?.id===id)return constructorCache.provider;}
  if(constructorCache?.id===id)return constructorCache.provider;const d=window.PROOF_ATLAS_CONSTRUCTORS.records.find(r=>r.edition===id);if(!d)throw Error('No native catalogue for this edition');
  constructorPending=window.ProofAtlasConstructors.open(d).then(provider=>{constructorCache={id,provider};return provider;});try{return await constructorPending;}finally{constructorPending=null;}
 }
 async function projectionsReady(){if(!projectionLoad)projectionLoad=(async()=>{for(const [name,url]of [['ProofAtlasConstructorExpectations','/public/js/proof-atlas-constructor-expectations.js?v=2'],['ProofAtlasProjections','/public/js/proof-atlas-projections.js?v=1']])if(!window[name])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Projection typing module unavailable'));};document.head.append(script);});})().catch(error=>{projectionLoad=null;throw error;});await projectionLoad;}
 async function referencesReady(){if(!referenceLoad)referenceLoad=(async()=>{for(const [name,url]of [['ProofAtlasExpressionViews','/public/js/proof-atlas-expression-views.js?v=1'],['ProofAtlasSourceReferences','/public/js/proof-atlas-source-references.js?v=1']])if(!window[name])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Source-backed types module unavailable'));};document.head.append(script);});})().catch(error=>{referenceLoad=null;throw error;});await referenceLoad;}
 async function introductionsReady(){if(!introductionLoad)introductionLoad=(async()=>{for(const [name,url]of [['ProofAtlasExpressionViews','/public/js/proof-atlas-expression-views.js?v=1'],['ProofAtlasContextViews','/public/js/proof-atlas-context-views.js?v=2'],['ProofAtlasContextTransport','/public/js/proof-atlas-context-transport.js?v=2'],['ProofAtlasIntroductionTransport','/public/js/proof-atlas-introduction-transport.js?v=1'],['ProofAtlasCompositionalTypes','/public/js/proof-atlas-compositional-types.js?v=1']])if(!window[name])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Composed type module unavailable'));};document.head.append(script);});})().catch(error=>{introductionLoad=null;throw error;});await introductionLoad;}
 async function applicationTypesReady(){if(!applicationTypesLoad)applicationTypesLoad=(async()=>{for(const [name,url]of [['ProofAtlasExpressionViews','/public/js/proof-atlas-expression-views.js?v=1'],['ProofAtlasContextViews','/public/js/proof-atlas-context-views.js?v=2'],['ProofAtlasContextTransport','/public/js/proof-atlas-context-transport.js?v=2'],['ProofAtlasApplicationTransport','/public/js/proof-atlas-application-transport.js?v=3'],['ProofAtlasApplicationTypes','/public/js/proof-atlas-application-types.js?v=2']])if(!window[name])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Application type module unavailable'));};document.head.append(script);});})().catch(error=>{applicationTypesLoad=null;throw error;});await applicationTypesLoad;}
 async function contextTypesReady(){if(!contextTypesLoad)contextTypesLoad=(async()=>{for(const [name,url]of [['ProofAtlasExpressionViews','/public/js/proof-atlas-expression-views.js?v=1'],['ProofAtlasContextViews','/public/js/proof-atlas-context-views.js?v=2'],['ProofAtlasContextTypes','/public/js/proof-atlas-context-types.js?v=1']])if(!window[name])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Context type module unavailable'));};document.head.append(script);});})().catch(error=>{contextTypesLoad=null;throw error;});await contextTypesLoad;}
 function clearContextModuleView(){contextModuleController?.abort();contextModuleController=null;contextModuleView?.dispose();contextModuleView=null;}
 function resetContextModules(){clearContextModuleView();contextModuleData?.dispose();contextModuleData=null;contextModuleDataLoad=null;}
 async function contextModulesReady(){if(!contextModuleScripts)contextModuleScripts=(async()=>{await contextTypesReady();await geometryReady();for(const [ready,url]of [[!!window.ProofAtlasGeometry?.createModule,'/public/js/proof-atlas-geometry-core.js?v=10'],[!!window.ProofAtlasBetaReduction?.componentRoots,'/public/js/proof-atlas-beta-reduction.js?v=13'],[!!window.ProofAtlasDependentInterface,'/public/js/proof-atlas-dependent-interface.js?v=1'],[!!window.ProofAtlasContextModules,'/public/js/proof-atlas-context-modules.js?v=2'],[!!window.ProofAtlasContextModuleData,'/public/js/proof-atlas-context-module-data.js?v=1'],[typeof window.ProofAtlasContextModuleUse?.mount==='function'&&typeof window.ProofAtlasContextModuleUse?.fromSource==='function'&&typeof window.ProofAtlasContextModuleUse?.fromMaterialized==='function','/public/js/proof-atlas-context-module-use.js?v=1'],[!!window.ProofAtlasContextInterfaceView,'/public/js/proof-atlas-context-interface-view.js?v=2'],[!!window.ProofAtlasContextModuleView,'/public/js/proof-atlas-context-module-view.js?v=4']])if(!ready)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Checked module component unavailable'));};document.head.append(script);});if(typeof window.ProofAtlasContextModuleUse?.mount!=='function'||typeof window.ProofAtlasContextModuleUse?.fromMaterialized!=='function')throw Error('Module application code is incomplete');})().catch(error=>{contextModuleScripts=null;throw error;});await contextModuleScripts;}
 async function sourceContextModulesReady(){if(!sourceContextModuleScripts)sourceContextModuleScripts=(async()=>{await contextTypesReady();await geometryReady();for(const [ready,url]of [[!!window.ProofAtlasBetaReduction?.asyncComputedNavigation,'/public/js/proof-atlas-beta-reduction.js?v=13'],[!!window.ProofAtlasSourceContextModules,'/public/js/proof-atlas-source-context-modules.js?v=2'],[!!window.ProofAtlasSourceContextModuleData,'/public/js/proof-atlas-source-context-module-data.js?v=4'],[typeof window.ProofAtlasContextModuleUse?.mount==='function'&&typeof window.ProofAtlasContextModuleUse?.fromSource==='function'&&typeof window.ProofAtlasContextModuleUse?.fromMaterialized==='function','/public/js/proof-atlas-context-module-use.js?v=1'],[!!window.ProofAtlasContextInterfaceView,'/public/js/proof-atlas-context-interface-view.js?v=2'],[!!window.ProofAtlasSourceContextModuleView,'/public/js/proof-atlas-source-context-module-view.js?v=7']])if(!ready)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Source-backed module code unavailable'));};document.head.append(script);});if(!window.ProofAtlasBetaReduction?.asyncComputedNavigation||!window.ProofAtlasSourceContextModuleView||typeof window.ProofAtlasContextModuleUse?.mount!=='function'||typeof window.ProofAtlasContextModuleUse?.fromSource!=='function')throw Error('Source-backed module code is incomplete');})();try{await sourceContextModuleScripts;}catch(error){sourceContextModuleScripts=null;throw error;}}
 async function contextModulesFor(owner){if(contextModuleData)return contextModuleData;if(contextModuleDataLoad)return contextModuleDataLoad;const signal=letMetadataController.signal;const job=(async()=>{const reduced=window.PROOF_ATLAS_CONTEXT_MODULES?.records.find(d=>d.name===owner.record.name&&d.edition===edition.id),sourceBacked=window.PROOF_ATLAS_CONTEXT_TYPES?.records.find(d=>d.name===owner.record.name&&d.edition===edition.id);if(!reduced&&!sourceBacked)throw Error('No native module package for this declaration');await(reduced?contextModulesReady():sourceContextModulesReady());if(owner!==current||signal.aborted)throw Error('Module request cancelled');const provider=reduced?await window.ProofAtlasContextModuleData.open(reduced,owner,owner.record,{signal}):await window.ProofAtlasSourceContextModuleData.open(sourceBacked,owner,owner.record,{signal});if(owner!==current||signal.aborted){provider.dispose();throw Error('Module request cancelled');}contextModuleData=provider;return provider;})();contextModuleDataLoad=job;try{return await job;}catch(error){if(contextModuleDataLoad===job)contextModuleDataLoad=null;throw error;}}
 function nativeProviders(loadPacket=false){return{case:caseTyping,beta:betaTyping,let:letTyping,primary:typing,projection:projectionTyping,packet:loadPacket&&packetCursor?packetCursor.providers.packet:packetTyping,useSites:useSiteTyping};}
 function chooseTyping(route,loadPacket=false){const reference=referenceTyping?.get(route);if(reference?.referenceProjection)return referenceTyping;return window.ProofAtlasNativeSelection.select(nativeProviders(loadPacket),route)||(reference?.status==='checked'?referenceTyping:typing);}
 function url(name,occurrence,route){const u=new URL(location.href);u.searchParams.set('edition',edition.id);u.searchParams.set('proof',name);if(mode==='geometry')u.searchParams.set('geometry','scoped');else u.searchParams.delete('geometry');if(mode==='shared'||mode==='dependencies')u.searchParams.set('view',mode);else if(u.searchParams.get('view')!=='occurrence')u.searchParams.delete('view');const folds=[...(foldBinders?['binders']:[]),...(foldApplications?['applications']:[])];if(mode==='geometry'&&folds.length)u.searchParams.set('fold',folds.join(','));else u.searchParams.delete('fold');u.hash=occurrence===undefined?'':'expr-'+occurrence;if(route)u.searchParams.set('route',route.root+':'+route.slots.join('.'));else u.searchParams.delete('route');return (document.getElementById('pa-sync-panel')?'/projects/proof-atlas/library/':u.pathname)+u.search+u.hash;}
 function children(i){return current.children(i);}
 async function universesReady(){
  if(window.ProofAtlasUniverses)return window.ProofAtlasUniverses;
  if(!universeLoad)universeLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/js/proof-atlas-universes.js?v=2';s.onload=()=>resolve(window.ProofAtlasUniverses);s.onerror=()=>{universeLoad=null;s.remove();reject(Error('Universe geometry is unavailable'));};document.head.append(s);});return universeLoad;
 }
 function attachUniverses(container,read){
  const wrapper=el('section',undefined,'pl-universe-inspector'),toggle=el('button','Show universe levels'),host=el('div'),id='pl-universe-'+(++universeDomId);toggle.type='button';toggle.className='pl-universe-toggle';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',id);host.id=id;host.hidden=true;wrapper.append(toggle,host);container.append(wrapper);const owner=current,selection=selectionSerial,live=()=>owner===current&&selection===selectionSerial;let view=null,requestSerial=0,disposed=false,key=null;
  function clear(){requestSerial++;view?.dispose();view=null;host.replaceChildren();host.hidden=true;toggle.disabled=false;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show universe levels';}
  function refresh(){if(disposed)return;const q=read(),node=q?A.walk(q.data,q.route):null,available=q&&(q.data.kind[node]===3||q.data.kind[node]===4&&q.data.payloads[node].levels?.length>0);wrapper.hidden=!available;if(!available){key=null;clear();return;}const next=JSON.stringify([q.record.indexSha256,q.origin,q.route,node]);if(next!==key){key=next;clear();}}
  toggle.onclick=async()=>{if(!host.hidden){clear();return;}const request=++requestSerial;toggle.disabled=true;try{const U=await universesReady();if(disposed||!live()||request!==requestSerial)return;const q=read();host.hidden=false;view=U.mount(host,U.prepare(q.data,q.record,q.origin,q.route));toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide universe levels';}catch(error){if(!disposed&&live()&&request===requestSerial){host.hidden=false;host.textContent='Universe geometry unavailable: '+error.message;toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide universe levels';}}finally{if(request===requestSerial)toggle.disabled=false;}};
  refresh();return{refresh,getScene:()=>live()?view?.getScene()||null:null,getPoint:path=>live()?view?.getPoint(path)||null:null,dispose:()=>{disposed=true;clear();wrapper.remove();}};
 }
 function branchRoutes(start,route){
  // Store one parent per shared node; materialize only the displayed occurrence paths.
  const parents=new Map([[start,null]]),queue=[start];for(let p=0;p<queue.length;p++){const i=queue[p];children(i).forEach((c,j)=>{if(!parents.has(c)){parents.set(c,[i,j]);queue.push(c);}});}
  return{get:i=>{const slots=[];let parent;while((parent=parents.get(i))){slots.unshift(parent[1]);i=parent[0];}return{root:route.root,slots:[...route.slots,...slots]};}};
 }

 function setStatus(text,busy=false){$('pl-status').textContent=text;$('pl-workspace')?.setAttribute('aria-busy',String(busy));$('pl-library').setAttribute('aria-busy',String(busy));}
 function updateLocation(){if(declarationLoading||!current||!selectedRoute||document.getElementById('pa-sync-panel'))return;history.replaceState(null,'',url(current.record.name,selected,selectedRoute));}
 function inventory(){
  const module=$('pl-module').value,q=$('pl-search').value.trim().toLowerCase();
  const records=edition.declarations.filter(d=>(!module||d.module===module)&&(!q||d.name.toLowerCase().includes(q)));
  $('pl-declaration').replaceChildren();$('pl-inventory').replaceChildren();
  for(const d of records){const o=el('option',d.name+' · '+d.kind);o.value=d.name;$('pl-declaration').append(o);const a=link(d.name,url(d.name));a.dataset.proofName=d.name;$('pl-inventory').append(a);}
  if(current&&records.some(d=>d.name===current.record.name))$('pl-declaration').value=current.record.name;
  $('pl-declaration').setAttribute('aria-label',records.length+' declarations matching the filter; '+edition.declarations.length+' in the complete inventory');
 }
 function coverage(){
  const c=edition.counts;$('pl-coverage').replaceChildren();
  for(const [label,value]of [['Modules',c.modules],['Declarations / all inventoried',c.declarations],['Theorem proofs',c.theorems],['Available bodies',c.bodies],['Shared expression nodes',c.uniqueNodes]]){const p=el('div');p.append(el('strong',number(value)),el('span',label));$('pl-coverage').append(p);}
  $('pl-legend').replaceChildren();A.kinds.forEach((k,i)=>{const a=link(k+' · '+number(c.constructors[k]||0),'/projects/proof-atlas/grammar/#expr-'+k);const dot=el('i');dot.style.background=palette[i];a.prepend(dot);$('pl-legend').append(a);});
 }
 function chooseEdition(id){
  corridorControl?.dispose();corridorControl=null;
  resetContextModules();useSiteTyping=null;packetCursor?.dispose();packetCursor=null;packetTyping=null;
  letRequestController?.abort();letMetadataController?.abort();letTyping?.dispose?.();
  edition=lib.editions.find(e=>e.id===id)||lib.editions[0];$('pl-edition').value=edition.id;
  $('pl-module').replaceChildren(el('option','All modules'));$('pl-module').firstChild.value='';
  Object.keys(edition.modules).sort().forEach(m=>{const o=el('option',m);o.value=(edition.modulePrefix||'SE2Conjugate.')+m;$('pl-module').append(o);});
  serial++;selectionSerial++;current=null;useSiteTyping=null;packetCursor?.dispose();packetCursor=null;packetTyping=null;projectionTyping=null;referenceTyping=null;introductionTyping=null;applicationTypes=null;contextTypes=null;contextTypeView?.dispose();contextTypeView=null;introductionView?.dispose();introductionView=null;referenceView?.dispose();referenceView=null;coverage();inventory();
 }
 async function boundaryReady(){if(window.ProofAtlasBoundaryLedger)return;if(!boundaryLoad)boundaryLoad=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/js/proof-atlas-boundary-ledger.js?v=2';script.onload=resolve;script.onerror=()=>{boundaryLoad=null;script.remove();reject(Error('Hidden-region component unavailable'));};document.head.append(script);});await boundaryLoad;}
 async function localRefinementReady(){if(window.ProofAtlasLocalRefinement)return;if(!localRefinementLoad)localRefinementLoad=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/js/proof-atlas-local-refinement.js?v=1';script.onload=resolve;script.onerror=()=>{localRefinementLoad=null;script.remove();reject(Error('Local expansion component unavailable'));};document.head.append(script);});await localRefinementLoad;}
 async function packetPagesReady(){
  if(!packetPageLoad)packetPageLoad=(async()=>{for(const [name,url]of [['PROOF_ATLAS_USE_SITE_PAGES','/public/data/proof-atlas/use-site-query-pages-manifest.js?v=1'],['PROOF_ATLAS_PACKET_QUERY_PAGES','/public/data/proof-atlas/packet-query-pages-manifest.js?v=3'],['PROOF_ATLAS_NATIVE_PAGES','/public/data/proof-atlas/native-query-pages-manifest.js?v=9'],['ProofAtlasNativePages','/public/js/proof-atlas-native-pages.js?v=5']])if(!window[name])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Optional replay query pages unavailable'));};document.head.append(script);});})();
  try{await packetPageLoad;}catch(error){packetPageLoad=null;throw error;}
 }
 function packetSelection(provider,route){
  // Keep only this selection's observation/query for synchronous inspection tools.
  // Other routes remain cache lookups. This UI state is separate from the native LRU.
  const at=JSON.stringify(route),observation=provider.get(route),query=provider.getQuery?.(route),same=r=>JSON.stringify(r)===at;
  return{...provider,get:r=>same(r)?observation:provider.get(r),getQuery:r=>same(r)?query:provider.getQuery?.(r),argument:(r,a)=>(same(r)?observation:provider.get(r))?.arguments?.find(p=>JSON.stringify(p.route)===JSON.stringify(a))};
 }

 async function prepareUseSiteInputs(owner,signal){
  if(signal.aborted||owner!==current)throw Error('Selection changed');const cursor=packetCursor,providers=[typing,caseTyping,betaTyping,letTyping,cursor?.providers.packet||packetTyping,useSiteTyping].filter(Boolean);
  return{providers,options:{runNative:(work,options)=>cursor?cursor.run(work,options):Promise.resolve(work())}};
 }

 async function selectDeclaration(name,occurrence,write=true,route){
  clearSelection();
  resetContextModules();useSiteTyping=null;packetCursor?.dispose();packetCursor=null;packetTyping=null;
  letRequestController?.abort();letMetadataController?.abort();letTyping?.dispose?.();const metadataController=new AbortController();letMetadataController=metadataController;
  contextTypeView?.dispose();contextTypeView=null;contextTypes=null;
  const token=++serial,record=edition.declarations.find(d=>d.name===name);if(!record)throw Error('Declaration is outside this edition: '+name);declarationLoading=true;
  setStatus('Loading and checking '+name+'…',true);
  try{
   const opened=await A.open(record);if(token!==serial)return false;
   const descriptor=window.PROOF_ATLAS_OCCURRENCE_TYPES?.records.find(r=>r.edition===edition.id&&r.name===record.name);let checkedTypes=null,typeFailure=false;
   if(descriptor&&window.ProofAtlasOccurrenceTypes)try{checkedTypes=await window.ProofAtlasOccurrenceTypes.open(descriptor,opened.data,record);}catch(_){typeFailure=true;}
   let checkedUseSites=null,useSiteFailure=false;const useSiteDescriptor=window.PROOF_ATLAS_USE_SITE_TYPES?.records.find(r=>r.edition===edition.id&&r.name===record.name);
   if(useSiteDescriptor)try{if(!Number.isInteger(useSiteDescriptor.queried)||useSiteDescriptor.queried<1||useSiteDescriptor.queried>32||!Number.isInteger(useSiteDescriptor.bytes)||useSiteDescriptor.bytes<1||useSiteDescriptor.bytes>524288)throw Error('Complete-reader application-site bound; use the paged reader');const provider=await window.ProofAtlasOccurrenceTypes.open(useSiteDescriptor,opened.data,record,{signal:metadataController.signal,maxBytes:524288});if(provider.queried!==useSiteDescriptor.queried||provider.queried>32)throw Error('Additional query inventory differs');checkedUseSites=provider;}catch(_){useSiteFailure=true;}
   let checkedPacket=null,checkedPacketCursor=null,packetFailure=false;const packetDescriptor=window.PROOF_ATLAS_PACKET_TYPES?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(packetDescriptor&&window.ProofAtlasOccurrenceTypes)try{
    let pageDescriptor=window.PROOF_ATLAS_PACKET_QUERY_PAGES?.records.find(r=>r.edition===edition.id&&r.name===record.name);
    if(pageDescriptor||packetDescriptor.bytes>262144){await packetPagesReady();pageDescriptor=window.PROOF_ATLAS_PACKET_QUERY_PAGES?.records.find(r=>r.edition===edition.id&&r.name===record.name);const nativeDescriptor=window.PROOF_ATLAS_NATIVE_PAGES?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(!pageDescriptor||!nativeDescriptor)throw Error('Replay query descriptor unavailable');checkedPacketCursor=await window.ProofAtlasNativePages.open(nativeDescriptor,opened.data,record,{signal:metadataController.signal,packetTypingDescriptor:packetDescriptor,packetQueryDescriptor:pageDescriptor});const provider=checkedPacketCursor.providers.packet;packetFailure=Boolean(checkedPacketCursor.state().packetSupplement.failure);if(provider)checkedPacket={...provider,checked:packetDescriptor.checked,queried:packetDescriptor.queried,get:provider.peek,getQuery:provider.peekQuery,argument:(r,a)=>provider.peek(r)?.arguments?.find(p=>JSON.stringify(p.route)===JSON.stringify(a))};}
    else{if(!Number.isInteger(packetDescriptor.queried)||packetDescriptor.queried>32)throw Error('Resident replay query bound');checkedPacket=await window.ProofAtlasOccurrenceTypes.open(packetDescriptor,opened.data,record,{signal:metadataController.signal,maxBytes:262144});}
   }catch(_){checkedPacketCursor?.dispose();checkedPacketCursor=null;packetFailure=true;}
   let checkedBeta=null,betaFailure=false;const betaDescriptor=window.PROOF_ATLAS_BETA_REDUCTIONS?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(betaDescriptor&&window.ProofAtlasBetaReduction)try{checkedBeta=await window.ProofAtlasBetaReduction.open(betaDescriptor,opened.data,record);window.ProofAtlasBetaReduction.checkOverlap(checkedTypes,checkedBeta);}catch(_){checkedBeta=null;betaFailure=true;}
   let checkedLets=null,letFailure=false;const letDescriptor=window.PROOF_ATLAS_LET_REDUCTIONS?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(letDescriptor&&window.ProofAtlasLetReduction)try{checkedLets=await window.ProofAtlasLetReduction.open(letDescriptor,opened.data,record,{signal:metadataController.signal});window.ProofAtlasLetReduction.checkOverlap(checkedTypes,checkedLets);}catch(_){checkedLets=null;letFailure=true;}
   let checkedCases=null,caseFailure=false;const caseDescriptor=window.PROOF_ATLAS_ELIMINATIONS?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(caseDescriptor&&window.ProofAtlasElimination)try{checkedCases=await window.ProofAtlasElimination.open(caseDescriptor,opened.data,record);window.ProofAtlasElimination.checkOverlap(checkedTypes,checkedCases);window.ProofAtlasElimination.checkOverlap(checkedBeta,checkedCases);}catch(_){checkedCases=null;caseFailure=true;}
   let checkedProjections=null,projectionFailure=false;const projectionDescriptor=window.PROOF_ATLAS_PROJECTIONS?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(projectionDescriptor)try{await projectionsReady();checkedProjections=await window.ProofAtlasProjections.open(projectionDescriptor,opened.data,record,{signal:metadataController.signal});for(const prior of [checkedTypes,checkedBeta,checkedLets,checkedCases])window.ProofAtlasProjections.checkOverlap(prior,checkedProjections);}catch(_){checkedProjections=null;projectionFailure=true;}
   let checkedReferences=null,referenceFailure=false;const referenceDescriptor=window.PROOF_ATLAS_SOURCE_REFERENCES?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(referenceDescriptor)try{await referencesReady();checkedReferences=await window.ProofAtlasSourceReferences.open(referenceDescriptor,opened.data,record,{signal:metadataController.signal});}catch(_){referenceFailure=true;}
   let checkedIntroductions=null,introductionFailure=false;const introductionDescriptor=window.PROOF_ATLAS_COMPOSITIONAL_TYPES?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(introductionDescriptor)try{await introductionsReady();checkedIntroductions=await window.ProofAtlasCompositionalTypes.open(introductionDescriptor,opened.data,record,{signal:metadataController.signal});}catch(_){introductionFailure=true;}
   let checkedApplicationTypes=null,applicationTypeFailure=false;const applicationTypeDescriptor=window.PROOF_ATLAS_APPLICATION_TYPES?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(applicationTypeDescriptor)try{await applicationTypesReady();checkedApplicationTypes=await window.ProofAtlasApplicationTypes.open(applicationTypeDescriptor,opened.data,record,{signal:metadataController.signal});}catch(_){applicationTypeFailure=true;}
   let checkedContextTypes=null,contextTypeFailure=false;const contextTypeDescriptor=window.PROOF_ATLAS_CONTEXT_TYPES?.records.find(r=>r.edition===edition.id&&r.name===record.name);if(contextTypeDescriptor)try{await contextTypesReady();checkedContextTypes=await window.ProofAtlasContextTypes.open(contextTypeDescriptor,opened.data,record,{signal:metadataController.signal});}catch(_){contextTypeFailure=true;}
   if(token!==serial){checkedLets?.dispose?.();checkedPacketCursor?.dispose();return false;}contextTypes=checkedContextTypes;applicationTypes=checkedApplicationTypes;introductionTyping=checkedIntroductions;referenceTyping=checkedReferences;selectedRoute=null;scene=null;current=opened;typing=checkedTypes;useSiteTyping=checkedUseSites;packetTyping=checkedPacket;packetCursor=checkedPacketCursor;betaTyping=checkedBeta;letTyping=checkedLets;caseTyping=checkedCases;projectionTyping=checkedProjections;$('pl-typing-note').textContent=typing?typing.checked+' primary native-checked queries and '+typing.observed+' additional exact type observations from application and introduction records. Other paths have no recorded type judgment. The browser verifies provenance and structure, not Lean validity.':typeFailure?'Checked type evidence failed validation; types and argument roles are unavailable.':checkedCases?'Native type observations come from the separate case package. Other paths have no recorded judgment. The browser verifies provenance and structure, not Lean validity.':checkedProjections?'Native type observations come from the separate projection package. Other paths have no recorded judgment. The browser verifies provenance and structure, not Lean validity.':referenceTyping?'Native type observations come from source-backed field templates. Other paths have no recorded judgment.':'No checked occurrence type evidence is available for this declaration.';
   if(useSiteTyping)$('pl-typing-note').textContent+=' Additional application sites: '+useSiteTyping.checked+' native-checked queries, shared by the construction diagrams and binding inspector.';else if(useSiteFailure)$('pl-typing-note').textContent+=' Additional application-site evidence is unavailable; earlier records remain available. The paged reader retains its separate delivery bounds.';
   if(packetTyping)$('pl-typing-note').textContent+=' Public-packet replay: '+packetTyping.checked+(packetCursor?' indexed construction queries (paged evidence);':' exact construction queries;')+' the original proof module was not imported.';else if(packetFailure)$('pl-typing-note').textContent+=' Optional packet replay evidence failed validation; earlier native records remain available.';
   if(betaTyping)$('pl-typing-note').textContent+=' Separate β inventory: '+betaTyping.checked+' checked type-level reductions.';else if(betaFailure)$('pl-typing-note').textContent+=' Optional beta evidence failed validation; reduction view is unavailable.';
   if(letTyping)$('pl-typing-note').textContent+=' Native let inventory: '+letTyping.checked+' records / '+letTyping.queried+' exact routes, '+letTyping.observed+' additional exact premise observations within this inventory (some overlap primary observations); computed results load and undergo structural checks when opened.';else if(letFailure)$('pl-typing-note').textContent+=' Optional let evidence failed validation; substitution view is unavailable.';
   if(caseTyping)$('pl-typing-note').textContent+=' Separate elimination inventory: '+caseTyping.checked+' checked case representatives / '+caseTyping.queried+' candidate calls; unsupported candidates are withheld.';else if(caseFailure)$('pl-typing-note').textContent+=' Optional elimination evidence failed validation; case view is unavailable.';
   if(projectionTyping)$('pl-typing-note').textContent+=' Native field projections: '+projectionTyping.checked+' representatives; '+projectionTyping.queried+' projection/context queries; structure-input observations retain their source context.';else if(projectionFailure)$('pl-typing-note').textContent+=' Optional projection evidence failed validation; the source layout remains available.';
   if(referenceTyping)$('pl-typing-note').textContent+=' Source-backed field types: '+referenceTyping.checked+' exact queries; source operands are borrowed.';else if(referenceFailure)$('pl-typing-note').textContent+=' Optional source-backed evidence failed validation; existing source and type records remain available.';
   if(introductionTyping)$('pl-typing-note').textContent+=' Composed types: '+introductionTyping.checked+' exact queries.';else if(introductionFailure)$('pl-typing-note').textContent+=' Optional composed types failed validation; the source layout remains available.';
   if(applicationTypes)$('pl-typing-note').textContent+=' Source-backed application types: '+applicationTypes.checked+' exact queries.';else if(applicationTypeFailure)$('pl-typing-note').textContent+=' Optional application types failed validation; existing source and type records remain available.';
   if(contextTypes)$('pl-typing-note').textContent+=' Closed-context evidence: '+contextTypes.checked+' native exact routes in '+contextTypes.classes+' context classes. The separate context-type control derives typing at matching routes; other classes remain unsupported.';else if(contextTypeFailure)$('pl-typing-note').textContent+=' Optional context evidence failed validation; the source graph and existing type records remain available.';
   selected=occurrence??(route?A.walk(current.data,route):record.bodyAvailable?current.data.roots[1]:current.data.roots[0]);
   if(!Number.isInteger(selected)||selected<0||selected>=record.uniqueNodes)throw Error('Occurrence is outside the complete expression inventory');
   root=selected;zoom=1;pan={x:0,y:0};$('pl-title').textContent=record.name;$('pl-declaration').value=name;
   $('pl-provenance').replaceChildren(el('p',record.module+' · '+record.kind+' · native kernel check PASS'),el('p','Complete type: '+number(record.typeOccurrences)+' occurrences. Available body / reduction terms: '+number(record.proofOccurrences)+'.'),el('p','Source SHA-256: '+record.sourceSha256),el('p','Axiom dependencies: '+(record.axioms.join(', ')||'none')));
   const article=record.articleAnchor?'/projects/proof-atlas/article/?view=lean#'+(record.articleAnchor.startsWith('lem:')||record.articleAnchor.startsWith('thm:')?'proof-'+record.articleAnchor.replace(':','-'):record.articleAnchor):null;
   $('pl-downloads').replaceChildren(link('Complete term packet ↓',record.file),link(article?'Related article section / proof context ↗':'Corpus provenance ↗',article||(edition.id==='goedel-sample-4331'?'/projects/proof-atlas/program/#goedel-evaluation':edition.id==='context-module-controls'?'/research/proof-atlas/context-modules/README.md':edition.id==='closed-context-controls'?'/projects/proof-atlas/program/#closed-context-types':'/projects/proof-atlas/program/#recursive-premises')));if(edition.id==='closed-context-controls')$('pl-provenance').append(el('p','Twelve own synthetic declarations with every source occurrence queried for closed-context typing. These are finite controls, not an AI theorem-solving benchmark.'));if(edition.id==='source-reference-controls')$('pl-provenance').append(el('p','Nineteen selected own synthetic declarations, including four large stored operands. This is a finite control set, not every declaration generated in the fixture module or an AI theorem-solving benchmark.'));if(edition.id==='recursion-controls')$('pl-provenance').append(el('p','Assistant-authored synthetic controls with deterministic expression sharing. Not an AI theorem-solving benchmark.'));if(edition.id==='goedel-sample-4331')$('pl-provenance').append(el('p','Unmodified source from Goedel-LM/Lean-workbook-proofs, publisher-attributed to Goedel-Prover-SFT; recompiled under Lean 4.33.1. Twenty of 24 predetermined scripts compiled. Original generation and original-environment equivalence are not independently reproduced.'),link('Dataset release and declared license ↗','/public/data/proof-atlas/goedel-sample/NOTICE.txt'));
   const replay=compiledReplayLink(record);if(replay)$('pl-downloads').append(replay);
   $('pl-roots').replaceChildren();current.data.roots.forEach((r,i)=>{const b=el('button',rootLabel(current.data,i));b.type='button';b.dataset.proofRoot=r;b.onclick=()=>selectOccurrence(r,true,true,{root:i,slots:[]});$('pl-roots').append(b);});
   $('pl-source').replaceChildren(el('pre',record.type));$('pl-mobile-source').textContent=record.type;
   $('pl-references').replaceChildren();for(const dep of current.data.dependencies){const target=dep.local?url(dep.name):'https://leanprover-community.github.io/mathlib4_docs/find/?pattern='+encodeURIComponent(dep.name);const a=link(dep.name+' · '+number(dep.count)+' occurrences'+(dep.local?' · open its complete proof':' · external library boundary'),target);a.dataset.localReference=String(dep.local);$('pl-references').append(a);}
   $('pl-occurrence').max=record.uniqueNodes-1;declarationLoading=false;await selectOccurrence(selected,true,false,route);if(token!==serial)return false;
   if(write)updateLocation();setStatus('Verified '+name+' · all '+number(record.uniqueNodes)+' shared nodes available');return true;
  }catch(e){if(token===serial){declarationLoading=false;setStatus(e.message);}throw e;}
 }
 function label(i){const k=current.kind(i),p=current.payload(i)||{};return k+(p.name?' '+p.name:p.binderName?' '+p.binderName:p.declName?' '+p.declName:k==='bvar'?' '+p.index:k==='lit'?' '+(p.value??p.repr):k==='proj'?' '+p.typeName+'['+p.index+']':'');}
 let chainConversions;
 async function showChainConversion(detail,record,call,mismatch){
  const file='/public/data/proof-atlas/chain-endpoint-conversions.json';
  if(!chainConversions){
   chainConversions=(async()=>{
    const response=await fetch(file);
    if(!response.ok)throw Error('Endpoint report unavailable');
    const bytes=await response.arrayBuffer();
    if(await A.digest(bytes)!=='3921318e4fafc4019716b8872d3b372c7fa431c97792f93b71e51d6c9a967f21')throw Error('Endpoint report changed');
    return JSON.parse(new TextDecoder().decode(bytes)).entries;
   })().catch(error=>{chainConversions=null;throw error;});
  }
  const same=(a,b)=>a.node===b.node && a.route.root===b.route.root &&
    a.route.slots.join('.')===b.route.slots.join('.');
  try{
   const entries=await chainConversions;
   const match=entries.find(e=>e.name===record.name && e.indexSha256===record.indexSha256 &&
    same(e.call,call) && e.field===mismatch.field && same(e.outer,mismatch.outer) &&
    same(e.nested,mismatch.nested) && e.kernelReflexivity==='PASS');
   if(match)detail.append(el('br'),'Lean checked that these terms are definitionally equal. ',
    link('Kernel replay record',file));
   return Boolean(match);
  }catch{ /* The structural comparison remains available without the replay record. */ }
 }
 // Eq has three compiled arguments: the carrier, the left side and the right side.
 function equalitySides(data,at){
  let fn=at.node;
  for(let n=0;n<3;n++){
   if(data.kind[fn]!==5)return null;
   fn=data.children[fn][0];
  }
  if(data.kind[fn]!==4 || data.payloads[fn].name!=='Eq')return null;
  function side(path){
   const route={root:at.route.root,slots:at.route.slots.concat(path)};
   return {node:A.walk(data,route),route};
  }
  return [side([0,1]),side([1])];
 }
 async function selectOccurrence(i,focus=false,write=true,route){
  if(declarationLoading)throw Error('Proof declaration is still loading');
  if(!current||!Number.isInteger(i)||i<0||i>=current.record.uniqueNodes)throw Error('Invalid occurrence');
  const requestedRoute=route||current.route(i);if(A.walk(current.data,requestedRoute)!==i)throw Error('Route/node mismatch');const nextRoute={root:requestedRoute.root,slots:[...requestedRoute.slots]};
  localModel?.dispose?.();localModel=null;corridorControl?.dispose();corridorControl=null;clearContextModuleView();contextTypeView?.dispose();contextTypeView=null;introductionView?.dispose();introductionView=null;referenceView?.dispose();referenceView=null;letRequestController?.abort();letRequestController=null;sourceUniverses?.dispose();sourceUniverses=null;judgmentView?.dispose();judgmentView=null;caseView?.dispose();caseView=null;conversionView?.dispose();conversionView=null;letView?.dispose();letView=null;bindingView?.dispose();bindingView=null;betaView?.dispose();betaView=null;typeView?.dispose();typeView=null;applicationView?.dispose();applicationView=null;lambdaView?.dispose();lambdaView=null;const owner=current,selectionToken=++selectionSerial;selected=i;selectedRoute=nextRoute;if(focus){root=i;rootRoute=selectedRoute;zoom=1;pan={x:0,y:0};}
  const cs=children(i),binding=A.binding(current.data,selectedRoute),binder=binding?.node;await owner.payloads([i,...cs,...(binder===undefined?[]:[binder])]);if(owner!==current||selectionToken!==selectionSerial)return;
  $('pl-occurrence').value=i;$('pl-parent').disabled=!selectedRoute.slots.length;
  const target=$('pl-expression');target.replaceChildren(el('h3','Selected '+label(i)+' · e'+i),el('p',A.path(current.data,selectedRoute)),el('p',number(current.data.expanded[i])+' occurrences in this subtree. The selected route determines its lexical context.'));
  const p=current.payload(i),pre=el('pre',JSON.stringify(p,null,2));const metadata=el('details'),summary=el('summary','Constructor fields');metadata.append(summary,pre);target.append(metadata);
  const actions=el('div',undefined,'pl-actions');cs.forEach((c,j)=>{const b=el('button',A.fields[current.kind(i)][j]+' · #'+c+' · '+current.kind(c));b.type='button';b.onclick=()=>selectOccurrence(c,true,true,{root:selectedRoute.root,slots:[...selectedRoute.slots,j]});actions.append(b);});
  if(binder!==undefined){const b=el('button','Enclosing binder #'+binder+' · '+label(binder));b.type='button';b.onclick=()=>selectOccurrence(binder,true,true,binding.route);actions.append(b);}
  const sourceLink=(label,at)=>link(label,url(owner.record.name,at.node,at.route));
  const sides=equalitySides(owner.data,{node:i,route:nextRoute});
   function termLabel(at){
    const spine=window.ProofAtlasElimination.spine(owner.data,at.node);
    const headRoute={root:at.route.root,slots:at.route.slots.concat(Array(spine.args.length).fill(0))};
    const binder=A.binding(owner.data,headRoute);
    const name=binder?(owner.payload(binder.node).binderName??owner.payload(binder.node).declName):null;
    return (spine.args.length?'application of ':'')+(name??label(spine.head));
   }
  const congr=window.ProofAtlasOmittedReferences?.exactCallInputs?.(owner.data,{node:i,route:nextRoute},'congrArg',6);
  if(congr){
   const [, ,left,right,fn,premise]=congr;
   const panel=el('section'),rule=el('p'),inputs=el('ul');
   panel.setAttribute('aria-label','Equality under a function');
   rule.append(sourceLink('a',left),' = ',sourceLink('b',right),'  ⇒  ',
    sourceLink('f',fn),'(',sourceLink('a',left),') = ',sourceLink('f',fn),'(',sourceLink('b',right),')');
   for(const [role,at] of [['a',left],['b',right],['f',fn],['Proof of a = b',premise]]){
    const row=el('li');row.append(sourceLink(role+' · '+termLabel(at),at));inputs.append(row);
   }
   panel.append(el('h4','Equality under a function'),rule,inputs);
   if(owner.kind(fn.node)==='app'){
    const {prefix,args,folded}=window.ProofAtlasOmittedReferences.fixedArguments(owner.data,fn);
    const context=el('p'),fixed=el('ol');
    const headName=folded?'f':(owner.payload(prefix.node)?.name??termLabel(prefix));
    context.append('Function context: x ↦ ',sourceLink(headName,prefix),'(');
    for(const [index,arg] of args.entries()){
     const symbol='s'+(index+1);
     context.append(sourceLink(symbol,arg),', ');
     const item=el('li');item.append(sourceLink(symbol+' · '+termLabel(arg),arg));fixed.append(item);
    }
    context.append('x)');
    const details=el('details');
    details.append(el('summary','Fixed arguments in compiled order'),fixed);
    if(folded)details.append(el('p','Earlier arguments are included in f.'));
    const payload=owner.payload(prefix.node);
    const binary=owner.kind(prefix.node)==='const' && window.PROOF_ATLAS_TYPE_NOTATION?.entries.find(op=>
     op.name===payload.name && JSON.stringify(op.nameParts)===JSON.stringify(payload.nameParts) &&
     op.levelParams.length===payload.levels.length && op.form==='binary' && op.arity===args.length+1 &&
     op.visibleSlots.length===2 && op.visibleSlots[1]===args.length && op.visibleSlots[0]<args.length);
    if(binary){
     const operand=args[binary.visibleSlots[0]],expression=el('p');
     expression.append('Function context: x ↦ ',sourceLink('s',operand),' ',sourceLink(binary.glyph,prefix),' x');
     const legend=el('p');legend.append(sourceLink('s · '+termLabel(operand),operand));
     details.append(context);
     panel.append(expression,legend,details);
    }else panel.append(context,details);
   }
   if(owner.kind(fn.node)==='lam' && window.ProofAtlasRecursiveInputs){
    const body=owner.data.children[fn.node][1],counter=window.ProofAtlasRecursiveInputs.countReferences;
    const opts={useSupport:false,maxStates:4096},refs=counter(owner.data,body,0,opts);
    const note=el('p');
    if(refs.status==='counted'){
     note.append('Parameter references in the function body: '+refs.occurrences+'.');
     if(refs.occurrences!=='0'){
      const use=counter(owner.data,body,0,{...opts,ordinal:1n}).witness;
      const site={node:use.node,route:{root:fn.route.root,slots:fn.route.slots.concat(1,use.slots)}};
      note.append(' ',sourceLink('First parameter use',site));
      const receiver=window.ProofAtlasOmittedReferences.applicationAtUse(owner.data,site);
      if(receiver)note.append(receiver.slot?' · Argument '+receiver.slot+' of '+receiver.arity+' to ':' · Function in ',
       sourceLink(receiver.label,receiver.call));
      if(BigInt(refs.occurrences)>1n){
       const form=el('form'),label=el('label','Parameter use number '),input=el('input');
       input.value='1';input.required=true;input.inputMode='numeric';input.pattern='[1-9][0-9]*';
       input.maxLength=refs.occurrences.length;input.size=Math.min(8,input.maxLength+1);
       label.append(input);const submit=el('button','Find use'),result=el('p');
       result.setAttribute('aria-live','polite');
       form.append(label,' of '+refs.occurrences+' ',submit);
       form.onsubmit=e=>{
        e.preventDefault();
        if(!/^[1-9][0-9]*$/.test(input.value)||BigInt(input.value)>BigInt(refs.occurrences)){
         input.setCustomValidity('Enter a use number between 1 and '+refs.occurrences+'.');
         input.reportValidity();return;
        }
        const found=counter(owner.data,body,0,{...opts,ordinal:BigInt(input.value)}).witness;
        const target={node:found.node,route:{root:fn.route.root,slots:fn.route.slots.concat(1,found.slots)}};
        result.replaceChildren(sourceLink('Open use '+input.value,target));
        const receiver=window.ProofAtlasOmittedReferences.applicationAtUse(owner.data,target);
        if(receiver)result.append(receiver.slot?' · Argument '+receiver.slot+' of '+receiver.arity+' to ':' · Function in ',
         sourceLink(receiver.label,receiver.call));
       };
       input.oninput=()=>input.setCustomValidity('');
       panel.append(form,result);
      }
      if(refs.occurrences==='1' && window.PROOF_ATLAS_TYPE_NOTATION){
       const frames=window.ProofAtlasOmittedReferences.parameterContext(owner.data,window.PROOF_ATLAS_TYPE_NOTATION,
        {node:body,route:{root:fn.route.root,slots:fn.route.slots.concat(1)}},site);
       if(frames?.some(frame=>frame.form==='binder' || frame.form==='wideCall')){
        const trace=el('details'),list=el('ol');
        trace.append(el('summary',frames.some(frame=>frame.form==='binder')?'Trace parameter through binders':'Trace parameter through application'));
        for(const frame of frames.slice().reverse()){
         const row=el('li'),slot=frame.operands.indexOf(null);
         if(frame.form==='wideCall'){
          row.append(sourceLink(frame.glyph,frame.call),' · Parameter in argument '+frame.slot+' of '+frame.arity);
          const form=el('form'),label=el('label','Compiled argument number '),input=el('input');
          input.type='number';input.min='1';input.max=String(frame.arity);input.required=true;input.value=String(frame.slot);
          label.append(input);const result=el('p');result.setAttribute('aria-live','polite');
          function showArgument(){
           const n=input.valueAsNumber;
           if(!Number.isSafeInteger(n)||n<1||n>frame.arity)return;
           const route={root:frame.call.route.root,slots:frame.call.route.slots.concat(Array(frame.arity-n).fill(0),1)};
           const target={node:A.walk(owner.data,route),route};
           result.replaceChildren(sourceLink('Argument '+n+' · '+termLabel(target),target));
          }
          form.append(label,el('button','Find argument'));form.onsubmit=e=>{e.preventDefault();showArgument();};
          showArgument();row.append(form,result);
         }else if(frame.form==='binder'){
          const inBody=frame.field==='body',other=frame.operands[inBody?0:1];
          row.append(sourceLink(frame.glyph+' '+(owner.payload(frame.call.node).binderName||'_'),frame.call),
           inBody?' · Enter body within binder scope · ':' · Enter domain outside binder scope · ',
           sourceLink(inBody?'Open domain':'Open body',other));
         }else{
          row.append(sourceLink(frame.glyph,frame.call),' · ',
           frame.form==='localCall'?(slot?'Argument '+slot:'Function position'):
            (frame.raw?'Compiled argument ':'Displayed operand ')+(slot+1));
         }
         list.append(row);
        }
        const terminal=el('li');terminal.append(sourceLink('Parameter occurrence',site),' · ',sourceLink('Original parameter binder',fn));
        list.append(terminal);trace.append(list);panel.append(trace);
       }else if(frames?.length){
        const formula=el('p'),fixed=el('ul');let expression=[sourceLink('x',site)],count=0;
        for(const frame of frames){
         const op=sourceLink(frame.glyph,frame.call);
         const args=frame.operands.map(at=>{
          if(!at)return expression;
          const symbol='s'+(++count),row=el('li');
          row.append(sourceLink(symbol+' · '+termLabel(at),at));fixed.append(row);
          return [sourceLink(symbol,at)];
         });
         if(frame.form==='binary')expression=['(',...args[0],' ',op,' ',...args[1],')'];
         else{
          if(frame.form==='localCall'){
           const fn=args.shift(),row=el('li');
           row.append(sourceLink('Function occurrence',frame.head),' · ',sourceLink('Binder of '+frame.glyph,frame.binder),
            ' · ',sourceLink('Open application',frame.call));fixed.append(row);
           expression=[...fn,'('];
          }else expression=[op,'('];
          for(const [i,arg] of args.entries()){
           if(i)expression.push(', ');
           expression.push(...arg);
          }
          expression.push(')');
         }
        }
        formula.append('Function context: x ↦ ',...expression);
        let destination=panel;
        if(frames.some(frame=>frame.raw)){
         const trail=el('p');trail.append('From the parameter outward: ');
         for(const [i,frame] of frames.entries()){
          if(i)trail.append(' → ');
          trail.append(sourceLink(frame.raw?frame.glyph.slice(1):frame.glyph,frame.call));
         }
         destination=el('details');
         destination.append(el('summary','Show compiled arguments'),
          el('p','@ shows all compiled arguments in Lean order, including implicit arguments.'));
         panel.append(trail,destination);
        }
        destination.append(formula);
        if(count)destination.append(fixed);
       }else if(frames){
        const formula=el('p');formula.append('Function context: x ↦ ',sourceLink('x',site));panel.append(formula);
       }else{
        note.append(' The operator context is unavailable for this path.');
       }
      }
     }
    }else note.append('Parameter reference count unavailable.');
    panel.append(note);
   }
   target.append(panel);
  }
  const chain=window.ProofAtlasOmittedReferences?.exactCallInputs?.(owner.data,{node:i,route:nextRoute},'Eq.trans',6);
  if(chain){
   const [,start,middle,end,first,second]=chain;
   const section=el('section'),terms=el('p'),steps=el('ol');
   section.setAttribute('aria-label','Equality chain');
   terms.append(sourceLink('Start · '+termLabel(start),start),' = ',
    sourceLink('Intermediate term · '+termLabel(middle),middle),' = ',sourceLink('End · '+termLabel(end),end));
   for(const [text,proof] of [['Start equals intermediate term',first],['Intermediate term equals end',second]]){
    const row=el('li');
    row.append(sourceLink(text,proof),' · '+termLabel(proof));steps.append(row);
   }
   section.append(el('h4','Equality by transitivity'),terms,steps);
   const segments=window.ProofAtlasOmittedReferences.equalitySegments(owner.data,chain);
   if(segments.length>2 || segments.some(s=>s.boundary)){
    const detail=el('details'),list=el('ol');
    detail.append(el('summary','Trace '+segments.length+' equality steps'));
    for(const [index,step] of segments.entries()){
     const row=el('li');
     row.append(sourceLink(termLabel(step.start),step.start),' = ',sourceLink(termLabel(step.end),step.end),
      ' · ',sourceLink('Proof '+(index+1),step.proof));
     if(step.mismatches){
      const checks=[];
      for(const m of step.mismatches){
       const detail=el('p');
       detail.append('Different compiled '+m.field+' · ',sourceLink('Enclosing term',m.outer),' / ',sourceLink('Nested term',m.nested));
       if(m.outerSite)detail.append(' · First difference: ',sourceLink(termLabel(m.outerSite),m.outerSite),
        ' / ',sourceLink(termLabel(m.nestedSite),m.nestedSite));
       else detail.append(m.difference==='limit'?' · Comparison limit reached':' · Matching expression structure');
       row.append(detail);
       if(edition.id==='goedel-sample-4331')checks.push(showChainConversion(detail,owner.record,{node:i,route:nextRoute},m));
      }
      if(checks.length===step.mismatches.length)Promise.all(checks).then(matches=>{
       if(!matches.every(Boolean) || owner!==current || selectionToken!==selectionSerial)return;
       const nested=window.ProofAtlasOmittedReferences.exactCallInputs(owner.data,step.proof,'Eq.trans',6);
       const trace=el('details'),parts=el('ol');
       trace.append(el('summary','Inspect the two joined equalities'));
       for(const [offset,proof] of nested.slice(4).entries()){
        const part=el('li'),left=nested[1+offset],right=nested[2+offset];
        part.append(sourceLink(termLabel(left),left),' = ',sourceLink(termLabel(right),right),' · ',
         sourceLink('Open subproof '+(offset+1),proof));parts.append(part);
       }
       trace.append(parts);row.append(trace);
      });
     }else if(step.boundary)row.append(' · '+step.boundary);
     list.append(row);
    }
    detail.append(list);section.append(detail);
   }
   target.append(section);
  }
  if(sides){
   const comparison=el('p');
   comparison.append(sourceLink('Left side · '+label(sides[0].node),sides[0]),' = ',
    sourceLink('Right side · '+label(sides[1].node),sides[1]));
   target.append(comparison);
   const compare=window.ProofAtlasOmittedReferences?.firstStructuralDifference;
   if(compare && sides[0].node!==sides[1].node){
    const difference=compare(owner.data,sides[0].node,sides[1].node);
    if(difference.slots){
     const detail=el('p');
     detail.append('First difference in '+(difference.status==='constructor'?'constructor':'constructor data')+' · ');
     sides.forEach((side,index)=>{
      const route={root:side.route.root,slots:side.route.slots.concat(difference.slots)};
      const node=index?difference.right:difference.left;
      if(index)detail.append(' / ');
      detail.append(sourceLink((index?'Right':'Left')+' · '+label(node),{route,node}));
     });
     target.append(detail);
    }else{
     comparison.append(difference.status==='limit'?' · Comparison limit reached':' · Matching expression structure');
    }
   }
  }
  if(binding && window.ProofAtlasOmittedReferences){
   const destination=window.ProofAtlasOmittedReferences.resultDestination(owner.data,{node:i,route:nextRoute});
   const line=el('p');
   line.append('Use of ',sourceLink(owner.payload(binder).binderName??owner.payload(binder).declName??'bound variable',binding),' · ');
   if(destination.kind==='argument'){
    const c=destination.call;
    const equality=c.arity===3 && owner.kind(c.head.node)==='const' && c.label==='Eq';
    const role=equality && c.slot===2?'Left side of equality':equality && c.slot===3?'Right side of equality':
     c.slot===0?'Function applied to '+c.arity+' arguments':'Argument '+c.slot+' of '+c.arity;
    line.append(role+' · ',sourceLink(c.label,c.call));
    if(equality && (c.slot===2 || c.slot===3)){
     const opposite=equalitySides(owner.data,c.call)[c.slot===2?1:0];
     line.append(' · ',sourceLink(c.slot===2?'Open right side':'Open left side',opposite));
    }
   }else if(destination.kind==='root'){
    line.append('Expression root');
   }else{
    line.append(destination.field+' of ',sourceLink(destination.kind+(destination.name?' '+destination.name:''),destination.at));
   }
   target.append(line);
  }
  if(current.kind(i)==='const'){const local=edition.declarations.find(d=>d.name===p.name);target.append(local?link('Open the referenced '+local.kind+' and its entire proof ↗',url(local.name)):el('p','External Lean/Mathlib reference; its body is outside the project corpus.'));}
  if((edition.id===window.PROOF_ATLAS_AI_SAMPLE?.edition.id || edition.id==='published-15') && owner.record.kind==='theorem' && current.kind(i)==='lam' && nextRoute.root===1 &&
     nextRoute.slots.every(slot=>slot===1)){
   let ancestor=owner.data.roots[1];
   const leading=nextRoute.slots.every(()=>{
    if(owner.data.kind[ancestor]!==6)return false;
    ancestor=owner.data.children[ancestor][1];return true;
   });
   if(leading){
    const panel=el('details'),note=el('p');note.setAttribute('role','status');
    panel.append(el('summary','Where this input is used'),note);target.append(panel);
    let loaded=false;
    panel.ontoggle=async()=>{
     if(!panel.open || loaded)return;
     loaded=true;note.textContent='Loading receiving roles…';
     try{
      const digest=owner.record.indexSha256;
      const response=await fetch('/public/data/proof-atlas/input-roles/'+digest+'.json');
      if(!response.ok)throw Error('Missing role data');
      const packet=await response.json();
      if(!panel.isConnected)return;
      const entry=packet.entries.find(r=>r.node===i && r.depth===nextRoute.slots.length);
      if(packet.indexSha256!==digest || !entry)throw Error('Input mismatch');
      if(packet.entries.length>1 && !nextRoute.slots.length){
       const label=el('label','Proof input '),picker=el('select'),go=el('button','Inspect input');
       for(const r of packet.entries){
        const name=owner.data.payloads[r.node].binderName || '_';
        const option=el('option',(r.depth+1)+'. '+name+' · '+number(r.count)+' uses');
        option.value=String(r.depth);picker.append(option);
       }
       go.type='button';go.onclick=()=>{
        const choice=packet.entries.find(r=>r.depth===Number(picker.value));
        safely(selectOccurrence(choice.node,true,true,{root:1,slots:Array(choice.depth).fill(1)}));
       };
       label.append(picker);panel.append(label,' ',go);
      }
      const list=el('ol');
      for(const group of entry.groups){
       const route={root:1,slots:group.slots.split('.').map(Number)};
       const binding=A.binding(owner.data,route);
       if(A.walk(owner.data,route)!==group.node || binding?.node!==i ||
          binding.route.slots.join('.')!==nextRoute.slots.join('.'))throw Error('Witness mismatch');
       const row=el('li');
       row.append(link(group.label,url(owner.record.name,group.node,route)),' · '+number(group.count));
       if(group.count>1 && (group.offsets || group.role)){
        const more=el('details'),form=el('form'),label=el('label','Use number '),input=el('input'),go=el('button','Open use');
        input.type='number';input.min='1';input.max=String(group.count);input.required=true;input.value='1';
        label.append(input);go.type='submit';form.append(label,' ',go);
        const roles=window.ProofAtlasRoleOccurrences;
        let index;
        function useAt(ordinal){
         if(!group.role)return roles.select(owner.data,group,Number(ordinal));
         index??=roles.constantArgumentIndex(owner.data,{node:i,route:nextRoute},group.role);
         if(index.total!==BigInt(group.count))throw Error('Role count mismatch');
         return index.occurrence(ordinal);
        }
        form.onsubmit=event=>{
         event.preventDefault();
         if(!form.reportValidity())return;
         safely((async()=>{
          const hit=useAt(BigInt(input.valueAsNumber));
          const binder=A.binding(owner.data,hit.route);
          if(binder?.node!==i || binder.route.slots.join('.')!==nextRoute.slots.join('.'))throw Error('Use belongs to a different binder');
          await selectOccurrence(hit.node,true,true,hit.route);
         })());
        };
        more.append(el('summary','Choose a use'),form);row.append(more);
        const geometry=el('details'),display=el('div'),history=[];
        geometry.append(el('summary','Explore proof branches'),display);row.append(geometry);
        function drawBranches(first,last){
         const part=roles.partition(useAt,first,last,owner.data),parent=A.walk(owner.data,part.route);
         const kind=A.kinds[owner.data.kind[parent]],list=el('ul');
         const head=part.call?.head;
         const name=head===undefined?kind:owner.data.kind[head]===4?owner.data.payloads[head].name:A.kinds[owner.data.kind[head]]+' function';
         display.replaceChildren(link(name+' · subtree #'+parent,url(owner.record.name,parent,part.route)),list);
         for(const branch of part.branches){
          const size=branch.last-branch.first+1n,childRoute=branch.route || {root:part.route.root,slots:part.route.slots.concat(branch.slot)};
          const child=A.walk(owner.data,childRoute),item=el('li'),meter=el('meter');
          const field=part.call?(branch.slot===0?'Function':'Argument '+branch.slot+' of '+part.call.arity):A.fields[kind][branch.slot];
          meter.max=Number(last-first+1n);meter.value=Number(size);meter.setAttribute('aria-label',field+' share of uses');
          item.append(link(field,url(owner.record.name,child,childRoute)),' ',meter,' '+number(size)+' of '+number(last-first+1n)+' ');
          if(size>1n){
           const zoom=el('button','Explore '+field);zoom.type='button';
           zoom.onclick=()=>{history.push([first,last]);drawBranches(branch.first,branch.last);display.querySelector('a').focus();};item.append(zoom);
          }else{
           const hit=useAt(branch.first);item.append(link('Open use '+number(branch.first),url(owner.record.name,hit.node,hit.route)));
          }
          list.append(item);
         }
         if(part.call){
          if(caseTyping?.get(part.route)?.eliminationJudgment?.status==='checked'){
           const scene=window.ProofAtlasElimination.create(owner.data,owner.record,caseTyping,part.route);
           const cases=el('details'),handlers=el('ul');
           cases.append(el('summary','Case inputs and selected uses'),
            link(scene.major.typeText,url(owner.record.name,scene.major.node,scene.major.route)),handlers);
           for(const branch of scene.branches){
            const arg=branch.argument,interval=part.branches.find(b=>b.slot===arg.sourceSlot);
            const count=interval?interval.last-interval.first+1n:0n;
            const item=el('li');
            item.append(link(branch.constructor,url(owner.record.name,arg.node,arg.route)),
             ' · '+number(count)+(count===1n?' selected use':' selected uses'));
            for(const frame of branch.frames){
             const domain=frame.domain;
             item.append(el('br'),link(domain.text,url(owner.record.name,domain.node,domain.route)));
             const uses=window.ProofAtlasRecursiveInputs.countReferences(owner.data,frame.body.node,0);
             if(uses.status==='counted')item.append(' · ',link(number(uses.occurrences)+(uses.occurrences==='1'?' reference to this input':' references to this input'),
              url(owner.record.name,frame.binder.node,frame.binder.route)));
             if(uses.status==='counted' && uses.occurrences!=='0'){
              const trace=el('details'),result=el('div');
              trace.append(el('summary','Follow this input'),result);item.append(trace);
              function showUse(n){
               const picked=window.ProofAtlasRecursiveInputs.countReferences(owner.data,frame.body.node,0,{ordinal:n});
               if(!picked.witness){result.textContent='Reference search limit reached.';return;}
               const w=picked.witness,route={root:frame.body.route.root,slots:frame.body.route.slots.concat(w.slots)};
               const receiver=window.ProofAtlasOmittedReferences.applicationAtUse(owner.data,{node:w.node,route});
               result.replaceChildren(link('Use '+number(n),url(owner.record.name,w.node,route)));
               if(receiver){
                result.append(receiver.slot?' · argument '+receiver.slot+' of '+receiver.arity+' to ':' · function of ',
                 link(receiver.label,url(owner.record.name,receiver.call.node,receiver.call.route)));
                const next=window.ProofAtlasOmittedReferences.resultDestination(owner.data,receiver.call);
                const line=el('div');
                if(next.call){
                 const call=next.call;
                 line.append('Its result supplies '+(call.slot?'argument '+call.slot+' of '+call.arity:'the function')+' to ',
                  link(call.label,url(owner.record.name,call.call.node,call.call.route)));
                 const sig=owner.data.kind[call.head.node]===4 && window.ProofAtlasRoleOccurrences.importedSignature(
                  window.PROOF_ATLAS_TYPE_NOTATION,edition.id,call.label,window.PROOF_ATLAS_AI_SAMPLE?.provenance.compiler,window.PROOF_ATLAS_CORE_SIGNATURES);
                 if(sig){
                  const signature=el('details'),args=el('ol');
                  signature.append(el('summary','Arguments of '+call.label),args);
                  for(let k=1;k<=call.arity;k++){
                   const path={root:call.call.route.root,slots:call.call.route.slots.concat(Array(call.arity-k).fill(0),1)};
                   const node=A.walk(owner.data,path),param=sig.binders[k-1],li=el('li');
                   li.append(link(param?param.name+' · argument '+k:'Result applied to argument '+k,url(owner.record.name,node,path)));
                   if(k===call.slot)li.append(' · receives '+receiver.label);
                   if(k===window.ProofAtlasRoleOccurrences.resultMotiveSlot(sig) && owner.data.kind[node]===6){
                    const body=owner.data.children[node][1],count=window.ProofAtlasRecursiveInputs.countReferences(owner.data,body,0);
                    if(count.status==='counted')li.append(' · ',link(number(count.occurrences)+' references to the motive input',
                     url(owner.record.name,body,{root:path.root,slots:path.slots.concat(1)})));
                    const coverage=el('details'),regions=el('ul');
                    coverage.append(el('summary','Where the motive input occurs'),regions);li.append(coverage);
                    coverage.ontoggle=()=>{
                     if(!coverage.open || regions.children.length)return;
                     const parts=window.ProofAtlasRecursiveInputs.motiveRegions(owner.data,{node,route:path});
                     parts.forEach((part,j)=>{
                      const row=el('li');
                      row.append(link(part.label,url(owner.record.name,part.node,part.route)),
                       part.count.status==='counted'?' · '+number(part.count.occurrences)+(part.count.occurrences==='1'?' use':' uses'):' · count unavailable');
                      const applied=sig.arity+j+1;
                      if(j<parts.length-1 && applied<=call.arity){
                       const route={root:path.root,slots:call.call.route.slots.concat(Array(call.arity-applied).fill(0),1)};
                       row.append(' · ',link('Supplied argument '+applied,url(owner.record.name,A.walk(owner.data,route),route)));
                      }
                      regions.append(row);
                     });
                    };
                   }
                   args.append(li);
                  }
                  signature.append(el('p','Signature SHA-256 '+sig.signatureSha256));
                  line.append(signature);
                 }
                }else line.append('Its result reaches ',link(next.kind==='root'?'the expression root':next.kind+' · '+next.field,url(owner.record.name,next.at.node,next.at.route)));
                result.append(line);
               }
              }
              if(BigInt(uses.occurrences)>1n){
               const form=el('form'),label=el('label','Input use number '),input=el('input'),go=el('button','Trace use');
               input.type='text';input.inputMode='numeric';input.pattern='[1-9][0-9]*';input.required=true;
               input.maxLength=uses.occurrences.length;input.value='1';go.type='submit';label.append(input);form.append(label,go);trace.insertBefore(form,result);
               input.oninput=()=>input.setCustomValidity('');
               form.onsubmit=event=>{event.preventDefault();const n=BigInt(input.value);if(n>BigInt(uses.occurrences)){input.setCustomValidity('Choose a number up to '+uses.occurrences);input.reportValidity();return;}showUse(n);};
              }
              trace.ontoggle=()=>{if(trace.open && !result.children.length)showUse(1n);};
             }
            }
            if(branch.missingSourceLambdas)item.append(el('p',number(branch.missingSourceLambdas)+' handler inputs lack a recorded source binder.'));
            handlers.append(item);
           }
           display.append(cases);
          }
          const provider=[typing,caseTyping].find(p=>p?.get(part.route)?.status==='checked');
          const observation=provider?.get(part.route);
          if(observation?.kernelCheck==='PASS' && observation.node===parent){
           const details=el('details'),g=observation.typeGraph,r=observation.typeRoot;
           details.append(el('summary','Recorded result at this call'),el('pre',observation.typeText));
           if(g.kind[r]===5 && g.kind[g.children[r][0]]===6){
            const body=g.children[g.children[r][0]][1];
            const refs=window.ProofAtlasRecursiveInputs.countReferences(g,body,0);
            if(refs.status==='counted' && refs.occurrences==='0')
             details.append(el('p','The lambda in this result has no reference to its bound variable.'));
           }
           details.append(link('Inspect the checked call',url(owner.record.name,parent,part.route)),el('p','Native record SHA-256 '+provider.sha256));
           display.append(details);
          }
          const callee=owner.data.kind[head]===4 && edition.declarations.find(d=>d.name===name);
          const headRoute={root:part.route.root,slots:part.route.slots.concat(Array(part.call.arity).fill(0))};
          const bound=owner.data.kind[head]===0 && A.binding(owner.data,headRoute);
          const signature=!callee && owner.data.kind[head]===4 && roles.importedSignature(window.PROOF_ATLAS_TYPE_NOTATION,edition.id,name,window.PROOF_ATLAS_AI_SAMPLE?.provenance.compiler,window.PROOF_ATLAS_CORE_SIGNATURES);
          if(callee || bound || signature){
           const show=el('button','Show declared parameters'),status=el('p');
           show.type='button';status.setAttribute('role','status');display.append(show,status);
           show.onclick=async()=>{
            show.disabled=true;status.textContent='Reading the declared type…';
            try{
             const source=callee && callee.name!==owner.record.name ? await A.open(callee) : owner;
             if(!list.isConnected)return;
             const typeRoute=(callee || signature)?{root:0,slots:[]}:{root:bound.route.root,slots:bound.route.slots.concat(0)};
             const params=roles.formalParameters(signature?signature.graph:source.data,typeRoute,part.call.arity);
             const graph=signature?signature.graph:source.data;
             function argumentLinks(refs){
              const items=el('ul');
              for(const ref of refs){
               const earlier=params[ref.slot-1];
               const slots=part.route.slots.concat(Array(part.call.arity-ref.slot).fill(0),1);
               const at={root:part.route.root,slots},node=A.walk(owner.data,at);
               const row=el('li'),label=(earlier.name||'_')+' · argument '+ref.slot;
               row.append(link(label,url(owner.record.name,node,at)));
               if(signature)row.append(' · signature reference e'+ref.node+' at '+ref.route.root+':'+ref.route.slots.join('.'));
               else row.append(' · ',link('Reference in declared type',url(source.record.name,ref.node,ref.route)));
               items.append(row);
              }
              return items;
             }
             let shown=0;
             part.branches.forEach((b,j)=>{
              const f=params[b.slot-1];
              if(!f)return;
              const text=(f.name || '_')+' · '+(f.info==='default'?'explicit':f.info);
              let evidence=list.children[j];
              if(signature){
               const details=el('details'),domain=signature.graph.children[f.node][0];
               details.append(el('summary',text),el('p',name+' · signature binder e'+f.node+' · domain e'+domain),
                el('pre',A.termLines(signature.graph,domain).join('\n')),el('p','Signature SHA-256 '+signature.signatureSha256));
               evidence.append(details);evidence=details;
              }else evidence.append(' ',link(text,url(source.record.name,f.node,f.route)));
              const refs=roles.domainReferences(signature?signature.graph:source.data,params,b.slot);
              if(refs.length){
               const dependencies=el('details');
               dependencies.append(el('summary','Earlier arguments in this parameter type'),argumentLinks(refs));
               evidence.append(dependencies);
              }
              shown++;
             });
             const result=roles.declaredResult(graph,params,part.call.arity);
             if(result){
              const details=el('details');
              details.append(el('summary','Declared result before substitution'));
              const spine=window.ProofAtlasElimination.spine(graph,result.node);
              const atoms=[spine.head,...spine.args].map(node=>{
               if(graph.kind[node]===4)return graph.payloads[node].name;
               if(graph.kind[node]===0)return params.at(-1-graph.payloads[node].index)?.name;
              });
              if(atoms.every(Boolean))details.append(el('code',atoms.join(' ')));
              if(signature){
               const raw=el('details');raw.append(el('summary','Compiled result expression'),el('pre',A.termLines(graph,result.node).join('\n')),el('p','Signature SHA-256 '+signature.signatureSha256));
               details.append(raw);
              }
              else details.append(link('Result in the declared type',url(source.record.name,result.node,result.route)));
              if(result.references.length)details.append(el('p','Supplied arguments referenced by this result'),argumentLinks(result.references));
              else details.append(el('p','The result contains no reference to a supplied parameter.'));
              display.append(details);
             }else display.append(el('p','The recorded parameter list ends before the last supplied argument.'));
             status.textContent=shown?(signature?'Parameter details show the recorded imported signature and its domain.':'Parameter links open their binders in the declared type.'):'The declared type exposes no parameter at these positions.';
            }catch(error){show.disabled=false;status.textContent='Could not read the declared type. Select again to retry.';}
           };
          }
         }
         if(history.length){
          const back=el('button','Previous branch');back.type='button';
          back.onclick=()=>{drawBranches(...history.pop());display.querySelector('a').focus();};display.append(back);
         }
        }
        geometry.ontoggle=()=>{
         if(geometry.open && !display.children.length)drawBranches(1n,BigInt(group.count));
         if(!geometry.open){history.length=0;display.replaceChildren();index=null;}
        };
       }
       list.append(row);
      }
      note.textContent=entry.count?number(entry.count)+' references in '+number(entry.groups.length)+' receiving roles. Each link opens the first use.':'This proof body has no reference to this input.';
      if(list.children.length)panel.append(list);
     }catch(error){loaded=false;note.textContent='Receiving roles unavailable. Close and reopen to retry.';}
    };
   }
  }
  if([6,7,8].includes(owner.data.kind[i])&&window.ProofAtlasBindingUses&&window.ProofAtlasRecursiveInputs){const toggle=el('button','Show binding references'),host=el('div'),at={root:selectedRoute.root,slots:[...selectedRoute.slots]};toggle.type='button';toggle.id='pl-binding-toggle';toggle.setAttribute('aria-expanded','false');host.hidden=true;host.id='pl-binding-uses';toggle.setAttribute('aria-controls',host.id);target.append(toggle,host);toggle.onclick=()=>safely((async()=>{if(!host.hidden){bindingView?.dispose();bindingView=null;host.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show binding references';return;}toggle.disabled=true;toggle.textContent='Counting binding references…';host.setAttribute('aria-busy','true');try{await new Promise(resolve=>requestAnimationFrame(resolve));if(owner!==current||selectionToken!==selectionSerial)return;host.hidden=false;bindingView=window.ProofAtlasBindingUses.mount(host,{sourceLink,data:owner.data,record:owner.record,route:at,getNativeProviders:()=>[typing,caseTyping,betaTyping,letTyping].filter(Boolean),prepareNative:signal=>prepareUseSiteInputs(owner,signal),onProofOccurrence:(node,route)=>safely(selectOccurrence(node,true,true,route))});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide binding references';}catch(error){if(owner===current&&selectionToken===selectionSerial){host.hidden=false;host.textContent='Binding references unavailable: '+error.message;toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide binding references';}}finally{toggle.disabled=false;host.setAttribute('aria-busy','false');}})());}
  if(window.ProofAtlasPackedRoutes&&owner.record.uniqueNodes<=window.ProofAtlasPackedRoutes.limits.sourceNodes){const packed=window.ProofAtlasPackedRoutes.encode(selectedRoute.root,selectedRoute.slots),u=new URL('/projects/proof-atlas/library/',location.origin);u.searchParams.set('view','occurrence');u.searchParams.set('edition',edition.id);u.searchParams.set('proof',owner.record.name);u.hash='occurrence='+owner.record.indexSha256+'.'+packed.root+'.'+packed.depth+'.'+packed.slots;const a=link('Open occurrence geometry',u.pathname+u.search+u.hash);a.dataset.occurrenceWindowLink='';actions.append(a);}
  if(window.ProofAtlasSourceCorridor&&selectedRoute.slots.length){const host=el('div'),at={root:selectedRoute.root,slots:[...selectedRoute.slots]},Q=window.ProofAtlasSourceCorridor;target.append(host);corridorControl=Q.control(host,{prepare:signal=>Q.create(Q.open(owner.data,owner.record),{root:at.root,slots:[]},at,{signal}),onSource:(node,route)=>safely(selectOccurrence(node,true,true,route)),isCurrent:()=>owner===current&&selectionToken===selectionSerial});}
  if(nextRoute.root<=1 && !nextRoute.slots.length && owner.record.kind==='theorem' && window.ProofAtlasOmittedReferences)
   target.append(window.ProofAtlasOmittedReferences.control(owner.data,window.PROOF_ATLAS_TYPE_NOTATION,hit=>url(owner.record.name,hit.node,hit.route),nextRoute.root,route=>{
    if(caseTyping?.get(route)?.eliminationJudgment?.status==='checked')
     return window.ProofAtlasElimination.create(owner.data,owner.record,caseTyping,route);
   }));
  if(['app','letE'].includes(current.kind(i)) && window.ProofAtlasRowOccurrences){
   const chooser=window.ProofAtlasRowOccurrences.control(owner.data,i,nextRoute,route=>safely(selectOccurrence(i,true,true,route)));
   target.append(chooser);
  }
  target.append(actions);if(write)updateLocation();rowOffset=0;rowIds=A.reachable(current.data,selected);rowRoutes=branchRoutes(selected,selectedRoute);$('pl-rows').replaceChildren();await appendRows();if(owner!==current||selectionToken!==selectionSerial)return;await layout();if(owner!==current||selectionToken!==selectionSerial)return;
  const universeRoute={root:selectedRoute.root,slots:[...selectedRoute.slots]};sourceUniverses=attachUniverses(target,()=>({data:owner.data,record:owner.record,origin:{kind:'source-expression',indexSha256:owner.record.indexSha256,sourceSha256:owner.record.sourceSha256},route:universeRoute}));
  const activePacket=packetCursor,packetRoute={root:selectedRoute.root,slots:[...selectedRoute.slots]};
  if(activePacket){const loading=el('p','Loading checked construction…');loading.setAttribute('role','status');target.append(loading);try{await activePacket.run(()=>{const provider=activePacket.providers.packet,value=provider?.get(packetRoute);provider?.getQuery?.(packetRoute);return value;});}catch(error){if(owner!==current||selectionToken!==selectionSerial||activePacket!==packetCursor)return;throw error;}finally{loading.remove();}if(owner!==current||selectionToken!==selectionSerial)return;if(activePacket.state().packetSupplement.failure){const note=el('p','Additional checked constructions are unavailable. Earlier records remain available.');note.setAttribute('role','status');target.append(note);}}
  const chosenTyping=chooseTyping(selectedRoute),selectedTyping=chosenTyping&&chosenTyping===packetTyping&&activePacket?packetSelection(chosenTyping,packetRoute):chosenTyping;
   const moduleDescriptor=window.PROOF_ATLAS_CONTEXT_MODULES?.records.find(d=>d.edition===edition.id&&d.name===owner.record.name)||window.PROOF_ATLAS_CONTEXT_TYPES?.records.find(d=>d.edition===edition.id&&d.name===owner.record.name),moduleRoute={root:selectedRoute.root,slots:[...selectedRoute.slots]},moduleSupported=moduleDescriptor?.routes.some(r=>r.root===moduleRoute.root&&JSON.stringify(r.slots)===JSON.stringify(moduleRoute.slots));
  const judgment=selectedTyping?.get(selectedRoute),contextSelection=contextTypes?.get(selectedRoute),typePanel=el('section',undefined,'pl-type-evidence');typePanel.id='pl-type-evidence';typePanel.dataset.status=judgment?.status==='checked'||introductionTyping?.get(selectedRoute)?'checked':'unavailable';typePanel.dataset.contextStatus=contextSelection?(contextSelection.derivation.targetNativeObservation?'native-observation':'derived'):'unavailable';
  if(judgment?.sourceReference){
   const nativeText=el('details'),nativePre=el('pre',judgment.typeText);nativePre.tabIndex=0;nativeText.className='pl-beta-reduction';nativeText.append(el('summary','Native occurrence type · presentation'),nativePre);typePanel.append(el('h4',judgment.role+' · checked source-backed type'),el('p','Native type in the exact '+judgment.context.length+'-binder context; source regions remain shared.'),nativeText);const toggle=el('button','Show source-backed types'),host=el('div'),at=judgment;toggle.className='pl-reference-toggle';toggle.type='button';toggle.setAttribute('aria-expanded','false');host.id='pl-reference-types';host.hidden=true;toggle.setAttribute('aria-controls',host.id);typePanel.append(toggle,host);
   toggle.onclick=()=>safely((async()=>{if(!host.hidden){referenceView?.dispose();referenceView=null;host.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show source-backed types';return;}toggle.disabled=true;try{await geometryReady();if(owner!==current||selectionToken!==selectionSerial)return;host.hidden=false;referenceView=window.ProofAtlasSourceReferences.mount(host,{data:owner.data,record:owner.record,typing:selectedTyping,observation:at,onProofOccurrence:(node,route)=>{if(owner===current&&selectionToken===selectionSerial)safely(selectOccurrence(node,true,true,route));}});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide source-backed types';}finally{toggle.disabled=false;}})());
  }else if(judgment?.status==='checked'){
   typePanel.append(el('h4',judgment.role+' · checked occurrence type'),el('p','Native Lean 4.33.1 kernel check in the exact '+judgment.context.length+'-binder context. Pretty text is a presentation; the shared type expression and context retain the formal fields.'),el('pre',judgment.typeText));
   if(judgment.typingOrigin){const origin=el('details'),source=judgment.typingOrigin.query,jump=el('button',(judgment.typingOrigin.kind==='let-premise-observation'?'Open recorded let':judgment.typingOrigin.kind==='lambda-introduction-observation'?'Open recorded lambda':judgment.typingOrigin.kind==='projection-premise-observation'?'Open recorded projection':judgment.typingOrigin.kind==='beta-composition-observation'?'Open recorded β application':'Open recorded call')+' · e'+source.node),text=el('pre',JSON.stringify(judgment.typingOrigin,null,2));jump.type='button';jump.onclick=()=>safely(selectOccurrence(source.node,true,true,source.route));text.tabIndex=0;origin.append(el('summary',judgment.typingOrigin.kind==='let-premise-observation'?'Type recorded in let premise':judgment.typingOrigin.kind==='lambda-introduction-observation'?'Type recorded in lambda introduction':judgment.typingOrigin.kind==='beta-composition-observation'?'Type recorded in β composition':judgment.typingOrigin.kind==='projection-premise-observation'?'Type recorded in projection premise':'Type recorded in application trace'),jump,text);typePanel.append(origin);}
   const lines=A.termLines(judgment.typeGraph,judgment.typeRoot),details=el('details'),summary=el('summary','Shared type expression · root e'+judgment.typeRoot+' · '+Math.min(200,lines.length)+' / '+lines.length+' shared nodes shown');details.append(summary,el('p','Bound indices refer to this occurrence’s enclosing context, in addition to binders inside the type. This is compiled type data, not an article interpretation.'),el('pre',lines.slice(0,200).join('\n')),link('Complete checked type packet ↓',selectedTyping.file));typePanel.append(details);

   if(judgment.betaJudgment?.status==='checked'){
    const toggle=el('button','Show β composition'),betaHost=el('div');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','pl-beta-reduction');betaHost.id='pl-beta-reduction';betaHost.hidden=true;typePanel.append(toggle,betaHost);
    toggle.onclick=()=>safely((async()=>{if(!betaHost.hidden){betaView?.dispose();betaView=null;betaHost.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show β composition';return;}toggle.disabled=true;try{await geometryReady();if(owner!==current||selectionToken!==selectionSerial)return;betaHost.hidden=false;betaView=window.ProofAtlasBetaReduction.mount(betaHost,{data:owner.data,record:owner.record,typing:selectedTyping,attachUniverses,judgmentRoute:{root:selectedRoute.root,slots:[...selectedRoute.slots]},ensureGeometry:geometryReady,onProofOccurrence:(node,route)=>safely(selectOccurrence(node,true,true,route))});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide β composition';}finally{toggle.disabled=false;}})());
   }
   if((judgment.letJudgment?.status==='checked'||judgment.letReduction?.status==='available')&&window.ProofAtlasLetReduction){
    const toggle=el('button','Show let substitution'),host=el('div'),at={root:selectedRoute.root,slots:[...selectedRoute.slots]};toggle.type='button';toggle.setAttribute('aria-expanded','false');host.id='pl-let-reduction';host.hidden=true;toggle.setAttribute('aria-controls',host.id);typePanel.append(toggle,host);
    toggle.onclick=()=>safely((async()=>{if(!host.hidden){letRequestController?.abort();letRequestController=null;letView?.dispose();letView=null;host.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show let substitution';return;}toggle.disabled=true;toggle.textContent='Loading and checking let result…';host.setAttribute('aria-busy','true');const controller=new AbortController();letRequestController=controller;try{await geometryReady();if(owner!==current||selectionToken!==selectionSerial)return;const loaded=selectedTyping.load?await selectedTyping.load(at,{signal:controller.signal}):selectedTyping;if(owner!==current||selectionToken!==selectionSerial)return;host.hidden=false;letView=window.ProofAtlasLetReduction.mount(host,{data:owner.data,record:owner.record,typing:loaded,attachUniverses,judgmentRoute:at,onProofOccurrence:(node,route)=>safely(selectOccurrence(node,true,true,route))});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide let substitution';}catch(error){if(owner===current&&selectionToken===selectionSerial){host.hidden=false;host.textContent='Let substitution unavailable: '+error.message;toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide let substitution';}}finally{toggle.disabled=false;host.setAttribute('aria-busy','false');}})());
   }
   const show=el('button','Show type diagram'),host=el('div');show.type='button';show.setAttribute('aria-expanded','false');show.setAttribute('aria-controls','pl-type-geometry');host.id='pl-type-geometry';host.hidden=true;typePanel.append(show,host);
   let typeRequestSerial=0,requestedTypeComponent=null;
   const hideType=()=>{typeRequestSerial++;requestedTypeComponent=null;show.disabled=false;typeView?.dispose();typeView=null;host.replaceChildren();host.hidden=true;show.setAttribute('aria-expanded','false');show.textContent='Show type diagram';};
   const openType=async(component={kind:'subject-type'},judgmentRoute={root:selectedRoute.root,slots:[...selectedRoute.slots]})=>{
    const typeRequest=++typeRequestSerial;requestedTypeComponent=component;show.disabled=true;try{await geometryReady();
     if(applicationTypes?.get(judgmentRoute)&&window.ProofAtlasApplicationTypes.supports(component)){
      const provider=applicationTypes,prepared=await provider.getPrepared(judgmentRoute,{signal:letMetadataController?.signal});if(owner!==current||selectionToken!==selectionSerial||typeRequest!==typeRequestSerial)return;
      typeView?.dispose();host.hidden=false;typeView=window.ProofAtlasApplicationTypes.mount(host,{data:owner.data,record:owner.record,typing:provider,selected:prepared,component,attachUniverses,onComponentChange:c=>{requestedTypeComponent=c;},onProofOccurrence:(node,route)=>{if(owner===current&&selectionToken===selectionSerial)safely(selectOccurrence(node,true,true,route));}});show.setAttribute('aria-expanded','true');show.textContent='Hide type diagram';return;
     }
     if(!window.ProofAtlasTypeGeometry){if(!typeGeometryLoad)typeGeometryLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/js/proof-atlas-type-geometry.js?v=6';s.onload=resolve;s.onerror=()=>{typeGeometryLoad=null;s.remove();reject(Error('Type geometry is unavailable'));};document.head.append(s);});await typeGeometryLoad;}if(owner!==current||selectionToken!==selectionSerial||typeRequest!==typeRequestSerial)return;
     typeView?.dispose();host.hidden=false;typeView=window.ProofAtlasTypeGeometry.mount(host,{data:owner.data,record:owner.record,typing:selectedTyping,attachUniverses,initialComponent:component,judgmentRoute,onProofOccurrence:(node,route)=>safely(selectOccurrence(node,true,true,route))});show.setAttribute('aria-expanded','true');show.textContent='Hide type diagram';
    }finally{if(typeRequest===typeRequestSerial)show.disabled=false;}
   };
   show.onclick=()=>{if(!host.hidden)hideType();else safely(openType());};
   if(judgment.letPremises){const premises=el('details'),list=el('ol');premises.id='pl-let-premises';premises.append(el('summary','Native let premises'),list);for(const premise of judgment.letPremises){const part=premise.typingOrigin.part,row=el('li'),scope=part==='body'?'inside the local definition':'before this binder',source=el('button',({type:'Declared type',value:'Value',body:'Body'}[part])+' · '+scope),diagram=el('button',{type:'Show declared type’s sort',value:'Show value’s inferred type',body:'Show body’s inferred type'}[part]);source.type=diagram.type='button';source.dataset.letPremiseSource=part;diagram.dataset.letPremiseType=part;source.onclick=()=>safely(selectOccurrence(premise.node,true,true,premise.route));diagram.onclick=()=>safely(openType({kind:{type:'let-declared-type',value:'let-value-type',body:'let-body-type'}[part]}));row.append(source,diagram);if(part==='value'){const expected=el('button','Show declared value type');expected.type='button';expected.dataset.letPremiseExpected='value';expected.onclick=()=>safely(openType({kind:'let-value-expected'}));row.append(expected);}list.append(row);}typePanel.append(premises);}

   if([judgment.applicationJudgment,judgment.lambdaJudgment,judgment.betaJudgment,judgment.eliminationJudgment,judgment.letJudgment].some(t=>t?.status==='checked')||judgment.letReduction?.status==='available'||judgment.typingOrigin?.kind==='let-premise-observation'&&judgment.typingOrigin.part==='value'){
    const toggle=el('button','Show type conversions'),conversionHost=el('div'),at={root:selectedRoute.root,slots:[...selectedRoute.slots]};toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','pl-type-conversions');conversionHost.id='pl-type-conversions';conversionHost.hidden=true;typePanel.append(toggle,conversionHost);
    toggle.onclick=()=>safely((async()=>{if(!conversionHost.hidden){conversionView?.dispose();conversionView=null;conversionHost.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show type conversions';return;}toggle.disabled=true;try{await geometryReady();if(!window.ProofAtlasTypeConversions){if(!conversionLoad)conversionLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/js/proof-atlas-type-conversions.js?v=3';s.onload=resolve;s.onerror=()=>{conversionLoad=null;s.remove();reject(Error('Conversion geometry is unavailable'));};document.head.append(s);});await conversionLoad;}if(owner!==current||selectionToken!==selectionSerial)return;conversionHost.hidden=false;conversionView=window.ProofAtlasTypeConversions.mount(conversionHost,{data:owner.data,record:owner.record,typing:selectedTyping,attachUniverses,judgmentRoute:at,onProofOccurrence:(node,route)=>safely(selectOccurrence(node,true,true,route))});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide type conversions';}catch(error){if(owner===current&&selectionToken===selectionSerial){conversionHost.hidden=false;conversionHost.textContent='Type conversions unavailable: '+error.message;toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide type conversions';}}finally{toggle.disabled=false;}})());
   }

   if(judgment.eliminationJudgment?.status==='checked'){
    const toggle=el('button','Show case elimination'),caseHost=el('div');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','pl-elimination');caseHost.id='pl-elimination';caseHost.hidden=true;typePanel.append(toggle,caseHost);toggle.onclick=()=>safely((async()=>{if(!caseHost.hidden){caseView?.dispose();caseView=null;caseHost.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show case elimination';return;}toggle.disabled=true;try{if(owner!==current||selectionToken!==selectionSerial)return;caseHost.hidden=false;caseView=window.ProofAtlasElimination.mount(caseHost,{data:owner.data,record:owner.record,typing:selectedTyping,judgmentRoute:{root:selectedRoute.root,slots:[...selectedRoute.slots]},ensureGeometry:geometryReady,onProofOccurrence:(node,route)=>safely(selectOccurrence(node,true,true,route)),onTypeComponent:(component,route)=>safely(openType(component,route)),onBranchChange:()=>{if(requestedTypeComponent?.kind.startsWith('case-')||requestedTypeComponent?.kind.startsWith('lambda-'))hideType();}});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide case elimination';}finally{toggle.disabled=false;}})());
   }else if(judgment.eliminationJudgment?.status==='unavailable')typePanel.append(el('p','Elimination record unavailable: '+judgment.eliminationJudgment.reason));

   if(judgment.applicationJudgment?.status==='checked'){
    const toggle=el('button','Show application judgment'),appHost=el('div');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','pl-application-judgment');appHost.id='pl-application-judgment';appHost.hidden=true;typePanel.append(toggle,appHost);
    toggle.onclick=()=>safely((async()=>{
     if(!appHost.hidden){applicationView?.dispose();applicationView=null;appHost.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show application judgment';return;}
     toggle.disabled=true;try{if(!window.ProofAtlasApplicationJudgment){if(!applicationJudgmentLoad)applicationJudgmentLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/js/proof-atlas-application-judgment.js?v=1';s.onload=resolve;s.onerror=()=>{applicationJudgmentLoad=null;s.remove();reject(Error('Application judgment is unavailable'));};document.head.append(s);});await applicationJudgmentLoad;}if(owner!==current||selectionToken!==selectionSerial)return;
      appHost.hidden=false;applicationView=window.ProofAtlasApplicationJudgment.mount(appHost,{data:owner.data,record:owner.record,typing:selectedTyping,judgmentRoute:{root:selectedRoute.root,slots:[...selectedRoute.slots]},ensureGeometry:geometryReady,onProofOccurrence:(node,route)=>safely(selectOccurrence(node,true,true,route)),onTypeComponent:component=>safely(openType(component)),onStageChange:()=>{if(requestedTypeComponent?.kind.startsWith('application-'))hideType();}});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide application judgment';
     }finally{toggle.disabled=false;}
    })());
   }else if(current.kind(i)==='app')typePanel.append(el('p','No checked application trace is recorded for this occurrence. Its selected-term type judgment remains available.'));
   if(judgment.lambdaJudgment?.status==='checked'){
    const toggle=el('button','Show lambda introduction'),lambdaHost=el('div');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','pl-lambda-judgment');lambdaHost.id='pl-lambda-judgment';lambdaHost.hidden=true;typePanel.append(toggle,lambdaHost);
    toggle.onclick=()=>safely((async()=>{
     if(!lambdaHost.hidden){lambdaView?.dispose();lambdaView=null;lambdaHost.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show lambda introduction';return;}
     toggle.disabled=true;try{if(!window.ProofAtlasLambdaJudgment){if(!lambdaJudgmentLoad)lambdaJudgmentLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/js/proof-atlas-lambda-judgment.js?v=1';s.onload=resolve;s.onerror=()=>{lambdaJudgmentLoad=null;s.remove();reject(Error('Lambda introduction is unavailable'));};document.head.append(s);});await lambdaJudgmentLoad;}if(owner!==current||selectionToken!==selectionSerial)return;
      lambdaHost.hidden=false;lambdaView=window.ProofAtlasLambdaJudgment.mount(lambdaHost,{data:owner.data,record:owner.record,typing:selectedTyping,judgmentRoute:{root:selectedRoute.root,slots:[...selectedRoute.slots]},ensureGeometry:geometryReady,onProofOccurrence:(node,route)=>safely(selectOccurrence(node,true,true,route)),onTypeComponent:component=>safely(openType(component))});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide lambda introduction';
     }finally{toggle.disabled=false;}
    })());
   }else if(current.kind(i)==='lam'&&!introductionTyping?.get(selectedRoute))typePanel.append(el('p','No checked introduction is recorded for this lambda. Its selected-term type remains available.'));


  }else typePanel.append(el('p',introductionTyping?.get(selectedRoute)?'A native-checked composed type is available for this exact path. Other rule premises require their own records.':contextSelection?(contextSelection.derivation.targetNativeObservation?'The separate closed-context evidence below retains a native term/type check for this exact route. Other rule premises require their own records.':'No individual native judgment is recorded for this exact route. A context-derived type from the separate representative is available below.'):moduleSupported?'A separate context-module observation is indexed for this exact path. Open it to validate its recorded term/type evidence. Other rule premises remain unavailable.':'No individual checked judgment is recorded for this exact occurrence path. No argument role is inferred from the constructor, declaration name or an enclosing match.'));
   if(introductionTyping?.get(selectedRoute)){const toggle=el('button','Show composed type'),host=el('div'),at={root:selectedRoute.root,slots:[...selectedRoute.slots]},provider=introductionTyping;toggle.type='button';toggle.setAttribute('aria-expanded','false');host.id='pl-composed-type';host.hidden=true;toggle.setAttribute('aria-controls',host.id);typePanel.append(toggle,host);toggle.onclick=()=>safely((async()=>{if(!host.hidden){introductionView?.dispose();introductionView=null;host.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show composed type';return;}toggle.disabled=true;try{await geometryReady();if(owner!==current||selectionToken!==selectionSerial)return;host.hidden=false;introductionView=window.ProofAtlasCompositionalTypes.mount(host,{data:owner.data,record:owner.record,typing:provider,route:at,onProofOccurrence:(node,route)=>{if(owner===current&&selectionToken===selectionSerial)safely(selectOccurrence(node,true,true,route));}});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide composed type';}finally{toggle.disabled=false;}})());}
   if(contextSelection){const toggle=el('button','Show context type'),host=el('div'),provider=contextTypes;toggle.type='button';toggle.setAttribute('aria-expanded','false');host.id='pl-context-type';host.hidden=true;toggle.setAttribute('aria-controls',host.id);typePanel.append(toggle,host);toggle.onclick=()=>safely((async()=>{if(!host.hidden){contextTypeView?.dispose();contextTypeView=null;host.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show context type';return;}toggle.disabled=true;host.setAttribute('aria-busy','true');try{await geometryReady();if(owner!==current||selectionToken!==selectionSerial||provider!==contextTypes)return;host.hidden=false;contextTypeView=window.ProofAtlasContextTypes.mount(host,{selected:contextSelection,typing:provider,data:owner.data,record:owner.record,attachUniverses,onProofOccurrence:(node,route)=>{if(owner===current&&selectionToken===selectionSerial&&provider===contextTypes)safely(selectOccurrence(node,true,true,route));}});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide context type';}catch(error){if(owner===current&&selectionToken===selectionSerial&&provider===contextTypes){host.hidden=false;host.textContent='Context type unavailable: '+error.message;toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide context type';}}finally{toggle.disabled=false;host.setAttribute('aria-busy','false');}})());}
   if(moduleSupported){const toggle=el('button','Show checked context module'),host=el('div');toggle.type='button';toggle.setAttribute('aria-expanded','false');host.hidden=true;host.id='pl-context-module';toggle.setAttribute('aria-controls',host.id);typePanel.append(toggle,host);toggle.onclick=()=>safely((async()=>{if(!host.hidden){clearContextModuleView();host.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show checked context module';return;}clearContextModuleView();contextModuleController=new AbortController();const signal=contextModuleController.signal;toggle.disabled=true;host.setAttribute('aria-busy','true');try{const provider=await contextModulesFor(owner);if(owner!==current||selectionToken!==selectionSerial||signal.aborted)return;const prepared=await provider.prepare(moduleRoute,{signal});if(owner!==current||selectionToken!==selectionSerial||signal.aborted)return;if(!prepared)throw Error('No exact native module observation');host.hidden=false;contextModuleView=(provider.kind==='native-source-context-module'?window.ProofAtlasSourceContextModuleView:window.ProofAtlasContextModuleView).mount(host,{provider,prepared,onOriginalOccurrence:(node,route)=>{if(owner===current&&selectionToken===selectionSerial&&!signal.aborted)safely(selectOccurrence(node,true,true,route));}});toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide checked context module';}catch(error){if(owner===current&&selectionToken===selectionSerial&&!signal.aborted){host.hidden=false;host.textContent='Checked context module unavailable: '+error.message;toggle.setAttribute('aria-expanded','true');toggle.textContent='Hide checked context module';}}finally{toggle.disabled=false;host.setAttribute('aria-busy','false');}})());}else typePanel.append(el('p','No native context module is recorded at this exact occurrence route.'));
   const rulesToggle=el('button','Show judgment geometry'),rulesHost=el('div'),rulesRoute={root:selectedRoute.root,slots:[...selectedRoute.slots]};rulesToggle.type='button';rulesToggle.setAttribute('aria-expanded','false');rulesToggle.setAttribute('aria-controls','pl-judgment-geometry');rulesHost.id='pl-judgment-geometry';rulesHost.hidden=true;typePanel.append(rulesToggle,rulesHost);
   rulesToggle.onclick=()=>safely((async()=>{if(!rulesHost.hidden){judgmentView?.dispose();judgmentView=null;rulesHost.hidden=true;rulesToggle.setAttribute('aria-expanded','false');rulesToggle.textContent='Show judgment geometry';return;}rulesToggle.disabled=true;try{if(!window.ProofAtlasJudgmentGeometry){if(!judgmentLoad)judgmentLoad=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/js/proof-atlas-judgment-geometry.js?v=16';script.onload=resolve;script.onerror=()=>{judgmentLoad=null;script.remove();reject(Error('Judgment geometry is unavailable'));};document.head.append(script);});await judgmentLoad;}let boundaryFailure=null;try{await boundaryReady();}catch(error){boundaryFailure=error.message;}let localFailure=null;if(window.ProofAtlasBoundaryLedger)try{await localRefinementReady();}catch(error){localFailure=error.message;}let constructors=null,constructorFailure=null;try{constructors=await constructorProvider(edition.id);}catch(error){constructorFailure=error.message;}if(owner!==current||selectionToken!==selectionSerial)return;rulesHost.hidden=false;judgmentView=window.ProofAtlasJudgmentGeometry.mount(rulesHost,{data:owner.data,record:owner.record,resolveTyping:route=>owner===current&&selectionToken===selectionSerial?chooseTyping(route):null,prepareScene:activePacket?async(options,{signal})=>activePacket.run(()=>{if(owner!==current||selectionToken!==selectionSerial)throw Error('Proof selection changed');return window.ProofAtlasJudgmentGeometry.create(owner.data,owner.record,r=>chooseTyping(r,true),{...options,constructorLookup:constructors?.layout});},{signal}):undefined,judgmentRoute:rulesRoute,initialGrouping:'context',initialPolicy:'proof-focus',sourceFallback:true,onSceneReady:(scene,local)=>{if(window.ProofAtlasBoundaryLedger&&owner===current&&selectionToken===selectionSerial)window.ProofAtlasBoundaryLedger.mount(rulesHost,{scene,prepare:()=>window.ProofAtlasBoundaryLedger.create(scene,owner.data),onExpand:local?.expand,expansionCapacity:local?.capacity||0,onFocus:r=>judgmentView?.focus(r),onSource:(node,r)=>{if(owner===current&&selectionToken===selectionSerial)safely(selectOccurrence(node,true,true,r));}});},constructorLookup:constructors?.layout,constructorScanner:constructors?.scan,constructorExpected:constructors?.expected,ensureGeometry:geometryReady,onProofOccurrence:(node,route)=>{if(owner===current&&selectionToken===selectionSerial)safely(selectOccurrence(node,true,true,route));}});if(boundaryFailure)rulesHost.append(el('p','Hidden-region list unavailable. The proof diagram remains available.'));if(localFailure)rulesHost.append(el('p','Local expansion unavailable. Source navigation remains available.'));if(constructorFailure)rulesHost.prepend(el('p','Native constructor layouts unavailable: '+constructorFailure+'. Recorded typing rules remain available.'));rulesToggle.setAttribute('aria-expanded','true');rulesToggle.textContent='Hide judgment geometry';}catch(error){if(owner===current&&selectionToken===selectionSerial){rulesHost.hidden=false;rulesHost.textContent='Judgment geometry unavailable: '+error.message;rulesToggle.setAttribute('aria-expanded','true');rulesToggle.textContent='Hide judgment geometry';}}finally{rulesToggle.disabled=false;}})());
  if(owner.data.kind[i]===8&&judgment?.letJudgment?.status!=='checked'&&judgment?.letReduction?.status!=='available')typePanel.append(el('p','No checked let-substitution record for this exact occurrence.'));target.append(typePanel);
  const snapshot=window.ProofAtlasLibrary.getSnapshot();
  if(snapshot.edition==='published-15'&&window.ProofAtlasProofStepIndex&&window.PROOF_ATLAS_PROOF_STEPS&&!document.getElementById('pa-sync-panel')){
   const index=window.ProofAtlasProofStepIndex.create(window.PROOF_ATLAS_PROOF_STEPS,window.PROOF_ATLAS_PROOF_STEPS.articleSha256);index.validate(snapshot,current.data,A);
   $('pl-downloads').querySelectorAll('[data-proof-step-link]').forEach(n=>n.remove());
   for(const match of index.resolve(snapshot)){const u=new URL('/projects/proof-atlas/article/',location.origin);u.searchParams.set('view','proof');u.searchParams.set('proof',snapshot.name);u.searchParams.set('route',snapshot.route.root+':'+snapshot.route.slots.join('.'));u.hash=match.passage.id;const a=link('Proof step: '+match.passage.title,u.pathname+u.search+u.hash);a.dataset.proofStepLink=match.passage.id;$('pl-downloads').append(a);}
  }
  window.dispatchEvent(new CustomEvent('proof-atlas:compiled-selection',{detail:snapshot}));
 }
 async function appendRows(){
  if(declarationLoading||!current||!selectedRoute)return;
  const token=selectionSerial,owner=current,ids=rowIds.slice(rowOffset,rowOffset+200);await owner.payloads(ids);if(owner!==current||token!==selectionSerial)return;
  for(const i of ids){const li=el('li'),b=el('button','e'+i+' := '+A.describe(current.data,i));b.type='button';b.dataset.occurrence=i;b.setAttribute('aria-pressed',String(i===selected));b.title=A.path(current.data,rowRoutes.get(i));const route=rowRoutes.get(i);b.onclick=()=>selectOccurrence(i,true,true,route);li.append(b);$('pl-rows').append(li);}
  rowOffset+=ids.length;const total=rowIds.length;$('pl-row-count').textContent=number(rowOffset)+' / '+number(total)+' distinct subterms shown. Repeated occurrences are represented by shared child links.';$('pl-more').hidden=rowOffset===total;
 }
 async function geometryReady(){
  if(window.ProofAtlasGeometry)return;
  if(!geometryLoad)geometryLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/js/proof-atlas-geometry-core.js?v=10';s.onload=resolve;s.onerror=()=>{geometryLoad=null;s.remove();reject(Error('Geometric language core is unavailable'));};document.head.append(s);});
  await geometryLoad;
 }
 function scopedLayout(){
  scene=window.ProofAtlasGeometry.create(current.data,current.record,{route:rootRoute||current.route(root),maxNodes:48,maxDepth:4,foldBinders,foldApplications});
  const byPath=new Map(),groups=new Map(),max=Math.max(1,...scene.nodes.map(n=>n.depth));
  for(const n of scene.nodes){if(!groups.has(n.depth))groups.set(n.depth,[]);groups.get(n.depth).push(n);}
  for(const n of scene.nodes){const group=groups.get(n.depth),t=n.abstraction==='binder-telescope',a=n.abstraction==='application-spine',p={id:n.node,path:n.id,route:n.route,x:n.depth/(max+1),y:(group.indexOf(n)+.5)/group.length,kind:current.data.kind[n.node],glyph:n.members?(t?'T':'@')+n.members.length:n.glyph,caption:n.kind==='const'?n.payload.name.split('.').slice(-2).join('.'):null,name:(t?n.members.length+'-entry telescope · ':a?n.members.length+'-argument spine · ':'')+label(n.node)+' · '+n.id+' · '+n.hidden+' hidden occurrences',collapsed:n.frontier};world.push(p);byPath.set(n.id,p);}
  for(const edge of scene.edges){const from=byPath.get(edge.from),to=byPath.get(edge.to),arg=edge.relation==='application-argument'?chooseTyping(from.route)?.argument?.(from.route,to.route):null;edges.push([from,to,'child',edge.field+(arg?' · '+arg.role:'')]);}
  const contexts=new Map(),boundaries=scene.links.filter(l=>l.relation==='bound-to'&&l.boundary),unique=[...new Set(boundaries.map(l=>l.target))];
  for(const l of boundaries)if(!contexts.has(l.target)){const p={id:l.node,path:l.target,route:l.route,x:1,y:(unique.indexOf(l.target)+.5)/unique.length,kind:current.data.kind[l.node],glyph:'↑',context:true,name:'Context binder · '+l.target};contexts.set(l.target,p);world.push(p);}
  for(const l of scene.links)if(l.relation==='bound-to')edges.push([byPath.get(l.from),byPath.get(l.displayTarget||l.target)||contexts.get(l.target),'binder',l.telescopeSlot?'slot '+l.telescopeSlot:undefined]);
  $('pl-scene-rows').replaceChildren();for(const p of world){const row=el('li'),b=el('button',(p.context?'Context binder':current.kind(p.id))+' · '+p.path);b.type='button';b.dataset.scenePath=p.path;b.onclick=()=>selectOccurrence(p.id,true,true,p.route);row.append(b);$('pl-scene-rows').append(row);}
  for(const n of scene.nodes)if(n.abstraction==='binder-telescope'){
   const details=el('details'),summary=el('summary',n.members.length+' binders · '+n.id+(n.truncated?' · prefix continues':''));details.dataset.telescopePath=n.id;details.append(summary,el('p','T denotes an ordered telescope, not a Lean constructor. Scope arrows identify its slots. Type and let-value regions are outside their own binder’s scope. These links open the original terms; no occurrence types are inferred.'));const list=el('ol');
   n.members.forEach((m,j)=>{const row=el('li'),b=el('button','Slot '+(j+1)+' · '+m.kind+' '+(m.payload.binderName||m.payload.declName||'_'));b.type='button';b.dataset.telescopeMember=m.path;b.onclick=()=>selectOccurrence(m.node,true,true,m.route);row.append(b);if(window.ProofAtlasBindingUses&&window.ProofAtlasRecursiveInputs){const use=el('button','Inspect binding references');use.type='button';use.dataset.bindingMember=m.path;use.onclick=()=>safely((async()=>{await selectOccurrence(m.node,true,true,m.route);$('pl-binding-toggle')?.click();})());row.append(use);}
    for(const region of m.regions){const q=el('button',region.field+' · before slot '+(j+1)+' · '+number(region.expanded)+' occurrences');q.type='button';q.dataset.telescopeRegion=region.path;q.title=region.path+'; enclosing scope requirement '+region.requiredScope;q.onclick=()=>selectOccurrence(region.node,true,true,region.route);row.append(q);}list.append(row);});
   const body=el('button','Open telescope continuation');body.type='button';body.dataset.telescopeContinuation=n.continuation.path;body.onclick=()=>selectOccurrence(n.continuation.node,true,true,n.continuation.route);details.append(list,body);$('pl-telescope-headers').append(details);
  }
  for(const n of scene.nodes)if(n.abstraction==='application-spine'){
   const details=el('details'),head=current.data.payloads[n.head.node],headName=n.spineComplete&&(head.name||current.kind(n.head.node)),summary=el('summary',n.arguments.length+' '+(n.truncated?'trailing slots · function spine continues': 'arguments · '+headName)+' · '+n.id);details.dataset.applicationPath=n.id;details.append(summary,el('p','@n groups n original Expr.app occurrences. head/arg links follow the original left-associated call order and keep the same lexical context. All arguments remain available below; at most six ports are drawn per group. Argument roles are shown only where a matching native type check is available. Application saturation is not inferred.'));
   const h=el('button',n.truncated?'Open remaining function spine':'Open head · '+headName);h.type='button';h.dataset.applicationHead=n.head.path;h.onclick=()=>selectOccurrence(n.head.node,true,true,n.head.route);details.append(h);const list=el('ol');
   n.arguments.forEach((a,j)=>{const row=el('li'),checked=chooseTyping(n.route)?.argument?.(n.route,a.route),q=el('button',(a.position===null?'Trailing slot ':'Argument ')+a.slot+' · '+current.kind(a.node)+' · '+(checked?'checked '+checked.role+' / '+checked.binderInfo:'role unavailable')+' · '+number(a.expanded)+' occurrences · '+(n.regions[j+1].displayed?'drawn':'collapsed'));q.type='button';q.dataset.applicationArgument=a.path;q.dataset.argumentRole=checked?.role||'unavailable';q.title=a.path;q.onclick=()=>selectOccurrence(a.node,true,true,a.route);const m=n.members[j],b=el('button','Original application '+a.slot);b.type='button';b.dataset.applicationMember=m.path;b.title=m.path;b.onclick=()=>selectOccurrence(m.node,true,true,m.route);row.append(q,b);list.append(row);});details.append(list);$('pl-application-headers').append(details);
  }
  const s=scene.stats;$('pl-graph-note').textContent='Scoped geometry prototype · '+s.displayed+' vertices'+(foldBinders||foldApplications?' retaining '+number(s.retainedOccurrences)+' kernel occurrences':' visible occurrences')+' + '+number(s.hidden)+' hidden = '+number(s.represented)+' represented. '+s.frontiers+' vertices with collapsed regions; '+s.scopeBoundaries+' links to enclosing context.'+(foldBinders?' Tn is an ordered binder telescope; dashed scope arrows name its slots.':'')+(foldApplications?' @n groups an application spine; head/argN are ordered abstract ports. Any proof/type/value labels come from separate native checks; arrows do not assert logical implication. Compact labels N:P/T/V mean argument N: proof/type/value.':'')+' Solid links retain constructor fields or the stated abstraction ports; dashed links are lexical binding. Layout positions are not a mathematical invariant.';
 }
 async function layout(){
  if(declarationLoading||!current||!selectedRoute)return;
  localModel?.dispose?.();localModel=null;world=[];edges=[];scene=null;$('pl-telescope-headers').replaceChildren();$('pl-application-headers').replaceChildren();$('pl-scene-details').hidden=mode!=='geometry';$('pl-scene-controls').hidden=mode!=='geometry';
  frame.hidden=mode!=='geometry'&&mode!=='shared';$('pl-legend').hidden=frame.hidden;$('pl-local-view').hidden=mode!=='term';$('pl-dependency-view').hidden=mode!=='dependencies';
  for(const id of ['pl-minus','pl-fit','pl-plus'])$(id).hidden=frame.hidden;
  if(mode==='term'){
   const owner=current,at=selectedRoute;await localReaderReady();if(declarationLoading||current!==owner||selectedRoute!==at||mode!=='term')return;
   localModel=window.ProofAtlasLocalReader.mount($('pl-local-view'),owner.data,at,(node,route)=>safely((async()=>{await selectOccurrence(node,true,true,route);if(current===owner&&mode==='term'&&A.path(owner.data,selectedRoute)===A.path(owner.data,route))$('pl-local-view').querySelector('.pl-local-select')?.focus();})()),{record:owner.record,isCurrent:()=>current===owner&&selectedRoute===at&&mode==='term'});points=localModel.nodes;
   $('pl-graph-note').textContent='Solid branches are ordered constructor fields. “Bound to” follows a lexical binder. Folded counts retain every descendant.';return;
  }else if(mode==='dependencies'){points=[];dependencyLayout();return;}
  else if(mode==='geometry'){await geometryReady();if(declarationLoading||!current||!selectedRoute)return;scopedLayout();}
  else{
   const graphRoutes=branchRoutes(root,rootRoute||current.route(root));
   const ids=A.reachable(current.data,root),visible=ids.slice(0,800),byId=new Map(),depth=new Map([[root,0]]);
   for(const id of visible)for(const c of children(id))depth.set(c,Math.max(depth.get(c)||0,(depth.get(id)||0)+1));
   const max=Math.max(...visible.map(i=>depth.get(i)||0),1),groups=new Map();
   for(const id of visible){const d=depth.get(id)||0;if(!groups.has(d))groups.set(d,[]);groups.get(d).push(id);}
   for(const id of visible){const d=depth.get(id)||0,group=groups.get(d),p={id,route:graphRoutes.get(id),x:d/max,y:(group.indexOf(id)+.5)/group.length,kind:current.data.kind[id],name:label(id),collapsed:children(id).some(c=>!visible.includes(c))};world.push(p);byId.set(id,p);}
   for(const id of visible)for(const c of children(id))if(byId.has(c))edges.push([byId.get(id),byId.get(c)]);
   const b=A.binder(current.data,selectedRoute);if(b!==undefined&&byId.has(selected)&&byId.has(b))edges.push([byId.get(selected),byId.get(b),'binder']);
   $('pl-graph-note').textContent=number(visible.length)+' / '+number(ids.length)+' distinct stored subterms in this diagnostic, representing '+number(current.data.expanded[root])+' occurrences. This storage layout does not summarize the mathematical argument. Ringed nodes have folded children.';
  }
  draw();
 }
 function draw(){
  if(frame.hidden)return;
  Object.assign(drawing,window.ProofAtlasDrawingTheme?.read(canvas)||{});if(drawing.palette)palette.splice(0,palette.length,...drawing.palette);document.querySelectorAll('#pl-legend i').forEach((n,i)=>n.style.background=palette[i]);
  const w=frame.clientWidth,h=frame.clientHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=drawing.paper;ctx.fillRect(0,0,w,h);
  const scale=Math.min(w-60,h-60)/(mode==='dependencies'?2:1)*zoom,cx=mode==='dependencies'?0:.5,cy=mode==='dependencies'?0:.5;
  const xScale=mode==='geometry'?(w-80)*zoom:scale,yScale=mode==='geometry'?(h-60)*zoom:scale;
  const point=p=>({x:w/2+(p.x-cx)*xScale+pan.x,y:h/2+(p.y-cy)*yScale+pan.y});
  for(const [a,b,type,field]of edges){const p=point(a),q=point(b);ctx.strokeStyle=type==='binder'?drawing.accent:drawing.muted;ctx.globalAlpha=mode==='dependencies'?.08:.32;ctx.setLineDash(mode==='geometry'&&type==='binder'?[4,4]:[]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([]);
   if(mode==='geometry'){const angle=Math.atan2(q.y-p.y,q.x-p.x),x=q.x-12*Math.cos(angle),y=q.y-12*Math.sin(angle);ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(x-6*Math.cos(angle-.45),y-6*Math.sin(angle-.45));ctx.lineTo(x,y);ctx.lineTo(x-6*Math.cos(angle+.45),y-6*Math.sin(angle+.45));ctx.stroke();if(field){const at=type==='binder'?.35:.5;let text=field;if(w<600){text=text.replace(/^arg(\d+) · (proof|type|value)$/,(_,n,r)=>n+':'+r[0].toUpperCase()).replace(/^arg(\d+)$/,'$1').replace('continuation','cont.');}ctx.font='10px '+drawing.sans;const x=p.x+(q.x-p.x)*at,y=p.y+(q.y-p.y)*at-4,width=ctx.measureText(text).width;ctx.fillStyle=drawing.paper;ctx.fillRect(x-width/2-2,y-9,width+4,12);ctx.textAlign='center';ctx.fillStyle=drawing.ink;ctx.fillText(text,x,y);ctx.textAlign='start';}}
  }
  ctx.globalAlpha=1;points=[];for(const n of world){const p=point(n),active=mode==='dependencies'?n.id===current.record.name:mode==='geometry'?n.path===A.path(current.data,selectedRoute):n.id===selected;ctx.fillStyle=active?drawing.warm:palette[n.kind];ctx.beginPath();
   if(mode==='geometry'){
    if([6,7,8].includes(n.kind))ctx.rect(p.x-13,p.y-10,26,20);
    else if([0,1,2,4].includes(n.kind)){ctx.moveTo(p.x,p.y-12);ctx.lineTo(p.x+12,p.y);ctx.lineTo(p.x,p.y+12);ctx.lineTo(p.x-12,p.y);ctx.closePath();}
    else ctx.arc(p.x,p.y,n.glyph.length>2?14:11,0,Math.PI*2);ctx.fill();ctx.font='bold 12px '+drawing.sans;ctx.textAlign='center';ctx.fillStyle=drawing.paper;ctx.fillText(n.glyph,p.x,p.y+4);ctx.textAlign='start';
    if(n.caption){ctx.font='11px '+drawing.sans;ctx.fillStyle=drawing.ink;const column=xScale/(Math.max(1,...scene.nodes.map(n=>n.depth))+1),available=Math.min(150,w-p.x-22,column-36);let caption=n.caption;if(available>30){while(caption.length>1&&ctx.measureText(caption).width>available)caption=caption.slice(0,-2)+'…';ctx.fillText(caption,p.x+17,p.y+4);}}
   }else{ctx.arc(p.x,p.y,active?6:3,0,Math.PI*2);ctx.fill();}
   if(n.collapsed){ctx.strokeStyle=drawing.accent;ctx.beginPath();ctx.arc(p.x,p.y,mode==='geometry'?16:6,0,Math.PI*2);ctx.stroke();}points.push({...n,...p});}

 }
 function safely(p){Promise.resolve(p).catch(e=>setStatus(e.message,declarationLoading));}
 $('pl-edition').onchange=()=>{chooseEdition($('pl-edition').value);safely(selectDeclaration(edition.declarations.find(d=>d.name==='JacobiFull.exact_first_time')?.name||edition.declarations[0].name));};
 $('pl-module').onchange=inventory;$('pl-search').oninput=inventory;$('pl-declaration').onchange=()=>safely(selectDeclaration($('pl-declaration').value));
 $('pl-term-download').onclick=()=>{const data=current.data,root=selected,text='Decoded kernel term with sharing retained. eN refers to a shared node; bound variable indices are contextual. This is not the original tactic script.\nRoot: e'+root+'\n\n'+A.termLines(data,root).join('\n'),a=document.createElement('a'),u=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.href=u;a.download=current.record.name+'-compiled-node-'+root+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
 $('pl-go').onclick=()=>safely(selectOccurrence(Number($('pl-occurrence').value),true));$('pl-parent').onclick=()=>{if(declarationLoading||!current||!selectedRoute)return;const r={root:selectedRoute.root,slots:selectedRoute.slots.slice(0,-1)};safely(selectOccurrence(A.walk(current.data,r),true,true,r));};$('pl-more').onclick=()=>safely(appendRows());
 for(const [id,value]of [['pl-term-view','term'],['pl-geometry-view','geometry'],['pl-deps-view','dependencies'],['pl-shared-view','shared']])$(id).onclick=()=>safely((async()=>{if(value==='geometry')await geometryReady();mode=value;for(const[k,m]of [['pl-term-view','term'],['pl-geometry-view','geometry'],['pl-deps-view','dependencies'],['pl-shared-view','shared']])$(k).setAttribute('aria-pressed',String(mode===m));zoom=1;pan={x:0,y:0};await layout();updateLocation();})());
 $('pl-telescope-toggle').onclick=()=>safely((async()=>{foldBinders=!foldBinders;$('pl-telescope-toggle').setAttribute('aria-pressed',String(foldBinders));await layout();updateLocation();})());
 $('pl-application-toggle').onclick=()=>safely((async()=>{foldApplications=!foldApplications;$('pl-application-toggle').setAttribute('aria-pressed',String(foldApplications));await layout();updateLocation();})());
 $('pl-minus').onclick=()=>{zoom=Math.max(.2,zoom/1.3);draw();};$('pl-plus').onclick=()=>{zoom=Math.min(30,zoom*1.3);draw();};$('pl-fit').onclick=()=>{zoom=1;pan={x:0,y:0};draw();};
 function nearestPoint(x,y){
  let nearest=null,distance=mode==='geometry'?16:9;
  for(const point of points){const next=Math.hypot(point.x-x,point.y-y);if(next<distance){nearest=point;distance=next;}}
  return nearest;
 }
 canvas.onpointerdown=e=>{drag={x:e.offsetX,y:e.offsetY,px:pan.x,py:pan.y,moved:false};canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(drag){const x=e.offsetX-drag.x,y=e.offsetY-drag.y;drag.moved=drag.moved||Math.hypot(x,y)>4;pan={x:drag.px+x,y:drag.py+y};draw();}else{const n=nearestPoint(e.offsetX,e.offsetY);canvas.title=n?n.name:'';}};
 canvas.onpointerup=e=>{if(drag&&!drag.moved){const n=nearestPoint(e.offsetX,e.offsetY);if(n)safely(mode==='dependencies'?selectDeclaration(n.id):selectOccurrence(n.id,true,true,n.route));}drag=null;};
 canvas.onwheel=e=>{e.preventDefault();zoom=Math.max(.2,Math.min(30,zoom*Math.exp(-e.deltaY*.001)));draw();};
 new ResizeObserver(()=>{if(current)draw();}).observe(frame);
 window.ProofAtlasDrawingTheme?.subscribe(()=>{if(current)draw();});
 $('pl-library').addEventListener('click',e=>{
  const a=e.target.closest('a');
  if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target||a.hasAttribute('download'))return;
  const u=new URL(a.href,location.href);
  if(u.origin!==location.origin||u.searchParams.get('view')==='occurrence')return;
  if(u.pathname!==location.pathname && !(document.getElementById('pa-sync-panel')&&u.pathname==='/projects/proof-atlas/library/'))return;
  const proof=u.searchParams.get('proof');
  if(!proof)return;
  const route=u.searchParams.get('route')?.match(/^(\d+):(\d+(?:\.\d+)*)?$/);
  const at=route?{root:Number(route[1]),slots:route[2]?route[2].split('.').map(Number):[]}:undefined;
  const id=u.hash.match(/^#expr-(\d+)$/),node=id?Number(id[1]):undefined;
  e.preventDefault();
  if(edition.id===u.searchParams.get('edition')&&current?.record.name===proof&&at&&node!==undefined){
   safely(selectOccurrence(node,true,true,at));return;
  }
  if(u.searchParams.get('edition')!==edition.id)chooseEdition(u.searchParams.get('edition'));
  safely(selectDeclaration(proof,node,true,at));
 });
 function clearSelection(){localModel?.dispose?.();localModel=null;declarationLoading=false;selectedRoute=null;rootRoute=null;rowIds=[];rowRoutes=new Map();rowOffset=0;$('pl-parent').disabled=true;$('pl-more').hidden=true;corridorControl?.dispose();corridorControl=null;resetContextModules();contextTypeView?.dispose();contextTypeView=null;contextTypes=null;introductionView?.dispose();introductionView=null;referenceView?.dispose();referenceView=null;referenceTyping=null;introductionTyping=null;applicationTypes=null;judgmentView?.dispose();judgmentView=null;sourceUniverses?.dispose();sourceUniverses=null;letRequestController?.abort();letMetadataController?.abort();letTyping?.dispose?.();caseView?.dispose();caseView=null;conversionView?.dispose();conversionView=null;letView?.dispose();letView=null;bindingView?.dispose();bindingView=null;betaView?.dispose();betaView=null;typeView?.dispose();typeView=null;applicationView?.dispose();applicationView=null;lambdaView?.dispose();lambdaView=null;serial++;selectionSerial++;current=null;typing=null;useSiteTyping=null;packetCursor?.dispose();packetCursor=null;packetTyping=null;betaTyping=null;letTyping=null;caseTyping=null;projectionTyping=null;scene=null;$('pl-typing-note').textContent='';points=[];world=[];edges=[];$('pl-scene-rows').replaceChildren();$('pl-telescope-headers').replaceChildren();$('pl-application-headers').replaceChildren();$('pl-scene-details').hidden=true;$('pl-scene-controls').hidden=true;$('pl-rows').replaceChildren();$('pl-expression').replaceChildren();$('pl-mobile-source').textContent='';$('pl-local-view').replaceChildren();$('pl-dependency-view').replaceChildren();localModel=null;ctx.clearRect(0,0,canvas.width,canvas.height);}
 window.ProofAtlasLibrary={getSourceApplicationScene:()=>localModel?.getSourceApplicationScene?.()||null,getSourceApplicationState:()=>localModel?.getSourceApplicationState?.()||null,selectDeclaration,selectOccurrence,clearSelection,getSnapshot:()=>!declarationLoading&&current&&selectedRoute?{edition:edition.id,name:current.record.name,selected,root,mode,occurrences:current.record.occurrences,uniqueNodes:current.record.uniqueNodes,path:A.path(current.data,selectedRoute),route:{root:selectedRoute.root,slots:[...selectedRoute.slots]},sourceSha256:current.record.sourceSha256,indexSha256:current.record.indexSha256,rendered:points.length}:null,getData:()=>current?.data,getSourceCorridor:()=>corridorControl?.getScene()||null,getNativePageState:()=>packetCursor?.state()||null,getUseSiteCoverage:()=>useSiteTyping?{checked:useSiteTyping.checked,queried:useSiteTyping.queried,sha256:useSiteTyping.sha256,delivery:'resident',queryLimit:32,byteLimit:524288}:null,getScene:()=>scene,getTypeScene:()=>typeView?.getScene()||null,getContextTypeScene:()=>contextTypeView?.getScene()||null,getContextModuleScene:()=>contextModuleView?.getScene()||null,getContextModuleSelection:()=>contextModuleView?.getSelection()||null,getContextModuleRawTypeScene:()=>contextModuleView?.getRawTypeScene()||null,getContextModuleState:()=>contextModuleData?.state()||null,getContextModuleCoverage:()=>!declarationLoading&&contextModuleData?{...(contextModuleData.coverage?.()||{checked:contextModuleData.checked,modules:contextModuleData.modules??contextModuleData.classes,kind:contextModuleData.kind||'checked-context-module',instantiations:contextModuleData.instantiations}),...contextModuleData.state()}:null,getContextTypeCoverage:()=>!declarationLoading&&contextTypes?{checked:contextTypes.checked,classes:contextTypes.classes,conversions:contextTypes.conversions,sha256:contextTypes.sha256,...contextTypes.state()}:null,getJudgmentScene:()=>judgmentView?.getScene()||null,getSourceCutRecord:()=>judgmentView?.getSourceCutRecord()||null,getSourceCutState:()=>judgmentView?.getSourceCutState()||null,getLocalRefinementState:()=>judgmentView?.getRefinementState()||null,getReferenceScene:()=>referenceView?.getScene()||null,getApplicationTypeCoverage:()=>!declarationLoading&&applicationTypes?{checked:applicationTypes.checked,sha256:applicationTypes.sha256,...applicationTypes.state()}:null,getComposedTypeScene:()=>introductionView?.getScene()||null,getComposedTypeCoverage:()=>!declarationLoading&&introductionTyping?{checked:introductionTyping.checked,sha256:introductionTyping.sha256,...introductionTyping.state()}:null,getReferenceCoverage:()=>!declarationLoading&&referenceTyping?{checked:referenceTyping.checked,sha256:referenceTyping.sha256}:null,getProjectionCoverage:()=>!declarationLoading&&projectionTyping?{checked:projectionTyping.checked,queried:projectionTyping.queried,sha256:projectionTyping.sha256}:null,getConstructorScan:()=>judgmentView?.getConstructorScan()||null,getExpectedExpression:()=>judgmentView?.getExpectedExpression()||null,getExpectedScene:()=>judgmentView?.getExpectedScene()||null,getJudgmentPoint:path=>judgmentView?.getPoint(path)||null,getUniverseScene:(kind='source',side)=>kind==='context'?contextTypeView?.getUniverseScene()||null:kind==='type'?typeView?.getUniverseScene()||null:kind==='conversion'?conversionView?.getUniverseScene(side)||null:kind==='let'?letView?.getUniverseScene()||null:kind==='beta'?betaView?.getUniverseScene()||null:sourceUniverses?.getScene()||null,getUniversePoint:path=>sourceUniverses?.getPoint(path)||null,getConversionScene:()=>conversionView?.getScene()||null,getConversionPoint:(side,path)=>conversionView?.getPoint(side,path)||null,getApplicationJudgment:()=>applicationView?.getScene()||null,getLambdaJudgment:()=>lambdaView?.getScene()||null,getEliminationRule:()=>caseView?.getScene()||null,getMethodScene:minor=>caseView?.getMethodScene(minor)||null,getMethodFlowScene:minor=>caseView?.getMethodFlowScene(minor)||null,getCaseComposition:()=>caseView?.getComposition()||null,getUseInput:()=>bindingView?.getUseInput()||null,getBindingUseWitness:()=>bindingView?.getWitness()||null,getBindingUses:()=>bindingView?.getScene()||null,openBindingUses:()=>{const toggle=$('pl-binding-toggle');if(toggle?.getAttribute('aria-expanded')==='false')toggle.click();},getKernelRuleScene:minor=>caseView?.getRuleScene(minor)||null,getEliminationCoverage:()=>!declarationLoading&&caseTyping?{checked:caseTyping.checked,queried:caseTyping.queried,sha256:caseTyping.sha256}:null,getLetScene:()=>letView?.getScene()||null,getLetLoadState:()=>window.ProofAtlasLetPools?.state()||null,getLetCoverage:()=>!declarationLoading&&letTyping?{checked:letTyping.checked,queried:letTyping.queried,sha256:letTyping.sha256}:null,getBetaScene:()=>betaView?.getScene()||null,getBetaCoverage:()=>!declarationLoading&&betaTyping?{checked:betaTyping.checked,sha256:betaTyping.sha256}:null,getTypePoint:path=>typeView?.getPoint(path)||null,getTypeJudgment:route=>!declarationLoading&&current&&(route||selectedRoute)?(chooseTyping(route||selectedRoute)?.get(route||selectedRoute)||null):null,getTypeCoverage:()=>!declarationLoading&&current&&typing?{source:typing.source,sha256:typing.sha256,checked:typing.checked,queried:typing.queried,observed:typing.observed,typedOccurrences:typing.typedOccurrences}:null,getOccurrencePoint:path=>points.find(p=>p.path===path),getPoint:i=>points.find(p=>p.id===i)};
 lib.editions.forEach(e=>{const o=el('option',e.id==='published-15'?'Published article · 15 modules':(e.label||e.id)+' · '+e.counts.modules+' modules');o.value=e.id;$('pl-edition').append(o);});
 const params=new URLSearchParams(location.search);chooseEdition(params.get('edition'));
 if(document.getElementById('pa-sync-panel'))return;
 if(params.get('geometry')==='scoped'){await geometryReady();mode='geometry';const folds=(params.get('fold')||'').split(',');foldBinders=folds.includes('binders');foldApplications=folds.includes('applications');$('pl-telescope-toggle').setAttribute('aria-pressed',String(foldBinders));$('pl-application-toggle').setAttribute('aria-pressed',String(foldApplications));$('pl-term-view').setAttribute('aria-pressed','false');$('pl-geometry-view').setAttribute('aria-pressed','true');}
 if(['shared','dependencies'].includes(params.get('view'))){mode=params.get('view');$('pl-term-view').setAttribute('aria-pressed','false');$(mode==='shared'?'pl-shared-view':'pl-deps-view').setAttribute('aria-pressed','true');}
 const name=params.get('proof')||edition.declarations.find(d=>d.name==='JacobiFull.exact_first_time')?.name||edition.declarations[0].name;
 const route=params.get('route')?.match(/^(\d+):([\d.]*)$/);await selectDeclaration(name,location.hash.match(/^#expr-(\d+)$/)?Number(location.hash.slice(6)):undefined,true,route?{root:Number(route[1]),slots:route[2]?route[2].split('.').map(Number):[]}:undefined);
})().catch(e=>{const n=document.getElementById('pl-status');if(n)n.textContent=e.message;});
