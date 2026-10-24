/* Recorded-use controls inside the mixed context diagram. */
(function(host){
'use strict';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const equal=(a,b)=>a.root===b.root&&a.depth===b.depth&&a.slots===b.slots;
function mount(shell,stage,scene,provider,callbacks){
 let disposed=false,epoch=0,controller=null,refs=[],next=null,selected=null,error=null,loading=false;
 const panel=el('section',undefined,'pvu-panel'),title=el('h3','Recorded variable uses'),help=el('p','These links identify recorded uses in the original source. A link adds no source occurrence. Syntax counts and recorded typing coverage are separate.','pow-help'),status=el('p',undefined,'pow-help'),rows=el('div',undefined,'pvu-rows'),filter=el('select'),filterLabel=el('label','Binder filter '),navigation=el('div',undefined,'pvu-nav');
 panel.dataset.variableUses='';filter.setAttribute('aria-label','Recorded-use binder');filter.append(new Option('All original binders','all'));scene.units.forEach((u,i)=>filter.append(new Option((i+1)+': '+u.binding.name,String(i))));filterLabel.append(filter);status.setAttribute('role','status');panel.append(title,help,filterLabel,status,rows,navigation);
 shell.insertBefore(panel,shell.querySelector('.pdu-boundary'));
 const continuation=el('div','Reference into remaining body · Γ'+scene.continuation.contextLength,'pvu-region');continuation.dataset.variableUseContinuation='';stage.append(continuation);
 const target=el('div',undefined,'pvu-target');target.hidden=true;stage.prepend(target);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('pvu-links');svg.setAttribute('aria-hidden','true');stage.prepend(svg);
 const path=document.createElementNS(svg.namespaceURI,'path');path.dataset.relation='recorded-use-bound-to';path.setAttribute('fill','none');path.setAttribute('stroke-dasharray','5 4');svg.append(path);
 const countNodes=[];
 for(const[i,u]of scene.units.entries()){
  const box=stage.querySelector('[data-definition-unit="'+i+'"] .pdu-binding'),count=provider.supportFor(u.root.route),note=el('p',undefined,'pvu-count');
  note.dataset.variableUseCount=i;
  note.textContent=count?count.recordedUses+' recorded typed use'+(count.recordedUses===1?'':'s')+' · '+(count.status==='complete'?count.count+' syntax occurrence'+(count.count==='1'?'':'s'):'syntax count unavailable'):'Syntax count unavailable for this original binder.';
  note.title='The syntax count covers the original binder body. It is not a count of type judgments or necessary assumptions.';box.append(note);countNodes.push(note);
 }
 function endpoint(ref){
  if(equal(ref.region.route,scene.continuation.route))return continuation;
  for(const[i,u]of scene.units.entries()){
   const fields=u.rule==='Pi-introduction'?[['domain',u.ports.domain.route]]:[['declared',u.ports.declared.route],['value',u.value.route]];
   for(const[id,route]of fields)if(equal(route,ref.region.route))return stage.querySelector('[data-definition-port="'+i+'-'+id+'"]');
  }
  return null;
 }
 function clearSelection(){
  selected=null;target.hidden=true;path.removeAttribute('d');delete path.dataset.useRoute;delete path.dataset.binderRoute;
  stage.querySelectorAll('[data-use-highlight]').forEach(n=>delete n.dataset.useHighlight);rows.querySelectorAll('[aria-pressed]').forEach(n=>n.setAttribute('aria-pressed','false'));
 }
 function draw(){
  if(disposed||!selected)return;const start=endpoint(selected),end=selected.kind==='retained-binder'?stage.querySelector('[data-definition-unit="'+selected.target.unit+'"] .pdu-binding'):target;
  if(!start||!end)return;
  const s=stage.getBoundingClientRect(),a=start.getBoundingClientRect(),b=end.getBoundingClientRect(),scale=s.width/stage.offsetWidth,x1=(a.right-s.left)/scale,y1=(a.top+a.height/2-s.top)/scale,x2=(b.right-s.left)/scale,y2=(b.top+b.height/2-s.top)/scale,lane=stage.offsetWidth-10;
  svg.setAttribute('width',stage.offsetWidth);svg.setAttribute('height',stage.offsetHeight);path.setAttribute('d','M'+x1+','+y1+' H'+lane+' V'+y2+' H'+x2);path.dataset.useRoute=JSON.stringify(selected.use.route);path.dataset.binderRoute=JSON.stringify(selected.use.binder.route);
 }
 function highlight(ref){
  clearSelection();selected=ref;const region=endpoint(ref);if(region)region.dataset.useHighlight='region';
  if(ref.kind==='retained-binder'){const node=stage.querySelector('[data-definition-unit="'+ref.target.unit+'"] .pdu-binding');node.dataset.useHighlight='binder';}
  else{target.hidden=false;target.textContent=(ref.kind==='internal-to-hidden-region'?'Binder inside the hidden region':'Original context before this frame')+' · '+ref.use.binder.name+' · e'+ref.use.binder.node+' · Γ'+ref.use.binder.ordinal+' → Γ'+(ref.use.binder.ordinal+1);target.dataset.useHighlight='binder';}
  draw();
 }
 function button(parent,text,attribute,handler){const b=el('button',text);b.type='button';b.dataset[attribute]='';b.setAttribute('aria-pressed','false');b.onclick=async()=>{if(disposed)return;b.disabled=true;try{await handler(b);}catch(e){if(!disposed){error=e.message;status.textContent='Recorded use unavailable: '+e.message;}}finally{b.disabled=false;}};parent.append(b);return b;}
 function panTo(node){
  const viewport=stage.closest('.pow-viewport');if(!node||!viewport)return;const a=node.getBoundingClientRect(),v=viewport.getBoundingClientRect();
  viewport.scrollTo({left:Math.max(0,viewport.scrollLeft+a.left-v.left-20),top:Math.max(0,viewport.scrollTop+a.top-v.top-60)});
 }
 async function choose(ref,index,mode,b){callbacks.onPick(ref,index,mode);highlight(ref);b.setAttribute('aria-pressed','true');panTo(mode==='binder'?(ref.kind==='retained-binder'?stage.querySelector('[data-definition-unit="'+ref.target.unit+'"] .pdu-binding'):target):endpoint(ref));
  if(mode==='source')await callbacks.onSource(ref);
  else if(mode==='binder')await callbacks.onBinder(ref);
  else if(mode==='type')await callbacks.onType(ref,index);
 }
 function render(){
  rows.replaceChildren();navigation.replaceChildren();clearSelection();
  for(const[i,ref]of refs.entries()){
   const row=el('article',undefined,'pvu-row');row.dataset.variableUse=i;row.dataset.useKind=ref.kind;row.dataset.useNode=ref.use.node;row.dataset.binderNode=ref.use.binder.node;
   row.append(el('h4',ref.use.binder.name+' · e'+ref.use.node+' · recorded '+ref.use.role+' use · Γ'+ref.use.contextLength),el('p',ref.kind==='retained-binder'?'Bound to context extension '+(ref.target.unit+1)+'.':ref.kind==='external-original-context'?'Bound in the original context before this frame.':'Use and binder are inside the same hidden region.'));
   const controls=el('div',undefined,'pvu-actions');
   button(controls,'Inspect use e'+ref.use.node,'useSource',b=>choose(ref,null,'source',b));button(controls,'Inspect binder e'+ref.use.binder.node,'useBinder',b=>choose(ref,null,'binder',b));
   ref.use.observations.forEach((o,j)=>{const b=button(controls,'Type · '+(o.field==='recorded'?'recorded query':o.field+' observation'),'useType',b=>choose(ref,j,'type',b));b.dataset.observation=j;b.dataset.nativeOwner=o.owner.evidenceSha256;b.dataset.nativeTypeRoot=o.owner.typeRoot;});
   button(controls,'Focus source use','useFocus',()=>callbacks.onFocus(ref.use.route));row.append(controls);rows.append(row);
  }
  button(navigation,'First batch','useFirst',()=>query(null));if(next)button(navigation,'Next recorded uses','useNext',()=>query(next));
  status.textContent=refs.length?refs.length+' recorded use'+(refs.length===1?'':'s')+' in this batch. '+(next?'More entries remain.':'End of the selected recorded-use list.'):(next?'No matches in this bounded batch; more entries remain.':'No recorded uses in this selected region and filter. Unrecorded uses may exist.');
 }
 async function query(cursor){
  callbacks.onReset();const serial=++epoch;controller?.abort();controller=new AbortController();loading=true;error=null;refs=[];next=null;status.textContent='Loading a bounded batch of recorded uses…';rows.replaceChildren();navigation.replaceChildren();clearSelection();filter.disabled=true;
  try{const binder=filter.value==='all'?null:scene.units[Number(filter.value)].root.route,result=await provider.query({within:scene.root.route,binder,cursor,signal:controller.signal});if(disposed||serial!==epoch)return;const overlay=provider.references(scene,result);refs=overlay.references;next=overlay.next;render();}
  catch(e){if(!disposed&&serial===epoch){error=e.message;status.textContent='Recorded uses unavailable: '+e.message;button(navigation,'Retry recorded uses','useRetry',()=>query(null));}}
  finally{if(!disposed&&serial===epoch){loading=false;filter.disabled=false;}}
 }
 filter.onchange=()=>query(null);const observer=new ResizeObserver(draw);observer.observe(stage);
 function setFilter(index){filter.value=index===null?'all':String(index);return query(null);}
 return{setFilter,clearSelection,getState:()=>({loading,error,source:scene.source,root:scene.root.route,binder:filter.value==='all'?null:scene.units[Number(filter.value)].root.route,references:refs,selection:selected,hasNext:!!next,residency:provider.stats()}),dispose:()=>{disposed=true;epoch++;controller?.abort();provider.dispose();observer.disconnect();svg.remove();continuation.remove();target.remove();panel.remove();countNodes.forEach(n=>n.remove());}};
}
host.ProofAtlasVariableUseView={mount};
})(typeof window==='undefined'?globalThis:window);
