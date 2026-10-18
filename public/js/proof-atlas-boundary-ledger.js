/* A bounded ledger of hidden source regions, never a proof-completeness certificate. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const demand=(ok,message)=>{if(!ok)throw Error('Boundary ledger: '+message);};
 const key=r=>r.root+':'+r.slots.join('');
 const copy=r=>{demand(Number.isInteger(r?.root)&&r.root>=0&&Array.isArray(r.slots)&&r.slots.length<=512&&r.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2),'source route bound');return{root:r.root,slots:[...r.slots]};};
 const amount=x=>{demand(typeof x==='string'&&/^(0|[1-9]\d*)$/.test(x),'occurrence count');return BigInt(x);};
 function create(scene,data,{maxBoundaries=4096}={}){
  demand(Number.isInteger(maxBoundaries)&&maxBoundaries>0&&maxBoundaries<=4096,'boundary bound');
  demand(scene?.source&&scene.root&&Array.isArray(scene.nodes)&&scene.nodes.length>0&&scene.nodes.length<=32,'scene bounds');
  demand(['source-expression','kernel-rule'].includes(scene.root.namespace),'source namespace');
  demand(data.serialization==='ExprDAG/1'&&scene.source.name===data.declaration.name,'source identity');
  demand(A.walk(data,scene.root.route)===scene.root.node&&A.path(data,scene.root.route)===scene.root.path,'selected source occurrence');
  const rows=[],totals=Object.fromEntries(['proof','type','value','unrecorded'].map(role=>[role,{regions:0,occurrences:'0'}]));
  let hidden=0n;
  function add(n,p,reason){
   demand(rows.length<maxBoundaries,'hidden-region inventory exceeds fixed bound');
   const route=copy(p.route),id=A.walk(data,route),path=A.path(data,route),expanded=amount(data.expanded[id]);
   demand(id===p.node&&path===p.path&&expanded===amount(p.expanded)&&expanded>0n,'boundary source region');
   const role=p.typeReference?p.role:'unrecorded';demand(Object.hasOwn(totals,role),'root role');
   const row={node:id,path,route,expanded:expanded.toString(),role,relation:p.typeReference?'recorded-premise':'source-field',
    reason,origin:{node:n.node,path:n.id,route:copy(n.route),field:p.originalField||p.field},typeReference:p.typeReference||null};
   rows.push(row);hidden+=expanded;totals[role].regions++;totals[role].occurrences=(amount(totals[role].occurrences)+expanded).toString();
  }
  for(const n of scene.nodes){
   demand(A.walk(data,n.route)===n.node&&A.path(data,n.route)===n.id,'displayed source occurrence');
   const before=hidden;
   if(n.ports.length){for(const p of n.ports)if(p.frontier){demand(!p.child,'drawn region marked hidden');add(n,p,p.folded?'folded-'+p.foldReason:'cut-frontier');}}
   else if(amount(n.hidden)>0n){
    // An unrecorded source boundary retains its root, not its descendants.
    // Split those descendants only along literal kernel fields; infer no types.
    demand(amount(n.retainedOccurrences)===1n,'opaque source root accounting');
    const fields=A.fields[A.kinds[data.kind[n.node]]]||[];
    for(const [slot,id]of data.children[n.node].entries()){
     demand(fields[slot],'kernel child port');
     add(n,{node:id,path:n.id+'.'+fields[slot],route:{root:n.route.root,slots:[...n.route.slots,slot]},expanded:data.expanded[id],field:fields[slot]},'uninspected-source-descendants');
    }
   }
   demand(hidden-before===amount(n.hidden),'local hidden accounting');
  }
  const sorted=rows.map(r=>key(r.route)).sort();
  for(let i=1;i<sorted.length;i++)demand(!sorted[i].startsWith(sorted[i-1]),'overlapping hidden regions');
  const retained=scene.nodes.reduce((sum,n)=>sum+amount(n.retainedOccurrences),0n),represented=amount(data.expanded[scene.root.node]);
  demand(hidden===amount(scene.stats.hidden)&&retained===amount(scene.stats.retainedOccurrences)&&represented===amount(scene.stats.represented)&&hidden+retained===represented,'complete source accounting');
  return{format:'ProofAtlasBoundaryLedger/1',source:scene.source,root:scene.root,maxBoundaries,retained:retained.toString(),hidden:hidden.toString(),represented:represented.toString(),totals,rows,
   guarantee:'Exact hidden source-region partition of an already validated scene. Roles describe recorded boundary roots only; type/value regions can contain proofs. Unknown descendants acquire no typing or construction judgment. No whole-proof completeness follows.'};
 }
 function page(ledger,{offset=0,limit=16,role='all'}={}){
  demand(Number.isInteger(offset)&&offset>=0&&Number.isInteger(limit)&&limit>=1&&limit<=32&&['all','proof','type','value','unrecorded'].includes(role),'page bounds');
  const rows=ledger.rows.filter(r=>role==='all'||r.role===role);demand(offset<=rows.length,'page offset');
  return{offset,total:rows.length,rows:rows.slice(offset,offset+limit)};
 }
 function validate(ledger,scene,data){demand(JSON.stringify(ledger)===JSON.stringify(create(scene,data,{maxBoundaries:ledger.maxBoundaries})),'changed source partition, role or provenance');return true;}

 const sessions=new WeakMap();
 function dispose(container){sessions.get(container)?.dispose();sessions.delete(container);}
 function mount(container,{scene,prepare,onFocus,onSource}){
  dispose(container);
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const section=el('details'),summary=el('summary','Hidden source regions · '+scene.stats.hidden+' occurrences'),note=el('p','Roles describe region roots. Type and value regions may contain proofs; an empty proof-premise frontier does not certify complete coverage.'),status=el('p'),filter=el('select'),list=el('ol'),controls=el('div'),previous=el('button','Previous hidden regions'),next=el('button','Next hidden regions'),position=el('span');
  section.className='pl-boundary-ledger';section.dataset.boundaryLedger='';status.setAttribute('role','status');filter.setAttribute('aria-label','Hidden region root role');controls.className='pl-actions';previous.type=next.type='button';previous.disabled=next.disabled=filter.disabled=true;
  for(const [value,text]of [['all','All hidden roots'],['proof','Proof roots'],['type','Type roots'],['value','Value roots'],['unrecorded','Roots without recorded types']]){const o=el('option',text);o.value=value;filter.append(o);}
  controls.append(previous,position,next);section.append(summary,note,status,filter,list,controls);
  const inspection=container.querySelector('.pl-judgment-inspection');if(inspection)inspection.before(section);else container.append(section);
  let ledger=null,offset=0,controller=null,epoch=0,disposed=false;
  function draw(){
   if(disposed)return;filter.disabled=false;const p=page(ledger,{offset,role:filter.value});list.replaceChildren();
   for(const row of p.rows){const li=el('li'),focus=el('button',row.role+' · '+row.origin.field+' · e'+row.node+' · '+row.expanded+' source occurrences'),source=el('button','Open source · e'+row.node),path=el('code',row.path);focus.type=source.type='button';focus.dataset.boundaryFocus=row.path;source.dataset.boundarySource=row.path;focus.onclick=()=>{if(!disposed)onFocus(row.route);};source.onclick=()=>{if(!disposed)onSource(row.node,row.route);};li.append(focus,source,path);list.append(li);}
   previous.disabled=offset===0;next.disabled=offset+16>=p.total;position.textContent=p.total?(offset+1)+'–'+Math.min(offset+16,p.total)+' / '+p.total:'No hidden roots in this category';
   status.textContent=ledger.retained+' retained + '+ledger.hidden+' hidden = '+ledger.represented+' source occurrences. '+Object.entries(ledger.totals).map(([role,t])=>t.regions+' '+role+' roots').join(' · ')+'.';
  }
  async function load(){
   if(disposed||!section.isConnected)return;if(ledger){draw();return;}const at=++epoch;controller?.abort();controller=new AbortController();status.textContent='Processing hidden regions…';section.setAttribute('aria-busy','true');
   try{const result=await prepare(scene,{signal:controller.signal});if(disposed||at!==epoch||!section.isConnected)return;ledger=result;draw();}
   catch(error){if(!disposed&&at===epoch&&section.isConnected){status.textContent='Hidden-region list unavailable: '+error.message;list.replaceChildren();}}
   finally{if(!disposed&&at===epoch)section.setAttribute('aria-busy','false');}
  }
  section.ontoggle=()=>{if(disposed)return;if(section.open)load();else if(!ledger){epoch++;controller?.abort();section.setAttribute('aria-busy','false');}};
  filter.onchange=()=>{offset=0;if(ledger)draw();};previous.onclick=()=>{offset=Math.max(0,offset-16);draw();};next.onclick=()=>{offset+=16;draw();};
  const session={getLedger:()=>ledger,dispose:()=>{disposed=true;epoch++;controller?.abort();section.remove();}};sessions.set(container,session);return session;
 }
 const api={create,page,validate,mount,dispose};if(node)module.exports=api;else host.ProofAtlasBoundaryLedger=api;
})(typeof window==='undefined'?globalThis:window);
