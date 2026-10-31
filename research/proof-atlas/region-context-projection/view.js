(function(host){
 'use strict';
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;},button=(label,action)=>{const b=el('button',label);b.type='button';b.onclick=action;return b;};
 function mount(container,{graph,support,scene,onTarget,isCurrent}){
  let disposed=false,version=0,controller=null,navigation=null,projection=null,cut=null,page=0,status='idle',error=null;
  const details=el('details'),summary=el('summary','Project into required lexical context'),body=el('div');details.dataset.rcProjection='';details.append(summary,body);container.append(details);
  const live=v=>!disposed&&v===version&&isCurrent(),clear=()=>{controller?.abort();navigation?.abort();projection?.dispose();projection=null;cut=null;page=0;};
  const showError=e=>{const v=version;cut=null;status='unavailable';error=e.message;body.replaceChildren(el('p','Context projection unavailable: '+error),button('Retry context projection',()=>{if(live(v))load();}));};
  const name=root=>root.kind==='bvar'?'#'+root.payload.index:root.kind==='const'?root.payload.name:root.kind==='lam'?'λ '+root.payload.binderName:root.kind==='forallE'?'∀ '+root.payload.binderName:root.kind==='letE'?'let '+root.payload.declName:({app:'Application',sort:'Sort',mdata:'Metadata',proj:'Projection',fvar:'Free variable',mvar:'Metavariable',lit:'Literal'}[root.kind]||root.kind);
  function contextPage(v){
   const old=body.querySelector('[data-rc-context]');if(old)old.remove();const panel=el('div');panel.dataset.rcContext='';panel.append(el('h5','Retained context entries'));
   const rows=projection.contextPage(page),s=projection.state(),list=el('ol');list.className='rc-context-list';list.start=page*4+1;
   for(const row of rows){const item=el('li'),b=button('Open original '+({lam:'λ',forallE:'∀',letE:'let'}[row.kind]||row.kind)+' '+row.name+' · projected index '+row.projectedIndex,()=>{if(live(v))onTarget(row.locator,scene.locator);});b.dataset.rcHeader=String(row.ordinal);item.append(b,el('small',row.why.role==='term'?'Referenced by the selected term.':'Retained by '+(row.why.role==='binderType'?'the type':'the value')+' of original context entry '+row.why.via+'.'));for(const field of row.fields){const preview=button(field.role==='binderType'?'Inspect projected type':'Inspect projected value',()=>{if(live(v))select([],v,{kind:'header',slot:row.ordinal,role:field.role});});preview.dataset.rcHeaderField=row.ordinal+':'+field.role;item.append(preview);}list.append(item);}
   panel.append(rows.length?list:el('p','The selected term has no enclosing de Bruijn dependencies.'));
   if(s.retainedEntries>4){const tools=el('div');tools.className='pm-controls';const prev=button('Previous context entries',()=>{if(live(v)){page--;draw(++version);}}),next=button('Next context entries',()=>{if(live(v)){page++;draw(++version);}});prev.dataset.rcPrevious='';next.dataset.rcNext='';prev.disabled=page===0;next.disabled=(page+1)*4>=s.retainedEntries;tools.append(prev,el('span',(page*4+1)+'–'+Math.min((page+1)*4,s.retainedEntries)+' of '+s.retainedEntries),next);panel.append(tools);}body.append(panel);
  }
  function draw(v){
   const s=projection.state();body.replaceChildren(el('p',s.originalEntries+' original context entries → '+s.retainedEntries+' retained; '+s.omittedEntries+' omitted. '+s.directSlots.length+' entries are referenced directly; '+(s.retainedEntries-s.directSlots.length)+' are added through header types or let values.'));
   body.append(el('p','Syntax projection. No inferred type is recorded for this derived region. Local definitions remain definitions; this is not a minimal list of mathematical premises.'));
   const tools=el('div');tools.className='pm-controls';const root=button('Projected region root',()=>{if(live(v))select([],v);});root.dataset.rcRoot='';tools.append(root);if(cut.parent){const parent=button('Projected parent',()=>{if(live(v))select(cut.parent,v,cut.part);});parent.dataset.rcParent='';tools.append(parent);}const original=button('Open original constructor',()=>{if(live(v))onTarget(cut.originalLocator,scene.locator);});original.dataset.rcOriginal='';tools.append(original);
   if(cut.binding){const binder=button('Open original binder',()=>{if(live(v))onTarget(cut.binding.locator,scene.locator);});binder.dataset.rcBinder='';tools.append(binder);}const release=button('Release projection',()=>{if(live(v)){clear();version++;idle();}});release.dataset.rcRelease='';tools.append(release);body.append(tools);if(cut.part.kind==='header')body.append(el('p','Projected '+(cut.part.role==='binderType'?'type':'value')+' of original context entry '+cut.part.slot+'. Only retained earlier entries are in scope.'));
   const diagram=el('div');diagram.className='rc-scene';diagram.setAttribute('role','group');diagram.setAttribute('aria-label','Projected constructor and ordered fields');diagram.tabIndex=0;
   const selected=el('div');selected.className='rc-node';selected.append(el('strong',name(cut.root)),el('small',cut.root.expanded+' expression occurrences'));
   if(cut.root.kind==='bvar')selected.append(el('small','Original #'+cut.root.originalIndex+' → projected #'+cut.root.payload.index));diagram.append(selected);
   if(cut.children.length){const fields=el('ul');fields.className='rc-fields';for(const child of cut.children){const item=el('li'),b=button(child.field+' · '+child.kind,()=>{if(live(v))select(child.relativeSlots,v,cut.part);});b.dataset.rcField=String(child.slot);item.append(b);fields.append(item);}diagram.append(fields);}body.append(diagram);
   body.append(el('p','Solid connections are constructor fields. Projection can change indices; original binder identities stay fixed. '+cut.stats.hiddenOccurrences+' hidden occurrences remain recoverable from the original graph.'));
   const evidence=el('details');evidence.append(el('summary','Projection rule, payload and exact original address'),el('pre',JSON.stringify({rule:host.ProofAtlasRegionContext.rule,payload:cut.root.payload,derived:cut.root.address,binding:cut.binding,originalContextEntries:s.originalEntries,keptSlots:s.keptSlots,typing:'unavailable'},null,2)));body.append(evidence);contextPage(v);
  }
  async function select(relative,v,part={kind:'term'}){
   if(!live(v))return;navigation?.abort();const ticket=++version,nav=new AbortController();navigation=nav;cut=null;status='loading';body.setAttribute('aria-busy','true');
   const progress=el('p','Loading projected constructor…');progress.setAttribute('role','status');body.replaceChildren(progress);
   try{const next=await (part.kind==='header'?projection.inspectHeader(part.slot,part.role,relative,{signal:nav.signal}):projection.inspect(relative,{signal:nav.signal}));if(!live(ticket)||nav.signal.aborted)return;cut=next;status='ready';error=null;draw(ticket);}catch(e){if(live(ticket)&&!nav.signal.aborted)showError(e);}finally{if(live(ticket))body.setAttribute('aria-busy','false');}
  }
  async function load(){
   if(disposed||!isCurrent())return;clear();const v=++version;controller=new AbortController();status='loading';error=null;body.setAttribute('aria-busy','true');const progress=el('p','Closing the selected term’s context under header types and let values…');progress.setAttribute('role','status');body.replaceChildren(progress);
   try{const next=await host.ProofAtlasRegionContext.prepare(graph,support,scene,{signal:controller.signal});if(!live(v)){next.dispose();return;}projection=next;await select([],v);}catch(e){if(live(v))showError(e);}finally{if(live(v))body.setAttribute('aria-busy','false');}
  }
  function idle(){status='idle';error=null;body.setAttribute('aria-busy','false');const v=version,b=button('Project selected region',()=>{if(live(v))load();});b.dataset.rcLoad='';body.replaceChildren(el('p','Keep the term’s lexical dependencies, including dependencies in retained header types and let values. Constructor fields load on demand; whole-root native typing does not extend to this projection.'),b);}
  idle();return{state:()=>({status,error,page,projection:projection?.state()||null,selection:cut?.root.address||null,vertices:cut?.stats.vertices||0}),dispose:()=>{disposed=true;version++;clear();details.remove();graph=null;support=null;scene=null;}};
 }
 host.ProofAtlasRegionContextView={mount};
})(window);
