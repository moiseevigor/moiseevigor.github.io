/* A small prefix tree; original binders remain source objects, contexts are derived. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},button=(text,action)=>{const n=el('button',text);n.type='button';n.onclick=action;return n;};
 function mount(root,actions){
  let disposed=false,version=0,lease=null,loading=false,controller=null,selectedCall=actions.selectedCall,frameVersion=0;
  const box=el('section',undefined,'atlas-region-contexts'),status=el('p'),tree=el('div'),frames=el('div'),toggle=button('Show original contexts',load);
  box.dataset.regionContexts='';status.setAttribute('role','status');box.append(el('h3','Where the calls are in scope'),el('p','Calls share a context only when their ordered original binders agree. A link below extends a lexical context; it is not a logical implication.'),toggle,status,tree,frames);root.replaceChildren(box);
  function release(){version++;frameVersion++;controller?.abort();controller=null;lease?.dispose();lease=null;loading=false;tree.replaceChildren();frames.replaceChildren();box.removeAttribute('aria-busy');}
  function selectCall(call){selectedCall=call;for(const b of tree.querySelectorAll('[data-context-call]'))b.setAttribute('aria-pressed',String(Number(b.dataset.contextCall)===call));for(const n of tree.querySelectorAll('[data-context-vertex]'))n.classList.toggle('rc-selected',!!n.querySelector('[data-context-call][aria-pressed="true"]'));if(lease){const p=lease.scene().placements.find(p=>p.call===call);if(p&&p.vertex!=='c0')showFrames(p.vertex);else{frameVersion++;frames.replaceChildren();}}}
  function showFrames(vertex,offset=0){
   if(disposed||!lease)return;const current=version,frame=++frameVersion,page=lease.page(vertex,offset),scene=lease.scene(),children=new Map(scene.edges.map(e=>[e.to,e.from]));
   const descendants=scene.placements.filter(p=>{let id=p.vertex;while(id!=='c0'&&id!==vertex)id=children.get(id);return id===vertex;});
   const call=descendants.some(p=>p.call===selectedCall)?selectedCall:descendants[0].call;
   frames.replaceChildren(el('h4',page.from+' → '+page.to+' · '+page.total+' additional binders'),el('p','Headers belong to the context before each binder. Entering its body adds that binder. Binder actions use original call '+call+'.'));
   const list=el('ol');list.start=page.rows[0].afterDepth;
   for(const f of page.rows){const li=el('li'),pick=button('Inspect binder '+f.afterDepth+' · '+(f.name||'_')+(f.nameTruncated?'…':''),()=>{if(!disposed&&current===version&&frame===frameVersion&&lease){const at=lease.binder(call,f.beforeDepth);actions.onBinder(call,at);}});pick.dataset.contextBinder=String(f.beforeDepth);pick.dataset.contextBinderCall=String(call);pick.dataset.contextAddress=JSON.stringify(f.address);li.append(pick,el('p',f.kind+' · Γ'+f.beforeDepth+' → Γ'+f.afterDepth+' · '+f.headers.map(h=>h.field+' in Γ'+h.contextDepth).join(', ')));const source=scene.identity.source;if(['published-15','working-26','goedel-sample-4331'].includes(source.edition)){const link=el('a','Open exact binder in the proof explorer');link.href='/projects/proof-atlas/library/?loading=paged&edition='+encodeURIComponent(source.edition)+'&proof='+encodeURIComponent(source.name)+'&route='+encodeURIComponent(f.address.route.root+':'+f.address.route.slots.join('.'));li.append(link);}list.append(li);}frames.append(list);
   const paging=el('div',undefined,'an-controls'),prev=button('Previous context binders',()=>{if(!disposed&&frame===frameVersion)showFrames(vertex,page.previous);}),next=button('Next context binders',()=>{if(!disposed&&frame===frameVersion)showFrames(vertex,page.next);});prev.disabled=page.previous===null;next.disabled=page.next===null;paging.append(prev,next);frames.append(el('p','Binders '+(offset+1)+'–'+(offset+page.rows.length)+' of '+page.total+' on this link.'),paging);
  }
  function draw(){
   const scene=lease.scene();tree.replaceChildren();const edges=new Map(scene.edges.map(e=>[e.to,e])),children=new Map();for(const e of scene.edges){if(!children.has(e.from))children.set(e.from,[]);children.get(e.from).push(e.to);}
   const byId=new Map(scene.vertices.map(v=>[v.id,v]));
   function branch(id){const v=byId.get(id),li=el('li'),card=el('div',undefined,'rc-context');card.dataset.contextVertex=id;card.append(el('strong',id+' · Γ'+v.depth));const incoming=edges.get(id);if(incoming){const inspect=button('Show '+incoming.frames.length+' binders from '+incoming.from,()=>showFrames(id));inspect.dataset.contextEdge=id;card.append(inspect);}else card.append(el('span','Empty lexical context'));
    const calls=el('div',undefined,'rc-calls');for(const call of v.calls){const b=button('Read call '+call,()=>{if(!disposed){selectCall(call);actions.onCall(call);}});b.dataset.contextCall=String(call);b.setAttribute('aria-pressed',String(call===selectedCall));calls.append(b);}if(!v.calls.length&&id!=='c0')card.append(el('p','Shared prefix; no selected call is placed here.'));card.append(calls);li.append(card);
    if(children.has(id)){const list=el('ol');for(const child of children.get(id))list.append(branch(child));li.append(list);}return li;
   }
   const list=el('ol',undefined,'rc-tree');list.append(branch('c0'));tree.append(list);status.textContent=scene.stats.calls+' calls in '+scene.stats.distinctContexts+' exact contexts; '+scene.stats.vertices+' visible context vertices. Context labels are local to this tree.';selectCall(selectedCall);
   const p=scene.placements.find(p=>p.call===selectedCall)||scene.placements[0];if(p.vertex!=='c0')showFrames(p.vertex);
  }
  async function load(){
   if(disposed||loading)return;if(lease){release();status.textContent='';toggle.textContent='Show original contexts';return;}
   const current=++version;loading=true;controller=new AbortController();box.setAttribute('aria-busy','true');status.textContent='Reading exact binder prefixes through source pages…';toggle.disabled=true;
   try{const opened=await actions.open(controller.signal);if(disposed||current!==version){opened.dispose();return;}lease=opened;draw();toggle.textContent='Hide original contexts';}
   catch(error){if(!disposed&&current===version){status.textContent='Original contexts unavailable: '+error.message;lease?.dispose();lease=null;tree.replaceChildren();frames.replaceChildren();}}
   finally{if(!disposed&&current===version){loading=false;toggle.disabled=false;box.removeAttribute('aria-busy');}}
  }
  return{selectCall,state:()=>({loading,selectedCall,scene:lease?.scene()||null,lease:lease?.state()||null}),dispose(){if(disposed)return;disposed=true;release();for(const b of box.querySelectorAll('button'))b.disabled=true;}};
 }
 host.ProofAtlasRegionContextsView={mount};
})(window);
