/* Bounded scope bands for a checked raw cut. Original source selections stay external. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
 function mount(root,input,actions){
  const scene=JSON.parse(JSON.stringify(input));
  let disposed=false,call=actions.selectedCall??scene.original.focus,lane=scene.calls.find(c=>c.call===call)?.lane||scene.lanes[0].id,binderOffset=0,busOffset=0,inputOffset=0,pageVersion=0,busVersion=0,inputVersion=0;
  let bus=scene.buses.find(b=>b.addedBinders>0)?.id||scene.buses[0]?.id||null;if(bus)busOffset=Math.floor(scene.buses.findIndex(b=>b.id===bus)/8)*8;
  const box=el('section',undefined,'sa-view'),viewport=el('div',undefined,'sa-viewport'),canvas=el('div',undefined,'sa-canvas'),wireLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');
  const summary=el('p',scene.counts.calls+' original calls · '+scene.counts.contexts+' exact contexts · '+scene.counts.retainedUses+' retained input uses'),connectionList=el('div'),inputList=el('div'),contextList=el('div'),callActions=el('div',undefined,'an-controls'),status=el('p');
  box.dataset.scopedApplications='';status.setAttribute('role','status');viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Application flow in lexical scope bands; scroll or drag the background to pan');
  canvas.style.width=scene.layout.width+'px';canvas.style.height=scene.layout.height+'px';
  for(const [key,value]of Object.entries({width:scene.layout.width,height:scene.layout.height,viewBox:'0 0 '+scene.layout.width+' '+scene.layout.height,'aria-hidden':'true'}))wireLayer.setAttribute(key,String(value));
  canvas.append(wireLayer);
  for(const [i,l]of scene.lanes.entries()){
   const band=el('div',undefined,'sa-band');band.dataset.scopeBand=l.id;band.style.top=l.y+'px';band.style.height=l.height+'px';
   const pick=button('Context '+(i+1)+' · Γ'+l.depth,()=>{if(disposed)return;lane=l.id;binderOffset=0;drawContext();});pick.dataset.scopeLane=l.id;pick.title='Inspect the exact ordered binders of context '+(i+1);band.append(pick);canvas.append(band);
  }
  for(const p of scene.calls){
   const c=scene.records.find(c=>c.index===p.call),pick=button(c.index+' · '+c.functionLabel,()=>{if(disposed)return;markCall(c.index);actions.onCall(c.index);});
   pick.className='sa-call';pick.dataset.scopeCall=String(c.index);pick.dataset.nsNode=String(c.index);pick.style.left=p.x+'px';pick.style.top=p.y+'px';pick.style.width=scene.layout.cardWidth+'px';pick.style.height=scene.layout.cardHeight+'px';pick.title='Inspect original call '+c.index+' · '+c.functionLabel;
   pick.replaceChildren(el('strong',c.index+' · '+c.functionLabel),el('span','Γ'+c.result.contextLength+' · '+c.arguments+' arguments'+(c.result.role==='unobserved'?'':' · '+c.result.role)));if(c.result.role==='unobserved')pick.append(el('span','Native type unobserved'));else{const result=el('code',c.result.typeText);result.title=c.result.typeText;pick.append(result);}
   canvas.append(pick);
  }
  viewport.append(canvas);
  box.append(el('h3','Application flow and lexical scope'),summary,el('p','Left to right: retained source uses. Each band groups identical ordered binder occurrences. Solid wires are direct uses; dashed wires follow local definitions. Choose a connection to trace it. Added binders describe scope, not premise necessity.','sa-note'),viewport,callActions,connectionList,inputList,contextList,status);root.replaceChildren(box);
  function portal(parent,address,label){
   if(!['published-15','working-26','goedel-sample-4331'].includes(scene.identity.source.edition))return;
   const link=el('a',label);link.href='/projects/proof-atlas/library/?loading=paged&edition='+encodeURIComponent(scene.identity.source.edition)+'&proof='+encodeURIComponent(address.name)+'&route='+encodeURIComponent(address.route.root+':'+address.route.slots.join('.'));link.dataset.scopePortal=JSON.stringify(address);parent.append(link);
  }
  function drawWires(){
   wireLayer.replaceChildren();
   const defs=document.createElementNS(wireLayer.namespaceURI,'defs'),marker=document.createElementNS(wireLayer.namespaceURI,'marker'),tip=document.createElementNS(wireLayer.namespaceURI,'path');
   for(const [k,v]of Object.entries({id:'sa-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'}))marker.setAttribute(k,String(v));tip.setAttribute('d','M0 0 L10 5 L0 10 z');tip.setAttribute('class','sa-arrow');marker.append(tip);defs.append(marker);wireLayer.append(defs);
   // Top gutters and column gaps keep skipped-rank uses out of intermediate cards.
   for(const [i,b]of scene.buses.slice(busOffset,busOffset+8).entries()){
    const from=scene.calls.find(p=>p.call===b.from),to=scene.calls.find(p=>p.call===b.to),band=scene.lanes.find(l=>l.id===from.lane),x1=from.x+scene.layout.cardWidth,y1=from.y+scene.layout.cardHeight/2,x2=to.x,y2=to.y+scene.layout.cardHeight/2,gutter=band.y+24+i*3,out=x1+10+i,inlet=x2-10-i;
    const path=document.createElementNS(wireLayer.namespaceURI,'path');path.setAttribute('d','M'+x1+' '+y1+' H'+out+' V'+gutter+' H'+inlet+' V'+y2+' H'+x2);path.setAttribute('class','sa-wire'+(b.id===bus?' sa-wire-selected':''));path.setAttribute('marker-end','url(#sa-arrow)');if(b.relation==='binding-mediated-source-use')path.setAttribute('stroke-dasharray','6 4');path.dataset.scopeWire=b.id;wireLayer.append(path);if(b.id===bus&&b.addedBinders){const label=document.createElementNS(wireLayer.namespaceURI,'text');label.setAttribute('x',String(inlet+8));label.setAttribute('y',String(band.y+band.height+13));label.setAttribute('class','sa-crossing-label');label.dataset.scopeCrossing=String(b.addedBinders);label.textContent='+'+b.addedBinders+' binders';wireLayer.append(label);}
   }
  }
  function drawConnections(){
   const generation=++busVersion;connectionList.replaceChildren(el('h4','Retained source-use connections'));
   const list=el('div',undefined,'sa-connections');
   for(const b of scene.buses.slice(busOffset,busOffset+8)){
    const pick=button('Call '+b.from+' → '+b.to+' · '+b.inputs.length+' input'+(b.inputs.length===1?'':'s')+' · '+(b.addedBinders?'+'+b.addedBinders+' binders':'same context'),()=>{if(disposed||generation!==busVersion)return;bus=b.id;inputOffset=0;drawConnections();drawWires();drawInputs();});
    pick.dataset.scopeBus=b.id;pick.setAttribute('aria-pressed',String(b.id===bus));list.append(pick);
   }
   connectionList.append(list,el('p',scene.buses.length?'Showing connection groups '+(busOffset+1)+'–'+Math.min(busOffset+8,scene.buses.length)+' of '+scene.buses.length+'. Every original input position remains separate.':'No retained call-to-call use. Boundary inputs remain in the input list.','sa-note'));
   if(scene.buses.length>8){const nav=el('div',undefined,'an-controls'),prev=button('Previous scope connections',()=>change(-8)),next=button('Next scope connections',()=>change(8));prev.disabled=busOffset===0;next.disabled=busOffset+8>=scene.buses.length;nav.append(prev,next);connectionList.append(nav);}
   function change(delta){if(disposed||generation!==busVersion)return;busOffset+=delta;bus=scene.buses[busOffset].id;inputOffset=0;drawConnections();drawWires();drawInputs();}
  }
  function drawInputs(){
   const generation=++inputVersion,b=scene.buses.find(b=>b.id===bus);inputList.replaceChildren();if(!b)return;
   const links=b.inputs.map(id=>scene.links.find(e=>e.input===id));
   inputList.append(el('h4','Call '+b.from+' → call '+b.to),el('p',b.addedBinders?'Exact context extension: '+b.addedBinders+' binders.':'Same exact ordered binder context.'));
   for(const e of links.slice(inputOffset,inputOffset+4)){
    const row=el('div',undefined,'sa-input'),pick=button('Inspect original input '+e.input,()=>{if(disposed||generation!==inputVersion)return;markCall(e.to);actions.onInput(e.to,e.slot);});pick.dataset.scopeInput=e.input;
    row.append(pick,el('span',(e.slot===0?'Function':'Argument '+e.slot)+' · '+e.definitionHops+' local definition'+(e.definitionHops===1?'':'s')+(e.definitionBoundary?' · further resolution unobserved':'')));inputList.append(row);
   }
   const nav=el('div',undefined,'an-controls'),prev=button('Previous grouped inputs',()=>change(-4)),next=button('Next grouped inputs',()=>change(4));prev.disabled=inputOffset===0;next.disabled=inputOffset+4>=links.length;nav.append(prev,next);inputList.append(el('p','Showing '+(inputOffset+1)+'–'+Math.min(inputOffset+4,links.length)+' of '+links.length+' original input positions.','sa-note'),nav);
   function change(delta){if(disposed||generation!==inputVersion)return;inputOffset+=delta;drawInputs();}
  }
  function drawContext(){
   const generation=++pageVersion,l=scene.lanes.find(l=>l.id===lane),representative=l.calls.includes(call)?call:l.calls[0],frames=l.frames.slice(binderOffset,binderOffset+4),number=scene.lanes.indexOf(l)+1;
   for(const pick of box.querySelectorAll('[data-scope-lane]'))pick.setAttribute('aria-pressed',String(pick.dataset.scopeLane===lane));
   contextList.replaceChildren(el('h4','Context '+number+' · Γ'+l.depth),el('p','Original ordered binders. Headers remain in the preceding context; bodies enter the binder.','sa-note'));
   const list=el('ol');list.start=binderOffset+1;
   function sourcePick(label,address){const pick=button(label,async()=>{const valid=()=>!disposed&&generation===pageVersion; if(!valid())return;try{const ok=await actions.onSource(representative,address,valid);if(valid()&&ok===false)status.textContent='Source inspector unavailable. Use the exact proof-explorer link where available.';}catch(error){if(valid())status.textContent='Source selection unavailable: '+error.message;}});pick.dataset.scopeSource=JSON.stringify(address);return pick;}
   for(const frame of frames){
    const li=el('li'),pick=sourcePick(frame.kind+' binder '+frame.afterDepth+' · '+(frame.name||'_')+(frame.nameTruncated?'…':''),frame.address);pick.dataset.scopeBinder=String(frame.beforeDepth);li.append(pick,el('p','Header in Γ'+frame.beforeDepth+' · body in Γ'+frame.afterDepth));
    const headers=el('div',undefined,'an-controls');for(const h of frame.headers){const field=el('span',h.field+' in Γ'+h.contextDepth+' · ');if(['published-15','working-26','goedel-sample-4331'].includes(scene.identity.source.edition))portal(field,h.address,'Open '+h.field+' in proof explorer');else field.append(el('span','source node '+h.address.node+'; outside the selected input window'));headers.append(field);}li.append(headers);portal(li,frame.address,'Open exact binder in proof explorer');list.append(li);
   }
   const nav=el('div',undefined,'an-controls'),prev=button('Previous scope binders',()=>change(-4)),next=button('Next scope binders',()=>change(4));prev.disabled=binderOffset===0;next.disabled=binderOffset+4>=l.depth;nav.append(prev,next);
   contextList.append(list,el('p',l.depth?'Showing binders '+(binderOffset+1)+'–'+Math.min(binderOffset+4,l.depth)+' of '+l.depth+'.':'Empty lexical context.','sa-note'),nav);
   function change(delta){if(disposed||generation!==pageVersion)return;binderOffset+=delta;drawContext();}
  }
  function markCall(id){
   if(disposed||!scene.calls.some(p=>p.call===id))return;call=id;const nextLane=scene.calls.find(p=>p.call===id).lane;if(lane!==nextLane){lane=nextLane;binderOffset=0;drawContext();}
   for(const pick of box.querySelectorAll('[data-scope-call]'))pick.setAttribute('aria-pressed',String(Number(pick.dataset.scopeCall)===call));
   callActions.replaceChildren(el('span','Selected call '+call));
   const target=call,collapse=button('Remove retained call '+call,()=>{if(!disposed&&call===target)actions.onCollapse(target);});collapse.disabled=call===scene.original.focus;callActions.append(collapse);if(collapse.disabled)callActions.append(el('span','Focus call','sa-note'));
  }
  function markInput(id,slot){
   if(disposed)return;markCall(id);const index=scene.buses.findIndex(b=>b.inputs.includes(id+':'+slot));if(index<0)return;
   bus=scene.buses[index].id;busOffset=Math.floor(index/8)*8;inputOffset=Math.floor(scene.buses[index].inputs.indexOf(id+':'+slot)/4)*4;drawConnections();drawWires();drawInputs();
  }
  const events=new AbortController();let drag=null;
  viewport.addEventListener('pointerdown',e=>{if(e.button!==0||e.pointerType!=='mouse'||e.target.closest('button,a'))return;drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('sa-dragging');},{signal:events.signal});
  viewport.addEventListener('pointermove',e=>{if(drag){viewport.scrollLeft=drag.left+drag.x-e.clientX;viewport.scrollTop=drag.top+drag.y-e.clientY;}},{signal:events.signal});
  function stop(){drag=null;viewport.classList.remove('sa-dragging');}viewport.addEventListener('pointerup',stop,{signal:events.signal});viewport.addEventListener('lostpointercapture',stop,{signal:events.signal});
  drawWires();drawConnections();drawInputs();drawContext();markCall(call);
  return{markCall,markInput,state:()=>({disposed,call,lane,binderOffset,busOffset,inputOffset,visibleWires:disposed?0:Math.min(8,scene.buses.length-busOffset),visibleInputPositions:disposed?0:inputList.querySelectorAll('[data-scope-input]').length,visibleBinders:disposed?0:contextList.querySelectorAll('[data-scope-binder]').length}),dispose(){if(disposed)return;disposed=true;pageVersion++;busVersion++;inputVersion++;events.abort();for(const b of box.querySelectorAll('button'))b.disabled=true;}};
 }
 host.ProofAtlasScopedApplicationsView={mount};
})(window);
