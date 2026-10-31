/* Finite source-reference coefficients, separately owned from kernel typing. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
const base='/public/data/proof-atlas/binder-support/';
const demand=(ok,message)=>{if(!ok)throw Error('Binder references: '+message);};
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const count=s=>typeof s==='string'&&s.length<=4096&&/^(0|[1-9]\d*)$/.test(s);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function validate(m,d){
 demand(m.format==='ProofAtlasBinderSupport/1'&&m.id===d.id&&m.nativeCaseSha256===d.nativeCaseSha256&&m.nativeInventorySha256===d.nativeInventorySha256,'native owner');
 demand(['edition','name','indexSha256','sourceSha256'].every(k=>m.source[k]===d.source[k]),'source owner');
 const original=m.sourceProjection?.frames;
 demand(Array.isArray(original)&&original.length>0&&original.length<=128,'original frames');
 for(const key of ['sourceProjection','normalProjection']){
  const p=m[key];demand(p&&p.frames.length===original.length,'frame count');
  const seen=new Set(),order=[];let path=[];
  function field(f){
   demand(f&&count(f.occurrences)&&BigInt(f.occurrences)>0n&&count(f.localReferences)&&Array.isArray(f.references)&&f.references.length<=128,'field counts');
   const targets=new Set();let total=BigInt(f.localReferences);
   for(const r of f.references){demand(seen.has(r.binder)&&!targets.has(r.binder)&&count(r.count)&&BigInt(r.count)>0n,'lexical target');targets.add(r.binder);total+=BigInt(r.count);}
   demand(total<=BigInt(f.occurrences),'reference accounting');
   demand(Array.isArray(f.free)&&f.free.length===f.references.length,'free coefficients');
   const mapped=f.free.map(r=>{demand(Number.isInteger(r.index)&&r.index>=0&&r.index<order.length&&count(r.count)&&BigInt(r.count)>0n,'free index');return{binder:order[order.length-1-r.index],count:r.count};}).sort((a,b)=>a.binder-b.binder);
   demand(same(mapped,f.references),'coefficient to binder mapping');
  }
  p.frames.forEach((f,i)=>{
   demand(Number.isInteger(f.binder)&&f.binder>=0&&f.binder<original.length&&!seen.has(f.binder)&&f.ordinal===i&&['lam','letE'].includes(f.kind)&&same(f.path,path),'original identity / ordered spine');
   demand(key!=='sourceProjection'||f.binder===i,'source ordinal');
   demand(typeof f.name==='string'&&f.name===original[f.binder].name,'binder label');field(f.domain);
   if(f.kind==='letE')field(f.value);else demand(f.value===undefined,'input has no defining value');
   seen.add(f.binder);order.push(f.binder);path=[...path,f.kind==='letE'?2:1];
  });
  demand(same(p.tailPath,path),'remaining body path');field(p.tail);
 }
 return m;
}
async function open(input,{fetcher=host.fetch.bind(host),signal}={}){
 const d=freeze(JSON.parse(JSON.stringify(input)));
 demand(hex(d.sha256)&&hex(d.nativeCaseSha256)&&hex(d.nativeInventorySha256)&&Number.isSafeInteger(d.bytes)&&d.bytes>0&&d.bytes<=131072&&d.file===base+d.sha256+'.json.gz','descriptor');
 const response=await fetcher(d.file,{signal});demand(response.ok,'unavailable ('+response.status+')');
 const reader=response.body.pipeThrough(new host.DecompressionStream('gzip')).getReader(),parts=[];let size=0;
 try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.byteLength;demand(size<=d.bytes,'decoded byte bound');parts.push(p.value);}}catch(e){await reader.cancel(e).catch(()=>{});throw e;}finally{reader.releaseLock();}
 demand(!signal?.aborted&&size===d.bytes,'cancelled or incomplete');const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}
 demand(await A.digest(bytes)===d.sha256,'content hash');demand(!signal?.aborted,'cancelled');
 return freeze(validate(JSON.parse(new TextDecoder().decode(bytes)),d));
}
const api={open,validate};if(node)module.exports=api;else host.ProofAtlasBinderSupport=api;
})(typeof window==='undefined'?globalThis:window);
