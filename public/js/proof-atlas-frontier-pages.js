/* Scoped computed components. Hash-checked pages are transport, not kernel replay. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,N=node?require('./proof-atlas-computed-type-neighborhood'):host.ProofAtlasComputedTypeNeighborhood;
 const limits=Object.freeze({nodes:131072,pageSize:64,pageBytes:1048576,indexBytes:16384,manifestBytes:262144,path:512}),base='/public/data/proof-atlas/frontier-pages/';
 const demand=(v,m)=>{if(!v)throw Error('Frontier pages: '+m);},nat=n=>Number.isSafeInteger(n)&&n>=0,hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s),copy=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 function sourceEqual(a,b){return a&&b&&['edition','name','indexSha256','sourceSha256'].every(k=>a[k]===b[k]);}
 async function open(input,expectedSource,{fetcher=host.fetch.bind(host),signal}={}){
  const d=freeze(copy(input)),expected=freeze(copy(expectedSource)),pages=new Map(),indices=new Map();let disposed=false,active=false,pending=null;
  const stats={pageLoads:0,indexLoads:0,evictions:0,peakCachedRows:0,peakCachedBytes:0,peakIndexPages:0};
  const live=s=>{if(signal?.aborted||s?.aborted)throw signal?.reason||s.reason||Error('Navigation cancelled');demand(!disposed,'disposed');};
  async function read(ref,extension,cap,s){
   live(s);demand(hex(ref.sha256)&&nat(ref.bytes)&&ref.bytes>0&&ref.bytes<=cap&&ref.file===base+ref.sha256+'.'+extension+'.gz','asset descriptor');
   const r=await fetcher(ref.file,{signal:s||signal});demand(r.ok,'asset unavailable ('+r.status+')');
   const reader=r.body.pipeThrough(new host.DecompressionStream('gzip')).getReader(),parts=[];let size=0;
   try{while(true){live(s);const part=await reader.read();if(part.done)break;size+=part.value.byteLength;demand(size<=ref.bytes&&size<=cap,'decoded byte bound');parts.push(part.value);}}
   catch(e){await reader.cancel(e).catch(()=>{});throw e;}finally{reader.releaseLock();}
   demand(size===ref.bytes,'decoded size');const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.byteLength;}
   demand(await A.digest(bytes)===ref.sha256,'asset hash');live(s);return freeze(JSON.parse(new TextDecoder().decode(bytes)));
  }
  demand(hex(d.nativeInventorySha256)&&hex(d.nativeCaseSha256)&&sourceEqual(d.source,expected)&&hex(expected.indexSha256)&&hex(expected.sourceSha256),'descriptor source/native identity');
  const m=await read(d,'manifest',limits.manifestBytes,signal),n=m.nodeCount;live();
  demand(m.format==='ProofAtlasFrontierPages/1'&&m.nativeInventorySha256===d.nativeInventorySha256&&m.nativeCaseSha256===d.nativeCaseSha256&&m.id===d.id&&sourceEqual(m.source,expected),'manifest owner');
  demand(nat(n)&&n>0&&n<=limits.nodes&&m.pageSize===64&&m.pageCount===Math.ceil(n/64)&&hex(m.indexRoot),'table bounds');
  let level=0,capacity=64;while(capacity<m.pageCount){capacity*=64;level++;}demand(m.indexLevel===level,'index depth');
  demand(m.indexSizes&&Object.keys(m.indexSizes).length<=34&&Object.entries(m.indexSizes).every(([k,v])=>hex(k)&&nat(v)&&v>0&&v<=limits.indexBytes),'index inventory');
  demand(Array.isArray(m.holes)&&m.holes.length>0&&m.holes.length<=8&&Array.isArray(m.components),'component inventory');
  const expectedComponents=['function.term','function.inferredType','function.declaredGoalType','source.term','source.inferredType','source.declaredType'].map(component=>({component,scope:{kind:'closed',length:0}}));
  for(const [i,h]of m.holes.entries()){
   demand(nat(h.call)&&nat(h.anchor?.node)&&h.anchor.route?.root===1&&Array.isArray(h.anchor.route.slots)&&h.anchor.route.slots.length<=512&&h.anchor.route.slots.every(s=>nat(s)&&s<3)&&Array.isArray(h.context)&&h.context.length<=512,'source fragment');
   let prev=-1;for(const f of h.context){demand(nat(f.node)&&['lam','forallE','letE'].includes(f.kind)&&f.route?.root===1&&Array.isArray(f.route.slots)&&f.route.slots.length>prev&&f.route.slots.length<h.anchor.route.slots.length&&same(f.route.slots,h.anchor.route.slots.slice(0,f.route.slots.length)),'original context frame');prev=f.route.slots.length;}
   for(const suffix of ['closedTerm','closedType','originalType'])expectedComponents.push({component:'hole.'+i+'.'+suffix,scope:{kind:suffix==='originalType'?'source-prefix':'closed',length:suffix==='originalType'?h.context.length:0}});
  }
  for(let i=0;i<m.holes.length;i++)expectedComponents.push({component:'parameter.'+i+'.type',scope:{kind:'parameter-prefix',length:i}});
  demand(m.components.length===expectedComponents.length,'component count');const roots={},owners={};
  for(const [i,c]of m.components.entries()){demand(c.component===expectedComponents[i].component&&same(c.scope,expectedComponents[i].scope)&&nat(c.root)&&c.root<n,'component scope/root');roots[c.component]=c.root;owners[c.component]=c;}
  const flags=['functionTyping','declaredGoalFunctionTyping','declaredGoalTypeConversion','sourceInstantiationTyping','sourceInstantiationConversion','sourceEqualityWitness','literalHoleReopening','literalParameterTypeRecovery'];
  demand(flags.every(k=>m.judgments?.[k]==='PASS')&&m.closedPacketKernelTyping==='PASS','recorded native judgments');
  const touch=(cache,key)=>{const v=cache.get(key);cache.delete(key);cache.set(key,v);return v;};
  async function index(sha,s){
   if(indices.has(sha))return touch(indices,sha);
   const v=await read({file:base+sha+'.index.gz',sha256:sha,bytes:m.indexSizes[sha]},'index',limits.indexBytes,s);live(s);
   demand(v.format==='ProofAtlasFrontierIndex/1'&&Array.isArray(v.children)&&v.children.length>0&&v.children.length<=64&&v.children.every(r=>hex(r.sha256)&&nat(r.bytes)&&r.bytes>0&&r.bytes<=limits.pageBytes),'index shape');
   if(indices.size===2)indices.delete(indices.keys().next().value);indices.set(sha,v);stats.indexLoads++;stats.peakIndexPages=Math.max(stats.peakIndexPages,indices.size);return v;
  }
  async function row(id,s){
   live(s);demand(nat(id)&&id<n,'row address');const page=Math.floor(id/64);if(pages.has(page))return pages.get(page).value.nodes[id%64];
   let ref={sha256:m.indexRoot,bytes:m.indexSizes[m.indexRoot]};
   for(let l=m.indexLevel;l>=0;l--){demand(ref.bytes===m.indexSizes[ref.sha256],'index parent size');const v=await index(ref.sha256,s),span=64**l,first=Math.floor(page/(64*span))*64*span;demand(v.level===l&&v.first===first&&v.children.length===Math.min(64,Math.ceil((m.pageCount-first)/span)),'index range');ref=v.children[Math.floor(page/span)%64];}
   const v=await read({...ref,file:base+ref.sha256+'.page.gz'},'page',limits.pageBytes,s);live(s);
   demand(v.format==='ProofAtlasFrontierPage/1'&&v.start===page*64&&Array.isArray(v.nodes)&&v.nodes.length===Math.min(64,n-v.start),'page range');
   for(const [j,r]of v.nodes.entries()){
    demand(Array.isArray(r)&&r.length===5,'row tuple');const [k,cs,p,count,scope]=r;
    demand(nat(k)&&k<12&&k!==1&&k!==2&&Array.isArray(cs)&&cs.length===(A.fields[A.kinds[k]]||[]).length&&cs.every(c=>nat(c)&&c<v.start+j),'constructor ports/order');
    demand(p&&typeof p==='object'&&!Array.isArray(p)&&typeof count==='string'&&/^[1-9]\d*$/.test(count)&&count.length<=4096&&nat(scope)&&scope<=limits.nodes,'payload/count/scope');
    if(k===0)demand(nat(p.index)&&p.index<limits.nodes,'bound variable index');
   }
   if(pages.size){pages.clear();stats.evictions++;}pages.set(page,{value:v,bytes:ref.bytes});stats.pageLoads++;stats.peakCachedRows=Math.max(stats.peakCachedRows,v.nodes.length);stats.peakCachedBytes=Math.max(stats.peakCachedBytes,ref.bytes);return v.nodes[id%64];
  }
  function start(task){active=true;(async()=>{try{live(task.signal);const value=await task.fn();live(task.signal);task.resolve(value);}catch(e){task.reject(e);}finally{active=false;const next=pending;pending=null;if(next)start(next);}})();}
  function run(fn,s){return new Promise((resolve,reject)=>{try{live(s);}catch(e){reject(e);return;}const task={fn,signal:s,resolve,reject};if(active){pending?.reject(Error('Frontier pages: pending operation superseded'));pending=task;}else start(task);});}
  const address=(component,id,slots)=>({namespace:'frontier-components',sourceIndexSha256:expected.indexSha256,nativeInventorySha256:d.nativeInventorySha256,nativeCaseSha256:d.nativeCaseSha256,manifestSha256:d.sha256,case:m.id,component,node:id,route:{root:component,slots:[...slots]}});
  const parameters=[];let fn=roots['function.term'];
  for(let i=0;i<m.holes.length;i++){const r=await row(fn,signal);demand(r[0]===6&&r[1][0]===roots['parameter.'+i+'.type'],'parameter/function domain identity');parameters.push(address('function.term',fn,Array(i).fill(1)));fn=r[1][1];}
  for(const c of m.components)demand((await row(c.root,signal))[4]<=c.scope.length,'component root scope');
  async function locate(component,slots,s){demand(Object.hasOwn(roots,component)&&Array.isArray(slots)&&slots.length<=512,'component path');let id=roots[component];for(const slot of slots){const r=await row(id,s);demand(nat(slot)&&slot<r[1].length,'ordered path');id=r[1][slot];}return id;}
  const original=h=>({namespace:'source-expression',name:expected.name,indexSha256:expected.indexSha256,sourceSha256:expected.sourceSha256,node:h.anchor.node,route:copy(h.anchor.route)});
  function context(component){
   const scope=owners[component].scope;
   if(scope.kind==='parameter-prefix')return{ambient:parameters.slice(0,scope.length),source:{namespace:'computed-parameter-prefix',sourceIndexSha256:expected.indexSha256,bindings:copy(parameters.slice(0,scope.length))}};
   if(scope.kind==='source-prefix'){const h=m.holes[Number(component.split('.')[1])];return{ambient:h.context,source:original(h)};}
   return{ambient:[],source:{namespace:'source-expression',name:expected.name,indexSha256:expected.indexSha256,sourceSha256:expected.sourceSha256,node:null,route:{root:1,slots:[]}}};
  }
  async function neighborhood(component,slots=[],options={}){demand(Array.isArray(slots)&&slots.length<=512,'component path');const path=copy(slots);return run(async()=>{const id=await locate(component,path,options.signal),c=context(component);return N.createPaged(id=>row(id,options.signal),roots,address(component,id,path),c.ambient,c.source,options);},options.signal);}
  return Object.freeze({manifest:m,roots:freeze(roots),parameters:freeze(parameters),neighborhood,sourceFragment:i=>{demand(nat(i)&&i<m.holes.length,'source fragment position');return freeze(original(m.holes[i]));},readNode:(id,{signal:s}={})=>run(()=>row(id,s),s),
   state:()=>({...stats,cachedRows:[...pages.values()].reduce((v,p)=>v+p.value.nodes.length,0),cachedPages:pages.size,indexPages:indices.size,rowLimit:64,indexLimit:2,nodeCount:n,disposed,activeOperation:active,pendingOperations:pending?1:0,fullTableArchiveRequests:0}),
   dispose:()=>{disposed=true;pending?.reject(Error('Frontier pages: disposed'));pending=null;pages.clear();indices.clear();}});
 }
 const api={open,limits,base,sourceEqual,binds};if(node)module.exports=api;else host.ProofAtlasFrontierPages=api;
})(typeof window==='undefined'?globalThis:window);
