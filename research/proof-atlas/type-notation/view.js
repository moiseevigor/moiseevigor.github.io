(function(host){
 'use strict';
 const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 function draw(container,{scene,onSelect,onExpand,isCurrent}){
  const expression=el('div');expression.className='tn-expression';expression.tabIndex=0;expression.setAttribute('role','group');expression.setAttribute('aria-label','Recoverable type notation');
  const punctuation=text=>el('span',text),button=(text,slots,label)=>{const b=el('button',text);b.type='button';b.className='tn-atom';b.dataset.tnPick=JSON.stringify(slots);b.setAttribute('aria-label',label);b.title=label;b.onclick=()=>{if(isCurrent())onSelect(slots);};return b;};
  function render(node){
   const group=el('span');group.className='tn-term';group.dataset.tnKind=node.kind;
   const pick=button(node.form==='absolute'?'|':node.label,node.slots,node.label+(node.signature?' · '+node.signature.name:'')+' · '+node.rawKind+' · '+(node.hiddenPorts?.length||0)+' retained arguments'+(node.metadata?' · metadata retained':''));
   const parts=node.children.map(c=>render(c.value));
   if(node.kind==='notation'&&node.form==='binary'){group.append(punctuation('('),parts[0],pick,parts[1],punctuation(')'));}
   else if(node.kind==='notation'&&node.form==='prefix'){group.append(pick,punctuation('('),parts[0],punctuation(')'));}
   else if(node.kind==='notation'&&node.form==='absolute'){group.append(pick,parts[0],punctuation('|'));}
   else if(node.kind==='binder'){
    group.classList.add('tn-binder');const heading=el('span');heading.className='tn-binder-head';heading.append(punctuation(node.form==='forall'?'∀ ':node.form==='lambda'?'fun ':'let '),pick);group.append(heading);
    const names=node.form==='let'?['Type','Value','Body']:['Domain','Body'];parts.forEach((part,i)=>{const row=el('span');row.className='tn-binder-field';const caption=el('small',names[i]);row.append(caption,part);group.append(row);});
   }else if(node.kind==='annotated'){group.append(...parts);const marker=button('⋯',node.slots,'Retained metadata wrapper');marker.classList.add('tn-metadata');group.append(marker);}
   else{group.append(pick);if(parts.length){group.append(punctuation('('));parts.forEach((p,i)=>{if(i)group.append(punctuation(', '));group.append(p);});group.append(punctuation(')'));}}
   if(node.kind==='frontier'&&onExpand){const expand=el('button','+');expand.type='button';expand.className='tn-expand';expand.dataset.tnExpand=JSON.stringify(node.slots);expand.setAttribute('aria-label','Expand this frontier in place');expand.title='Expand this frontier in place';expand.onclick=()=>{if(isCurrent())onExpand(node.slots);};group.append(expand);}
   return group;
  }
  expression.append(render(scene.root));container.append(expression);
  const note=el('p','Select a symbol to inspect its compiled region. Use + to open a frontier in place. Type and instance arguments remain in the notation record.');note.className='tn-caption';container.append(note);
  const counts=el('p',scene.stats.nodes+' notation objects · '+scene.stats.retained+' source occurrences retained in records · '+scene.stats.hidden+' collapsed.');counts.className='tn-caption';container.append(counts);
  const root=scene.root,ports=[...(root.hiddenPorts||[]),...(root.foldedPorts||[])].sort((a,b)=>a.slot-b.slot);
  if(ports.length){
   const panel=el('div');panel.className='tn-ports';panel.dataset.tnPorts='';panel.append(el('h5','Retained arguments of this symbol'));let page=0;
   const list=el('ul'),tools=el('div');tools.className='pm-controls';
   function show(){list.replaceChildren();for(const port of ports.slice(page*4,page*4+4)){const item=el('li'),label='slot '+port.slot+' · '+port.name.split('._@')[0]+' · '+port.binderInfo,b=button(label,port.slots,'Inspect '+label);b.dataset.tnPort=String(port.slot);item.append(b);list.append(item);}tools.replaceChildren();if(ports.length>4){const prev=el('button','Previous arguments'),next=el('button','Next arguments');prev.type=next.type='button';prev.disabled=page===0;next.disabled=(page+1)*4>=ports.length;prev.onclick=()=>{if(isCurrent()){page--;show();}};next.onclick=()=>{if(isCurrent()){page++;show();}};tools.append(prev,el('span',(page*4+1)+'–'+Math.min((page+1)*4,ports.length)+' of '+ports.length),next);}}
   show();panel.append(list,tools);container.append(panel);
  }
  if(root.residual){const head=button('Inspect exact head',root.residual.head.origin.slots,'Inspect exact application head');head.dataset.tnHead='';container.append(head);}
  const evidence=el('details');evidence.append(el('summary','Notation rule, signature and reconstruction record'),el('pre',JSON.stringify({rule:scene.rule,origin:root.origin,signature:root.signature,residual:root.residual,hiddenPorts:root.hiddenPorts,foldedPorts:root.foldedPorts,accounting:scene.stats,limits:scene.limits},null,2)));container.append(evidence);
 }
 host.ProofAtlasTypeNotationView={draw};
})(window);
