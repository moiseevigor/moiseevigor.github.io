/* Context-frame lens inside the existing occurrence construction reader. */
(function(host){
'use strict';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action)=>{const n=el('button',text);n.type='button';n.onclick=action;return n;};
function mount(parent,model,data,scene,callbacks){
 let disposed=false,action=0,scale=1;const points=[];
 const shell=el('section',undefined,'poc-view pcf-view'),viewport=el('div',undefined,'pow-viewport'),sizing=el('div',undefined,'pow-sizing'),stage=el('div',undefined,'pcf-stage'),status=el('p',undefined,'pow-help');
 shell.dataset.contextFrameView='';viewport.tabIndex=0;viewport.setAttribute('aria-label','Context frame. Scroll or drag empty space to pan.');status.setAttribute('role','status');
 shell.append(el('h2','Recorded context frame'),el('p','Each row extends the original Γ once. Headers stay before their own binder; the remaining body follows the last extension.','pow-help'));
 const initial=el('p','Original context Γ'+scene.context.initialLength+' → Γ'+scene.context.finalLength+' · '+scene.members.length+' retained extensions','pcf-initial');stage.append(initial);
 function pick(address,notify=true){
  const route=model.resolve(scene,address);for(const p of points)p.button.setAttribute('aria-pressed',String(JSON.stringify(p.address)===JSON.stringify(address)));
  if(notify)callbacks.onSelect(route,model.typeFor(scene,address));return route;
 }
 function sourceControl(address,label,parent){
  const route=model.resolve(scene,address),node=host.ProofAtlasPackedRoutes.resolve(data,route).node,b=button(label,()=>pick(address));b.dataset.contextFramePoint=JSON.stringify(address);b.dataset.constructionPoint='';b.setAttribute('aria-pressed','false');parent.append(b);points.push({address,route,button:b});
  const detail=host.ProofAtlasLibraryData.describe(data,node),preview=el('p',detail.length>240?detail.slice(0,240)+'… [constructor preview]':detail,'pow-formula');preview.tabIndex=0;parent.append(preview);
  const actions=el('div',undefined,'pcf-actions'),type=button('Recorded type',async()=>{const epoch=++action;type.disabled=true;try{const entry=await model.typeFor(scene,address);if(!disposed&&epoch===action){pick(address,false);callbacks.onType(route,entry);}}catch(error){if(!disposed)status.textContent=error.message;}finally{type.disabled=false;}});type.dataset.contextFrameType=JSON.stringify(address);actions.append(type,button('Focus source',()=>callbacks.onSource(route)));parent.append(actions);
  const link=scene.links.find(l=>JSON.stringify(l.from)===JSON.stringify(address));if(link){const jump=button('Go to original '+(link.bindingClass==='local-definition'?'definition':'binder'),()=>callbacks.onSource(model.resolve(scene,link.target)));jump.dataset.contextFrameBinding=JSON.stringify(address);jump.className='pow-binding';parent.append(jump);}
 }
 for(const [i,m]of scene.members.entries()){
  const row=el('article',undefined,'pcf-row'),headers=el('section',undefined,'pcf-headers'),step=el('section',undefined,'pcf-step'),extension=el('div',undefined,'pcf-extension');row.dataset.contextFrameMember=i;row.dataset.constructor=m.rule==='let-binding'?'letE':'lam';
  headers.append(el('h3','Headers · Γ'+m.contextLength));for(const h of scene.headers.filter(h=>h.address.member===i)){const box=el('div',undefined,'pcf-header');sourceControl(h.address,h.address.field+' · '+h.role+' · Γ'+h.contextLength+' · e'+h.node,box);headers.append(box);}
  const glyph=host.ProofAtlasGeometry.vocabulary[m.rule==='let-binding'?'letE':'lam'].glyph;step.append(el('h3',glyph+' '+(m.rule==='let-binding'?'Local definition':'Introduction')));sourceControl({member:i},(m.binder.name||'_')+' · '+m.role+' · e'+m.node,step);
  step.append(el('p',m.binder.kind==='local-definition'?'Extend by x : A := v; retain the value.':'Extend by x : A; discharge in the introduction conclusion.','pow-help'));
  const address={member:i,field:'body'},body=button('Body · Γ'+(m.contextLength+1),()=>pick(address));body.dataset.contextFrameBody=i;body.setAttribute('aria-pressed','false');points.push({address,route:model.resolve(scene,address),button:body});step.append(body);
  extension.append(el('p','Γ'+m.contextLength),el('span','↓'),el('p','Γ'+(m.contextLength+1)));extension.setAttribute('aria-label','Context extension from '+m.contextLength+' to '+(m.contextLength+1));row.append(headers,step,extension);stage.append(row);
 }
 const end=el('article',undefined,'pcf-continuation');end.dataset.contextFrameContinuation='';end.append(el('h3','Remaining body · Γ'+scene.context.finalLength));sourceControl(scene.continuation.address,scene.continuation.role+' · e'+scene.continuation.node+' · '+scene.continuation.expanded+' source occurrences',end);
 const reason={'member-budget':'More compatible recorded extensions remain. Focus the remaining body to continue.','no-construction-record':'No construction record at this exact body occurrence.','different-recorded-interface':'Recorded interfaces disagree; further composition is withheld.','non-context-construction':'The next recorded construction is '+scene.continuation.availableRule+'.'};
 end.append(el('p',reason[scene.stop],'pow-help'));stage.append(end);viewport.append(sizing);sizing.append(stage);shell.append(viewport,el('p',scene.stats.retained+' retained constructors + '+scene.stats.hidden+' header/body boundary occurrences = '+scene.stats.represented+'. Original Γ references contribute zero.','pow-summary'),status);parent.replaceChildren(shell);parent.hidden=false;
 status.textContent='Exact source structure and recorded native interfaces. No reduction or additional typing query.';
 function resize(){if(disposed)return;sizing.style.width=stage.offsetWidth*scale+'px';sizing.style.height=stage.offsetHeight*scale+'px';}
 const observer=new ResizeObserver(resize);observer.observe(stage);
 function setScale(value){scale=value;stage.style.transform='scale('+scale+')';resize();}
 let drag=null;viewport.addEventListener('pointerdown',e=>{if(e.target.closest('article,button,a'))return;drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);});viewport.addEventListener('pointermove',e=>{if(drag)viewport.scrollTo(drag.left+drag.x-e.clientX,drag.top+drag.y-e.clientY);});viewport.addEventListener('pointerup',()=>{drag=null;});viewport.addEventListener('pointercancel',()=>{drag=null;});
 setScale(1);
 return{getScene:()=>scene,setScale,select:route=>{const p=points.find(p=>p.route.root===route.root&&p.route.depth===route.depth&&p.route.slots===route.slots);if(p)pick(p.address);},dispose:()=>{disposed=true;action++;observer.disconnect();shell.remove();parent.hidden=true;}};
}
host.ProofAtlasOccurrenceContextFrameView={mount};
})(typeof window==='undefined'?globalThis:window);
