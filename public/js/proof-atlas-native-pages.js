/* Query pages retain original native provenance; type graphs have separate fixed bounds. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes,E=node?require('./proof-atlas-elimination'):host.ProofAtlasElimination,B=node?require('./proof-atlas-beta-reduction'):host.ProofAtlasBetaReduction,Z=node?require('./proof-atlas-let-reduction'):host.ProofAtlasLetReduction;
const demand=(x,m)=>{if(!x)throw Error('Native pages: '+m);},hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),routeKey=r=>{demand(Number.isInteger(r?.root)&&r.root>=0&&r.root<=2147483647&&Array.isArray(r.slots)&&r.slots.length<=512&&r.slots.every(x=>Number.isInteger(x)&&x>=0&&x<=2),'route');return r.root+':'+r.slots.join('');};
class MissingNative extends Error{constructor(kind,provider,ref,level=null){super('Native '+kind+' is not resident');Object.assign(this,{kind,provider,ref,level});}}
async function open(descriptor,data,record,{signal,queryLimit=128,byteLimit=16777216,indexLimit=16,expectedDescriptors}={}){
 const base=descriptor.file?.slice(0,descriptor.file.lastIndexOf('/')+1);demand(base?.startsWith('/public/data/proof-atlas/native-query-pages/'),'asset base');
 async function read(d,cap,s){demand(d&&hex(d.sha256)&&Number.isInteger(d.bytes)&&d.bytes>0&&d.bytes<=cap,'asset descriptor');return A.compressed(d===descriptor?descriptor.file:base+d.sha256+'.gz',d.sha256,{maxBytes:cap,expectedBytes:d.bytes,signal:s});}
 const live=s=>{if(signal?.aborted||s?.aborted)throw signal?.reason||s.reason||Error('aborted');demand(!disposed,'disposed');};let disposed=false,queue=Promise.resolve();
 demand(Number.isInteger(queryLimit)&&queryLimit>=1&&queryLimit<=256&&Number.isInteger(byteLimit)&&byteLimit>=2097152&&byteLimit<=16777216&&Number.isInteger(indexLimit)&&indexLimit>=1&&indexLimit<=16,'cache bounds');
 live();const m=await read(descriptor,1048576,signal);live();demand(m.format==='NativeQueryPages/1'&&m.edition===descriptor.edition&&descriptor.name===record.name&&descriptor.indexSha256===record.indexSha256&&descriptor.sourceSha256===record.sourceSha256&&m.record.name===record.name&&m.record.indexSha256===record.indexSha256&&m.record.sourceSha256===record.sourceSha256&&Array.isArray(m.providers)&&m.providers.length>0&&m.providers.length<=4,'manifest identity');
 if(expectedDescriptors)demand(JSON.stringify(m.providers.map(p=>({kind:p.kind,descriptor:p.descriptor})))===JSON.stringify(expectedDescriptors),'original descriptor inventory');
 const queries=new Map(),indices=new Map(),models=[],stats={loads:0,evictions:0,decodedBytes:0,peakQueries:0,peakBytes:0,indexLoads:0};
 const touch=(map,k)=>{const v=map.get(k);map.delete(k);map.set(k,v);return v;};
 const providers={};
 function rebuild(p,row){
  const evidence={...p.header,typeGraph:p.graph,entries:[row.entry]};let result;
  if(p.kind==='primary'){T.validate(evidence,data,record);const idx=T.indexObservations(evidence,data);result={get:r=>idx.lookup.get(r.root+':'+r.slots.join('.')),getQuery:r=>idx.entries.get(r.root+':'+r.slots.join('.'))};}
  else if(p.kind==='case')result=E.provider(evidence,data,record,p.descriptor.sha256,p.descriptor.file);
  else if(p.kind==='beta')result=B.provider(evidence,data,record,p.descriptor.sha256,p.descriptor.file);
  else{T.validate(evidence,data,record);const entry={...row.entry,typeGraph:p.graph};if(entry.status==='checked')Z.validateMetadata(entry,data,p.graph);let visible=entry;if(p.descriptor.storage==='bounded-result-pools/1'&&entry.status==='checked'){visible={...entry,letReduction:{status:'available',storage:'bounded-result-pools/1'}};delete visible.letJudgment;}const idx=Z.indexPremises([entry],data,[visible]);result={get:idx.get,getQuery:idx.getQuery};}
  return result;
 }
 function lookup(p,which,route){live();const key=routeKey(route);let at=p[which];if(!at)return undefined;
  while(true){const cacheKey=at.sha256;if(!indices.has(cacheKey))throw new MissingNative('index',p,at,at.level);const cached=touch(indices,cacheKey),v=cached.value;demand(cached.bytes===at.bytes,'cached index decoded size');demand(v.level===at.level&&(v.level?v.children[0].min:v.rows[0][0])===at.min&&(v.level?v.children.at(-1).max:v.rows.at(-1)[0])===at.max,'cached index range');if(key<at.min||key>at.max)return undefined;
   if(v.level===0){const row=v.rows.find(row=>row[0]===key);if(!row)return undefined;const id=row[1];demand(p.queries[id],'index query address');const cacheKey=p.kind+'/'+p.descriptor.sha256+'/'+id;if(!queries.has(cacheKey))throw new MissingNative('query',p,p.queries[id]);const q=touch(queries,cacheKey);if(!q.prepared)q.prepared=rebuild(p,q.value);const e=q.prepared[which]?.(route);demand(e&&routeKey(e.route)===key,'recipe reconstruction');return e;}
   at=v.children.find(c=>key>=c.min&&key<=c.max);if(!at)return undefined;at={...at,level:v.level-1};
  }
 }
 for(const p of m.providers){
  demand(['primary','case','beta','let'].includes(p.kind)&&!providers[p.kind]&&p.descriptor.name===record.name&&p.descriptor.indexSha256===record.indexSha256&&p.descriptor.sourceSha256===record.sourceSha256&&hex(p.descriptor.sha256)&&Array.isArray(p.queries)&&p.queries.length>0&&p.queries.length<=512,'provider identity');
  demand(p.descriptor.edition===m.edition&&p.header&&p.header.source?.edition===m.edition&&!Object.hasOwn(p.header,'entries')&&!Object.hasOwn(p.header,'typeGraph')&&new TextEncoder().encode(JSON.stringify(p.header)).length<=262144&&p.methods&&typeof p.methods.getQuery==='boolean','native header');
  for(const q of p.queries){demand(hex(q.sha256)&&Number.isInteger(q.bytes)&&q.bytes>0&&q.bytes<=2097152&&q.route?.root<data.roots.length,'query descriptor');routeKey(q.route);}
  for(const root of [p.get,p.getQuery])if(root)demand(hex(root.sha256)&&Number.isInteger(root.bytes)&&root.bytes>0&&root.bytes<=131072&&Number.isInteger(root.level)&&root.level>=0&&root.level<=4&&typeof root.min==='string'&&typeof root.max==='string'&&root.min<=root.max,'index root');
  demand(p.get&&Boolean(p.getQuery)===p.methods.getQuery,'lookup methods');
  const graph=await read(p.graph,16777216,signal);live();T.validate({...p.header,typeGraph:graph,entries:[]},data,record);live();const model={...p,graph,graphBytes:p.graph.bytes};models.push(model);const api={source:p.header.source,sha256:p.descriptor.sha256,file:p.descriptor.file,get:r=>lookup(model,'get',r),argument:(r,a)=>lookup(model,'get',r)?.arguments?.find(x=>routeKey(x.route)===routeKey(a))};if(p.methods.getQuery)api.getQuery=r=>lookup(model,'getQuery',r);providers[p.kind]=api;
 }
 async function load(error,s){live(s);const {provider:p,ref}=error;
  if(error.kind==='index'){
   const v=await read(ref,131072,s||signal);live(s);demand(v.format==='NativeQueryIndex/1'&&v.level===error.level&&Number.isInteger(v.level)&&v.level>=0&&v.level<=4,'index level');let min,max;
   if(!v.level){demand(Array.isArray(v.rows)&&v.rows.length>0&&v.rows.length<=64&&v.rows.every((r,i)=>Array.isArray(r)&&r.length===2&&typeof r[0]==='string'&&/^(0|[1-9]\d*):[012]*$/.test(r[0])&&Number.isInteger(r[1])&&r[1]>=0&&r[1]<p.queries.length&&(!i||v.rows[i-1][0]<r[0])),'index rows');min=v.rows[0][0];max=v.rows.at(-1)[0];}
   else{demand(Array.isArray(v.children)&&v.children.length>0&&v.children.length<=32&&v.children.every((c,i)=>hex(c.sha256)&&Number.isInteger(c.bytes)&&c.bytes>0&&c.bytes<=131072&&typeof c.min==='string'&&typeof c.max==='string'&&c.min<=c.max&&(!i||v.children[i-1].max<c.min)),'index children');min=v.children[0].min;max=v.children.at(-1).max;}
   demand(min===ref.min&&max===ref.max,'index range');if(indices.size===indexLimit)indices.delete(indices.keys().next().value);indices.set(ref.sha256,{value:v,bytes:ref.bytes});stats.indexLoads++;
  }else{
   const v=await read(ref,2097152,s||signal);live(s);demand(v.format==='NativeQueryRecord/1'&&v.nativeSha256===p.descriptor.sha256&&Number.isInteger(v.id)&&v.id>=0&&v.id<p.queries.length&&p.queries[v.id].sha256===ref.sha256&&routeKey(v.entry.route)===routeKey(ref.route),'query identity');
   while(queries.size>=queryLimit||stats.decodedBytes+ref.bytes>byteLimit){const k=queries.keys().next().value;demand(k!==undefined,'query byte bound');stats.decodedBytes-=queries.get(k).bytes;queries.delete(k);stats.evictions++;}queries.set(p.kind+'/'+p.descriptor.sha256+'/'+v.id,{value:v,bytes:ref.bytes,prepared:null});stats.decodedBytes+=ref.bytes;stats.loads++;stats.peakQueries=Math.max(stats.peakQueries,queries.size);stats.peakBytes=Math.max(stats.peakBytes,stats.decodedBytes);
  }
 }
 function run(fn,options={}){const task=async()=>{live(options.signal);for(let attempt=0;attempt<512;attempt++)try{const value=await fn();live(options.signal);return value;}catch(e){live(options.signal);if(!(e instanceof MissingNative))throw e;await load(e,options.signal);}throw Error('Native pages: retry limit; evidence working set exceeds the cache bound.');};const result=queue.then(task,task);queue=result.catch(()=>{});return result;}
 live();return{providers,manifest:m,run,state:()=>({...stats,source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},manifestSha256:descriptor.sha256,cachedQueries:queries.size,indexPages:indices.size,queryLimit,byteLimit,indexLimit,typeNodeLimit:65536,typeGraphByteLimit:16777216,typeGraphs:models.filter(p=>p.graph).length,typeNodes:models.reduce((sum,p)=>sum+(p.graph?.kind.length||0),0),typeDecodedBytes:models.reduce((sum,p)=>sum+(p.graph?p.graphBytes:0),0)}),dispose:()=>{disposed=true;queries.clear();indices.clear();for(const p of models)p.graph=null;stats.decodedBytes=0;}};
}
const api={open,routeKey};if(node)module.exports=api;else host.ProofAtlasNativePages=api;

})(typeof window==='undefined'?globalThis:window);
