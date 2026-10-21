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
 function mount(parent,model,data,scene,callbacks,presentation=null){
  const A=host.ProofAtlasLibraryData,P=host.ProofAtlasPackedRoutes;
  let disposed=false,scale=1,selected=null,action=0;
  const shell=el('section',undefined,'poc-view'),heading=el('h2','Recorded proof constructions'),caption=el('p','Ordered ports are original source fields. Γ labels retain the original lexical context. Dashed connections identify binders.','pow-help'),viewport=el('div',undefined,'pow-viewport'),sizing=el('div',undefined,'pow-sizing'),stage=el('div',undefined,'pow-stage'),summary=el('p',undefined,'pow-summary'),status=el('p',undefined,'pow-help');
  shell.dataset.constructionView='';viewport.tabIndex=0;viewport.setAttribute('aria-label','Recorded construction diagram. Scroll or drag empty space to pan.');status.setAttribute('role','status');viewport.append(sizing);sizing.append(stage);shell.append(heading,caption,viewport,summary,status);parent.replaceChildren(shell);parent.hidden=false;
  const folded=['ProofAtlasApplicationSpineCut/1','ProofAtlasApplicationSpineCut/2'].includes(scene.format);
  const orderedLayout=folded||scene.format==='ProofAtlasOccurrenceConstructionCut/2';
  if(folded)caption.textContent='Grouped head/argument ports retain their original fn/arg fields. Retained stages remain individually inspectable. Γ labels keep the original context.';
  const points=[...scene.nodes.map(p=>p.members?{...p.members.at(-1),...p}:p),...scene.frontiers],positions=new Map(),cards=new Map(),layers=new Map(),byAddress=new Map(),displayDepths=new Map();
  if(orderedLayout){const pending=[{id:points[0].id,depth:0}],order=new Map();while(pending.length){const p=pending.shift();displayDepths.set(p.id,p.depth);order.set(p.id,order.size);for(const e of scene.edges.filter(e=>e.from===p.id))pending.push({id:e.to,depth:p.depth+1});}points.sort((a,b)=>order.get(a.id)-order.get(b.id));}
  const addressKey=a=>JSON.stringify(a);
  for(const p of points){const depth=displayDepths.get(p.id)??p.depth,row=layers.get(depth)||0;layers.set(depth,row+1);positions.set(p.id,{x:20+depth*340,y:20+row*370});byAddress.set(addressKey(p.address),p.id);}
  const external=[...new Map(scene.links.filter(l=>!byAddress.has(addressKey(l.address))).map(l=>[addressKey(l.address),l])).values()],columns=Math.max(...points.map(p=>displayDepths.get(p.id)??p.depth))+1;
  const width=(columns+(external.length?1:0))*340+30,height=Math.max(Math.max(...layers.values())*370,external.length*180)+30;let currentHeight=height;
  stage.style.width=width+'px';stage.style.height=height+'px';viewport.style.height=Math.min(650,Math.max(350,height+20))+'px';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('pow-edges');svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('aria-hidden','true');stage.append(svg);
  function pick(p,notify=true){if(notify)action++;selected=p.id;for(const item of cards.values())if(item.pick.dataset.constructionPoint)item.pick.setAttribute('aria-pressed',String(item.pick.dataset.constructionPoint===selected));for(const b of stage.querySelectorAll('[data-construction-member]'))b.setAttribute('aria-pressed','false');if(notify)callbacks.onSelect(model.routeFor(scene,p.id),p.typeReference?(callbacks.lazyTypes?()=>model.typeFor(scene,p.id):model.typeFor(scene,p.id)):null);}
  function pickMember(p,m){action++;pick(p,false);for(const b of stage.querySelectorAll('[data-construction-member]'))b.setAttribute('aria-pressed',String(b.dataset.constructionMember===p.id+':'+m.id));callbacks.onSelect(model.routeFor(scene,p.id,m.id),model.typeFor(scene,p.id,m.id));}
  async function memberType(p,m,field,b){const epoch=++action;b.disabled=true;try{const entry=await model.memberTypeFor(scene,p.id,m.id,field);if(!disposed&&epoch===action)callbacks.onType(entry.route,entry);}catch(error){status.textContent=error.message;}finally{b.disabled=false;}}
  function preview(p){
   if(presentation)return presentation.previews[p.id];
   if(p.kind!=='app')return A.describe(data,p.node);
   let id=p.node,count=0;while(data.kind[id]===5&&count<32){id=data.children[id][0];count++;}
   if(data.kind[id]===5)return 'Application head beyond this 32-field preview';
   let text=A.describe(data,id);
   if(data.kind[id]===0){const r=P.append(model.routeFor(scene,p.id),Array(count).fill(0)),b=P.resolve(data,r).binding;if(b){const payload=data.payloads[b.node];text=(payload.binderName||payload.declName||'_')+' · binder at source depth '+b.route.depth;}}
   return 'Head: '+text+' · '+count+' supplied source argument'+(count===1?'':'s');
  }
  for(const p of points){
   const pos=positions.get(p.id),card=el('article',undefined,'pow-card poc-card'),label=p.rule?(p.rule==='Pi-introduction'?'Π introduction':p.rule==='let-binding'?'Local definition':p.rule==='Pi-application-spine'?'Π application · '+p.members.length+' retained stages':'Π application'):reason[p.boundaryReason],pickButton=button(p.glyph+' '+(label||p.kind),()=>pick(p));
   card.dataset.constructor=p.kind;card.dataset.constructionKind=p.rule?'rule':'boundary';card.style.left=pos.x+'px';card.style.top=pos.y+'px';pickButton.dataset.constructionPoint=p.id;pickButton.setAttribute('aria-pressed','false');pickButton.append(el('small',p.role+' · Γ'+p.contextLength+' · source e'+p.node));card.append(pickButton);
   const formula=el('p',preview(p),'pow-formula');formula.tabIndex=0;card.append(formula);
   if(p.rule==='let-binding'){card.dataset.localDefinition=p.id;card.append(el('p','Type and value in Γ'+p.contextLength+'; body in Γ'+(p.contextLength+1)+' with '+p.contextExtension.binderName+' := value.','poc-context'));}
   if(p.typeComponents){const d=el('details'),a=el('a','Compiled native record ↓'),pre=el('pre',JSON.stringify({context:p.contextExtension,conversionChecks:p.checks,typeExpressions:p.typeComponents},null,2),'poc-stage-types');pre.tabIndex=0;a.href=p.evidenceFile;d.append(el('summary','Native rule record'),pre,a);card.append(d);}
   if(p.rule==='Pi-introduction')card.append(el('p','Domain in Γ'+p.contextLength+'; body in Γ'+(p.contextLength+1)+'.','poc-context'));
   if(p.recording?.stage)card.append(el('p','Recorded application stage '+p.recording.stage,'poc-context'));
   if(p.members&&p.kind==='app'){card.dataset.applicationGroup=p.id;card.append(el('p',p.headIsApplication?'Partial spine: argument slots are relative to this retained suffix.':'Complete source spine: argument slots follow call order.','poc-context'));}
   if(!p.rule)card.append(el('p',p.expanded+' source occurrence'+(p.expanded==='1'?'':'s')+' inside this boundary.','poc-context'));
   const ports=new Map();for(const edge of scene.edges.filter(e=>e.from===p.id)){const child=points.find(p=>p.id===edge.to),field=edge.field==='head'?'Head':/^arg\d+$/.test(edge.field)?(p.headIsApplication?'Trailing argument ':'Argument ')+edge.field.slice(3):edge.field,b=button(field+' · '+child.role+' · Γ'+child.contextLength,()=>pick(child));b.className='pow-port';b.dataset.constructionField=edge.field;card.append(b);ports.set(edge.field,b);}
   if(p.typeReference){
    const b=button('Recorded type · Γ'+p.contextLength,async()=>{const epoch=++action;b.disabled=true;try{callbacks.onTypeStart?.();const type=await model.typeFor(scene,p.id);if(!disposed&&epoch===action){pick(p,false);callbacks.onType(model.routeFor(scene,p.id),type);}}catch(error){status.textContent=error.message;}finally{b.disabled=false;}});b.dataset.constructionType=p.id;card.append(b);
   }
   if(p.alternateTypeReference){const b=button('Meta-inferred argument type',async()=>{const epoch=++action;b.disabled=true;try{callbacks.onTypeStart?.();const type=await model.typeFor(scene,p.id,'meta');if(!disposed&&epoch===action){pick(p,false);callbacks.onType(model.routeFor(scene,p.id),type);}}catch(error){status.textContent=error.message;}finally{b.disabled=false;}});b.dataset.constructionAlternateType=p.id;card.append(b);}
   if(p.members&&p.kind==='app'){
    const details=el('details'),content=el('ol');details.dataset.constructionStages=p.id;details.append(el('summary','Retained stages · '+p.members.length),content);let populated=false;
    details.ontoggle=()=>{if(populated||!details.open)return;populated=true;for(const [i,m]of p.members.entries()){
     const native=model.stageFor(scene,p.id,m.id),item=el('li'),b=button((p.headIsApplication?'Trailing stage ':'Stage ')+(i+1)+' · e'+m.node+' · '+m.role,()=>pickMember(p,m));b.dataset.constructionMember=p.id+':'+m.id;b.setAttribute('aria-pressed','false');item.append(b,el('p','Γ'+native.contextLength+' · '+({default:'explicit',implicit:'implicit',strictImplicit:'strict implicit',instImplicit:'instance implicit'}[native.binderInfo]||native.binderInfo)+' binder · function '+native.roles.function+' / argument '+native.roles.argument+' / result '+native.roles.result,'poc-context'));
     const text=Object.entries(native.texts).filter(([,s])=>s).map(([label,s])=>label+': '+(s.length<=1600?s:s.slice(0,1600)+'… [text clipped; exact type graph available]')).join('\n');if(text){const pre=el('pre',text,'poc-stage-types');pre.tabIndex=0;item.append(pre);}
     for(const [field,label]of [['fn','Before type'],['arg','Argument type'],['conclusion','After type']]){const typeButton=button(label,()=>memberType(p,m,field,typeButton));typeButton.dataset.constructionMemberType=p.id+':'+m.id+':'+field;item.append(typeButton);}
     item.append(button('Focus source stage',()=>callbacks.onSource(model.routeFor(scene,p.id,m.id))));content.append(item);
    }};card.append(details);
   }
   let binding=null;if(p.binding){binding=button('Go to original binder',()=>callbacks.onSource(model.resolve(scene,p.binding.address)));binding.className='pow-binding';binding.dataset.constructionBinding=p.id;card.append(binding);}
   stage.append(card);cards.set(p.id,{card,pick:pickButton,ports,binding});
  }
  external.forEach((ref,i)=>{const id='ctx'+i,pos={x:20+columns*340,y:20+i*180},card=el('article',undefined,'pow-context-card'),r=model.resolve(scene,ref.address),label=presentation?.binders[ref.node],payload=label?null:data.payloads[ref.node],pick=button((label?label.name:payload.binderName||payload.declName||'_')+' · e'+ref.node,()=>callbacks.onSource(r));positions.set(id,pos);byAddress.set(addressKey(ref.address),id);card.style.left=pos.x+'px';card.style.top=pos.y+'px';pick.dataset.constructionContext=id;card.append(el('small',(label?label.kind:data.kind[ref.node])===8?'ORIGINAL Γ · LOCAL DEFINITION':'ORIGINAL Γ · OUTSIDE THIS CUT'),pick,el('p','Source depth '+r.depth+'. Excluded from the subtree count.'));stage.append(card);cards.set(id,{card,pick});});
  function paths(){if(disposed)return;svg.replaceChildren();function line(from,to,control,relation){const a=positions.get(from),b=positions.get(to),target=cards.get(to).pick,right=b.x>=a.x,sx=right?a.x+280:a.x,sy=a.y+control.offsetTop+control.offsetHeight/2,tx=right?b.x:b.x+280,ty=b.y+target.offsetTop+target.offsetHeight/2,path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M '+sx+' '+sy+' C '+(sx+(right?35:-35))+' '+sy+' '+(tx+(right?-35:35))+' '+ty+' '+tx+' '+ty);path.dataset.relation=relation;if(relation==='original-source-context')path.classList.add('pow-binding-edge');svg.append(path);}
   for(const edge of scene.edges)line(edge.from,edge.to,cards.get(edge.from).ports.get(edge.field),edge.relation);
   for(const link of scene.links)line(link.from,byAddress.get(addressKey(link.address)),cards.get(link.from).binding,'original-source-context');
  }
  function reflow(){if(disposed)return;if(orderedLayout){const bottoms=new Map();for(const [id,item]of cards){const pos=positions.get(id),y=bottoms.get(pos.x)||20;pos.y=y;item.card.style.top=y+'px';bottoms.set(pos.x,y+item.card.offsetHeight+36);}currentHeight=Math.max(350,...bottoms.values());stage.style.height=currentHeight+'px';svg.setAttribute('height',currentHeight);sizing.style.height=currentHeight*scale+'px';viewport.style.height=Math.min(650,currentHeight+20)+'px';}paths();}
  reflow();document.fonts?.ready.then(reflow);
  summary.textContent=(folded?'Displayed rules: '+scene.stats.displayedRules+'. ':'')+'Retained constructors: '+scene.stats.retained+'. Boundary occurrences: '+scene.stats.hidden+'. Total: '+scene.stats.represented+'. External Γ references contribute zero.';
  status.textContent='Only recorded construction rules are expanded. '+(folded?'Groups retain all primitive stages. ':'')+'A boundary is not an independently checked proof step.';
  function setScale(value){scale=value;stage.style.transform='scale('+scale+')';sizing.style.width=width*scale+'px';sizing.style.height=currentHeight*scale+'px';}setScale(1);
  let drag=null;viewport.addEventListener('pointerdown',e=>{if(e.target.closest('article,button,a'))return;drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);});viewport.addEventListener('pointermove',e=>{if(drag)viewport.scrollTo(drag.left+drag.x-e.clientX,drag.top+drag.y-e.clientY);});viewport.addEventListener('pointerup',()=>{drag=null;});viewport.addEventListener('pointercancel',()=>{drag=null;});
  const resize=new ResizeObserver(reflow);for(const item of cards.values())resize.observe(item.card);host.addEventListener('resize',reflow);
  return{getScene:()=>scene,select:route=>{for(const p of points){const members=p.members||[null];for(const m of members){const r=model.routeFor(scene,p.id,m?.id);if(r.root===route.root&&r.depth===route.depth&&r.slots===route.slots){if(m&&m!==p.members.at(-1))pickMember(p,m);else pick(p);return;}}}},setScale,dispose:()=>{disposed=true;action++;resize.disconnect();host.removeEventListener('resize',reflow);shell.remove();parent.hidden=true;}};
 }
 host.ProofAtlasOccurrenceConstructionView={mount};
})(typeof window==='undefined'?globalThis:window);
