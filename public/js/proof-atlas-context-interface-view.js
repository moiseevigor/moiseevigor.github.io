/* A finite view of syntactic context dependencies; no additional typing judgment. */
(function(host){
 'use strict';
 let witnessScript=null;
 async function witnessesReady(){
  if(host.ProofAtlasContextWitnesses)return;
  if(!witnessScript)witnessScript=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/js/proof-atlas-context-witnesses.js?v=1';script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Optional reference-chain code unavailable'));};document.head.append(script);}).catch(error=>{witnessScript=null;throw error;});
  await witnessScript;if(!host.ProofAtlasContextWitnesses?.index){witnessScript=null;throw Error('Reference-chain code is incomplete');}
 }
 function mount(container,{model,onOriginalOccurrence,onRecordedType}){
  const D=host.ProofAtlasDependentInterface;
  if(!D||model?.format!=='ProofAtlasDependentInterface/1'||model.contexts.length>512)throw Error('Context dependency interface unavailable');
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},button=(text,fn)=>{const n=el('button',text);n.type='button';n.onclick=()=>{if(!disposed)fn();};return n;},name=c=>c.payload.binderName||c.payload.declName||'_',source=ref=>onOriginalOccurrence(ref.node,{root:ref.route.root,slots:[...ref.route.slots]});
  const labels={'term-support':'Term reference','recorded-type-support':'Recorded-type reference','binder-type':'Binder-type reference','let-value':'Let-value reference'};
  let origin='term',offset=0,disposed=false,history=[],witnesses=null,witnessTarget=null,witnessOffset=0,witnessEpoch=0;
  container.replaceChildren();container.classList.add('pl-context-interface');
  const heading=el('h5','Required context'),note=el('p','Arrows show syntactic references, including type dependencies. They do not assert logical necessity or add typing judgments.'),select=el('select'),actions=el('div',undefined,'pl-actions'),back=button('Previous dependency origin',()=>{const previous=history.pop();if(previous){origin=previous.origin;offset=previous.offset;draw();}}),diagram=el('div',undefined,'pl-context-dependencies'),paging=el('div',undefined,'pl-actions'),status=el('p'),explanation=el('section'),details=el('details');
  select.setAttribute('aria-label','Context reference origin');status.setAttribute('role','status');
  for(const [value,label]of [['term','Selected term'],['type','Recorded type'],...model.retainedSlots.map(j=>[String(j),'Header '+name(model.contexts[j])+' · slot '+(j+1)])]){const option=el('option',label);option.value=value;select.append(option);}
  details.append(el('summary','Dependency identity and scope'),el('pre',JSON.stringify({source:model.source,nativeType:model.nativeType,retainedSlots:model.retainedSlots,omittedSlots:model.omittedSlots,guarantee:model.guarantee},null,2)));details.querySelector('pre').tabIndex=0;
  actions.append(back);container.append(heading,note,select,actions,diagram,paging,status,explanation,details);explanation.className='pl-context-witness';explanation.hidden=true;
  function focus(next){if(disposed)return;history.push({origin,offset});if(history.length>512)history.shift();origin=next;offset=0;draw();select.focus();}
  async function explain(slot){
   if(disposed)return;const token=++witnessEpoch;witnessTarget=slot;explanation.hidden=false;explanation.replaceChildren(el('h6','Why '+name(model.contexts[slot])+' is retained'));
   explanation.setAttribute('aria-busy','true');explanation.append(el('p','Preparing the reference chain…'));
   try{await witnessesReady();if(disposed||token!==witnessEpoch)return;explanation.replaceChildren(el('h6','Why '+name(model.contexts[slot])+' is retained'));if(!witnesses)witnesses=host.ProofAtlasContextWitnesses.index(model);const page=witnesses.path(slot,{offset:witnessOffset}),list=el('ol');list.start=witnessOffset+1;explanation.dataset.witnessTarget=String(slot);explanation.append(el('p','One shortest syntactic reference chain · '+page.length+' edge'+(page.length===1?'':'s')+'. References identify regions, not individual variable uses.'),list);
    for(const edge of page.edges){const row=el('li'),from=edge.from==='term'?'Selected term':edge.from==='type'?'Recorded type':'Header '+name(model.contexts[edge.from])+' · slot '+(edge.from+1),to=name(model.contexts[edge.targetSlot])+' · slot '+(edge.targetSlot+1);row.dataset.witnessFrom=String(edge.from);row.dataset.witnessTo=String(edge.targetSlot);row.dataset.witnessRelation=edge.relation;row.append(el('strong',from+' → '+to),el('span',labels[edge.relation]));if(edge.from==='type'){if(onRecordedType)row.append(button('Open reference region',()=>onRecordedType()));}else row.append(button('Open reference region',()=>source(edge.originRegion)));row.append(button('Open target binder',()=>source(edge.target)));list.append(row);}
    const controls=el('div',undefined,'pl-actions'),previous=button('Previous chain edges',()=>{witnessOffset=Math.max(0,witnessOffset-16);explain(slot);}),next=button('Next chain edges',()=>{witnessOffset+=16;explain(slot);});previous.disabled=witnessOffset===0;next.disabled=!page.remaining;controls.append(previous,el('span',(witnessOffset+1)+'–'+(witnessOffset+page.edges.length)+' / '+page.length),next);explanation.append(controls);
   }catch(error){if(!disposed&&token===witnessEpoch)explanation.replaceChildren(el('h6','Reference chain unavailable'),el('p',error.message+'. The dependency diagram remains available; select Why retained again to retry.'));}finally{if(!disposed&&token===witnessEpoch)explanation.setAttribute('aria-busy','false');}
  }
  function draw(){
   if(disposed)return;const page=D.dependencies(model,origin,{offset,limit:16});container.dataset.contextOrigin=String(origin);select.value=String(origin);back.disabled=!history.length;diagram.replaceChildren();paging.replaceChildren();
   const isHeader=Number.isInteger(origin),header=isHeader?model.contexts[origin]:null,card=el('div',undefined,'pl-context-origin');card.append(el('strong',isHeader?'Header '+name(header)+' · slot '+(origin+1):origin==='term'?'Selected term':'Recorded type'),el('span',isHeader?(header.value?'Type and value before this let binder':'Type before this binder'):origin==='term'?'Original compiled occurrence':'Type of the selected original occurrence'));
   if(isHeader||origin==='term'){const ref=isHeader?header.sourceBinder:model.source;card.append(button(isHeader?'Open original header':'Open selected term',()=>source(ref)));}else if(onRecordedType)card.append(button('Open recorded type',()=>onRecordedType()));
   const targets=el('ol',undefined,'pl-context-targets');targets.start=offset+1;diagram.append(card,targets);
   for(const edge of page.edges){const c=model.contexts[edge.targetSlot],row=el('li',undefined,'pl-context-dependency');row.dataset.contextTarget=String(edge.targetSlot);row.dataset.contextRelation=edge.relation;const relation=el('span',labels[edge.relation]+' →','pl-context-relation'),target=el('div',undefined,'pl-context-target');target.append(el('strong',name(c)+' · slot '+(c.slot+1)),el('span',c.value?'Retained let definition':'Retained assumption'),button('Inspect header '+name(c)+' · slot '+(c.slot+1),()=>focus(c.slot)),button('Why retained: '+name(c)+' · slot '+(c.slot+1),()=>{witnessOffset=0;explain(c.slot);}),button('Open original binder '+name(c)+' · slot '+(c.slot+1),()=>source(edge.target)));row.append(relation,target);targets.append(row);}
   if(!page.total)targets.append(el('li','No free context references for this origin.','pl-context-empty'));
   const previous=button('Previous context references',()=>{offset=Math.max(0,offset-16);draw();}),next=button('Next context references',()=>{offset+=16;draw();});previous.disabled=offset===0;next.disabled=!page.remaining;paging.append(previous,el('span',page.total?(offset+1)+'–'+(offset+page.edges.length)+' / '+page.total+' references':'0 references'),next);
   status.textContent=model.retainedSlots.length+' / '+model.originalDepth+' original context entries retained by syntactic closure. '+(page.remaining?page.remaining+' further references on later pages.':'All references for this origin are shown.');
  }
  select.onchange=()=>focus(select.value==='term'||select.value==='type'?select.value:Number(select.value));draw();
  return{getState:()=>({origin,offset,history:history.length,visibleEdges:diagram.querySelectorAll('[data-context-target]').length,witnessTarget,witnessState:witnesses?.state()||null}),dispose(){disposed=true;witnessEpoch++;witnesses=null;select.onchange=null;container.replaceChildren();container.classList.remove('pl-context-interface');}};
 }
 host.ProofAtlasContextInterfaceView={mount};
})(typeof window==='undefined'?globalThis:window);
