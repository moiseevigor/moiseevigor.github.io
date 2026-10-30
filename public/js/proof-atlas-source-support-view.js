/* One binder, two literal occurrence layers. Unknown types never become absences. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
 function create(root,input,actions){
  const scene=JSON.parse(JSON.stringify(input));if(scene?.format!=='ProofAtlasSourceTypeSupport/1'||scene.status!=='complete')throw Error('Complete source support required');
  let disposed=false,version=0,offset=0,part=scene.typeStatus==='recorded'?'referenced':'source-present';
  const box=el('section',undefined,'atlas-support-comparison'),status=el('p'),choice=el('select'),rows=el('div');box.dataset.supportComparison='';choice.setAttribute('aria-label','Source and type reference category');status.setAttribute('role','status');
  const categories=scene.typeStatus==='recorded'?[['referenced','Referenced in source or type'],['both','Present in both'],['source-only','Present in source only'],['type-only','Present in type only'],['neither','Absent from both']]:[['source-present','Present in source'],['source-absent','Absent from source']];
  for(const [key,label]of categories){const o=el('option',label);o.value=key;choice.append(o);}choice.value=part;
  const labels={producerType:'producer type',producerTypeInConsumer:'lifted producer type',inputType:'expected input type',consumerType:'result type',normalizedInputType:'recorded callable input type',normalizedConsumerType:'recorded callable result type'};const role={producer:'Original producer expression','actual-input-use':'Actual input use',result:'Result application','selected-expression':'Selected source expression'}[scene.identity.sourceRole];
  box.append(el('h5',scene.typeStatus==='recorded'?'Source expression and recorded type':'Source expression · type unobserved'),el('p',(role||'Source expression')+' · original Γ'+scene.ambientLength+(scene.identity.typeRoot?' · '+(labels[scene.identity.typeRoot.component]||scene.identity.typeRoot.component):'. No per-expression type observation is available.')),el('p','Only original binders outside the selected source expression are listed. Literal fields include annotations. Source references, type references and necessary premises are different relations.'),choice,rows,status);root.replaceChildren(box);
  function draw(){
   const current=++version,items=scene.rows.filter(r=>part==='referenced'?r.sourceStatus==='present'||r.typeStatus==='present':r.category===part);rows.replaceChildren();
   function pick(label,address,role){const b=button(label,async()=>{const valid=()=>!disposed&&current===version;if(!valid())return;try{const ok=await actions.onSelect(address,valid);if(valid()&&ok===false)status.textContent='Expression selection unavailable.';}catch(error){if(valid())status.textContent='Expression selection unavailable: '+error.message;}});b.dataset.supportSelect=role;b.dataset.supportAddress=JSON.stringify(address);return b;}
   function use(parent,w,kind){if(w.status==='located')parent.append(pick('Inspect '+kind+' occurrence',w.address,kind));else parent.append(el('span','Witness outside the 512-field selection bound.'));}
   for(const row of items.slice(offset,offset+4)){
    const card=el('div',undefined,'sc-row');card.dataset.supportOrdinal=String(row.ordinal);card.dataset.supportCategory=row.category;
    const left=el('div'),middle=el('div'),right=el('div');left.append(el('strong','Source expression'));if(row.sourceStatus==='present')use(left,row.source,'source');else left.append(el('span','No literal reference'));
    middle.append(el('strong','↶ Γ slot '+(row.ordinal+1)+' · '+(row.name||'_')+(row.nameTruncated?'…':'')),pick('Inspect original binder',row.address,'binder'));
    right.append(el('strong','Recorded type'));if(row.typeStatus==='present')use(right,row.type,'type');else right.append(el('span',row.typeStatus==='unobserved'?'Unobserved':'No literal reference'));card.append(left,middle,right);rows.append(card);
   }
   const prev=button('Previous source/type binders',()=>change(-4)),next=button('Next source/type binders',()=>change(4)),nav=el('div',undefined,'an-controls');prev.disabled=offset===0;next.disabled=offset+4>=items.length;nav.append(prev,next);rows.append(el('p',items.length?'Showing '+(offset+1)+'–'+Math.min(offset+4,items.length)+' of '+items.length+' binders.':'No binders in this category.'),nav);
   function change(delta){if(disposed||current!==version)return;offset+=delta;draw();}
  }
  choice.onchange=()=>{part=choice.value;offset=0;draw();};draw();
  return{state:()=>({part,offset,visibleRows:rows.querySelectorAll('[data-support-ordinal]').length,scene:JSON.parse(JSON.stringify(scene))}),dispose(){disposed=true;version++;choice.disabled=true;for(const b of rows.querySelectorAll('button'))b.disabled=true;}};
 }
 function mountSource(root,actions){
  let disposed=false,version=0,loading=false,lease=null,view=null,controller=null;
  const box=el('section',undefined,'atlas-region-contexts atlas-source-support'),toggle=button('Show source expression support',load),status=el('p'),body=el('div');box.dataset.sourceSupport='';status.setAttribute('role','status');box.append(el('h5','Original context references'),toggle,status,body);root.replaceChildren(box);
  function release(){version++;controller?.abort();controller=null;lease?.dispose();lease=null;view?.dispose();view=null;loading=false;body.replaceChildren();}
  async function load(){
   if(disposed)return;if(lease||loading){release();toggle.textContent='Show source expression support';status.textContent='';return;}const current=++version;loading=true;controller=new AbortController();toggle.textContent='Cancel source support scan';status.textContent='Checking original source context and expression fields…';
   try{const opened=await actions.open(controller.signal);if(disposed||current!==version){opened.dispose();return;}lease=opened;const source=lease.scene();if(source.status!=='complete'){status.textContent='Source support unavailable: '+source.reason+'. No absence conclusion is shown.';lease.dispose();lease=null;toggle.textContent='Show source expression support';return;}
    view=create(body,host.ProofAtlasSourceSupport.compare(source,null),{onSelect:(address,pageCurrent)=>actions.onSelect(address,()=>!disposed&&current===version&&!!lease&&pageCurrent())});toggle.textContent='Hide source expression support';status.textContent='Complete source scan. Recorded type support remains unobserved in this view.';
   }catch(error){if(!disposed&&current===version){lease?.dispose();lease=null;status.textContent='Source support unavailable: '+error.message;toggle.textContent='Show source expression support';}}finally{if(!disposed&&current===version){controller=null;loading=false;}}
  }
  return{state:()=>({loading,view:view?.state()||null,lease:lease?.state()||null}),infoSource:(a,request)=>{if(!lease||disposed)throw Error('Source support retired');return lease.info(a,request);},dispose(){if(disposed)return;disposed=true;release();toggle.disabled=true;}};
 }
 host.ProofAtlasSourceSupportView={create,mountSource};
})(window);
