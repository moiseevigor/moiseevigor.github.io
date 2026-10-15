/* Every compiled local declaration and proof is reachable. Canvas collapse is visual only. */
(async function(){
 'use strict';
 const lib=window.PROOF_ATLAS_LIBRARY,A=window.ProofAtlasLibraryData,$=id=>document.getElementById(id);
 if(!$('pl-library')||!lib||!A)return;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const number=n=>BigInt(n).toLocaleString('en-US'),link=(text,url)=>{const n=el('a',text);n.href=url;return n;};
 const palette=['#bda6e4','#8dd5e9','#e3a5cd','#d3dce8','#5ed0bc','#8dacde','#e9bf76','#edca86','#e3a381','#bbd7a7','#d2bba2','#e79dac'];
 const canvas=$('pl-canvas'),ctx=canvas.getContext('2d'),frame=canvas.parentElement;
 let edition,current,serial=0,selected=0,root=0,mode='term',foldBinders=false,scene=null,geometryLoad=null,points=[],world=[],edges=[],rowOffset=0,zoom=1,pan={x:0,y:0},drag=null,sourceCache=new Map(),selectedRoute=null,rowIds=[],selectionSerial=0,rowRoutes=new Map(),rootRoute=null;
 const rootLabel=(d,i)=>i===0?'Type':d.declaration.rootPaths[i]==='root.value'?(d.declaration.kind==='theorem'?'Complete proof':'Definition body'):'Reduction rule '+(i-(d.declaration.bodyAvailable?1:0));
 function url(name,occurrence,route){const u=new URL(location.href);u.searchParams.set('edition',edition.id);u.searchParams.set('proof',name);if(mode==='geometry')u.searchParams.set('geometry','scoped');else u.searchParams.delete('geometry');if(mode==='geometry'&&foldBinders)u.searchParams.set('fold','binders');else u.searchParams.delete('fold');u.hash=occurrence===undefined?'':'expr-'+occurrence;if(route)u.searchParams.set('route',route.root+':'+route.slots.join('.'));else u.searchParams.delete('route');return (document.getElementById('pa-sync-panel')?'/projects/proof-atlas/library/':u.pathname)+u.search+u.hash;}
 function children(i){return current.children(i);}
 function branchRoutes(start,route){
  // Store one parent per shared node; materialize only the displayed occurrence paths.
  const parents=new Map([[start,null]]),queue=[start];for(let p=0;p<queue.length;p++){const i=queue[p];children(i).forEach((c,j)=>{if(!parents.has(c)){parents.set(c,[i,j]);queue.push(c);}});}
  return{get:i=>{const slots=[];let parent;while((parent=parents.get(i))){slots.unshift(parent[1]);i=parent[0];}return{root:route.root,slots:[...route.slots,...slots]};}};
 }

 function setStatus(text,busy=false){$('pl-status').textContent=text;$('pl-workspace')?.setAttribute('aria-busy',String(busy));$('pl-library').setAttribute('aria-busy',String(busy));}
 function updateLocation(){if(document.getElementById('pa-sync-panel'))return;history.replaceState(null,'',url(current.record.name,selected,selectedRoute));}
 function inventory(){
  const module=$('pl-module').value,q=$('pl-search').value.trim().toLowerCase();
  const records=edition.declarations.filter(d=>(!module||d.module===module)&&(!q||d.name.toLowerCase().includes(q)));
  $('pl-declaration').replaceChildren();$('pl-inventory').replaceChildren();
  for(const d of records){const o=el('option',d.name+' · '+d.kind);o.value=d.name;$('pl-declaration').append(o);const a=link(d.name,url(d.name));a.dataset.proofName=d.name;$('pl-inventory').append(a);}
  if(current&&records.some(d=>d.name===current.record.name))$('pl-declaration').value=current.record.name;
  $('pl-declaration').setAttribute('aria-label',records.length+' declarations matching the filter; '+edition.declarations.length+' in the complete inventory');
 }
 function coverage(){
  const c=edition.counts;$('pl-coverage').replaceChildren();
  for(const [label,value]of [['Modules',c.modules],['Declarations / all inventoried',c.declarations],['Theorem proofs',c.theorems],['Available bodies',c.bodies],['Shared expression nodes',c.uniqueNodes]]){const p=el('div');p.append(el('strong',number(value)),el('span',label));$('pl-coverage').append(p);}
  $('pl-legend').replaceChildren();A.kinds.forEach((k,i)=>{const a=link(k+' · '+number(c.constructors[k]||0),'/projects/proof-atlas/grammar/#expr-'+k);const dot=el('i');dot.style.background=palette[i];a.prepend(dot);$('pl-legend').append(a);});
 }
 function chooseEdition(id){
  edition=lib.editions.find(e=>e.id===id)||lib.editions[0];$('pl-edition').value=edition.id;
  $('pl-module').replaceChildren(el('option','All modules'));$('pl-module').firstChild.value='';
  Object.keys(edition.modules).sort().forEach(m=>{const o=el('option',m);o.value='SE2Conjugate.'+m;$('pl-module').append(o);});
  serial++;selectionSerial++;current=null;coverage();inventory();
 }
 async function selectDeclaration(name,occurrence,write=true,route){
  const token=++serial,record=edition.declarations.find(d=>d.name===name);if(!record)throw Error('Declaration is outside this edition: '+name);
  setStatus('Loading and checking '+name+'…',true);
  try{
   const opened=await A.open(record);if(token!==serial)return false;
   current=opened;selected=occurrence??(record.bodyAvailable?current.data.roots[1]:current.data.roots[0]);
   if(!Number.isInteger(selected)||selected<0||selected>=record.uniqueNodes)throw Error('Occurrence is outside the complete expression inventory');
   root=selected;zoom=1;pan={x:0,y:0};$('pl-title').textContent=record.name;$('pl-declaration').value=name;
   $('pl-provenance').replaceChildren(el('p',record.module+' · '+record.kind+' · native kernel check PASS'),el('p','Complete type: '+number(record.typeOccurrences)+' occurrences. Available body / reduction terms: '+number(record.proofOccurrences)+'.'),el('p','Source SHA-256: '+record.sourceSha256),el('p','Axiom dependencies: '+(record.axioms.join(', ')||'none')));
   const article='/projects/proof-atlas/article/?view=lean#'+(record.articleAnchor.startsWith('lem:')||record.articleAnchor.startsWith('thm:')?'proof-'+record.articleAnchor.replace(':','-'):record.articleAnchor);
   $('pl-downloads').replaceChildren(link('Complete term packet ↓',record.file),link('Related article section / proof context ↗',article));
   $('pl-roots').replaceChildren();current.data.roots.forEach((r,i)=>{const b=el('button',rootLabel(current.data,i));b.type='button';b.dataset.proofRoot=r;b.onclick=()=>selectOccurrence(r,true,true,{root:i,slots:[]});$('pl-roots').append(b);});
   $('pl-source').replaceChildren(el('pre',record.type));
   $('pl-references').replaceChildren();for(const dep of current.data.dependencies){const target=dep.local?url(dep.name):'https://leanprover-community.github.io/mathlib4_docs/find/?pattern='+encodeURIComponent(dep.name);const a=link(dep.name+' · '+number(dep.count)+' occurrences'+(dep.local?' · open its complete proof':' · external library boundary'),target);a.dataset.localReference=String(dep.local);$('pl-references').append(a);}
   $('pl-occurrence').max=record.uniqueNodes-1;await selectOccurrence(selected,true,false,route);if(token!==serial)return false;
   if(write)updateLocation();setStatus('Verified '+name+' · all '+number(record.uniqueNodes)+' shared nodes available');return true;
  }catch(e){if(token===serial)setStatus(e.message);throw e;}
 }
 function label(i){const k=current.kind(i),p=current.payload(i)||{};return k+(p.name?' '+p.name:p.binderName?' '+p.binderName:p.declName?' '+p.declName:k==='bvar'?' '+p.index:k==='lit'?' '+(p.value??p.repr):k==='proj'?' '+p.typeName+'['+p.index+']':'');}
 async function selectOccurrence(i,focus=false,write=true,route){
  if(!current||!Number.isInteger(i)||i<0||i>=current.record.uniqueNodes)throw Error('Invalid occurrence');
  const owner=current,selectionToken=++selectionSerial;selected=i;selectedRoute=route||current.route(i);if(A.walk(current.data,selectedRoute)!==i)throw Error('Route/node mismatch');if(focus){root=i;rootRoute=selectedRoute;zoom=1;pan={x:0,y:0};}
  const cs=children(i),binding=A.binding(current.data,selectedRoute),binder=binding?.node;await owner.payloads([i,...cs,...(binder===undefined?[]:[binder])]);if(owner!==current||selectionToken!==selectionSerial)return;
  $('pl-occurrence').value=i;$('pl-parent').disabled=!selectedRoute.slots.length;
  const target=$('pl-expression');target.replaceChildren(el('h3','Shared node #'+i+' · '+label(i)),el('p',A.path(current.data,selectedRoute)),el('p','A shared node may occur on several paths. Binder meaning follows the path shown here; direct jumps use a representative path.'),el('p',number(current.data.expanded[i])+' occurrences in this exact subtree'));
  const p=current.payload(i),pre=el('pre',JSON.stringify(p,null,2));const metadata=el('details'),summary=el('summary','Constructor fields');metadata.append(summary,pre);target.append(metadata);
  const actions=el('div',undefined,'pl-actions');cs.forEach((c,j)=>{const b=el('button',A.fields[current.kind(i)][j]+' · #'+c+' · '+current.kind(c));b.type='button';b.onclick=()=>selectOccurrence(c,true,true,{root:selectedRoute.root,slots:[...selectedRoute.slots,j]});actions.append(b);});
  if(binder!==undefined){const b=el('button','Enclosing binder #'+binder+' · '+label(binder));b.type='button';b.onclick=()=>selectOccurrence(binder,true,true,binding.route);actions.append(b);}
  if(current.kind(i)==='const'){const local=edition.declarations.find(d=>d.name===p.name);target.append(local?link('Open the referenced '+local.kind+' and its entire proof ↗',url(local.name)):el('p','External Lean/Mathlib reference; its body is outside the project corpus.'));}
  target.append(actions);if(write)updateLocation();rowOffset=0;rowIds=A.reachable(current.data,selected);rowRoutes=branchRoutes(selected,selectedRoute);$('pl-rows').replaceChildren();await appendRows();if(owner!==current||selectionToken!==selectionSerial)return;await layout();
  const snapshot=window.ProofAtlasLibrary.getSnapshot();
  if(snapshot.edition==='published-15'&&window.ProofAtlasProofStepIndex&&window.PROOF_ATLAS_PROOF_STEPS&&!document.getElementById('pa-sync-panel')){
   const index=window.ProofAtlasProofStepIndex.create(window.PROOF_ATLAS_PROOF_STEPS,window.PROOF_ATLAS_PROOF_STEPS.articleSha256);index.validate(snapshot,current.data,A);
   $('pl-downloads').querySelectorAll('[data-proof-step-link]').forEach(n=>n.remove());
   for(const match of index.resolve(snapshot)){const u=new URL('/projects/proof-atlas/article/',location.origin);u.searchParams.set('view','proof');u.searchParams.set('proof',snapshot.name);u.searchParams.set('route',snapshot.route.root+':'+snapshot.route.slots.join('.'));u.hash=match.passage.id;const a=link('Proof step: '+match.passage.title,u.pathname+u.search+u.hash);a.dataset.proofStepLink=match.passage.id;$('pl-downloads').append(a);}
  }
  window.dispatchEvent(new CustomEvent('proof-atlas:compiled-selection',{detail:snapshot}));
 }
 async function appendRows(){
  const owner=current,ids=rowIds.slice(rowOffset,rowOffset+200);await owner.payloads(ids);if(owner!==current)return;
  for(const i of ids){const li=el('li'),b=el('button','e'+i+' := '+A.describe(current.data,i));b.type='button';b.dataset.occurrence=i;b.setAttribute('aria-pressed',String(i===selected));b.title=A.path(current.data,rowRoutes.get(i));const route=rowRoutes.get(i);b.onclick=()=>selectOccurrence(i,true,true,route);li.append(b);$('pl-rows').append(li);}
  rowOffset+=ids.length;const total=rowIds.length;$('pl-row-count').textContent=number(rowOffset)+' / '+number(total)+' distinct subterms shown. Repeated occurrences are represented by shared child links.';$('pl-more').hidden=rowOffset===total;
 }
 async function geometryReady(){
  if(window.ProofAtlasGeometry)return;
  if(!geometryLoad)geometryLoad=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/public/js/proof-atlas-geometry-core.js?v=2';s.onload=resolve;s.onerror=()=>{geometryLoad=null;s.remove();reject(Error('Geometric language core is unavailable'));};document.head.append(s);});
  await geometryLoad;
 }
 function scopedLayout(){
  scene=window.ProofAtlasGeometry.create(current.data,current.record,{route:rootRoute||current.route(root),maxNodes:48,maxDepth:4,foldBinders});
  const byPath=new Map(),groups=new Map(),max=Math.max(1,...scene.nodes.map(n=>n.depth));
  for(const n of scene.nodes){if(!groups.has(n.depth))groups.set(n.depth,[]);groups.get(n.depth).push(n);}
  for(const n of scene.nodes){const group=groups.get(n.depth),p={id:n.node,path:n.id,route:n.route,x:n.depth/(max+1),y:(group.indexOf(n)+.5)/group.length,kind:current.data.kind[n.node],glyph:n.members?'T'+n.members.length:n.glyph,name:(n.members?n.members.length+'-binder telescope':'')+n.kind+' · '+n.id+' · '+n.hidden+' hidden occurrences',collapsed:n.frontier};world.push(p);byPath.set(n.id,p);}
  for(const edge of scene.edges)edges.push([byPath.get(edge.from),byPath.get(edge.to),'child',edge.field]);
  const contexts=new Map(),boundaries=scene.links.filter(l=>l.relation==='bound-to'&&l.boundary),unique=[...new Set(boundaries.map(l=>l.target))];
  for(const l of boundaries)if(!contexts.has(l.target)){const p={id:l.node,path:l.target,route:l.route,x:1,y:(unique.indexOf(l.target)+.5)/unique.length,kind:current.data.kind[l.node],glyph:'↑',context:true,name:'Context binder · '+l.target};contexts.set(l.target,p);world.push(p);}
  for(const l of scene.links)if(l.relation==='bound-to')edges.push([byPath.get(l.from),byPath.get(l.displayTarget||l.target)||contexts.get(l.target),'binder',l.telescopeSlot?'slot '+l.telescopeSlot:undefined]);
  $('pl-scene-rows').replaceChildren();for(const p of world){const row=el('li'),b=el('button',(p.context?'Context binder':current.kind(p.id))+' · '+p.path);b.type='button';b.dataset.scenePath=p.path;b.onclick=()=>selectOccurrence(p.id,true,true,p.route);row.append(b);$('pl-scene-rows').append(row);}
  for(const n of scene.nodes)if(n.members){
   const details=el('details'),summary=el('summary',n.members.length+' binders · '+n.id+(n.truncated?' · prefix continues':''));details.dataset.telescopePath=n.id;details.append(summary,el('p','T denotes an ordered telescope, not a Lean constructor. Scope arrows identify its slots. Type and let-value regions are outside their own binder’s scope. These links open the original terms; no occurrence types are inferred.'));const list=el('ol');
   n.members.forEach((m,j)=>{const row=el('li'),b=el('button','Slot '+(j+1)+' · '+m.kind+' '+(m.payload.binderName||m.payload.declName||'_'));b.type='button';b.dataset.telescopeMember=m.path;b.onclick=()=>selectOccurrence(m.node,true,true,m.route);row.append(b);
    for(const region of m.regions){const q=el('button',region.field+' · before slot '+(j+1)+' · '+number(region.expanded)+' occurrences');q.type='button';q.dataset.telescopeRegion=region.path;q.title=region.path+'; enclosing scope requirement '+region.requiredScope;q.onclick=()=>selectOccurrence(region.node,true,true,region.route);row.append(q);}list.append(row);});
   const body=el('button','Open telescope continuation');body.type='button';body.dataset.telescopeContinuation=n.continuation.path;body.onclick=()=>selectOccurrence(n.continuation.node,true,true,n.continuation.route);details.append(list,body);$('pl-telescope-headers').append(details);
  }
  const s=scene.stats;$('pl-graph-note').textContent='Scoped geometry prototype · '+s.displayed+' vertices'+(foldBinders?' retaining '+number(s.retainedOccurrences)+' kernel occurrences':' visible occurrences')+' + '+number(s.hidden)+' hidden = '+number(s.represented)+' represented. '+s.frontiers+' exact collapsed boundaries; '+s.scopeBoundaries+' links to enclosing context.'+(foldBinders?' Tn is an ordered binder telescope; dashed scope arrows name its slots.':'')+' Solid links are ordered constructor fields; dashed links are lexical binding. Layout positions are not a mathematical invariant.';
 }
 async function layout(){
  world=[];edges=[];scene=null;$('pl-telescope-headers').replaceChildren();$('pl-scene-details').hidden=mode!=='geometry';$('pl-scene-controls').hidden=mode!=='geometry';
  if(mode==='geometry'){await geometryReady();scopedLayout();}
  else if(mode==='dependencies'){
   const records=edition.declarations,byName=new Map();records.forEach((d,i)=>{const a=2*Math.PI*i/records.length;const p={id:d.name,x:Math.cos(a),y:Math.sin(a),kind:4,name:d.name};world.push(p);byName.set(d.name,p);});
   edition.edges.forEach(e=>edges.push([byName.get(e.from),byName.get(e.to)]));$('pl-graph-note').textContent=number(records.length)+' / '+number(records.length)+' project declarations · '+number(edition.edges.length)+' exact local dependency links. External references appear in the reader.';
  }else{
   const graphRoutes=branchRoutes(root,rootRoute||current.route(root));
   const ids=A.reachable(current.data,root),visible=ids.slice(0,800),byId=new Map(),depth=new Map([[root,0]]);
   for(const id of visible)for(const c of children(id))depth.set(c,Math.max(depth.get(c)||0,(depth.get(id)||0)+1));
   const max=Math.max(...visible.map(i=>depth.get(i)||0),1),groups=new Map();
   for(const id of visible){const d=depth.get(id)||0;if(!groups.has(d))groups.set(d,[]);groups.get(d).push(id);}
   for(const id of visible){const d=depth.get(id)||0,group=groups.get(d),p={id,route:graphRoutes.get(id),x:d/max,y:(group.indexOf(id)+.5)/group.length,kind:current.data.kind[id],name:label(id),collapsed:children(id).some(c=>!visible.includes(c))};world.push(p);byId.set(id,p);}
   for(const id of visible)for(const c of children(id))if(byId.has(c))edges.push([byId.get(id),byId.get(c)]);
   const b=A.binder(current.data,selectedRoute);if(b!==undefined&&byId.has(selected)&&byId.has(b))edges.push([byId.get(selected),byId.get(b),'binder']);
   $('pl-graph-note').textContent=number(visible.length)+' / '+number(ids.length)+' distinct subterms in this branch, representing '+number(current.data.expanded[root])+' occurrences. Shared child links retain every branch. Ringed nodes have further children; open any node by number.';
  }
  draw();
 }
 function draw(){
  const w=frame.clientWidth,h=frame.clientHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#112a37';ctx.fillRect(0,0,w,h);
  const scale=Math.min(w-60,h-60)/(mode==='dependencies'?2:1)*zoom,cx=mode==='dependencies'?0:.5,cy=mode==='dependencies'?0:.5;
  const point=p=>({x:w/2+(p.x-cx)*scale+pan.x,y:h/2+(p.y-cy)*scale+pan.y});
  for(const [a,b,type,field]of edges){const p=point(a),q=point(b);ctx.strokeStyle=type==='binder'?'#c4a6e0':'#759bab';ctx.globalAlpha=mode==='dependencies'?.08:.32;ctx.setLineDash(mode==='geometry'&&type==='binder'?[4,4]:[]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.setLineDash([]);
   if(mode==='geometry'){const angle=Math.atan2(q.y-p.y,q.x-p.x),x=q.x-12*Math.cos(angle),y=q.y-12*Math.sin(angle);ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(x-6*Math.cos(angle-.45),y-6*Math.sin(angle-.45));ctx.lineTo(x,y);ctx.lineTo(x-6*Math.cos(angle+.45),y-6*Math.sin(angle+.45));ctx.stroke();if(field){ctx.font='10px system-ui';ctx.fillStyle='#d5e5e7';ctx.fillText(field,p.x+(q.x-p.x)*.35+3,p.y+(q.y-p.y)*.35-4);}}
  }
  ctx.globalAlpha=1;points=[];for(const n of world){const p=point(n),active=mode==='dependencies'?n.id===current.record.name:mode==='geometry'?n.path===A.path(current.data,selectedRoute):n.id===selected;ctx.fillStyle=active?'#ffe2a3':palette[n.kind];ctx.beginPath();
   if(mode==='geometry'){
    if([6,7,8].includes(n.kind))ctx.rect(p.x-13,p.y-10,26,20);
    else if([0,1,2,4].includes(n.kind)){ctx.moveTo(p.x,p.y-12);ctx.lineTo(p.x+12,p.y);ctx.lineTo(p.x,p.y+12);ctx.lineTo(p.x-12,p.y);ctx.closePath();}
    else ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.fill();ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#102a37';ctx.fillText(n.glyph,p.x,p.y+4);ctx.textAlign='start';
   }else{ctx.arc(p.x,p.y,active?6:3,0,Math.PI*2);ctx.fill();}
   if(n.collapsed){ctx.strokeStyle='#a1c8c9';ctx.beginPath();ctx.arc(p.x,p.y,mode==='geometry'?16:6,0,Math.PI*2);ctx.stroke();}points.push({...n,...p});}

 }
 function safely(p){Promise.resolve(p).catch(e=>setStatus(e.message));}
 $('pl-edition').onchange=()=>{chooseEdition($('pl-edition').value);safely(selectDeclaration(edition.declarations.find(d=>d.name==='JacobiFull.exact_first_time')?.name||edition.declarations[0].name));};
 $('pl-module').onchange=inventory;$('pl-search').oninput=inventory;$('pl-declaration').onchange=()=>safely(selectDeclaration($('pl-declaration').value));
 $('pl-term-download').onclick=()=>{const data=current.data,root=selected,text='Decoded kernel term with sharing retained. eN refers to a shared node; bound variable indices are contextual. This is not the original tactic script.\nRoot: e'+root+'\n\n'+A.termLines(data,root).join('\n'),a=document.createElement('a'),u=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.href=u;a.download=current.record.name+'-compiled-node-'+root+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
 $('pl-go').onclick=()=>safely(selectOccurrence(Number($('pl-occurrence').value),true));$('pl-parent').onclick=()=>{const r={root:selectedRoute.root,slots:selectedRoute.slots.slice(0,-1)};safely(selectOccurrence(A.walk(current.data,r),true,true,r));};$('pl-more').onclick=()=>safely(appendRows());
 for(const [id,value]of [['pl-term-view','term'],['pl-geometry-view','geometry'],['pl-deps-view','dependencies']])$(id).onclick=()=>safely((async()=>{if(value==='geometry')await geometryReady();mode=value;for(const[k,m]of [['pl-term-view','term'],['pl-geometry-view','geometry'],['pl-deps-view','dependencies']])$(k).setAttribute('aria-pressed',String(mode===m));zoom=1;pan={x:0,y:0};await layout();updateLocation();})());
 $('pl-telescope-toggle').onclick=()=>safely((async()=>{foldBinders=!foldBinders;$('pl-telescope-toggle').setAttribute('aria-pressed',String(foldBinders));await layout();updateLocation();})());
 $('pl-minus').onclick=()=>{zoom=Math.max(.2,zoom/1.3);draw();};$('pl-plus').onclick=()=>{zoom=Math.min(30,zoom*1.3);draw();};$('pl-fit').onclick=()=>{zoom=1;pan={x:0,y:0};draw();};
 function nearestPoint(x,y){
  let nearest=null,distance=mode==='geometry'?16:9;
  for(const point of points){const next=Math.hypot(point.x-x,point.y-y);if(next<distance){nearest=point;distance=next;}}
  return nearest;
 }
 canvas.onpointerdown=e=>{drag={x:e.offsetX,y:e.offsetY,px:pan.x,py:pan.y,moved:false};canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(drag){const x=e.offsetX-drag.x,y=e.offsetY-drag.y;drag.moved=drag.moved||Math.hypot(x,y)>4;pan={x:drag.px+x,y:drag.py+y};draw();}else{const n=nearestPoint(e.offsetX,e.offsetY);canvas.title=n?n.name:'';}};
 canvas.onpointerup=e=>{if(drag&&!drag.moved){const n=nearestPoint(e.offsetX,e.offsetY);if(n)safely(mode==='dependencies'?selectDeclaration(n.id):selectOccurrence(n.id,true,true,n.route));}drag=null;};
 canvas.onwheel=e=>{e.preventDefault();zoom=Math.max(.2,Math.min(30,zoom*Math.exp(-e.deltaY*.001)));draw();};
 new ResizeObserver(()=>{if(current)draw();}).observe(frame);
 $('pl-library').addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;const u=new URL(a.href,location.href);if((u.pathname===location.pathname||document.getElementById('pa-sync-panel')&&u.pathname==='/projects/proof-atlas/library/')&&u.searchParams.has('proof')){e.preventDefault();if(u.searchParams.get('edition')!==edition.id)chooseEdition(u.searchParams.get('edition'));safely(selectDeclaration(u.searchParams.get('proof')));}});
 window.ProofAtlasLibrary={selectDeclaration,selectOccurrence,clearSelection:()=>{serial++;selectionSerial++;current=null;scene=null;points=[];world=[];edges=[];$('pl-scene-rows').replaceChildren();$('pl-telescope-headers').replaceChildren();$('pl-scene-details').hidden=true;$('pl-scene-controls').hidden=true;$('pl-rows').replaceChildren();$('pl-expression').replaceChildren();ctx.clearRect(0,0,canvas.width,canvas.height);},getSnapshot:()=>current?{edition:edition.id,name:current.record.name,selected,root,mode,occurrences:current.record.occurrences,uniqueNodes:current.record.uniqueNodes,path:A.path(current.data,selectedRoute),route:{root:selectedRoute.root,slots:[...selectedRoute.slots]},sourceSha256:current.record.sourceSha256,indexSha256:current.record.indexSha256,rendered:points.length}:null,getData:()=>current?.data,getScene:()=>scene,getOccurrencePoint:path=>points.find(p=>p.path===path),getPoint:i=>points.find(p=>p.id===i)};
 lib.editions.forEach(e=>{const o=el('option',e.id==='published-15'?'Published article · 15 modules':e.id+' · '+e.counts.modules+' modules');o.value=e.id;$('pl-edition').append(o);});
 const params=new URLSearchParams(location.search);chooseEdition(params.get('edition'));
 if(document.getElementById('pa-sync-panel'))return;
 if(params.get('geometry')==='scoped'){await geometryReady();mode='geometry';foldBinders=params.get('fold')==='binders';$('pl-telescope-toggle').setAttribute('aria-pressed',String(foldBinders));$('pl-term-view').setAttribute('aria-pressed','false');$('pl-geometry-view').setAttribute('aria-pressed','true');}
 const name=params.get('proof')||edition.declarations.find(d=>d.name==='JacobiFull.exact_first_time')?.name||edition.declarations[0].name;
 const route=params.get('route')?.match(/^(\d+):([\d.]*)$/);await selectDeclaration(name,location.hash.match(/^#expr-(\d+)$/)?Number(location.hash.slice(6)):undefined,true,route?{root:Number(route[1]),slots:route[2]?route[2].split('.').map(Number):[]}:undefined);
})().catch(e=>{const n=document.getElementById('pl-status');if(n)n.textContent=e.message;});
