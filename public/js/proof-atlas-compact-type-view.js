/* A recorded type uses the same constructor vocabulary, in its own namespace. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,action)=>{const n=el('button',text);n.type='button';n.onclick=action;return n;};
 function mount(parent,entry,source,onSource){
  const A=host.ProofAtlasLibraryData,P=host.ProofAtlasPackedRoutes,T=host.ProofAtlasDeepContext,W=host.ProofAtlasOccurrenceWindow;
  let scene=null,selected=null,disposed=false,scale=1,index=null;
  const shell=el('section',undefined,'pow-type-region'),heading=el('h2','Recorded type geometry'),caption=el('p','Native '+entry.role+' record · Γ'+entry.contextLength+' · computed type namespace'),tools=el('div',undefined,'pow-tools'),viewport=el('div',undefined,'pow-viewport pow-type-viewport'),sizing=el('div',undefined,'pow-sizing'),stage=el('div',undefined,'pow-stage'),summary=el('p',undefined,'pow-summary'),inspector=el('section',undefined,'pow-type-inspector');
  shell.dataset.recordedType='';viewport.tabIndex=0;viewport.setAttribute('aria-label','Recorded type geometry. Scroll to inspect the bounded cut.');viewport.append(sizing);sizing.append(stage);shell.append(heading,caption,tools,viewport,summary,inspector);parent.replaceChildren(shell);parent.hidden=false;
  const root=button('Type root',()=>focus(P.encode(0,[]))),up=button('Type parent',()=>focus(P.prefix(scene.root.route,scene.root.route.depth-1)));
  function scaled(){stage.style.transform='scale('+scale+')';sizing.style.width=Number(stage.dataset.width)*scale+'px';sizing.style.height=Number(stage.dataset.height)*scale+'px';}
  const jump=el('input');jump.type='number';jump.min='0';jump.max=String(entry.typeData.kind.length-1);jump.setAttribute('aria-label','Computed type node number');jump.style.width='9rem';
  const status=el('p','A type node number chooses one representative occurrence; descendants have no additional typing.','pow-help');status.setAttribute('role','status');tools.after(status);
  tools.append(root,up,button('Type zoom out',()=>{scale=Math.max(.4,scale/1.25);scaled();}),button('Type zoom in',()=>{scale=Math.min(2,scale*1.25);scaled();}),button('Reset type zoom',()=>{scale=1;scaled();}),jump,button('Go to type node',()=>{try{if(!jump.value.trim())throw Error('Enter a stored type node number');index??=W.representatives(entry.typeData);focus(index.route(Number(jump.value)));status.textContent='Representative computed type occurrence. The source selection is unchanged.';}catch(error){status.textContent=error.message;}}));
  function inspect(n){
   selected=n;for(const b of stage.querySelectorAll('[data-type-node]'))b.setAttribute('aria-pressed',String(b.dataset.typeNode===n.id));
   const term=el('pre',A.describe(entry.typeData,n.node));term.tabIndex=0;
   inspector.replaceChildren(el('h3',n.glyph+' '+n.kind+' · type e'+n.node),term,el('p','Computed type syntax at depth '+n.route.depth+'. No additional native typing judgment is attached here.'),button('Focus type expression',()=>focus(n.route)));
   if(n.binding){const b=n.binding,external=b.namespace==='original-source-context';const jump=button(external?'Go to original Γ slot '+(b.ordinal+1):'Go to type binder',()=>external?onSource(b.route):focus(b.route));jump.dataset.typeBinding=b.namespace;inspector.append(jump);}
   const exact=el('details');exact.append(el('summary','Computed type address'),el('pre',JSON.stringify({namespace:'computed-native-type',typeGraphSha256:entry.typeGraphSha256,typeRoute:n.route,originalSourceRoute:entry.route,evidenceSha256:entry.evidenceSha256},null,2)));inspector.append(exact);
   const payload=el('details');payload.append(el('summary','Recorded type constructor payload'),el('pre',JSON.stringify(n.payload,null,2)));inspector.append(payload);
  }
  function focus(route){
   if(disposed)return;const next=T.typeScene(entry,source,route);scene=next;stage.replaceChildren();
   const cols=Math.max(...scene.nodes.map(n=>n.depth))+1,rows=Math.max(...scene.nodes.map(n=>n.row))+1;
   const key=b=>b.namespace+':'+b.route.root+':'+b.route.depth+':'+b.route.slots;
   const shown=new Map(scene.nodes.map(n=>[key({namespace:'computed-native-type',route:n.route}),n.id]));
   const boundaries=[...new Map(scene.links.filter(l=>!shown.has(key(l))).map(l=>[key(l),l])).values()];
   const width=(cols+(boundaries.length?1:0))*300+30,height=Math.max(rows*260,boundaries.length*180)+30;
   stage.dataset.width=width;stage.dataset.height=height;stage.style.width=width+'px';stage.style.height=height+'px';viewport.style.height=Math.min(500,Math.max(300,height+15))+'px';
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('aria-hidden','true');svg.classList.add('pow-edges');stage.append(svg);
   const positions=new Map(),cards=new Map();
   for(const n of scene.nodes){
    const pos={x:20+n.depth*300,y:20+n.row*260};positions.set(n.id,pos);
    const card=el('article',undefined,'pow-card'),pick=button(n.glyph+' '+n.kind+' · type e'+n.node,()=>inspect(n)),ports=[];pick.dataset.typeNode=n.id;pick.setAttribute('aria-pressed','false');card.dataset.constructor=n.kind;card.style.left=pos.x+'px';card.style.top=pos.y+'px';pick.append(el('small','Computed type · depth '+n.route.depth));card.append(pick,el('p',A.describe(entry.typeData,n.node),'pow-formula'));
    for(const port of n.ports){const b=button(port.kernelField+' · '+(port.displayed?'shown':port.expanded+' hidden'),()=>focus(port.route));b.className='pow-port'+(port.displayed?'':' pow-frontier');b.dataset.typeField=port.slot;card.append(b);ports.push(b);}
    let binding=null;
    if(n.binding){const external=n.binding.namespace==='original-source-context';binding=button(external?'Γ slot '+(n.binding.ordinal+1)+' of '+entry.contextLength:'↪ type binder',()=>external?onSource(n.binding.route):focus(n.binding.route));binding.className='pow-binding';binding.dataset.typeBoundary=n.binding.namespace;card.append(binding);}
    stage.append(card);cards.set(n.id,{card,pick,ports,binding});
   }
   boundaries.forEach((b,i)=>{
    const external=b.namespace==='original-source-context',id=key(b),card=el('article',undefined,'pow-context-card'),pos={x:20+cols*300,y:20+i*180};positions.set(id,pos);card.style.left=pos.x+'px';card.style.top=pos.y+'px';
    const target=external?source:entry.typeData,payload=target.payloads[b.node],pick=button(external?'Γ slot '+(b.ordinal+1)+' · '+(payload.binderName||payload.declName||'_'):'Enclosing type binder · e'+b.node,()=>external?onSource(b.route):focus(b.route));pick.dataset.typeContext=b.namespace;
    card.append(el('small',external?'ORIGINAL SOURCE CONTEXT':'ENCLOSING COMPUTED TYPE'),pick,el('p','Outside this type cut; excluded from its occurrence count.'));stage.append(card);cards.set(id,{card,pick});
   });
   function paths(){if(disposed||scene!==next)return;svg.replaceChildren();
    function line(from,to,control,relation){const a=positions.get(from),b=positions.get(to),target=cards.get(to).pick,right=b.x>=a.x,p=document.createElementNS(svg.namespaceURI,'path'),sx=right?a.x+245:a.x,sy=a.y+control.offsetTop+control.offsetHeight/2,tx=right?b.x:b.x+245,ty=b.y+target.offsetTop+target.offsetHeight/2;p.setAttribute('d','M '+sx+' '+sy+' C '+(sx+(right?30:-30))+' '+sy+' '+(tx+(right?-30:30))+' '+ty+' '+tx+' '+ty);p.dataset.relation=relation;if(relation!=='type-field')p.classList.add('pow-binding-edge');svg.append(p);}
    for(const edge of scene.edges)line(edge.from,edge.to,cards.get(edge.from).ports[edge.slot],'type-field');
    for(const b of scene.links)line(b.from,shown.get(key(b))||key(b),cards.get(b.from).binding,b.namespace==='original-source-context'?'type-original-context':'type-bound-to');
   }
   paths();document.fonts?.ready.then(paths);up.disabled=route.depth===0;
   summary.textContent=scene.stats.retained+' retained + '+scene.stats.hidden+' hidden = '+scene.stats.represented+' type occurrences. '+boundaries.length+' context references are outside this count.';
   inspect(scene.nodes[0]);scaled();viewport.scrollTo(0,0);
  }
  focus(P.encode(0,[]));
  return {getScene:()=>scene,getSnapshot:()=>({namespace:'computed-native-type',sourceRoute:entry.route,typeRoute:selected.route,node:selected.node,evidenceSha256:entry.evidenceSha256,typeGraphSha256:entry.typeGraphSha256}),focus,dispose:()=>{disposed=true;shell.remove();parent.hidden=true;}};
 }
 host.ProofAtlasCompactTypeView={mount};
})(typeof window==='undefined'?globalThis:window);
