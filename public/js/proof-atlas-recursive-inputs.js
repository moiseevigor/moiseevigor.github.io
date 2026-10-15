/* Kernel-rule input flow. Metadata routes never masquerade as proof occurrences. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const G=node?require('./proof-atlas-geometry-core'):null;
 const demand=(ok,m)=>{if(!ok)throw Error('Recursive inputs: '+m);};
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 const binds=(kind,slot)=>(kind===6||kind===7)&&slot===1||kind===8&&slot===2;
 function spine(g,id,route){const args=[];while(g.kind[id]===5){args.push({node:g.children[id][1],route:{root:route.root,slots:[...route.slots,1]}});id=g.children[id][0];route={root:route.root,slots:[...route.slots,0]};}return{head:{node:id,route},args:args.reverse()};}
 function role(t,r,slot){
  const g=t.metadataGraph,base=t.parameters+t.motives+t.minors,b=base+r.constructorFields;
  let body=r.rhsRoot,bodyRoute={root:0,slots:[]};for(let k=0;k<b;k++){demand(g.kind[body]===6,'rule binder prefix');body=g.children[body][1];bodyRoute.slots.push(1);}
  const input=spine(g,body,bodyRoute).args[slot-1];demand(input,'minor input slot');
  const result={slot,kind:'unclassified',expression:{...input,namespace:'kernel-rule'},reason:'Outside the direct-field/self-recursion pattern'};
  if(g.kind[input.node]===0){const index=g.payloads[input.node].index;if(index<r.constructorFields){const field=r.constructorFields-1-index;return{slot,kind:'constructor-field',field,expression:result.expression,fieldBinder:{node:A.walk({...g,roots:[r.rhsRoot]},{root:0,slots:Array(base+field).fill(1)}),route:{root:0,slots:Array(base+field).fill(1)},namespace:'kernel-rule'}};}return result;}
  let id=input.node,route=input.route,depth=0;while(g.kind[id]===6){if(++depth>64)return{...result,reason:'Recursive-family binder limit'};id=g.children[id][1];route={root:0,slots:[...route.slots,1]};}
  const call=spine(g,id,route),head=g.payloads[call.head.node];
  if(g.kind[call.head.node]!==4||head.name!==t.recursor||!same(head.levels,t.recursorLevels)||call.args.length!==t.majorSlot)return result;
  for(let j=0;j<base;j++){const a=call.args[j].node;if(g.kind[a]!==0||g.payloads[a].index!==b+depth-1-j)return{...result,reason:'Recursive call changes a parameter, motive or minor premise'};}
  const major=call.args[t.majorSlot-1],fieldCall=spine(g,major.node,major.route),p=g.payloads[fieldCall.head.node];
  if(g.kind[fieldCall.head.node]!==0||p.index<depth||p.index>=depth+r.constructorFields||fieldCall.args.length!==depth)return{...result,reason:'Recursive major is not the corresponding constructor field/family'};
  for(let j=0;j<depth;j++){const a=fieldCall.args[j].node;if(g.kind[a]!==0||g.payloads[a].index!==depth-1-j)return{...result,reason:'Constructor family arguments are not forwarded in order'};}
  const field=r.constructorFields-1-(p.index-depth),fieldRoute={root:0,slots:Array(base+field).fill(1)};
  return{slot,kind:'recursive-premise',field,familyArity:depth,expression:result.expression,call:{node:id,route,namespace:'kernel-rule'},major:{...major,namespace:'kernel-rule'},indices:call.args.slice(base,t.majorSlot-1).map(a=>({...a,namespace:'kernel-rule'})),fieldBinder:{node:A.walk({...g,roots:[r.rhsRoot]},fieldRoute),route:fieldRoute,namespace:'kernel-rule'}};
 }
 function countReferences(data,root,index,options={}){
  const limit=options.maxStates??65536,maxDepth=options.maxDepth??512;
  demand(Number.isInteger(index)&&index>=0&&Number.isInteger(limit)&&limit>=1&&limit<=65536&&Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=512,'usage bounds');
  let states=0;const memo=new Map();
  function visit(id,depth,distance){const key=id+':'+depth;if(memo.has(key))return memo.get(key);if(distance>maxDepth||++states>limit)throw Error('budget');
   let n=0n;if(data.neededScope[id]>index+depth){const kind=data.kind[id];if(kind===0)n=data.payloads[id].index===index+depth?1n:0n;else data.children[id].forEach((c,j)=>{n+=visit(c,depth+(binds(kind,j)?1:0),distance+1);});}memo.set(key,n);return n;}
  try{return{status:'counted',occurrences:visit(root,0,0).toString(),states,method:'scoped-dag-reference-count/1'};}catch(_){return{status:'unavailable',reason:'Scoped reference-count budget exceeded',states,method:'scoped-dag-reference-count/1'};}
 }
 function describe(t,r,data,frames){
  return Array.from({length:r.inputCount},(_,j)=>{const input=role(t,r,j+1),source=frames[j]?.binder||null,complete=frames.length===r.inputCount;
   return{...input,sourceBinder:source,sourceBodyReferences:complete?countReferences(data,frames.at(-1).body.node,r.inputCount-1-j):{status:'unavailable',reason:'No complete source lambda prefix'},guarantee:'Input role belongs to the compiled reduction rule. A source binder is an exact minor-premise input, not a new recursive call in the proof packet.'};});
 }
 function prepare(data,record,typing,judgmentRoute,minor){
  const C=node?require('./proof-atlas-elimination'):host.ProofAtlasElimination,e=typing?.get(judgmentRoute);
  demand(typing?.source.name===record.name&&typing.source.indexSha256===record.indexSha256&&typing.source.sourceSha256===record.sourceSha256&&/^[a-f0-9]{64}$/.test(typing.sha256),'source/evidence identity');
  demand(e?.status==='checked','no exact judgment');C.validateEntry(e,data,e.typeGraph);const t=e.eliminationJudgment,r=t?.rules.find(r=>r.minor===minor);demand(r,'missing kernel rule');
  const ruleData={...t.metadataGraph,serialization:'ExprDAG/1',declaration:{name:record.name,rootPaths:['rule.'+r.constructor]},roots:[r.rhsRoot]};
  return{entry:e,trace:t,rule:r,ruleData,origin:{kind:'native-kernel-rule',typeEvidenceSha256:typing.sha256,judgment:{node:e.node,path:e.path,route:judgmentRoute},recursor:t.recursor,constructor:r.constructor,minor,metadataRoot:r.rhsRoot,namespace:'kernel-rule'}};
 }
 function create(data,record,typing,options){const p=prepare(data,record,typing,options.judgmentRoute,options.minor);return(G||host.ProofAtlasGeometry).createRule(p.ruleData,record,p.origin,{route:{root:0,slots:options.slots||[]},maxNodes:32,maxDepth:3,maxLayerNodes:6,maxApplicationChildren:4,foldBinders:true,foldApplications:true});}
 function validate(scene,data,record,typing){const p=prepare(data,record,typing,scene.source.judgment.route,scene.source.minor);return(G||host.ProofAtlasGeometry).validateRule(scene,p.ruleData,record,p.origin);}
 function mount(container,config){
  const {data,record,typing,judgmentRoute,minor}=config,p=prepare(data,record,typing,judgmentRoute,minor),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;},button=(title,fn)=>{const n=el('button',title);n.type='button';n.onclick=fn;return n;},ns='http://www.w3.org/2000/svg';
  container.replaceChildren();container.classList.add('pl-kernel-rule');container.append(el('h5','Kernel reduction rule · '+p.rule.constructor),el('p','This is the compiled reduction schema. Its binders and recursive calls are in the kernel-rule namespace; they are not added calls in the original proof.'));
  const select=el('select');select.setAttribute('aria-label','Kernel minor input');for(let j=1;j<=p.rule.inputCount;j++){const option=el('option','Minor input '+j);option.value=String(j);select.append(option);}select.disabled=!p.rule.inputCount;container.append(select);
  const flow=document.createElementNS(ns,'svg');flow.classList.add('pl-rule-flow');flow.setAttribute('aria-hidden','true');container.append(flow);const explanation=el('p'),actions=el('div');actions.className='pl-actions';container.append(explanation,actions);
  const canvas=document.createElementNS(ns,'svg');canvas.classList.add('pl-rule-diagram');canvas.setAttribute('aria-hidden','true');container.append(canvas);const nav=el('div');nav.className='pl-actions';container.append(nav);const info=el('p');info.setAttribute('aria-live','polite');container.append(info);const details=el('details'),list=el('ol'),regions=el('div');details.append(el('summary','Kernel-rule nodes, scope links and hidden regions'),list,regions);container.append(details);
  let scene,slots=[],selected=config.slot||(Array.from({length:p.rule.inputCount},(_,j)=>role(p.trace,p.rule,j+1)).findIndex(i=>i.kind==='recursive-premise')+1)||1,width=600,zoom=1,pan={x:0,y:0},drag=null,suppress=false,disposed=false;select.value=String(selected);
  const parent=button('Parent rule node',()=>focus(slots.slice(0,-1)));nav.append(button('Zoom rule out',()=>{zoom=Math.max(.3,zoom/1.3);viewport();}),button('Fit rule',()=>{zoom=1;pan={x:0,y:0};viewport();}),button('Zoom rule in',()=>{zoom=Math.min(8,zoom*1.3);viewport();}),parent);
  function viewport(){canvas.setAttribute('viewBox',`${-pan.x} ${-pan.y} ${width/zoom} ${320/zoom}`);}
  function focus(next){slots=[...next];zoom=1;pan={x:0,y:0};render();}
  function shape(svg,tag,attrs,text){const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;svg.append(n);return n;}
  function drawFlow(){flow.replaceChildren();actions.replaceChildren();flow.setAttribute('viewBox',`0 0 ${width} 110`);flow.hidden=!p.rule.inputCount;if(!p.rule.inputCount){explanation.textContent='This constructor case has no minor-premise inputs.';return;}const input=role(p.trace,p.rule,selected),q=[];
   if(input.fieldBinder)q.push({x:35,y:45,label:'λ '+(input.field+1),title:'Constructor field '+(input.field+1),route:input.fieldBinder.route});
   if(input.call)q.push({x:width*.48,y:45,label:input.familyArity?'λ → @':'@',title:input.familyArity?'Recursive family':'Recursive call',route:input.call.route});
   q.push({x:width-42,y:45,label:'in '+selected,title:'Minor input '+selected,route:input.expression.route});for(let j=1;j<q.length;j++)shape(flow,'path',{d:`M ${q[j-1].x+19} 45 L ${q[j].x-24} 45 l -6 -4 m 6 4 l -6 4`,class:'pl-rule-wire'});
   for(const v of q){const b=shape(flow,'rect',{x:v.x-24,y:31,width:48,height:28,rx:3,fill:v.title.startsWith('Constructor')?'#e9bf76':'#8dacde'});b.onclick=()=>focus(v.route.slots);shape(flow,'text',{x:v.x,y:49,'text-anchor':'middle',class:'pl-rule-flow-glyph'},v.label);actions.append(button(v.title,()=>focus(v.route.slots)));}
   explanation.textContent=input.kind==='constructor-field'?'Minor input '+selected+' receives constructor field '+(input.field+1)+'.':input.kind==='recursive-premise'?'Minor input '+selected+' receives '+(input.familyArity?'a '+input.familyArity+'-binder family of recursive results':'a recursive result')+' for constructor field '+(input.field+1)+'.':input.reason;
  }
  function render(){if(disposed)return;width=Math.max(260,canvas.clientWidth||600);scene=create(data,record,typing,{judgmentRoute,minor,slots});canvas.replaceChildren();list.replaceChildren();regions.replaceChildren();parent.disabled=!slots.length;const layers=new Map(),by=new Map(),max=Math.max(1,...scene.nodes.map(n=>n.depth));for(const n of scene.nodes){if(!layers.has(n.depth))layers.set(n.depth,[]);layers.get(n.depth).push(n);}
   for(const n of scene.nodes){const layer=layers.get(n.depth);by.set(n.id,{...n,x:24+n.depth/(max+1)*(width-70),y:25+(layer.indexOf(n)+.5)/layer.length*270,glyph:n.members?(n.abstraction==='binder-telescope'?'T':'@')+n.members.length:n.glyph});}
   const boundaries=[...new Map(scene.links.filter(l=>l.boundary&&l.relation==='bound-to').map(l=>[l.target,l])).values()];boundaries.forEach((l,j)=>by.set(l.target,{id:l.target,node:l.node,route:l.route,kind:A.kinds[p.ruleData.kind[l.node]],glyph:'↑',x:width-24,y:25+(j+.5)/boundaries.length*270}));
   const edge=(from,to,binding,label)=>{const a=by.get(from),b=by.get(to);if(!a||!b)return;const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),x=b.x-18*dx/d,y=b.y-18*dy/d;shape(canvas,'path',{d:`M ${a.x} ${a.y} L ${x} ${y} m ${-6*dx/d+4*dy/d} ${-6*dy/d-4*dx/d} L ${x} ${y} l ${-6*dx/d-4*dy/d} ${-6*dy/d+4*dx/d}`,class:binding?'pl-rule-scope':'pl-rule-wire'});if(label&&width>500)shape(canvas,'text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-5,class:'pl-rule-edge-label'},label);};for(const e of scene.edges)edge(e.from,e.to,false,e.field);for(const l of scene.links)if(l.relation==='bound-to')edge(l.from,l.displayTarget||l.target,true,l.telescopeSlot?'slot '+l.telescopeSlot:'scope');
   const palette=['#bda6e4','#8dd5e9','#e3a5cd','#d3dce8','#5ed0bc','#8dacde','#e9bf76','#edca86','#e3a381','#bbd7a7','#d2bba2','#e79dac'];for(const [path,v]of by){const attrs={fill:palette[A.kinds.indexOf(v.kind)],'data-rule-path':path};let n;if(['lam','forallE','letE'].includes(v.kind))n=shape(canvas,'rect',{...attrs,x:v.x-14,y:v.y-11,width:28,height:22});else if(['bvar','const'].includes(v.kind))n=shape(canvas,'path',{...attrs,d:`M ${v.x} ${v.y-13} L ${v.x+13} ${v.y} L ${v.x} ${v.y+13} L ${v.x-13} ${v.y} Z`});else n=shape(canvas,'circle',{...attrs,cx:v.x,cy:v.y,r:13});n.onclick=()=>{if(suppress){suppress=false;return;}focus(v.route.slots);};const title=document.createElementNS(ns,'title');title.textContent=v.kind+' · '+path;n.append(title);shape(canvas,'text',{x:v.x,y:v.y+4,'text-anchor':'middle',class:'pl-rule-flow-glyph'},v.glyph);if(v.frontier)shape(canvas,'circle',{cx:v.x,cy:v.y,r:17,fill:'none',stroke:'#9ebfc5','pointer-events':'none'});const li=el('li'),b=button(v.kind+' · '+path,()=>focus(v.route.slots));b.dataset.rulePath=path;b.dataset.ruleNamespace='kernel-rule';li.append(b);list.append(li);}
   for(const n of scene.nodes){const d=el('details'),items=el('ol');d.append(el('summary',(n.abstraction||n.kind)+' · '+n.id),items);const add=(title,route)=>{const li=el('li'),b=button(title,()=>focus(route.slots));b.dataset.ruleRegion=A.path(p.ruleData,route);li.append(b);items.append(li);};if(n.abstraction==='binder-telescope'){for(const m of n.members){add('Binder '+m.path,m.route);for(const r of m.regions)add(r.field+' before binder',r.route);}add('Continuation',n.continuation.route);}else if(n.members){add('Head',n.head.route);for(const a of n.arguments)add('Argument '+a.slot,a.route);}else p.ruleData.children[n.node].forEach((c,j)=>add(A.fields[n.kind][j],{root:0,slots:[...n.route.slots,j]}));if(items.children.length)regions.append(d);}
   const s=scene.stats;info.textContent=s.displayed+' rule vertices retain '+s.retainedOccurrences+' occurrences + '+s.hidden+' hidden = '+s.represented+'. '+s.scopeBoundaries+' rule-context boundaries. Metadata root e'+p.rule.rhsRoot+'.';drawFlow();viewport();
  }
  select.onchange=()=>{selected=Number(select.value);drawFlow();};canvas.onpointerdown=e=>{suppress=false;drag={x:e.clientX,y:e.clientY,start:{...pan},moved:false};};canvas.onpointermove=e=>{if(!drag)return;const scale=width/canvas.getBoundingClientRect().width/zoom,dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved=drag.moved||Math.hypot(dx,dy)>4;if(drag.moved){pan={x:drag.start.x+dx*scale,y:drag.start.y+dy*scale};viewport();}};canvas.onpointerup=()=>{suppress=!!drag?.moved;drag=null;};canvas.onpointerleave=()=>{drag=null;};const observer=new ResizeObserver(()=>{if(Math.abs(Math.max(260,canvas.clientWidth||600)-width)>1)render();});observer.observe(canvas);render();return{getScene:()=>scene,getInput:()=>p.rule.inputCount?role(p.trace,p.rule,selected):null,focus,dispose:()=>{disposed=true;observer.disconnect();container.replaceChildren();}};
 }
 const api={role,describe,countReferences,prepare,create,validate,mount};if(node)module.exports=api;else host.ProofAtlasRecursiveInputs=api;
})(typeof window==='undefined'?globalThis:window);
