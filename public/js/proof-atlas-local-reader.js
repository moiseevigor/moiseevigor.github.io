/* Read a small exact occurrence tree; never merge uses of a stored node. */
(function(host){
 'use strict';
 const A=typeof module==='object'&&module.exports?require('./proof-atlas-library-data.js'):host.ProofAtlasLibraryData;
 function create(data,route){
  const nodes=[],frontiers=[];
  function visit(at,depth){
   const node=A.walk(data,at),kind=A.kinds[data.kind[node]],children=A.children(data,node),binding=A.binding(data,at);
   const row={node,kind,route:{root:at.root,slots:[...at.slots]},path:A.path(data,at),binding,children:[]};nodes.push(row);
   if(depth===2){for(const [slot,id]of children.entries())frontiers.push({node:id,route:{root:at.root,slots:[...at.slots,slot]},expanded:data.expanded[id]});}
   else for(const [slot]of children.entries())row.children.push({field:A.fields[kind][slot],row:visit({root:at.root,slots:[...at.slots,slot]},depth+1)});
   row.hidden=depth===2?children.reduce((sum,id)=>sum+BigInt(data.expanded[id]),0n).toString():'0';return row;
  }
  const tree=visit(route,0),hidden=frontiers.reduce((sum,f)=>sum+BigInt(f.expanded),0n);
  if(BigInt(nodes.length)+hidden!==BigInt(data.expanded[tree.node]))throw Error('Local occurrence accounting differs');
  return{tree,nodes,frontiers,retained:nodes.length,hidden:hidden.toString(),represented:data.expanded[tree.node]};
 }
 function mount(container,data,route,select){
  const model=create(data,route),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const count=x=>BigInt(x).toLocaleString('en-US');
  function pick(text,row,cls){const b=el('button',text,cls);b.type='button';b.title=row.path||A.path(data,row.route);b.onclick=()=>select(row.node,row.route);return b;}
  function render(row){
   const titles={bvar:'Bound variable',fvar:'Local variable',mvar:'Metavariable',sort:'Sort',const:'Declaration reference',app:'Apply',lam:'Bind',forallE:'∀ / Π binder',letE:'Local definition',lit:'Literal',mdata:'Metadata wrapper',proj:'Project field'};
   const li=el('li'),card=el('div',undefined,'pl-local-card'),b=pick(titles[row.kind]+' · '+row.kind+' · e'+row.node,row,'pl-local-select');b.dataset.localPath=row.path;b.setAttribute('aria-pressed',String(row===model.tree));
   card.append(b,el('code',A.describe(data,row.node)));
   if(row.binding)card.append(pick('Bound to '+(data.payloads[row.binding.node].binderName||data.payloads[row.binding.node].declName||'_')+' · e'+row.binding.node,row.binding,'pl-local-binding'));
   if(row.hidden!=='0')card.append(pick('Open '+count(row.hidden)+' folded occurrences',row,'pl-local-expand'));
   li.append(card);
   if(row.children.length){const list=el('ol');for(const child of row.children){const entry=render(child.row);entry.prepend(el('span',child.field,'pl-local-field'));list.append(entry);}li.append(list);}
   return li;
  }
  const list=el('ol',undefined,'pl-local-tree');list.append(render(model.tree));
  container.replaceChildren(el('p','Read from the selected occurrence down through its ordered fields. Select a child to continue; Parent returns along the same source path. Node-number jumps choose one representative use.','pl-local-help'),list,el('p',count(model.retained)+' shown + '+count(model.hidden)+' folded = '+count(model.represented)+' occurrences. Source structure; types appear only where separately recorded.','pl-local-accounting'));
  return model;
 }
 const api={create,mount};if(typeof module==='object'&&module.exports)module.exports=api;else host.ProofAtlasLocalReader=api;
})(typeof window==='undefined'?globalThis:window);
