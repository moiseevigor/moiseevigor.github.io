/* Four exact ambient links at a time; absence is shown only after a complete scan. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
 function mount(root,actions){
  let disposed=false,loading=false,version=0,pageVersion=0,controller=null,scene=null,offset=0,part='present',comparisonLease=null,comparisonView=null,comparisonController=null,comparisonVersion=0;
  const box=el('section',undefined,'atlas-region-contexts atlas-type-support'),toggle=button('Show literal type support',load),status=el('p'),rows=el('div'),choice=el('select');choice.setAttribute('aria-label','Literal type binder membership');choice.hidden=true;const compareButton=button('Compare source expression',compare),comparisonBox=el('div');compareButton.disabled=true;compareButton.hidden=!actions.openSource||!host.ProofAtlasSourceSupportView;status.setAttribute('role','status');box.dataset.typeSupport=actions.component;
  const labels={producerType:'Producer type',producerTypeInConsumer:'Producer type in consumer context',inputType:'Expected input type',consumerType:'Result type',normalizedInputType:'Recorded callable input type',normalizedConsumerType:'Recorded callable result type'};box.append(el('h5','Whole recorded type · '+(labels[actions.component]||actions.component)),el('p','Literal syntax only. A binder absent here may still occur in the proof, in a binder type or after unfolding. This is not premise necessity.'),toggle,compareButton,status,choice,rows,comparisonBox);root.replaceChildren(box);
  function release(){retireComparison();compareButton.disabled=true;version++;pageVersion++;controller?.abort();controller=null;scene=null;loading=false;choice.hidden=true;rows.replaceChildren();box.removeAttribute('aria-busy');}
  function draw(){
   const generation=version,current=++pageVersion,items=scene.rows.filter(r=>r.status===part);rows.replaceChildren(el('p',part==='present'?'Each row connects one literal bound-variable occurrence to its original context binder. Only one witness per binder is shown.':'No literal occurrence of these original binders was found in the complete selected type component.'));
   for(const row of items.slice(offset,offset+4)){
    const card=el('div',undefined,'ts-link');card.dataset.typeSupportOrdinal=String(row.ordinal);card.append(el('strong','Γ slot '+(row.ordinal+1)+' · '+(row.name||'_')+(row.nameTruncated?'…':'')+' · '+row.kind));
    function pick(label,address,role){const b=button(label,async()=>{const valid=()=>!disposed&&generation===version&&current===pageVersion&&!!scene;if(!valid())return;try{const ok=await actions.onSelect(address,valid);if(valid()&&ok===false)status.textContent='Expression selection unavailable; the recorded support stays separate.';}catch(error){if(valid())status.textContent='Expression selection unavailable: '+error.message;}});b.dataset.typeSupportSelect=role;b.dataset.typeSupportAddress=JSON.stringify(address);return b;}
    if(part==='present'){
     if(row.witness.status==='located')card.append(pick('Inspect type occurrence',row.witness.address,'witness'),el('span','↶ literal bound-variable reference','ts-relation'));
     else card.append(el('span','Witness at depth '+row.witness.pathLength+'; beyond the '+scene.stats.pathLimit+'-field selection bound.'));
    }
    card.append(pick('Inspect original binder',row.address,'binder'));rows.append(card);
   }
   const nav=el('div',undefined,'an-controls'),prev=button('Previous type-support binders',()=>change(-4)),next=button('Next type-support binders',()=>change(4));prev.disabled=offset===0;next.disabled=offset+4>=items.length;nav.append(prev,next);rows.append(el('p',items.length?'Showing '+(offset+1)+'–'+Math.min(offset+4,items.length)+' of '+items.length+' '+part+' binders.':'No '+part+' binders.'),nav);
   function change(delta){if(disposed||current!==pageVersion)return;offset+=delta;draw();}
  }
  choice.onchange=()=>{if(!scene||disposed)return;part=choice.value;offset=0;draw();};
  async function load(){
   if(disposed)return;if(scene||loading){release();toggle.textContent='Show literal type support';status.textContent='';return;}
   const current=++version;loading=true;controller=new AbortController();box.setAttribute('aria-busy','true');toggle.textContent='Cancel type-support scan';status.textContent='Scanning the recorded type through bounded pages…';
   try{const result=await actions.open(controller.signal);if(disposed||current!==version)return;loading=false;box.removeAttribute('aria-busy');if(result.status!=='complete'){status.textContent='Type support unavailable: '+result.reason+'. No absence conclusion is shown.';toggle.textContent='Show literal type support';return;}
    if(result.format!=='ProofAtlasRecordedTypeSupport/1'||result.rows.length!==result.ambientLength||result.rows.some((r,i)=>r.ordinal!==i||!['present','absent'].includes(r.status)))throw Error('Invalid original-context support rows');
    scene=JSON.parse(JSON.stringify(result));choice.replaceChildren();for(const part of ['present','absent']){const option=el('option',(part==='present'?'Present':'Absent')+' in literal type · '+scene.rows.filter(r=>r.status===part).length);option.value=part;choice.append(option);}part='present';offset=0;choice.value=part;choice.hidden=false;toggle.textContent='Hide literal type support';compareButton.disabled=false;status.textContent='Complete literal scan · original Γ'+scene.ambientLength+'.';draw();
   }catch(error){if(!disposed&&current===version){scene=null;rows.replaceChildren();choice.hidden=true;status.textContent='Type support unavailable: '+error.message;toggle.textContent='Show literal type support';}}finally{if(!disposed&&current===version){loading=false;controller=null;box.removeAttribute('aria-busy');}}
  }
  function retireComparison(){comparisonVersion++;comparisonController?.abort();comparisonController=null;comparisonView?.dispose();comparisonView=null;comparisonLease?.dispose();comparisonLease=null;comparisonBox.replaceChildren();rows.hidden=false;choice.hidden=!scene;compareButton.textContent='Compare source expression';if(scene)status.textContent='Showing recorded type support only.';}
  async function compare(){
   if(disposed||!scene)return;if(comparisonLease||comparisonController){retireComparison();return;}const generation=version,current=++comparisonVersion;comparisonController=new AbortController();compareButton.textContent='Cancel source comparison';status.textContent='Checking the source expression in its original context…';
   try{const opened=await actions.openSource(comparisonController.signal);if(disposed||generation!==version||current!==comparisonVersion){opened.dispose();return;}comparisonLease=opened;comparisonView=host.ProofAtlasSourceSupportView.create(comparisonBox,opened.scene(),{onSelect:(address,pageCurrent)=>actions.onSelect(address,()=>!disposed&&generation===version&&current===comparisonVersion&&!!comparisonLease&&pageCurrent())});rows.hidden=true;choice.hidden=true;compareButton.textContent='Show type support only';status.textContent='Source expression and recorded type share the same exact ordered context.';}
   catch(error){if(!disposed&&generation===version&&current===comparisonVersion){comparisonLease?.dispose();comparisonLease=null;status.textContent='Source comparison unavailable: '+error.message+'. The type-only view remains available.';compareButton.textContent='Compare source expression';}}
   finally{if(!disposed&&current===comparisonVersion)comparisonController=null;}
  }
  return{infoSource:(address,request)=>{if(disposed||!comparisonLease)throw Error('Source comparison unavailable');return comparisonLease.info(address,request);},state:()=>({component:actions.component,loading,comparison:comparisonView?.state()||null,comparisonLease:comparisonLease?.state()||null,part,offset,visibleRows:rows.querySelectorAll('[data-type-support-ordinal]').length,scene:scene?JSON.parse(JSON.stringify(scene)):null}),dispose(){if(disposed)return;disposed=true;release();for(const n of box.querySelectorAll('button,select'))n.disabled=true;}};
 }
 host.ProofAtlasTypeSupportView={mount};
})(window);
