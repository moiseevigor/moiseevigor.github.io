/* Context-frame lens inside the existing occurrence construction reader. */
(function(host){
'use strict';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action)=>{const n=el('button',text);n.type='button';n.onclick=action;return n;};
function mount(parent,model,data,scene,callbacks,presentation=null){
 let disposed=false,action=0,scale=1;const points=[],captionItems=new Map();
 const shell=el('section',undefined,'poc-view pcf-view'),viewport=el('div',undefined,'pow-viewport'),sizing=el('div',undefined,'pow-sizing'),stage=el('div',undefined,'pcf-stage'),status=el('p',undefined,'pow-help');
 shell.dataset.contextFrameView='';viewport.tabIndex=0;viewport.setAttribute('aria-label','Context frame. Scroll or drag empty space to pan.');status.setAttribute('role','status');
 shell.append(el('h2','Recorded context frame'),el('p','Each row extends the original Γ once. Headers stay before their own binder; the remaining body follows the last extension.','pow-help'));
 const initial=el('p','Original context Γ'+scene.context.initialLength+' → Γ'+scene.context.finalLength+' · '+scene.members.length+' retained extensions','pcf-initial');stage.append(initial);
 function pick(address,notify=true){
  if(notify)action++;
  const route=model.resolve(scene,address);for(const p of points)p.button.setAttribute('aria-pressed',String(JSON.stringify(p.address)===JSON.stringify(address)));
  if(notify)callbacks.onSelect(route,callbacks.lazyTypes?()=>model.typeFor(scene,address):model.typeFor(scene,address));return route;
 }
 function sourceControl(address,label,parent){
  const route=model.resolve(scene,address),prepared=presentation?.previews[JSON.stringify(address)],node=prepared?prepared.node:host.ProofAtlasPackedRoutes.resolve(data,route).node,b=button(label,()=>pick(address));b.dataset.contextFramePoint=JSON.stringify(address);b.dataset.constructionPoint='';b.setAttribute('aria-pressed','false');parent.append(b);points.push({address,route,button:b});
  const detail=prepared?prepared.text:host.ProofAtlasLibraryData.describe(data,node),preview=el('p',prepared?detail:detail.length>240?detail.slice(0,240)+'… [constructor preview]':detail,'pow-formula'),badge=el('p',undefined,'pow-help');badge.hidden=true;preview.tabIndex=0;parent.append(badge,preview);captionItems.set(JSON.stringify(address),{preview,badge});
  const actions=el('div',undefined,'pcf-actions'),type=button(['binderType','type'].includes(address.field)?'Type of expression':'Recorded type',async()=>{const epoch=++action;type.disabled=true;try{callbacks.onTypeStart?.();const entry=await model.typeFor(scene,address);if(!disposed&&epoch===action){pick(address,false);callbacks.onType(route,entry);}}catch(error){if(!disposed&&epoch===action)status.textContent=error.message;}finally{type.disabled=false;}});type.dataset.contextFrameType=JSON.stringify(address);actions.append(type,button('Focus source',()=>callbacks.onSource(route)));parent.append(actions);
  const link=scene.links.find(l=>JSON.stringify(l.from)===JSON.stringify(address));if(link){const jump=button('Go to original '+(link.bindingClass==='local-definition'?'definition':'binder'),()=>callbacks.onSource(model.resolve(scene,link.target)));jump.dataset.contextFrameBinding=JSON.stringify(address);jump.className='pow-binding';parent.append(jump);}
 }
 for(const [i,m]of scene.members.entries()){
  const row=el('article',undefined,'pcf-row'),headers=el('section',undefined,'pcf-headers'),step=el('section',undefined,'pcf-step'),extension=el('div',undefined,'pcf-extension');row.dataset.contextFrameMember=i;row.dataset.constructor=m.rule==='let-binding'?'letE':'lam';
  headers.append(el('h3','Headers · Γ'+m.contextLength));for(const h of scene.headers.filter(h=>h.address.member===i)){const box=el('div',undefined,'pcf-header');sourceControl(h.address,({binderType:'Binder domain',type:'Declared type',value:'Value'}[h.address.field]||h.address.field)+' · '+(h.address.field==='value'?h.role+' · ':'')+'Γ'+h.contextLength+' · e'+h.node,box);headers.append(box);}
  const glyph=host.ProofAtlasGeometry.vocabulary[m.rule==='let-binding'?'letE':'lam'].glyph;step.append(el('h3',glyph+' '+(m.rule==='let-binding'?'Local definition':'Introduction')+' · '+(m.binder.name||'_')));sourceControl({member:i},'Whole '+(m.rule==='let-binding'?'let':'lambda')+' · '+m.role+' · e'+m.node,step);
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
 const captionRetry=button('Retry captions',()=>{});captionRetry.hidden=true;captionRetry.dataset.captionRetry='';shell.append(captionRetry);
 function captionStatus(message,retry){status.textContent=message;captionRetry.hidden=!retry;captionRetry.onclick=async()=>{const focused=document.activeElement===captionRetry;captionRetry.disabled=true;try{await retry?.();}finally{if(!disposed){captionRetry.disabled=false;if(focused&&captionRetry.hidden)(shell.querySelector('[data-construction-point][aria-pressed="true"]')||viewport).focus();}}};}
 function setCaptions(presentation,retry){if(disposed)return false;host.ProofAtlasConstructionCaptions.assertFor(presentation,scene);for(const[id,item]of captionItems){const caption=presentation.captions[id];if(!caption)continue;item.badge.hidden=false;item.badge.textContent=caption.category==='recorded-source-expression'?'Source expression':caption.presentation==='compiled-constructor-summary'?'Recorded type · constructor summary':'Recorded type';item.preview.textContent=caption.text;item.preview.dataset.recordedCaption=caption.category;item.preview.dataset.captionOrigin=caption.originKey;}captionStatus(presentation.counts.refused?'Some captions are unavailable. Original source and type controls remain usable.':'Recorded text retains its original context and may omit details.',presentation.counts.refused?retry:null);resize();return true;}
 return{getScene:()=>scene,setScale,setCaptions,setCaptionPending:()=>{if(!disposed)captionStatus('Loading recorded text…',null);},setCaptionError:(message,retry)=>{if(!disposed)captionStatus('Recorded captions unavailable: '+message+'. Constructor previews and source/type controls remain usable.',retry);},select:route=>{const p=points.find(p=>p.route.root===route.root&&p.route.depth===route.depth&&p.route.slots===route.slots);if(p)pick(p.address);},dispose:()=>{disposed=true;action++;observer.disconnect();shell.remove();parent.hidden=true;}};
}
host.ProofAtlasOccurrenceContextFrameView={mount};
})(typeof window==='undefined'?globalThis:window);
