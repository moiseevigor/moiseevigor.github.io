/* Lossless shared terms. Only one declaration is fetched; expanded counts use BigInt. */
(function(host){
 'use strict';
 const fields={app:['fn','arg'],lam:['domain','body'],forallE:['domain','body'],letE:['type','value','body'],mdata:['expr'],proj:['struct']};
 const kinds=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj'];
 const levelPorts={zero:[],succ:['of'],max:['left','right'],imax:['left','right'],param:[],mvar:[]};
 const levelDemand=(ok,m)=>{if(!ok)throw Error('Level data: '+m);},levelCanonical=x=>Array.isArray(x)?x.map(levelCanonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,levelCanonical(x[k])])):x,levelSame=(a,b)=>JSON.stringify(levelCanonical(a))===JSON.stringify(levelCanonical(b));
 function levelNameIdentity(parts){if(parts===undefined)return null;levelDemand(Array.isArray(parts)&&parts.length<=128,'name parts bound');for(const p of parts)levelDemand(p&&Object.keys(p).length===1&&(typeof p.str==='string'||typeof p.num==='string'&&/^(0|[1-9]\d*)$/.test(p.num)),'structured name component');return JSON.stringify(parts);}
 function levelPayload(kind,l){const keys=Object.keys(l);levelDemand(levelPorts[kind],'unknown Level constructor');const required={zero:[],succ:[],max:[],imax:[],param:['name'],mvar:['id']}[kind],optional=kind==='param'?['nameParts']:kind==='mvar'?['idNameParts']:[],allowed=new Set(['kind',...levelPorts[kind],...required,...optional]);levelDemand(keys.every(k=>allowed.has(k))&&required.every(k=>typeof l[k]==='string'),'Level payload fields');if(kind==='param')levelNameIdentity(l.nameParts);if(kind==='mvar')levelNameIdentity(l.idNameParts);return Object.fromEntries([...required,...optional].filter(k=>l[k]!==undefined).map(k=>[k,l[k]]));}
 function compileLevels(roots){
  levelDemand(Array.isArray(roots)&&roots.length>0&&roots.length<=128,'level root bound');const g={format:'LevelDAG/1',kind:[],children:[],payloads:[],expanded:[],roots:[]},done=new WeakMap(),active=new WeakSet(),intern=new Map();let work=0;
  function add(kind,p,cs){const signature=JSON.stringify([kind,levelCanonical(p),cs]);let id=intern.get(signature);if(id===undefined){id=g.kind.length;levelDemand(id<4096,'Level DAG bound');intern.set(signature,id);g.kind.push(kind);g.payloads.push(p);g.children.push(cs);g.expanded.push((1n+cs.reduce((s,c)=>s+BigInt(g.expanded[c]),0n)).toString());}return id;}
  function imported(l,baseDepth){levelDemand(l.encoding==='LevelDAG/1'&&Object.keys(l).every(k=>['encoding','graph'].includes(k)),'Level transport encoding');const h=l.graph;validateLevelGraph(h);levelDemand(h.roots.length===1,'one Level per envelope');const seen=new Map(),stack=[{id:h.roots[0],finish:false,depth:baseDepth}];while(stack.length){const f=stack.pop();if(seen.has(f.id))continue;levelDemand(f.depth<=512&&++work<=32768,'Level input work/depth bound');if(!f.finish){stack.push({...f,finish:true});for(let j=h.children[f.id].length-1;j>=0;j--)stack.push({id:h.children[f.id][j],finish:false,depth:f.depth+1});}else seen.set(f.id,add(h.kind[f.id],h.payloads[f.id],h.children[f.id].map(c=>seen.get(c))));}return seen.get(h.roots[0]);}
  for(const root of roots){const todo=[{value:root,finish:false,depth:0}];while(todo.length){const f=todo.pop(),l=f.value;levelDemand(l&&typeof l==='object'&&!Array.isArray(l),'Level object');if(done.has(l))continue;if(l.encoding!==undefined){done.set(l,imported(l,f.depth));continue;}levelDemand(f.depth<=512&&++work<=32768,'Level input work/depth bound');const kind=l.kind,p=levelPayload(kind,l),ports=levelPorts[kind];if(!f.finish){levelDemand(!active.has(l),'cyclic Level input');active.add(l);todo.push({...f,finish:true});for(let j=ports.length-1;j>=0;j--)todo.push({value:l[ports[j]],finish:false,depth:f.depth+1});}else{const cs=ports.map(p=>done.get(l[p]));levelDemand(cs.every(Number.isInteger),'postorder Level fields');const id=add(kind,p,cs);done.set(l,id);active.delete(l);}}g.roots.push(done.get(root));}validateLevelGraph(g);return g;
 }
 function validateLevelGraph(g){
  const n=g?.kind?.length;levelDemand(g?.format==='LevelDAG/1'&&Object.keys(g).every(k=>['format','kind','children','payloads','expanded','roots'].includes(k))&&Number.isInteger(n)&&n>0&&n<=4096&&['children','payloads','expanded'].every(f=>g[f]?.length===n)&&Array.isArray(g.roots)&&g.roots.length>0&&g.roots.length<=128,'Level DAG shape/bounds');
  const depth=[];for(let i=0;i<n;i++){const k=g.kind[i],ports=levelPorts[k],cs=g.children[i];levelDemand(ports&&Array.isArray(cs)&&cs.length===ports.length&&cs.every(c=>Number.isInteger(c)&&c>=0&&c<i),'Level constructor/ports/order');depth[i]=Math.max(0,...cs.map(c=>depth[c]+1));levelDemand(depth[i]<=512,'Level DAG depth bound');levelDemand(levelSame(levelPayload(k,{kind:k,...g.payloads[i]}),g.payloads[i]),'Level payload encoding');levelDemand(typeof g.expanded[i]==='string'&&g.expanded[i].length<=160&&/^[1-9]\d*$/.test(g.expanded[i])&&1n+cs.reduce((s,c)=>s+BigInt(g.expanded[c]),0n)===BigInt(g.expanded[i]),'Level occurrence count');}levelDemand(g.roots.every(r=>Number.isInteger(r)&&r>=0&&r<n),'Level root');const reached=new Set(),todo=[...g.roots];while(todo.length){const id=todo.pop();if(reached.has(id))continue;reached.add(id);todo.push(...g.children[id]);}levelDemand(reached.size===n,'unreachable Level node');return true;
 }
 function levelsKey(levels){levelDemand(Array.isArray(levels),'universe argument slots');return levels.length?JSON.stringify(levelCanonical(compileLevels(levels))):'[]';}
 function payloadKey(kind,p){const normalized={...p};if(kind===3)normalized.level=compileLevels([p.level]);if(kind===4){levelDemand(Array.isArray(p.levels),'constant universe slots');normalized.levels=p.levels.length?compileLevels(p.levels):[];}return JSON.stringify(levelCanonical(normalized));}
 async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
 async function compressedBytes(file,hash,options={}){
  const signal=options.signal,check=()=>{if(signal?.aborted)throw signal.reason||Error('Proof load cancelled');};check();
  const limit=options.maxBytes;if(limit!==undefined&&(!Number.isInteger(limit)||limit<1||limit>67108864))throw Error('Invalid proof asset byte bound');
  if(options.expectedBytes!==undefined&&(!Number.isInteger(options.expectedBytes)||options.expectedBytes<0||(limit!==undefined&&options.expectedBytes>limit)))throw Error('Invalid expected proof asset size');
  const r=await fetch(file,signal?{signal}:undefined);if(!r.ok)throw Error('Proof asset unavailable: '+file+' ('+r.status+')');
  if(!host.DecompressionStream)throw Error('This browser needs gzip decompression support. The compressed term packet remains available.');
  const stream=r.body.pipeThrough(new DecompressionStream('gzip'));let bytes;
  if(limit!==undefined){const reader=stream.getReader(),chunks=[];let total=0;
   try{while(true){check();const part=await reader.read();if(part.done)break;total+=part.value.byteLength;if(total>limit)throw Error('Proof asset exceeds decoded byte bound');chunks.push(part.value);}check();bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}}
   catch(error){await reader.cancel(error).catch(()=>{});throw error;}finally{reader.releaseLock();}
  }else bytes=await new Response(stream).arrayBuffer();check();
  if(options.expectedBytes!==undefined&&bytes.byteLength!==options.expectedBytes)throw Error('Proof asset decoded size mismatch');
  if(await digest(bytes)!==hash)throw Error('Proof asset SHA-256 mismatch: '+file);check();return bytes;
 }
 async function compressed(file,hash,options={}){return JSON.parse(new TextDecoder().decode(await compressedBytes(file,hash,options)));}

 function children(data,i){return data.children[i];}
 function validateIndex(data,record){
  const n=record.uniqueNodes;if(data.serialization!=='ExprDAG/1'||data.kind.length!==n||data.children.length!==n||data.expanded.length!==n||data.payloads.length!==n||data.neededScope.length!==n||data.declaration.name!==record.name||data.declaration.kernelCheck!=='PASS')throw Error('Proof index does not match the compiled inventory');
  for(let i=0;i<n;i++){
   if(data.kind[i]===3)compileLevels([data.payloads[i].level]);if(data.kind[i]===4){levelDemand(Array.isArray(data.payloads[i].levels),'constant universe slots');if(data.payloads[i].levels.length)compileLevels(data.payloads[i].levels);}
   const cs=children(data,i),k=kinds[data.kind[i]];if(!k||cs.length!==(fields[k]||[]).length||cs.some(c=>!Number.isInteger(c)||c<0||c>=i))throw Error('Invalid DAG structure at '+i);
   if(1n+cs.reduce((s,c)=>s+BigInt(data.expanded[c]),0n)!==BigInt(data.expanded[i]))throw Error('Invalid expanded count at '+i);
   const need=k==='bvar'?data.payloads[i].index+1:Math.max(0,...cs.map((c,j)=>data.neededScope[c]-((['lam','forallE'].includes(k)&&j===1||k==='letE'&&j===2)?1:0)));
   if(need!==data.neededScope[i])throw Error('Invalid lexical scope at '+i);
  }
  if(data.roots.some(r=>!Number.isInteger(r)||r<0||r>=n||data.neededScope[r]!==0)||data.roots.reduce((s,i)=>s+BigInt(data.expanded[i]),0n)!==BigInt(record.occurrences))throw Error('Proof roots are incomplete or open');
  return data;
 }
 function routes(data){
  const parent=Array(data.kind.length).fill(-2),slot=Array(data.kind.length),origin=Array(data.kind.length),queue=[];
  data.roots.forEach((r,j)=>{if(parent[r]===-2){parent[r]=-1;origin[r]=j;queue.push(r);}});
  for(let p=0;p<queue.length;p++){const i=queue[p];children(data,i).forEach((c,j)=>{if(parent[c]===-2){parent[c]=i;slot[c]=j;origin[c]=origin[i];queue.push(c);}});}
  if(parent.includes(-2))throw Error('Unreachable proof nodes');
  const route=i=>{const slots=[];while(parent[i]>=0){slots.unshift(slot[i]);i=parent[i];}return{root:origin[i],slots};};
  return{parent,route};
 }
 function walk(data,route){let i=data.roots[route.root];if(i===undefined)throw Error('Unknown proof root');for(const j of route.slots){i=children(data,i)[j];if(i===undefined)throw Error('Invalid occurrence route');}return i;}
 function path(data,route){let i=data.roots[route.root],p=data.declaration.rootPaths[route.root];for(const j of route.slots){p+='.'+fields[kinds[data.kind[i]]][j];i=children(data,i)[j];}return p;}
 function binding(data,route){let i=data.roots[route.root],scope=[];for(let at=0;at<route.slots.length;at++){const j=route.slots[at],k=kinds[data.kind[i]];if(['lam','forallE'].includes(k)&&j===1||k==='letE'&&j===2)scope.unshift({node:i,route:{root:route.root,slots:route.slots.slice(0,at)}});i=children(data,i)[j];}return kinds[data.kind[i]]==='bvar'?scope[data.payloads[i].index]:undefined;}
 function binder(data,route){return binding(data,route)?.node;}
 function reachable(data,root){const seen=new Set(),queue=[root];for(let p=0;p<queue.length;p++){const i=queue[p];if(seen.has(i))continue;seen.add(i);queue.push(...children(data,i));}return [...seen];}
 async function open(record){const data=validateIndex(await compressed(record.indexFile,record.indexSha256,{maxBytes:67108864}),record),r=routes(data);data.parent=r.parent;return{data,record,children:i=>children(data,i),route:r.route,path:i=>path(data,r.route(i)),payloads:async()=>{},payload:i=>data.payloads[i],kind:i=>kinds[data.kind[i]]};}
 function levelText(u){const g=compileLevels([u]),root=g.roots[0],depth=[];for(let i=0;i<g.kind.length;i++)depth[i]=Math.max(0,...g.children[i].map(c=>depth[c]+1));if(BigInt(g.expanded[root])>256n||depth[root]>32)return 'LevelDAG(ℓ'+root+'; '+g.kind.length+' stored nodes)';const text=[];for(let i=0;i<g.kind.length;i++){const k=g.kind[i],p=g.payloads[i],cs=g.children[i];text[i]=k==='zero'?'0':k==='param'?p.name:k==='mvar'?p.id:k==='succ'?'('+text[cs[0]]+' + 1)':k+'('+text[cs[0]]+', '+text[cs[1]]+')';}return text[root];}
 function describe(data,i){const k=kinds[data.kind[i]],p=data.payloads[i],cs=children(data,i).map(c=>'e'+c),name=p.binderName||p.declName||'_';switch(k){
  case 'bvar':return 'bound variable ['+p.index+']';
  case 'fvar':case 'mvar':return k+' '+p.id;
  case 'sort':return 'Sort '+levelText(p.level);
  case 'const':return p.name+(p.levels.length?'.{'+p.levels.map(levelText).join(', ')+'}':'');
  case 'app':return cs[0]+' ('+cs[1]+')';
  case 'lam':case 'forallE':{const pair=p.binderInfo==='implicit'?['{','}']:p.binderInfo==='strictImplicit'?['⦃','⦄']:p.binderInfo==='instImplicit'?['[',']']:['(',')'];return(k==='lam'?'fun ':'∀ ')+pair[0]+name+' : '+cs[0]+pair[1]+(k==='lam'?' => ':', ')+cs[1];}
  case 'letE':return 'let '+name+' : '+cs[0]+' := '+cs[1]+'; '+cs[2]+(p.nondep?' [nondependent]':'');
  case 'lit':return p.literalKind==='natVal'?p.value:JSON.stringify(p.value);
  case 'mdata':return cs[0]+' [metadata: '+p.metadata.map(m=>m.key+' = '+m.value.repr).join('; ')+']';
  case 'proj':return cs[0]+'.'+p.typeName+'['+p.index+']';
  default:throw Error('Unknown expression constructor');}}
 function termLines(data,root){return reachable(data,root).sort((a,b)=>a-b).map(i=>'e'+i+' := '+describe(data,i));}
 const api={compileLevels,validateLevelGraph,levelNameIdentity,payloadKey,levelsKey,levelText,fields,kinds,children,describe,termLines,path,binding,binder,walk,reachable,routes,validateIndex,digest,compressed,compressedBytes,open};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasLibraryData=api;
})(typeof window==='undefined'?globalThis:window);
