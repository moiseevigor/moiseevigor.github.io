/* A compact one-hole source context. It adds no typing or semantic inference. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const P=()=>node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages;
 const issued=new WeakSet(),transfers=new WeakSet(),owners=new WeakMap();
 const limits=Object.freeze({members:512,bytes:131072,route:512,cutEntries:4096,cutTrie:8192,transferBytes:524288});
 const demand=(ok,m)=>{if(!ok)throw Error('Source corridor: '+m);};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 const copy=r=>({root:r.root,slots:[...r.slots]});
 const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
 const identity=r=>({name:r.name,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256});
 function checkRoute(r,header){demand(Number.isInteger(r?.root)&&r.root>=0&&r.root<header.roots.length&&Array.isArray(r.slots)&&r.slots.length<=limits.route&&r.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2),'route bound/encoding');}
 function options(o={}){const maxMembers=o.maxMembers??limits.members,maxBytes=o.maxBytes??limits.bytes;demand(Number.isInteger(maxMembers)&&maxMembers>=0&&maxMembers<=limits.members&&Number.isInteger(maxBytes)&&maxBytes>=256&&maxBytes<=limits.bytes,'metadata bounds');return{maxMembers,maxBytes};}
 function open(data,record){
  demand(data.serialization==='ExprDAG/1'&&data.declaration.name===record.name&&(data.declaration.sourceSha256===undefined||data.declaration.sourceSha256===record.sourceSha256)&&data.kind.length===record.uniqueNodes&&/^[a-f0-9]{64}$/.test(record.indexSha256)&&/^[a-f0-9]{64}$/.test(record.sourceSha256),'source identity');
  const owner=Object.freeze({}),read=async id=>[data.kind[id],data.children[id],data.payloads[id],data.expanded[id],data.neededScope[id]];
  owners.set(owner,{record,header:data,read});return owner;
 }
 function paged(cursor){
  const id=P().identity(cursor),record=cursor.record;demand(same(identity(record),{name:id.name,indexSha256:id.indexSha256,sourceSha256:id.sourceSha256}),'paged source identity');
  const owner=Object.freeze({}),read=(id,signal)=>cursor.run(()=>P().fields.map(f=>cursor.data[f][id]),{signal});owners.set(owner,{record,header:cursor.data,read});return owner;
 }
 function rootBindings(scene){return scene.outer.bindings.map(b=>({kind:'outer-binder',prefixDepth:b.depth,node:b.node,binderKind:A.kinds[b.kind]}));}
 function context(scene,point){
  demand(issued.has(scene)&&['member','sibling','endpoint'].includes(point.kind),'context address');resolve(scene,point);const ctx=rootBindings(scene);let count=scene.members.length;
  if(point.kind==='member')count=point.index;
  if(point.kind==='sibling')count=point.member;
  demand(Number.isInteger(count)&&count>=0&&count<=scene.members.length,'context address');
  for(let i=0;i<count;i++){const m=scene.members[i];if(m.scopeExtension)ctx.push({kind:'member',index:i,node:m.node,binderKind:A.kinds[m.kind]});}
  if(point.kind==='sibling'){const m=scene.members[point.member];demand(m&&m.siblings.some(s=>s.slot===point.slot),'sibling address');if(binds(m.kind,point.slot))ctx.push({kind:'member',index:point.member,node:m.node,binderKind:A.kinds[m.kind]});}
  return ctx;
 }
 function resolve(scene,point){
  demand(issued.has(scene),'unissued corridor');let node,slots,path;
  if(point.kind==='outer-binder'){
   const b=scene.outer.bindings.find(b=>b.depth===point.prefixDepth);demand(b,'outer binder address');node=b.node;slots=scene.root.route.slots.slice(0,b.depth);path=scene.outer.rootLabel;
   for(let i=0;i<b.depth;i++)path+='.'+A.fields[A.kinds[scene.outer.kinds[i]]][slots[i]];
  }else{
   let n=scene.members.length;if(point.kind==='member')n=point.index;if(point.kind==='sibling')n=point.member;
   demand(Number.isInteger(n)&&n>=0&&n<=scene.members.length,'source address');slots=[...scene.root.route.slots,...scene.members.slice(0,n).map(m=>m.slot)];path=scene.root.path+scene.members.slice(0,n).map(m=>'.'+m.field).join('');
   if(point.kind==='endpoint')node=scene.endpoint.node;
   else if(point.kind==='member'){demand(n<scene.members.length,'member address');node=scene.members[n].node;}
   else if(point.kind==='sibling'){const m=scene.members[n],s=m?.siblings.find(s=>s.slot===point.slot);demand(s,'sibling address');node=s.node;slots.push(s.slot);path+='.'+s.field;}
   else demand(false,'unknown address');
  }
  return{node,path,route:{root:scene.root.route.root,slots}};
 }
 function finish(scene){
  const hidden=scene.members.reduce((n,m)=>n+m.siblings.reduce((n,s)=>n+BigInt(s.occurrences),0n),BigInt(scene.endpoint.occurrences));
  demand(BigInt(scene.members.length)+hidden===BigInt(scene.root.occurrences),'source partition');
  scene.stats={retainedOccurrences:String(scene.members.length),hiddenOccurrences:String(hidden),representedOccurrences:scene.root.occurrences,frontiers:scene.members.reduce((n,m)=>n+m.siblings.length,1),encodedBytes:0};
  for(let i=0;i<4;i++){const bytes=new TextEncoder().encode(JSON.stringify(scene)).length;if(bytes===scene.stats.encodedBytes)break;scene.stats.encodedBytes=bytes;}
  demand(scene.members.length<=scene.options.maxMembers&&scene.stats.encodedBytes<=scene.options.maxBytes,'corridor exceeds metadata bound');
  freeze(scene);issued.add(scene);return scene;
 }
 async function create(owner,start,target,o={}){
  const own=owners.get(owner);demand(own,'unissued source owner');const {header,record,read}=own,bounds=options(o);checkRoute(start,header);checkRoute(target,header);
  demand(target.root===start.root&&target.slots.length>=start.slots.length&&same(target.slots.slice(0,start.slots.length),start.slots),'target is outside the selected source');
  demand(target.slots.length-start.slots.length<=bounds.maxMembers,'corridor exceeds member bound');
  async function row(id){if(o.signal?.aborted)throw o.signal.reason||Error('Source corridor cancelled');const r=await read(id,o.signal),[k,cs,p,n,scope]=r;demand(Number.isInteger(id)&&id>=0&&id<record.uniqueNodes&&Number.isInteger(k)&&k>=0&&k<12&&Array.isArray(cs)&&cs.length===(A.fields[A.kinds[k]]||[]).length&&cs.every(c=>Number.isInteger(c)&&c>=0&&c<id)&&p&&typeof p==='object'&&typeof n==='string'&&/^[1-9]\d*$/.test(n)&&n.length<=4096&&Number.isInteger(scope)&&scope>=0,'source row');return r;}
  let id=header.roots[start.root],path=header.declaration.rootPaths[start.root],depth=0;const outer={rootLabel:path,kinds:[],bindings:[]};
  for(const [i,slot]of start.slots.entries()){const [k,cs]=await row(id);demand(slot<cs.length,'invalid root prefix');outer.kinds.push(k);if(binds(k,slot)){outer.bindings.push({depth:i,node:id,kind:k});depth++;}path+='.'+A.fields[A.kinds[k]][slot];id=cs[slot];}
  const initial=await row(id),root={node:id,path,route:copy(start),occurrences:initial[3],context:depth},members=[];
  for(const slot of target.slots.slice(start.slots.length)){
   const [kind,cs,payload,mass,scope]=await row(id);demand(slot<cs.length,'invalid path field');const children=[];for(const c of cs)children.push(await row(c));
   demand(1n+children.reduce((n,r)=>n+BigInt(r[3]),0n)===BigInt(mass),'source child accounting');
   const needed=Math.max(0,...children.map((r,j)=>r[4]-(binds(kind,j)?1:0)));demand(needed===scope,'source scope recurrence');
   const rawName=kind===8?payload.declName:[6,7].includes(kind)?payload.binderName:null,presentationName=typeof rawName==='string'?rawName.slice(0,96).split('._@.')[0].slice(0,64):null;
   members.push({node:id,kind,slot,field:A.fields[A.kinds[kind]][slot],context:depth,scopeExtension:binds(kind,slot)?1:0,...(presentationName!==null?{presentationName}:{}),siblings:cs.flatMap((c,j)=>j===slot?[]:[{slot:j,field:A.fields[A.kinds[kind]][j],node:c,occurrences:children[j][3],neededScope:children[j][4],context:depth+(binds(kind,j)?1:0)}])});
   if(binds(kind,slot))depth++;id=cs[slot];
  }
  const last=await row(id),endpoint={node:id,kind:last[0],occurrences:last[3],neededScope:last[4],context:depth};
  if(last[0]===0){demand(Number.isInteger(last[2].index)&&last[2].index>=0&&last[4]===last[2].index+1,'bound variable index/scope');endpoint.boundIndex=last[2].index;}
  return finish({format:'ProofAtlasSourceCorridor/1',source:identity(record),options:bounds,outer,root,members,endpoint,guarantee:'Original source context only, using the loader’s hash-validated immutable packet. Ordered fields, sibling regions and lexical context extensions remain exact; payloads remain in the source packet. No typing of intermediate expressions, logical premise relation, normalization or semantic equivalence is inferred.'});
 }
 function join(first,second,o={}){
  demand(issued.has(first)&&issued.has(second)&&same(first.source,second.source),'foreign corridor/source');const at=resolve(first,{kind:'endpoint'});
  demand(same(at.route,second.root.route)&&at.node===second.root.node&&at.path===second.root.path&&first.endpoint.context===second.root.context&&first.endpoint.occurrences===second.root.occurrences,'corridor seam');
  demand(same(second.outer.kinds,[...first.outer.kinds,...first.members.map(m=>m.kind)]),'outer source fields at seam');
  const bindings=[...first.outer.bindings,...first.members.flatMap((m,i)=>m.scopeExtension?[{depth:first.root.route.slots.length+i,node:m.node,kind:m.kind}]:[])];demand(same(second.outer.bindings,bindings),'outer binder identities at seam');
  return finish({...first,options:options(o),members:[...first.members,...second.members],endpoint:second.endpoint});
 }
 function* cut(scene){
  demand(issued.has(scene),'unissued corridor');
  for(const [i,m]of scene.members.entries()){yield{...resolve(scene,{kind:'member',index:i}),state:'retained',occurrences:'1'};for(const s of m.siblings)yield{...resolve(scene,{kind:'sibling',member:i,slot:s.slot}),state:'frontier',occurrences:s.occurrences};}
  yield{...resolve(scene,{kind:'endpoint'}),state:'frontier',occurrences:scene.endpoint.occurrences};
 }
 async function plug(owner,scene,inner){
  const own=owners.get(owner),source=inner?.source;demand(own&&issued.has(scene)&&same(identity(own.record),scene.source)&&source?.name===scene.source.name&&source.indexSha256===scene.source.indexSha256&&source.sourceSha256===scene.source.sourceSha256,'transfer source identity');
  checkRoute(inner?.root?.route,own.header);
  const endpoint=resolve(scene,{kind:'endpoint'});demand(inner.root?.node===endpoint.node&&inner.root.path===endpoint.path&&same(copy(endpoint.route),copy(inner.root.route))&&Array.isArray(inner.cut)&&inner.cut.length>=1&&inner.cut.length<=limits.cutEntries,'transfer root/bound');
  let estimated=0;for(const r of inner.cut){checkRoute(r.route,own.header);demand(typeof r.path==='string'&&r.path.length<=8192&&typeof r.occurrences==='string'&&r.occurrences.length<=4096,'transfer field bound');estimated+=100+new TextEncoder().encode(r.path).length+r.occurrences.length+r.route.slots.length*4;demand(estimated<=limits.transferBytes,'transfer preflight byte bound');}
  const parts=inner.cut.map(r=>({node:r.node,path:r.path,route:copy(r.route),state:r.state,occurrences:r.occurrences}));
  demand(new TextEncoder().encode(JSON.stringify(parts)).length<=limits.transferBytes,'transfer byte bound');const trie={children:new Map()};let trieNodes=1;
  for(const r of parts){checkRoute(r.route,own.header);demand(r.route.root===endpoint.route.root&&same(r.route.slots.slice(0,endpoint.route.slots.length),endpoint.route.slots)&&['retained','frontier'].includes(r.state),'transfer position');let at=trie;for(const slot of r.route.slots.slice(endpoint.route.slots.length)){if(!at.children.has(slot)){demand(++trieNodes<=limits.cutTrie,'transfer trie bound');at.children.set(slot,{children:new Map()});}at=at.children.get(slot);}demand(!at.region,'duplicate transfer position');at.region=r;}
  let retained=0,hidden=0n;const work=[{trie,node:endpoint.node,path:endpoint.path}];
  while(work.length){const p=work.pop(),r=p.trie.region;demand(r&&r.node===p.node&&r.path===p.path,'transfer source gap/mismatch');const [kind,cs,,mass]=await own.read(p.node);
   if(r.state==='frontier'){demand(p.trie.children.size===0&&r.occurrences===mass,'overlapping/changed transfer frontier');hidden+=BigInt(mass);continue;}
   demand(r.occurrences==='1'&&p.trie.children.size===cs.length,'transfer constructor fields');retained++;
   for(let j=cs.length-1;j>=0;j--)work.push({trie:p.trie.children.get(j)||{},node:cs[j],path:p.path+'.'+A.fields[A.kinds[kind]][j]});
  }
  demand(BigInt(retained)+hidden===BigInt(scene.endpoint.occurrences),'inner transfer partition');
  const combinedRetained=BigInt(scene.stats.retainedOccurrences)+BigInt(retained),combinedHidden=BigInt(scene.stats.hiddenOccurrences)-BigInt(scene.endpoint.occurrences)+hidden;
  demand(combinedRetained+combinedHidden===BigInt(scene.root.occurrences),'whole transfer partition');
  const result=freeze({format:'ProofAtlasSourceCorridorTransfer/1',source:scene.source,outer:scene,inner:{root:endpoint,cut:parts},stats:{retainedOccurrences:String(combinedRetained),hiddenOccurrences:String(combinedHidden),representedOccurrences:scene.root.occurrences},guarantee:'Exact source-cut transfer into one original occurrence. The surrounding source context is unchanged. Only source positions and counts are transferred; native typing evidence requires its separate original validator.'});transfers.add(result);return result;
 }
 function* transferredCut(transfer){demand(transfers.has(transfer),'unissued transfer context');const endpoint=resolve(transfer.outer,{kind:'endpoint'});for(const r of cut(transfer.outer))if(!same(r.route,endpoint.route))yield r;yield*transfer.inner.cut;}
 async function validate(scene,owner){demand(same(scene,await create(owner,scene.root.route,{root:scene.root.route.root,slots:[...scene.root.route.slots,...scene.members.map(m=>m.slot)]},scene.options)),'changed source/context/partition');return true;}
 function mount(container,{scene,onSource}){
  demand(issued.has(scene),'unissued corridor');const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;},jump=(label,p)=>{const at=resolve(scene,p),b=button(label+' · e'+at.node,()=>onSource(at.node,at.route));b.dataset.corridorSource=at.path;return b;};
  const map=el('div',undefined,'pl-corridor-map'),rows=el('ol',undefined,'pl-corridor-members'),paging=el('div',undefined,'pl-actions'),inspection=el('section',undefined,'pl-corridor-inspection'),count=scene.members.length;let offset=0;
  const left=el('div'),middle=el('div',undefined,'pl-corridor-link'),right=el('div');left.append(el('strong','C['+count+'] · source context'),el('p','Γ'+scene.root.context+' · e'+scene.root.node));middle.append(el('span','ordered source fields'),el('span','no typing inferred'));right.append(el('strong','Selected occurrence'),jump('Open selected source',{kind:'endpoint'}),el('p','Γ'+scene.endpoint.context+' · '+A.kinds[scene.endpoint.kind]));map.append(left,middle,right);
  container.classList.add('pl-source-corridor');container.append(el('h5','Source context path'),map,el('p',scene.stats.retainedOccurrences+' retained constructors + '+scene.stats.hiddenOccurrences+' hidden occurrences = '+scene.stats.representedOccurrences+'. Side regions remain separate; this path does not classify them as logical premises.'),rows,paging,inspection);
  const label=m=>A.kinds[m.kind]+(m.presentationName?' '+m.presentationName:'');
  function inspect(index){const m=scene.members[index];inspection.replaceChildren(el('h6','Member '+(index+1)+' · '+label(m)+' → '+m.field),jump('Open constructor',{kind:'member',index}),el('p','Γ'+m.context+' before this constructor; selected field uses Γ'+(m.context+m.scopeExtension)+'.'));const points=m.siblings.map(s=>({kind:'sibling',member:index,slot:s.slot})),next=index+1<count?{kind:'member',index:index+1}:{kind:'endpoint'};inspection.append(jump('Follow '+m.field,next));for(const p of points){const s=m.siblings.find(s=>s.slot===p.slot),line=el('div',undefined,'pl-corridor-sibling');line.append(jump(s.field+' · Γ'+s.context,p),el('span',s.occurrences+' occurrences · original source region'));inspection.append(line);}const ctx=context(scene,{kind:'member',index});if(ctx.length){const list=el('details');list.append(el('summary','Original context · '+ctx.length+' binders'));for(const b of ctx.slice(-16))list.append(jump(b.binderKind,b));if(ctx.length>16)list.append(el('p','Showing the sixteen nearest enclosing binders; all remain in the source packet.'));inspection.append(list);}}
  function draw(){rows.replaceChildren();for(let i=offset;i<Math.min(count,offset+8);i++){const m=scene.members[i],li=el('li'),b=button(label(m)+' → '+m.field+' · Γ'+m.context+' → Γ'+(m.context+m.scopeExtension),()=>inspect(i));b.dataset.corridorMember=String(i);li.value=i+1;li.append(b);rows.append(li);}paging.replaceChildren();if(count>8){const before=button('Previous path members',()=>{offset=Math.max(0,offset-8);draw();}),after=button('Next path members',()=>{offset=Math.min(count-1,offset+8);draw();});before.disabled=offset===0;after.disabled=offset+8>=count;paging.append(before,el('span',(offset+1)+'–'+Math.min(count,offset+8)+' / '+count),after);}}
  draw();if(count)inspect(0);else inspection.append(el('p','The selected occurrence is the context root.'));
  if(scene.endpoint.kind===0){const ctx=context(scene,{kind:'endpoint'}),at=ctx[ctx.length-1-scene.endpoint.boundIndex];inspection.append(at?jump('Selected variable’s original binder',at):el('p','The selected bound index has no enclosing binder in this source path. No binding is inferred.'));}
  return{getScene:()=>scene,dispose:()=>container.replaceChildren()};
 }
 function control(container,{prepare,onSource,isCurrent=()=>true}){
  const toggle=document.createElement('button'),panel=document.createElement('div');toggle.type='button';toggle.textContent='Show source context path';toggle.setAttribute('aria-expanded','false');panel.hidden=true;container.append(toggle,panel);let controller=null,view=null,disposed=false;
  toggle.onclick=async()=>{if(!panel.hidden){controller?.abort();view?.dispose();view=null;panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='Show source context path';return;}controller?.abort();controller=new AbortController();const active=controller;toggle.disabled=true;toggle.textContent='Loading source context path…';panel.setAttribute('aria-busy','true');try{const scene=await prepare(active.signal);if(disposed||active.signal.aborted||!isCurrent())return;panel.hidden=false;view=mount(panel,{scene,onSource});toggle.textContent='Hide source context path';toggle.setAttribute('aria-expanded','true');}catch(error){if(!disposed&&!active.signal.aborted&&isCurrent()){panel.hidden=false;panel.textContent='Source context path unavailable: '+error.message;toggle.textContent='Hide source context path';toggle.setAttribute('aria-expanded','true');}}finally{if(!disposed&&controller===active){toggle.disabled=false;panel.setAttribute('aria-busy','false');}}};
  return{getScene:()=>view?.getScene()||null,dispose:()=>{disposed=true;controller?.abort();view?.dispose();container.replaceChildren();}};
 }
 const api={open,paged,create,join,resolve,context,cut,plug,transferredCut,validate,mount,control,limits};if(node)module.exports=api;else host.ProofAtlasSourceCorridor=api;
})(typeof window==='undefined'?globalThis:window);
