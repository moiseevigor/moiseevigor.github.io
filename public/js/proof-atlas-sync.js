/* One article selection and one path-qualified compiled term selection. No source scripts. */
(function(){
 'use strict';
 const paper=document.querySelector('.pa-paper'),panel=document.getElementById('pa-sync-panel');if(!paper||!panel)return;
 const $=id=>document.getElementById(id),toggle=document.querySelector('[data-pa-sync]');
 const layout=document.createElement('div');layout.className='pa-sync-layout';paper.before(layout);layout.append(paper,panel);
 let argumentReady,argument,indexMetadata,metadata,engine,active=null,revision=0,opened=false,pending=0;
 const targets=new Map(),status=$('pa-sync-status'),chooser=$('pa-sync-declaration');
 function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('Could not load correspondence data. Retry the synchronized view.'));};document.head.append(s);});}
 async function indexReady(){
  if(!indexMetadata)indexMetadata=Promise.all([
   window.PROOF_ATLAS_ARTICLE_INDEX||script('/public/data/proof-atlas/crossing-article-index.js?v=2'),
   window.PROOF_ATLAS_ARTICLE_COVERAGE||script('/public/data/proof-atlas/article-coverage.js?v=1'),
   window.PROOF_ATLAS_PROOF_STEPS||script('/public/data/proof-atlas/article-proof-steps.js?v=2'),
   window.ProofAtlasProofStepIndex||script('/public/js/proof-atlas-proof-step-index.js?v=1')
  ]).then(()=>{
   const index=window.PROOF_ATLAS_ARTICLE_INDEX,coverage=window.PROOF_ATLAS_ARTICLE_COVERAGE;
   if(index.source.sha256!==paper.dataset.sourceSha256||coverage.articleSha256!==paper.dataset.sourceSha256)throw Error('Article and correspondence hashes differ. Synchronization is disabled.');
   for(const p of index.passages)register(p.htmlAnchor,p.title,index.anchors.some(a=>a.passage===p.id)?[...new Set(['CrossingData.crossing',...p.declarations])]:p.declarations,'passage',p.note);
   for(const t of coverage.statements)register(t.htmlAnchor,t.title,t.id==='crossing'?['CrossingData.crossing']:t.declarations.map(d=>d.name),'statement',t.status==='partial'?'Partial, conditional counterpart. '+t.missing.join(' '):'Not formalized in the published snapshot.');
   for(const proof of paper.querySelectorAll('.proof')){
    const anchor=proof.id.replace(/^proof-/,'').replace(/^(lem|thm)-/,'$1:'),t=targets.get(anchor);
    register(proof.id,'Proof of '+(t?.title||anchor),t?.names||[],'proof','Whole-proof context. Indexed nodes and the marked article passages identify specific steps; other nodes retain broader context.');
   }
   const steps=window.ProofAtlasProofStepIndex.create(window.PROOF_ATLAS_PROOF_STEPS,paper.dataset.sourceSha256);if(!steps.valid)throw Error('Proof-step index does not match this article.');
   for(const p of steps.passages){register(p.id,p.title,p.declarations,'proof-step',p.note);Object.assign(targets.get(p.id),{articleAnchor:p.articleAnchor,defaultDeclaration:p.defaultDeclaration,defaultPath:p.defaultPath});}
   return{index,coverage,steps};
  }).catch(e=>{indexMetadata=null;throw e;});return indexMetadata;
 }
 async function metadataReady(){
  if(!metadata)metadata=(async()=>{
   const {index,coverage,steps}=await indexReady();if(!window.PROOF_ATLAS_LIBRARY)await script('/public/data/proof-atlas/library-manifest.js');
   const edition=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15');if(!edition)throw Error('Published compiled edition is unavailable.');
   const records=new Map(edition.declarations.map(d=>[d.name,d]));
   // Bridge audited against this immutable packet, not a similarly named later proof.
   if(records.get('CrossingData.crossing')?.indexSha256!=='b1f3867250131bf76d40e9dca395e29595ccf8d4bb49c8e075ba40213b33057a')throw Error('Crossing occurrence index does not match the audited compiled proof.');
   for(const t of targets.values())if(t.kind==='proof'){
    const anchor=t.id.replace(/^proof-/,'').replace(/^(lem|thm)-/,'$1:');
    t.names=[...new Set([...t.names,...edition.declarations.filter(d=>d.articleAnchor===anchor).map(d=>d.name)])];
   }
   return{index,coverage,steps,edition,records};
  })().catch(e=>{metadata=null;throw e;});return metadata;
 }

 function register(id,title,names,kind,note){
  const element=document.getElementById(id);if(!element)throw Error('Missing article correspondence anchor: '+id);
  targets.set(id,{id,title,names,kind,note});element.dataset.syncAnchor=id;element.tabIndex=0;element.setAttribute('aria-label',title+'; press Enter to compare with compiled Lean');
 }
 async function engineReady(){
  if(!engine)engine=(async()=>{
   await metadataReady();if(!window.ProofAtlasLibraryData)await script('/public/js/proof-atlas-library-data.js?v=3');
   try{
    if(!window.PROOF_ATLAS_OCCURRENCE_TYPES)await script('/public/data/proof-atlas/occurrence-types-manifest.js?v=4');
    if(!window.ProofAtlasOccurrenceTypes)await script('/public/js/proof-atlas-occurrence-types.js?v=9');
   }catch(_){/* Optional type evidence must not block the original compiled reader. */}
   try{
    if(!window.PROOF_ATLAS_BETA_REDUCTIONS)await script('/public/data/proof-atlas/beta-reductions-manifest.js?v=1');
    if(!window.ProofAtlasBetaReduction)await script('/public/js/proof-atlas-beta-reduction.js?v=8');
    if(!window.ProofAtlasLetPools)await script('/public/js/proof-atlas-let-pools.js?v=2');
    if(!window.ProofAtlasLetReduction)await script('/public/js/proof-atlas-let-reduction.js?v=3');
   }catch(_){/* Optional reduction evidence must not block the original compiled reader. */}
   try{
    if(!window.PROOF_ATLAS_ELIMINATIONS)await script('/public/data/proof-atlas/eliminations-manifest.js?v=1');
    if(!window.ProofAtlasRecursiveInputs)await script('/public/js/proof-atlas-recursive-inputs.js?v=3');
    if(!window.ProofAtlasElimination)await script('/public/js/proof-atlas-elimination.js?v=3');
   }catch(_){/* Optional elimination evidence must not block the original reader. */}
   try{if(!window.PROOF_ATLAS_PROJECTIONS)await script('/public/data/proof-atlas/projections-manifest.js?v=1');}catch(_){/* Optional projection evidence leaves the source graph available. */}
   try{if(!window.ProofAtlasBindingUses&&window.ProofAtlasRecursiveInputs)await script('/public/js/proof-atlas-binding-uses.js?v=1');}catch(_){/* Optional reference counts do not block the source reader. */}
   try{if(!window.PROOF_ATLAS_SOURCE_REFERENCES)await script('/public/data/proof-atlas/source-references-manifest.js?v=1');if(!window.ProofAtlasSourceReferenceExamples)await script('/public/js/proof-atlas-source-reference-examples.js?v=1');if(!window.PROOF_ATLAS_LIBRARY.editions.some(e=>e.id==='source-reference-controls'))window.PROOF_ATLAS_LIBRARY=window.ProofAtlasSourceReferenceExamples.register(window.PROOF_ATLAS_LIBRARY,window.PROOF_ATLAS_SOURCE_REFERENCES);}catch(_){/* Optional controls preserve the original inventories. */}
   try{for(const [name,url]of [['ProofAtlasExpressionViews','/public/js/proof-atlas-expression-views.js?v=1'],['ProofAtlasSourceReferences','/public/js/proof-atlas-source-references.js?v=1']])if(!window[name])await script(url);}catch(_){/* Optional source-backed types preserve source navigation. */}
   try{if(!window.PROOF_ATLAS_COMPOSITIONAL_TYPES)await script('/public/data/proof-atlas/compositional-types-manifest.js?v=1');}catch(_){/* Optional type compositions preserve the source reader. */}
   try{if(!window.PROOF_ATLAS_APPLICATION_TYPES)await script('/public/data/proof-atlas/application-types-manifest.js?v=1');}catch(_){/* Optional application types preserve the source reader. */}
   try{if(!window.PROOF_ATLAS_CONTEXT_TYPES)await script('/public/data/proof-atlas/context-types-manifest.js?v=1');}catch(_){/* Optional context evidence preserves the source reader. */}
   if(!window.ProofAtlasLibrary)await script('/public/js/proof-atlas-library.js?v=32');
   if(!$('pl-provenance').closest('details')){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Provenance and axiom dependencies';$('pl-provenance').before(details);details.append(summary,$('pl-provenance'));}
   return window.ProofAtlasLibrary;
  })().catch(e=>{engine=null;throw e;});return engine;
 }
 function clearHighlight(){paper.querySelectorAll('.pa-sync-selected').forEach(n=>n.classList.remove('pa-sync-selected'));}
 function highlight(id,scroll=false){
  clearHighlight();const target=document.getElementById(id);if(!target)return;
  target.classList.add('pa-sync-selected');for(let p=target.parentElement;p&&p!==paper;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
  $('pa-sync-back').href='#'+id;$('pa-sync-back').textContent='Article: '+(targets.get(id)?.title||'selected paragraph');
  if(scroll)target.scrollIntoView({block:'center',behavior:'auto'});
 }
 async function geometry(target,snapshot){
  const host=$('pa-riccati-geometry');host.hidden=target?.articleAnchor!=='lem:riccati'&&target?.id!=='lem:riccati'&&target?.id!=='proof-lem-riccati';
  if(host.hidden)return;
  if(!argumentReady)argumentReady=(async()=>{
   if(!window.ProofAtlasRiccatiGeometry)await script('/public/js/proof-atlas-riccati-geometry.js?v=1');
   argument=window.ProofAtlasRiccatiGeometry.mount($('pa-riccati-argument'),window.PROOF_ATLAS_PROOF_STEPS,async anchor=>{
    try{
     await selectArticle(anchor.step,anchor.declaration);
     if(!anchor.path||!window.ProofAtlasLibrary?.getData())return;
     const api=window.ProofAtlasLibrary,mapped=routeFromPath(api.getData(),anchor.path);await api.selectOccurrence(mapped.node,true,false,mapped.route);
    }catch(e){unavailable(e.message);}
   });
  })().catch(e=>{argumentReady=null;throw e;});
  await argumentReady;if(active?.id!==target?.id||!opened)return;argument.select(snapshot);
 }
 function unavailable(text){
  const u=new URL(location.href);u.searchParams.delete('proof');u.searchParams.delete('route');if(active)u.hash=active.id;history.replaceState(null,'',u);
  window.ProofAtlasLibrary?.clearSelection();$('pa-sync-proof').hidden=true;$('pa-sync-empty').hidden=false;$('pa-sync-empty').textContent=text;chooser.replaceChildren();chooser.disabled=true;
  if(active&&!active.names.length)geometry(active,null).catch(e=>{status.textContent=e.message;});else $('pa-riccati-geometry').hidden=true;showStepChoices([],null);status.textContent=text;panel.dataset.match='unmapped';
 }
 function close(){opened=false;revision++;panel.hidden=true;delete document.body.dataset.paSync;toggle.setAttribute('aria-pressed','false');document.querySelector('[data-pa-reading=article]').setAttribute('aria-pressed','true');$('pa-reading-status').textContent='Centered reading';const u=new URL(location.href);if(u.searchParams.get('view')==='proof'){u.searchParams.delete('view');u.searchParams.delete('proof');u.searchParams.delete('route');history.replaceState(null,'',u);}}
 async function open(){
  if(opened)return;await window.ProofAtlasArticle?.mode('article',false);opened=true;panel.hidden=false;document.body.dataset.paSync='open';toggle.setAttribute('aria-pressed','true');document.querySelector('[data-pa-reading=article]').setAttribute('aria-pressed','false');$('pa-reading-status').textContent='Synchronized reading';const u=new URL(location.href);u.searchParams.set('view','proof');history.replaceState(null,'',u);
  try{await metadataReady();}catch(e){unavailable(e.message);throw e;}
 }
 function options(target,chosen,records){
  chooser.replaceChildren();for(const name of target.names){if(!records.has(name))continue;const o=document.createElement('option');o.value=name;o.textContent=name;chooser.append(o);}chooser.disabled=!chooser.options.length;if(chosen)chooser.value=chosen;
 }
 function routeFromPath(data,path){
  const root=data.declaration.rootPaths.findIndex(p=>path===p||path.startsWith(p+'.'));if(root<0)throw Error('Indexed root is absent from the compiled proof');
  let node=data.roots[root];const slots=[];for(const field of path.slice(data.declaration.rootPaths[root].length).split('.').filter(Boolean)){
   const slot=(window.ProofAtlasLibraryData.fields[window.ProofAtlasLibraryData.kinds[data.kind[node]]]||[]).indexOf(field);if(slot<0)throw Error('Indexed expression path is absent from the compiled proof');slots.push(slot);node=data.children[node][slot];
  }return{node,route:{root,slots}};
 }
 async function selectArticle(id,name,scroll=false){
  const token=++revision;panel.dataset.match='loading';await open();const m=await metadataReady();if(token!==revision)return;
  active=targets.get(id)||null;showStepChoices([],null);highlight(id,scroll);
  if(!active){unavailable('No indexed Lean correspondence for this paragraph.');return;}
  name=name||active.defaultDeclaration||active.names.find(n=>n==='CrossingData.crossing')||active.names[0];options(active,name,m.records);
  if(active.kind==='proof-step'&&!active.names.includes(name)){unavailable('This declaration has no indexed counterpart for the selected proof step.');return;}
  if(!name||!m.records.has(name)){unavailable(active.note||'No compiled Lean counterpart is indexed for this passage.');return;}
  $('pa-sync-proof').hidden=false;$('pa-sync-empty').hidden=true;panel.dataset.match='loading';status.textContent='Loading '+name+'…';
  pending++;try{
   const api=await engineReady();if(token!==revision)return;
   await api.selectDeclaration(name,undefined,false);if(token!==revision)return;
   if(active.kind==='proof-step'){
    m.steps.validate(api.getSnapshot(),api.getData(),window.ProofAtlasLibraryData);
    const anchor=m.steps.anchors.find(a=>a.step===id&&a.declaration===name&&a.path===active.defaultPath)||m.steps.anchors.find(a=>a.step===id&&a.declaration===name);
    if(!anchor)throw Error('No exact compiled path is indexed for this proof step.');const mapped=routeFromPath(api.getData(),anchor.path);await api.selectOccurrence(mapped.node,true,false,mapped.route);if(token!==revision)return;
   }
   if(name==='CrossingData.crossing'){
    const anchors=m.index.anchors.filter(a=>m.index.passages.find(p=>p.id===a.passage)?.htmlAnchor===id);
    // Prefer a proof expression over the statement occurrence when both are indexed.
    const anchor=anchors.find(a=>a.path.startsWith('root.value'))||anchors[0];
    if(anchor){const mapped=routeFromPath(api.getData(),anchor.path);await api.selectOccurrence(mapped.node,true,false,mapped.route);if(token!==revision)return;}
   }
   const snapshot=api.getSnapshot();panel.dataset.match=active.kind==='proof-step'?'indexed':active.kind==='passage'&&name==='CrossingData.crossing'&&m.index.anchors.some(a=>m.index.passages.find(p=>p.id===a.passage)?.htmlAnchor===id)?'indexed':'context';
   status.textContent=active.title+' · '+(panel.dataset.match==='indexed'?(active.kind==='proof-step'?'Indexed proof step. ':'Indexed expression correspondence. '):active.kind==='statement'?'Declaration counterpart. ':'Proof context. ')+active.note;
   history.replaceState(null,'','#'+encodeURIComponent(id));
   await geometry(active,snapshot);if(token!==revision)return;emit(snapshot);
  }catch(e){if(token===revision)unavailable(e.message);}finally{pending--;}
 }
 function emit(snapshot){if(snapshot){const u=new URL(location.href);u.searchParams.set('view','proof');u.searchParams.set('proof',snapshot.name);u.searchParams.set('route',snapshot.route.root+':'+snapshot.route.slots.join('.'));if(active)u.hash=active.id;history.replaceState(null,'',u);}window.dispatchEvent(new CustomEvent('proof-atlas:synchronized',{detail:{article:active?.id||null,match:panel.dataset.match,compiled:snapshot}}));}
 function showStepChoices(matches,selected){
  const host=$('pa-sync-step-choices');host.replaceChildren();host.hidden=matches.length<2;
  if(matches.length<2)return;const label=document.createElement('p');label.textContent='This helper also corresponds to:';host.append(label);
  for(const m of matches){const b=document.createElement('button');b.type='button';b.textContent=m.passage.title;b.setAttribute('aria-pressed',String(m===selected));b.onclick=()=>{active=targets.get(m.passage.id);highlight(active.id,true);status.textContent=active.title+' · '+active.note;options(active,window.ProofAtlasLibrary.getSnapshot().name,new Map(window.PROOF_ATLAS_LIBRARY.editions[0].declarations.map(d=>[d.name,d])));geometry(active,window.ProofAtlasLibrary.getSnapshot()).catch(e=>{status.textContent=e.message;});emit(window.ProofAtlasLibrary.getSnapshot());showStepChoices(matches,m);};host.append(b);}
 }
 async function fromCompiled(snapshot){
  if(!opened||pending)return;const token=++revision,m=await metadataReady(),current=window.ProofAtlasLibrary.getSnapshot();if(token!==revision||current?.name!==snapshot.name||current?.path!==snapshot.path)return;
  if(snapshot.edition!=='published-15'){active=null;clearHighlight();status.textContent='This edition has no reviewed article index.';panel.dataset.match='unmapped';emit(snapshot);return;}
  let target,relation='Declaration/module proof context.',match='context';
  m.steps.validate(snapshot,window.ProofAtlasLibrary.getData(),window.ProofAtlasLibraryData);
  const matches=m.steps.resolve(snapshot),group=active?.articleAnchor||active?.id?.replace(/^proof-(thm|lem)-/,'$1:');
  const step=matches.find(c=>c.passage.id===active?.id)||matches.find(c=>c.passage.articleAnchor===group)||matches[0];
  if(step){target=targets.get(step.passage.id);match=step.inherited?'step-context':'indexed';relation=(step.inherited?'Within indexed proof step: ':'Indexed proof step: ')+(step.anchor.callee||snapshot.name)+'.';}
  else if(m.steps.hasDeclaration(snapshot.name))relation='No proof-step anchor covers this node; enclosing declaration context.';
  showStepChoices(matches,step);
  if(!target&&snapshot.name==='CrossingData.crossing'){
   const anchors=m.index.anchors.filter(a=>snapshot.path===a.path||snapshot.path.startsWith(a.path+'.')).sort((a,b)=>b.path.length-a.path.length);
   const a=anchors[0];if(a){target=targets.get(m.index.passages.find(p=>p.id===a.passage).htmlAnchor);match=a.path===snapshot.path?'indexed':'context';relation=(match==='indexed'?'Indexed expression: ':'Context from enclosing expression: ')+a.relation+'.';}
  }
  if(!target){
   // A direct declaration match is more specific than supporting-module membership.
   target=(active?.names.includes(snapshot.name)&&(active.kind!=='proof'||snapshot.route.root>0)?active:null)||[...targets.values()].find(t=>t.kind!=='proof'&&t.names.includes(snapshot.name));
   if(!target){const record=m.records.get(snapshot.name);target=targets.get('proof-'+record?.articleAnchor.replace(':','-'))||targets.get(record?.articleAnchor);}
  }
  active=target||null;if(target){options(target,snapshot.name,m.records);highlight(target.id,true);status.textContent=target.title+' · '+relation+' '+target.note;}
  else{clearHighlight();chooser.replaceChildren();chooser.disabled=true;status.textContent='No indexed article passage for '+snapshot.name+'. The compiled node and its graph remain selected.';}
  panel.dataset.match=target?match:'unmapped';await geometry(active,snapshot);if(token!==revision)return;emit(snapshot);
 }
 toggle.addEventListener('click',async()=>{try{if(opened)close();else{await open();if(active)await selectArticle(active.id,chooser.value);else unavailable('Select an article passage, statement or proof.');}}catch(e){status.textContent=e.message;}});
 document.querySelector('[data-pa-reading="article"]').addEventListener('click',close);
 chooser.addEventListener('change',()=>{if(active)selectArticle(active.id,chooser.value);});
 function interact(event){
  if(event.type==='keydown'&&(!['Enter',' '].includes(event.key)||event.target.matches('a,button,select,input,summary')))return;
  if(event.target.closest('a,button,select,input,summary'))return;
  const indexed=event.target.closest('[data-sync-anchor]'),paragraph=event.target.closest('p');if(!indexed&&!paragraph)return;
  if(event.type==='keydown')event.preventDefault();
  const id=indexed?.dataset.syncAnchor||paragraph.id||('pa-unindexed-'+[...paper.querySelectorAll('p')].indexOf(paragraph));if(!indexed)paragraph.id=id;
  selectArticle(id).catch(e=>unavailable(e.message));
 }
 paper.addEventListener('click',interact);paper.addEventListener('keydown',interact);
 window.addEventListener('proof-atlas:compiled-selection',e=>fromCompiled(e.detail).catch(error=>{active=null;clearHighlight();showStepChoices([],null);chooser.replaceChildren();chooser.disabled=true;panel.dataset.match='unmapped';status.textContent=error.message;}));
 window.addEventListener('hashchange',()=>{if(opened){const id=decodeURIComponent(location.hash.slice(1));if(targets.has(id)&&active?.id!==id)selectArticle(id);}});
 window.ProofAtlasSync={selectArticle,close,getSnapshot:()=>({article:active?.id||null,match:panel.dataset.match,open:opened,compiled:$('pa-sync-proof').hidden?null:window.ProofAtlasLibrary?.getSnapshot()||null}),routeFromPath};
 indexReady().then(async()=>{
  if(new URLSearchParams(location.search).get('view')==='proof'){
   const params=new URLSearchParams(location.search),id=decodeURIComponent(location.hash.slice(1)),name=params.get('proof'),saved=params.get('route')?.match(/^(\d+):([\d.]*)$/);
   if(targets.has(id)){await selectArticle(id,name);if(saved&&window.ProofAtlasLibrary?.getData()){
    const api=window.ProofAtlasLibrary,route={root:Number(saved[1]),slots:saved[2]?saved[2].split('.').map(Number):[]};await api.selectOccurrence(window.ProofAtlasLibraryData.walk(api.getData(),route),true,false,route);
   }}else await open();
  }
 }).catch(e=>{toggle.disabled=true;toggle.title=e.message;status.textContent=e.message;});
})();
