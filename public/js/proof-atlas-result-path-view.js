/* A bounded path module with selectable original results and an explicit input collar. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,action)=>{const b=el('button',text);b.type='button';b.onclick=action;return b;};
 function mount(root,model,actions){
  let disposed=false,useRequest=0;
  const box=el('section',undefined,'rp-path'),count=model.counts,first=model.stages[0],last=model.stages.at(-1),byId=new Map(model.stages.map(s=>[s.call,s]));
  box.dataset.resultPath='';box.append(el('h3','Result path · '+count.calls+' application'+(count.calls===1?'':'s')));
  if(actions.entryUse){const edge=actions.entryUse,entry=el('p','Entered call '+edge.to+' at '+(edge.slot===0?'the function':'argument '+edge.slot)+' from result '+edge.from+'. ','rp-entry');entry.append(button('Inspect the selected input use',()=>actions.onInput(edge.to,edge.slot)));box.append(entry);}
  const qualifier=model.mode==='native'?'Recorded native types · original contexts retained.':'Source structure only · per-call types are unobserved.';
  box.append(el('p',qualifier,'an-caption'),el('p',count.actualPorts+' inputs = '+count.pathUses+' path uses + '+count.sideInputs+' side inputs · '+count.resultPortals+' original result'+(count.resultPortals===1?'':'s')+'.','rp-accounting an-caption'));
  const endpoints=el('div',undefined,'rp-endpoints');endpoints.dataset.single=String(count.calls===1);
  function endpoint(stage,label){const item=el('div',undefined,'rp-endpoint'),pick=button(label+' · call '+stage.call,()=>actions.onResult(stage.call));pick.dataset.resultPathResult=String(stage.call);const text=el('pre',stage.record.result.typeText);text.tabIndex=0;text.setAttribute('role','region');text.setAttribute('aria-label',label+' type summary');item.append(pick,el('p',stage.record.result.role+' · original Γ'+stage.record.result.contextLength,'an-caption'),text);return item;}
  endpoints.append(endpoint(first,'First result'));if(count.calls>1){const arrow=el('div',undefined,'rp-path-arrow'),direction=el('span',undefined,'rp-direction');direction.setAttribute('aria-hidden','true');arrow.append(el('span',count.pathUses+' source uses'),direction);endpoints.append(arrow,endpoint(last,'Last result'));}box.append(endpoints);
  const stop=model.stop,reason=stop.kind==='end'?'No further use is recorded in this application inventory.':stop.kind==='branch'?stop.count+' recorded input positions use this result.':'The '+stop.limit+'-call path budget is reached; the next inventoried use remains a boundary.';
  box.append(el('p',reason+' Uses outside this inventory are unknown.','rp-boundary an-caption'));
  if(stop.kind==='branch'){
   const fanout=el('section',undefined,'rp-fanout'),message=el('p'),uses=el('div',undefined,'rp-consumers'),paging=el('div',undefined,'an-controls');fanout.dataset.resultUses='';message.setAttribute('role','status');
   fanout.append(el('h4','Uses of the last result'),el('p','One result → separate consumer input positions.','an-caption'),message,uses,paging);box.append(fanout);
   let useOffset=0;
   const previous=button('Previous result uses',()=>loadUses(Math.max(0,useOffset-8))),next=button('Next result uses',()=>loadUses(useOffset+8)),retry=button('Reload result uses',()=>loadUses(useOffset));paging.append(previous,next,retry);
   async function loadUses(offset){
    const request=++useRequest;useOffset=offset;previous.disabled=next.disabled=retry.disabled=true;uses.replaceChildren();message.textContent='Checking the next source-use page and its consumer inputs…';
    try{const page=await actions.onUses(offset);if(disposed||request!==useRequest)return;useOffset=page.offset;
     for(const consumer of page.consumers){const group=el('div',undefined,'rp-consumer'),heading=el('h5','Call '+consumer.id+' · '+consumer.label),type=el('pre',consumer.result.typeText),list=el('ul');group.dataset.resultUseConsumer=String(consumer.id);type.tabIndex=0;type.setAttribute('role','region');type.setAttribute('aria-label','Consumer '+consumer.id+' result type summary');
      group.append(heading,el('p',(model.mode==='native'?consumer.result.role:'type unobserved')+' · original Γ'+consumer.result.contextLength,'an-caption'),type,list);
      for(const edge of page.rows.filter(e=>e.to===consumer.id)){const li=el('li'),pick=button('Follow call '+edge.to+' · '+(edge.slot===0?'function':'argument '+edge.slot),()=>actions.onFollowUse(edge.ordinal));pick.dataset.resultUse=String(edge.ordinal);li.append(el('p',(edge.slot===0?'Function head':'Argument '+edge.slot)+' · '+edge.role+(edge.visibility?' · '+edge.visibility:'')+(edge.hops?' · '+edge.hops+' local definition'+(edge.hops===1?'':'s'):' · direct use'),'an-caption'),pick);list.append(li);}uses.append(group);
     }
     message.textContent='Showing input positions '+(page.offset+1)+'–'+(page.offset+page.rows.length)+' of '+page.total+'. '+page.consumers.length+' consumer occurrence'+(page.consumers.length===1?'':'s')+' on this page.';
     previous.disabled=useOffset===0;next.disabled=useOffset+8>=page.total;
    }catch(error){if(disposed||request!==useRequest)return;message.textContent='Result uses unavailable: '+error.message+'. Reload this page to retry.';previous.disabled=next.disabled=true;}
    finally{if(!disposed&&request===useRequest){retry.disabled=false;}}
   }
   loadUses(0);
  }
  const tools=el('div',undefined,'an-controls');tools.append(button('Show separate applications',actions.onUnfold));if(stop.kind==='budget'){const next=button('Continue with next consumer',()=>actions.onContinue(stop.next.to));next.dataset.resultPathContinue='';tools.append(next);}box.append(tools);
  const stages=el('details'),list=el('ol');stages.append(el('summary','All '+count.resultPortals+' original result stages'),list);
  for(const [i,stage]of model.stages.entries()){const li=el('li'),pick=button('Stage '+(i+1)+' · call '+stage.call+' · Γ'+stage.record.result.contextLength,()=>actions.onResult(stage.call));pick.dataset.resultPathStage=String(stage.call);li.append(pick,el('p',stage.record.functionLabel,'an-caption'));if(i){const edge=model.edges[i-1];li.append(el('p','Previous result enters '+(edge.slot===0?'the function':'argument '+edge.slot)+(edge.hops?' through '+edge.hops+' local definition'+(edge.hops===1?'':'s'):'')+'.','an-caption'));}list.append(li);}box.append(stages);
  const collar=el('section',undefined,'rp-collar'),select=el('select'),label=el('label','Input group '),rows=el('ol'),paging=el('div',undefined,'an-controls'),pageCount=el('p');select.setAttribute('aria-label','Input group');collar.append(el('h4','Side inputs · every position retained'));
  for(const [kind,name]of[['all','All side inputs'],['function','Function heads'],['proof','Proof arguments'],['type','Type arguments'],['value','Value arguments'],['unobserved','Unobserved arguments']]){const o=el('option',name+' · '+(kind==='all'?count.sideInputs:count.inputKinds[kind]));o.value=kind;select.append(o);}label.append(select);let offset=0;
  const prev=button('Previous side inputs',()=>{offset=Math.max(0,offset-8);update();}),next=button('Next side inputs',()=>{offset+=8;update();});paging.append(prev,next);collar.append(label,pageCount,rows,paging);box.append(collar);
  function update(){const filtered=model.sideInputs.filter(ref=>{const p=byId.get(ref.call).record.ports[ref.slot];return select.value==='all'||select.value===(p.slot===0?'function':p.role);});offset=Math.min(offset,Math.max(0,Math.floor((filtered.length-1)/8)*8));rows.replaceChildren();rows.start=offset+1;
   for(const ref of filtered.slice(offset,offset+8)){const p=byId.get(ref.call).record.ports[ref.slot],li=el('li'),pick=button('Inspect side input '+ref.call+':'+ref.slot,()=>actions.onInput(ref.call,ref.slot));pick.dataset.resultPathInput=ref.call+':'+ref.slot;li.append(el('p','Call '+ref.call+' · '+(ref.slot===0?'function head':'argument '+ref.slot)+' · '+p.role+(p.visibility?' · '+p.visibility:'')+(p.knownProducer===null?' · outside the inventoried applications':' · producer call '+p.knownProducer)+' · producer Γ'+p.producerContextLength+' → use Γ'+p.consumerContextLength,'an-caption'),pick);rows.append(li);}pageCount.textContent=filtered.length?'Showing '+(offset+1)+'–'+Math.min(offset+8,filtered.length)+' of '+filtered.length+' side inputs.':'No inputs in this group.';prev.disabled=offset===0;next.disabled=offset+8>=filtered.length;
  }
  select.onchange=()=>{offset=0;update();};update();
  const evidence=el('details'),pre=el('pre',JSON.stringify(model.identity,null,2));pre.tabIndex=0;pre.setAttribute('role','region');pre.setAttribute('aria-label','Derived path identity and original stage addresses');evidence.append(el('summary','Path identity and limits'),pre,el('p',model.scope),el('p','Proof arguments are recorded inputs, not a claim of mathematically necessary assumptions. Type summaries are presentations; select a result to inspect its original type.','an-caption'));box.append(evidence);
  root.replaceChildren(box);
  return{dispose(){disposed=true;useRequest++;for(const b of box.querySelectorAll('button'))b.disabled=true;}};
 }
 host.ProofAtlasResultPathView={mount};
})(window);
