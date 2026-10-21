/* One construction lens inside the existing occurrence reader. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,action)=>{const b=el('button',text);b.type='button';b.onclick=action;return b;};
 const reason={
  'display-boundary':'Recorded construction · collapsed by the display limit',
  'missing-construction-record':'Construction not recorded at this occurrence',
  'declaration-reference':'Declaration reference',
  'context-reference':'Original context reference',
  'type-expression':'Type-expression boundary',
  'different-recorded-interface':'Recorded interfaces differ · composition withheld',
  'typed-source-boundary':'Recorded type · construction outside this profile',
  'unrecorded-source':'No recorded native type or construction'
 };
 function mount(parent,model,data,scene,callbacks){
  const A=host.ProofAtlasLibraryData,P=host.ProofAtlasPackedRoutes;
  let disposed=false,scale=1,selected=null,action=0;
  const shell=el('section',undefined,'poc-view'),heading=el('h2','Recorded proof constructions'),caption=el('p','Ordered ports are original source fields. Γ labels retain the original lexical context. Dashed connections identify binders.','pow-help'),viewport=el('div',undefined,'pow-viewport'),sizing=el('div',undefined,'pow-sizing'),stage=el('div',undefined,'pow-stage'),summary=el('p',undefined,'pow-summary'),status=el('p',undefined,'pow-help');
  shell.dataset.constructionView='';viewport.tabIndex=0;viewport.setAttribute('aria-label','Recorded construction diagram. Scroll or drag empty space to pan.');status.setAttribute('role','status');viewport.append(sizing);sizing.append(stage);shell.append(heading,caption,viewport,summary,status);parent.replaceChildren(shell);parent.hidden=false;
  const points=[...scene.nodes,...scene.frontiers],positions=new Map(),cards=new Map(),layers=new Map(),byAddress=new Map();
  const addressKey=a=>JSON.stringify(a);
  for(const p of points){const row=layers.get(p.depth)||0;layers.set(p.depth,row+1);positions.set(p.id,{x:20+p.depth*340,y:20+row*370});byAddress.set(addressKey(p.address),p.id);}
  const external=[...new Map(scene.links.filter(l=>!byAddress.has(addressKey(l.address))).map(l=>[addressKey(l.address),l])).values()],columns=Math.max(...points.map(p=>p.depth))+1;
  const width=(columns+(external.length?1:0))*340+30,height=Math.max(Math.max(...layers.values())*370,external.length*180)+30;
  stage.style.width=width+'px';stage.style.height=height+'px';viewport.style.height=Math.min(650,Math.max(350,height+20))+'px';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('pow-edges');svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('aria-hidden','true');stage.append(svg);
  function pick(p,notify=true){if(notify)action++;selected=p.id;for(const item of cards.values())if(item.pick.dataset.constructionPoint)item.pick.setAttribute('aria-pressed',String(item.pick.dataset.constructionPoint===selected));if(notify)callbacks.onSelect(model.routeFor(scene,p.id),p.typeReference?model.typeFor(scene,p.id):null);}
  function preview(p){
   if(p.kind!=='app')return A.describe(data,p.node);
   let id=p.node,count=0;while(data.kind[id]===5&&count<32){id=data.children[id][0];count++;}
   if(data.kind[id]===5)return 'Application head beyond this 32-field preview';
   let text=A.describe(data,id);
   if(data.kind[id]===0){const r=P.append(model.routeFor(scene,p.id),Array(count).fill(0)),b=P.resolve(data,r).binding;if(b){const payload=data.payloads[b.node];text=(payload.binderName||payload.declName||'_')+' · binder at source depth '+b.route.depth;}}
   return 'Head: '+text+' · '+count+' supplied source argument'+(count===1?'':'s');
  }
  for(const p of points){
   const pos=positions.get(p.id),card=el('article',undefined,'pow-card poc-card'),label=p.rule?(p.rule==='Pi-introduction'?'Π introduction':'Π application'):reason[p.boundaryReason],pickButton=button(p.glyph+' '+(label||p.kind),()=>pick(p));
   card.dataset.constructor=p.kind;card.dataset.constructionKind=p.rule?'rule':'boundary';card.style.left=pos.x+'px';card.style.top=pos.y+'px';pickButton.dataset.constructionPoint=p.id;pickButton.setAttribute('aria-pressed','false');pickButton.append(el('small',p.role+' · Γ'+p.contextLength+' · source e'+p.node));card.append(pickButton);
   const formula=el('p',preview(p),'pow-formula');formula.tabIndex=0;card.append(formula);
   if(p.rule==='Pi-introduction')card.append(el('p','Domain in Γ'+p.contextLength+'; body in Γ'+(p.contextLength+1)+'.','poc-context'));
   if(p.recording?.stage)card.append(el('p','Recorded application stage '+p.recording.stage,'poc-context'));
   if(!p.rule)card.append(el('p',p.expanded+' source occurrence'+(p.expanded==='1'?'':'s')+' inside this boundary.','poc-context'));
   const ports=new Map();for(const edge of scene.edges.filter(e=>e.from===p.id)){const child=points.find(p=>p.id===edge.to),b=button(edge.field+' · '+child.role+' · Γ'+child.contextLength,()=>pick(child));b.className='pow-port';b.dataset.constructionField=edge.field;card.append(b);ports.set(edge.field,b);}
   if(p.typeReference){
    const b=button('Recorded type · Γ'+p.contextLength,async()=>{const epoch=++action;b.disabled=true;try{const type=await model.typeFor(scene,p.id);if(!disposed&&epoch===action){pick(p,false);callbacks.onType(model.routeFor(scene,p.id),type);}}catch(error){status.textContent=error.message;}finally{b.disabled=false;}});b.dataset.constructionType=p.id;card.append(b);
   }
   if(p.alternateTypeReference){const b=button('Meta-inferred argument type',async()=>{const epoch=++action;b.disabled=true;try{const type=await model.typeFor(scene,p.id,'meta');if(!disposed&&epoch===action){pick(p,false);callbacks.onType(model.routeFor(scene,p.id),type);}}catch(error){status.textContent=error.message;}finally{b.disabled=false;}});b.dataset.constructionAlternateType=p.id;card.append(b);}
   let binding=null;if(p.binding){binding=button('Go to original binder',()=>callbacks.onSource(model.resolve(scene,p.binding.address)));binding.className='pow-binding';binding.dataset.constructionBinding=p.id;card.append(binding);}
   stage.append(card);cards.set(p.id,{card,pick:pickButton,ports,binding});
  }
  external.forEach((ref,i)=>{const id='ctx'+i,pos={x:20+columns*340,y:20+i*180},card=el('article',undefined,'pow-context-card'),r=model.resolve(scene,ref.address),payload=data.payloads[ref.node],pick=button((payload.binderName||payload.declName||'_')+' · e'+ref.node,()=>callbacks.onSource(r));positions.set(id,pos);byAddress.set(addressKey(ref.address),id);card.style.left=pos.x+'px';card.style.top=pos.y+'px';pick.dataset.constructionContext=id;card.append(el('small','ORIGINAL Γ · OUTSIDE THIS CUT'),pick,el('p','Source depth '+r.depth+'. Excluded from the subtree count.'));stage.append(card);cards.set(id,{card,pick});});
  function paths(){if(disposed)return;svg.replaceChildren();function line(from,to,control,relation){const a=positions.get(from),b=positions.get(to),target=cards.get(to).pick,right=b.x>=a.x,sx=right?a.x+280:a.x,sy=a.y+control.offsetTop+control.offsetHeight/2,tx=right?b.x:b.x+280,ty=b.y+target.offsetTop+target.offsetHeight/2,path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M '+sx+' '+sy+' C '+(sx+(right?35:-35))+' '+sy+' '+(tx+(right?-35:35))+' '+ty+' '+tx+' '+ty);path.dataset.relation=relation;if(relation==='original-source-context')path.classList.add('pow-binding-edge');svg.append(path);}
   for(const edge of scene.edges)line(edge.from,edge.to,cards.get(edge.from).ports.get(edge.field),edge.relation);
   for(const link of scene.links)line(link.from,byAddress.get(addressKey(link.address)),cards.get(link.from).binding,'original-source-context');
  }
  paths();document.fonts?.ready.then(paths);
  summary.textContent='Retained constructors: '+scene.stats.retained+'. Boundary occurrences: '+scene.stats.hidden+'. Total: '+scene.stats.represented+'. External Γ references contribute zero.';
  status.textContent='Only recorded Π introduction/application rules are expanded. A boundary is not an independently checked proof step.';
  function setScale(value){scale=value;stage.style.transform='scale('+scale+')';sizing.style.width=width*scale+'px';sizing.style.height=height*scale+'px';}setScale(1);
  let drag=null;viewport.addEventListener('pointerdown',e=>{if(e.target.closest('article,button,a'))return;drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);});viewport.addEventListener('pointermove',e=>{if(drag)viewport.scrollTo(drag.left+drag.x-e.clientX,drag.top+drag.y-e.clientY);});viewport.addEventListener('pointerup',()=>{drag=null;});viewport.addEventListener('pointercancel',()=>{drag=null;});
  const resize=new ResizeObserver(paths);for(const item of cards.values())resize.observe(item.card);host.addEventListener('resize',paths);
  return{getScene:()=>scene,select:route=>{const p=points.find(p=>{const r=model.routeFor(scene,p.id);return r.root===route.root&&r.depth===route.depth&&r.slots===route.slots;});if(p)pick(p);},setScale,dispose:()=>{disposed=true;action++;resize.disconnect();host.removeEventListener('resize',paths);shell.remove();parent.hidden=true;}};
 }
 host.ProofAtlasOccurrenceConstructionView={mount};
})(typeof window==='undefined'?globalThis:window);
