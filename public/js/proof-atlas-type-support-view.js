/* Four exact ambient links at a time; absence is shown only after a complete scan. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
 function mount(root,actions){
  let disposed=false,loading=false,version=0,pageVersion=0,controller=null,scene=null,offset=0,part='present';
  const box=el('section',undefined,'atlas-region-contexts atlas-type-support'),toggle=button('Show literal type support',load),status=el('p'),rows=el('div'),choice=el('select');choice.setAttribute('aria-label','Literal type binder membership');choice.hidden=true;status.setAttribute('role','status');box.dataset.typeSupport=actions.component;
  const labels={producerType:'Producer type',producerTypeInConsumer:'Producer type in consumer context',inputType:'Expected input type',consumerType:'Result type',normalizedInputType:'Recorded callable input type',normalizedConsumerType:'Recorded callable result type'};box.append(el('h5','Whole recorded type · '+(labels[actions.component]||actions.component)),el('p','Literal syntax only. A binder absent here may still occur in the proof, in a binder type or after unfolding. This is not premise necessity.'),toggle,status,choice,rows);root.replaceChildren(box);
  function release(){version++;pageVersion++;controller?.abort();controller=null;scene=null;loading=false;choice.hidden=true;rows.replaceChildren();box.removeAttribute('aria-busy');}
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
    scene=JSON.parse(JSON.stringify(result));choice.replaceChildren();for(const part of ['present','absent']){const option=el('option',(part==='present'?'Present':'Absent')+' in literal type · '+scene.rows.filter(r=>r.status===part).length);option.value=part;choice.append(option);}part='present';offset=0;choice.value=part;choice.hidden=false;toggle.textContent='Hide literal type support';status.textContent='Complete literal scan · original Γ'+scene.ambientLength+'.';draw();
   }catch(error){if(!disposed&&current===version){scene=null;rows.replaceChildren();choice.hidden=true;status.textContent='Type support unavailable: '+error.message;toggle.textContent='Show literal type support';}}finally{if(!disposed&&current===version){loading=false;controller=null;box.removeAttribute('aria-busy');}}
  }
  return{state:()=>({component:actions.component,loading,part,offset,visibleRows:rows.querySelectorAll('[data-type-support-ordinal]').length,scene:scene?JSON.parse(JSON.stringify(scene)):null}),dispose(){if(disposed)return;disposed=true;release();for(const n of box.querySelectorAll('button,select'))n.disabled=true;}};
 }
 host.ProofAtlasTypeSupportView={mount};
})(window);
