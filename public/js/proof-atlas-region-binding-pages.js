/* Paged de Bruijn coefficients qualified by an existing native component table. */
(function(host){
 'use strict';
 const isNode=typeof module!=='undefined'&&module.exports,A=isNode?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const base='/public/data/proof-atlas/region-binding-pages/',limits=Object.freeze({nodes:131072,rows:64,indices:2,path:512,ports:4,pageBytes:1048576,indexBytes:16384,manifestBytes:32768});
 const demand=(v,m)=>{if(!v)throw Error('Region binding pages: '+m);},nat=n=>Number.isSafeInteger(n)&&n>=0,hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s),integer=s=>typeof s==='string'&&s.length<=4096&&/^(0|[1-9]\d*)$/.test(s),copy=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 async function open(input,graphDescriptor,graphHeader,{fetcher=host.fetch.bind(host),signal}={}){
  const d=freeze(copy(input)),g=freeze(copy(graphDescriptor)),pages=new Map(),indices=new Map();let disposed=false,active=false,pending=null;
  const stats={pageLoads:0,indexLoads:0,evictions:0,peakCachedRows:0,peakCachedBytes:0,peakIndexPages:0};
  const live=s=>{if(signal?.aborted||s?.aborted)throw signal?.reason||s.reason||Error('Cancelled');demand(!disposed,'disposed');},effective=s=>signal&&s?host.AbortSignal.any([signal,s]):s||signal;
  async function read(ref,kind,cap,s){
   live(s);demand(hex(ref.sha256)&&nat(ref.bytes)&&ref.bytes>0&&ref.bytes<=cap&&ref.file===base+ref.sha256+'.'+kind+'.gz','asset descriptor');
   const response=await fetcher(ref.file,{signal:effective(s)});demand(response.ok,'asset unavailable ('+response.status+')');
   const reader=response.body.pipeThrough(new host.DecompressionStream('gzip')).getReader(),parts=[];let size=0;
   try{while(true){live(s);const p=await reader.read();if(p.done)break;size+=p.value.byteLength;demand(size<=ref.bytes&&size<=cap,'decoded byte bound');parts.push(p.value);}}catch(e){await reader.cancel(e).catch(()=>{});throw e;}finally{reader.releaseLock();}
   demand(size===ref.bytes,'decoded size');const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.byteLength;}
   demand(await A.digest(bytes)===ref.sha256,'asset hash');live(s);return freeze(JSON.parse(new TextDecoder().decode(bytes)));
  }
  demand(hex(d.nativeCaseSha256)&&hex(d.nativeInventorySha256)&&hex(d.graphManifestSha256)&&d.nativeCaseSha256===g.nativeCaseSha256&&d.nativeInventorySha256===g.nativeInventorySha256&&d.graphManifestSha256===g.sha256&&same(d.source,g.source),'native graph owner');
  const m=await read(d,'manifest',limits.manifestBytes,signal),n=m.nodeCount;
  demand(m.format==='ProofAtlasRegionBindingPages/1'&&m.id===d.id&&same(m.source,d.source)&&m.nativeCaseSha256===d.nativeCaseSha256&&m.nativeInventorySha256===d.nativeInventorySha256&&m.graphManifestSha256===g.sha256,'manifest owner');
  demand(nat(n)&&n>0&&n<=limits.nodes&&n===graphHeader.nodeCount&&same(m.components,graphHeader.components)&&m.pageSize===64&&m.pageCount===Math.ceil(n/64),'component table');
  let level=0,capacity=64;while(capacity<m.pageCount){capacity*=64;level++;}
  demand(m.indexLevel===level&&hex(m.indexRoot)&&m.indexSizes&&Object.keys(m.indexSizes).length<=34,'index shape');for(const[k,v]of Object.entries(m.indexSizes))demand(hex(k)&&nat(v)&&v>0&&v<=limits.indexBytes,'index size');
  const touch=(cache,key)=>{const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;};
  async function index(hash,s){
   live(s);if(indices.has(hash))return touch(indices,hash);
   const value=await read({file:base+hash+'.index.gz',sha256:hash,bytes:m.indexSizes[hash]},'index',limits.indexBytes,s);live(s);
   demand(value.format==='ProofAtlasRegionBindingIndex/1'&&Array.isArray(value.children)&&value.children.length>0&&value.children.length<=64&&value.children.every(c=>hex(c.sha256)&&nat(c.bytes)&&c.bytes>0),'index record');
   if(indices.size===2)indices.delete(indices.keys().next().value);indices.set(hash,value);stats.indexLoads++;stats.peakIndexPages=Math.max(stats.peakIndexPages,indices.size);return value;
  }
  async function row(node,s){
   live(s);demand(nat(node)&&node<n,'row address');const page=Math.floor(node/64);if(pages.has(page))return touch(pages,page).rows[node%64];
   let ref={sha256:m.indexRoot};for(let level=m.indexLevel;level>=0;level--){const v=await index(ref.sha256,s),span=64**level,first=Math.floor(page/(64*span))*64*span;demand(v.level===level&&v.first===first&&v.children.length===Math.min(64,Math.ceil((m.pageCount-first)/span)),'index range');ref=v.children[Math.floor(page/span)%64];}
   const value=await read({...ref,file:base+ref.sha256+'.page.gz'},'page',limits.pageBytes,s);live(s);
   demand(value.format==='ProofAtlasRegionBindingPage/1'&&value.start===page*64&&Array.isArray(value.rows)&&value.rows.length===Math.min(64,n-value.start),'page range');
   for(const r of value.rows){demand(Array.isArray(r)&&r.length===2&&integer(r[0])&&Array.isArray(r[1])&&r[1].length<=512,'reference row');let last=-1;for(const pair of r[1]){demand(Array.isArray(pair)&&pair.length===2&&nat(pair[0])&&pair[0]>last&&pair[0]<512&&integer(pair[1])&&BigInt(pair[1])>0n,'ordered reference coefficient');last=pair[0];}}
   if(pages.size){pages.clear();stats.evictions++;}pages.set(page,{rows:value.rows,bytes:ref.bytes});stats.pageLoads++;stats.peakCachedRows=Math.max(stats.peakCachedRows,value.rows.length);stats.peakCachedBytes=Math.max(stats.peakCachedBytes,ref.bytes);return value.rows[node%64];
  }
  function start(task){active=true;(async()=>{try{live(task.signal);const value=await task.fn();live(task.signal);task.resolve(value);}catch(e){task.reject(e);}finally{active=false;const next=pending;pending=null;if(next)start(next);}})();}
  function run(fn,s){return new Promise((resolve,reject)=>{try{live(s);}catch(e){reject(e);return;}const task={fn,signal:s,resolve,reject};if(active){pending?.reject(Error('Region binding pages: pending operation superseded'));pending=task;}else start(task);});}
  function summary(node,expanded,neededScope,{signal:s}={}){return run(async()=>{
   demand(integer(expanded)&&BigInt(expanded)>0n&&nat(neededScope)&&neededScope<=512,'selected graph metadata');const r=await row(node,s),last=r[1].at(-1)?.[0]??-1,external=r[1].reduce((v,p)=>v+BigInt(p[1]),0n);
   demand(last+1===neededScope&&BigInt(r[0])+external<=BigInt(expanded),'selected scope/count correspondence');
   return freeze({node,localReferences:r[0],externalReferences:String(external),free:r[1].map(([index,count])=>({index,count})),portCount:r[1].length,occurrences:expanded,owner:{namespace:'region-binding-coefficients',nativeInventorySha256:d.nativeInventorySha256,nativeCaseSha256:d.nativeCaseSha256,graphManifestSha256:g.sha256,manifestSha256:d.sha256}});
  },s);}
  return Object.freeze({summary,state:()=>({...stats,cachedRows:[...pages.values()].reduce((v,p)=>v+p.rows.length,0),indexPages:indices.size,rowLimit:64,indexLimit:2,activeOperation:active,pendingOperations:pending?1:0,disposed,wholeArchiveRequests:0}),dispose:()=>{disposed=true;pending?.reject(Error('Region binding pages: disposed'));pending=null;pages.clear();indices.clear();}});
 }
 const api={open,base,limits};if(isNode)module.exports=api;else host.ProofAtlasRegionBindingPages=api;
})(typeof window==='undefined'?globalThis:window);
