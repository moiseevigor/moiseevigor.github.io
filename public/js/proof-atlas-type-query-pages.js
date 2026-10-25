/* Exact finite route membership/absence; table caches belong to selected views. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes,TP=node?require('./proof-atlas-type-pages'):host.ProofAtlasTypePages;
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s),natural=n=>Number.isSafeInteger(n)&&n>=0,demand=(v,m)=>{if(!v)throw Error('Type query pages: '+m);},key=r=>{P.parse(r);return r.root+':'+r.depth+':'+r.slots;};
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
async function open(input,recordInput,{fetcher=host.fetch.bind(host),signal,indexLimit=4}={}){
 const d=freeze(JSON.parse(JSON.stringify(input))),record=freeze(JSON.parse(JSON.stringify(recordInput))),base='/public/data/proof-atlas/type-query-pages/'+record.indexSha256+'/',cache=new Map(),issued=new WeakSet();let disposed=false;
 const live=s=>{if(signal?.aborted||s?.aborted)throw signal?.reason||s.reason||Error('aborted');demand(!disposed,'disposed');};
 demand(natural(indexLimit)&&indexLimit>=1&&indexLimit<=4&&d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256,'descriptor/cache identity');
 const stats={indexLoads:0,lookups:0,found:0,absent:0,peakIndexBytes:0};
 async function read(ref,cap,s){live(s);demand(hex(ref.sha256)&&natural(ref.bytes)&&ref.bytes>0&&ref.bytes<=cap&&typeof ref.file==='string'&&ref.file.startsWith(base)&&/^[a-f0-9]{64}\.(manifest|index)\.gz$/.test(ref.file.slice(base.length)),'asset descriptor');const response=await fetcher(ref.file,{signal:s||signal});demand(response.ok,'asset unavailable ('+response.status+')');const reader=response.body.pipeThrough(new host.DecompressionStream('gzip')).getReader(),chunks=[];let size=0;
  try{while(true){live(s);const part=await reader.read();if(part.done)break;size+=part.value.byteLength;demand(size<=ref.bytes,'asset byte bound');chunks.push(part.value);}}catch(error){await reader.cancel(error).catch(()=>{});throw error;}finally{reader.releaseLock();}
  demand(size===ref.bytes,'decoded size');const bytes=new Uint8Array(size);let at=0;for(const b of chunks){bytes.set(b,at);at+=b.byteLength;}demand(await A.digest(bytes)===ref.sha256,'asset hash');live(s);return freeze(JSON.parse(new TextDecoder().decode(bytes)));
 }
 const manifest=await read(d,262144,signal);live();
 demand(manifest.format==='ProofAtlasTypeQueryPages/1'&&manifest.source?.name===record.name&&manifest.source.indexSha256===record.indexSha256&&manifest.source.sourceSha256===record.sourceSha256&&manifest.observations===d.observations&&natural(d.observations)&&d.observations>0&&d.observations<=4096&&Array.isArray(manifest.tables)&&manifest.tables.length>0&&manifest.tables.length<=8,'manifest identity/bounds');
 function indexRef(ref){demand(ref&&hex(ref.sha256)&&natural(ref.level)&&ref.level<=4&&natural(ref.count)&&ref.count>0&&ref.count<=4096&&typeof ref.min==='string'&&typeof ref.max==='string'&&ref.min<=ref.max&&ref.min.length<=87500&&ref.max.length<=87500&&ref.file===base+ref.sha256+'.index.gz','index reference');}
 indexRef(manifest.index);demand(manifest.index.count===manifest.observations,'root count');
 for(const table of manifest.tables)demand(hex(table.typeTableSha256)&&hex(table.evidenceSha256)&&hex(table.sha256)&&natural(table.nodes)&&table.nodes>0&&table.nodes<=65536&&natural(table.bytes)&&table.bytes>0&&table.bytes<=262144&&table.file==='/public/data/proof-atlas/type-pages/'+table.typeTableSha256+'/'+table.sha256+'.manifest.gz','table descriptor');
 async function index(ref,s){
  live(s);indexRef(ref);let value;
  if(cache.has(ref.sha256)){const entry=cache.get(ref.sha256);demand(entry.bytes===ref.bytes,'cached index size');cache.delete(ref.sha256);cache.set(ref.sha256,entry);value=entry.value;}
  else{value=await read(ref,131072,s);live(s);if(cache.size===indexLimit)cache.delete(cache.keys().next().value);cache.set(ref.sha256,{value,bytes:ref.bytes});stats.indexLoads++;stats.peakIndexBytes=Math.max(stats.peakIndexBytes,[...cache.values()].reduce((sum,p)=>sum+p.bytes,0));}
  demand(value.format==='ProofAtlasTypeQueryIndex/1'&&value.level===ref.level,'index level');const entries=value.level?value.children:value.rows;
  demand(Array.isArray(entries)&&entries.length>0&&entries.length<=(value.level?32:16),'index shape');
  for(let i=0;i<entries.length;i++){const e=entries[i];if(value.level){indexRef(e);demand(e.level===ref.level-1&&(!i||entries[i-1].max<e.min),'branch order');}
   else{demand(e.key===key(e.route)&&natural(e.node)&&['proof','type','value'].includes(e.role)&&typeof e.origin==='string'&&e.origin.length<128&&natural(e.table)&&e.table<manifest.tables.length&&e.observation&&hex(e.observation.sha256)&&natural(e.observation.bytes)&&e.observation.bytes>0&&e.observation.bytes<=65536&&(!i||entries[i-1].key<e.key),'leaf order/observation');const table=manifest.tables[e.table];demand(e.observation.file==='/public/data/proof-atlas/type-pages/'+table.typeTableSha256+'/'+e.observation.sha256+'.observation.gz','observation address');}
  }
  demand((value.level?entries[0].min:entries[0].key)===ref.min&&(value.level?entries.at(-1).max:entries.at(-1).key)===ref.max,'index range');
  demand((value.level?entries.reduce((s,c)=>s+c.count,0):entries.length)===ref.count,'index count');return value;
 }
 async function lookup(route,{signal:s}={}){
  const wanted=key(route);stats.lookups++;let ref=manifest.index;
  while(true){const value=await index(ref,s);live(s);if(wanted<ref.min||wanted>ref.max){stats.absent++;return null;}
   if(value.level){const next=value.children.find(e=>wanted>=e.min&&wanted<=e.max);if(!next){stats.absent++;return null;}ref=next;continue;}
   const row=value.rows.find(e=>e.key===wanted);if(!row){stats.absent++;return null;}stats.found++;issued.add(row);return row;
  }
 }
 async function page({offset=0,limit=16,signal:s}={}){
  demand(natural(offset)&&offset<=manifest.observations&&natural(limit)&&limit>=1&&limit<=20,'position page bounds');const rows=[];
  async function visit(ref,start){if(start>=offset+limit||start+ref.count<=offset)return;const value=await index(ref,s);live(s);if(!value.level){for(const [i,row]of value.rows.entries())if(start+i>=offset&&start+i<offset+limit){issued.add(row);rows.push(row);}return;}let at=start;for(const child of value.children){await visit(child,at);at+=child.count;}}
  await visit(manifest.index,0);return freeze({offset,total:manifest.observations,rows});
 }
 async function selected(row,{signal:s,pageLimit=8}={}){
  live(s);demand(issued.has(row),'foreign route row');const cursor=await TP.open(manifest.tables[row.table],{fetcher,signal:s||signal,pageLimit});
  try{live(s);const observation=await cursor.observation(row.observation,{signal:s});live(s);demand(key(observation.sourceRoute)===row.key&&observation.sourceNode===row.node&&observation.role===row.role&&observation.origin.recording?.kind===row.origin,'route observation mismatch');return Object.freeze({cursor,observation});}catch(error){cursor.dispose();throw error;}
 }
 return Object.freeze({manifest,lookup,page,selected,state:()=>({...stats,indexPages:cache.size,indexLimit,decodedIndexBytes:[...cache.values()].reduce((sum,p)=>sum+p.bytes,0)}),dispose:()=>{disposed=true;cache.clear();}});
}
const api={open,key};if(node)module.exports=api;else host.ProofAtlasTypeQueryPages=api;
})(typeof window==='undefined'?globalThis:window);
