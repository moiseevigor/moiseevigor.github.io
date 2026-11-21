// Compare compressed payload bytes across a deterministic sequence with one source cursor.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const pages=require('../../../public/js/proof-atlas-source-pages');
const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');
const {pack,open}=require('./weight-profiles.cjs'),locate=require('./locate-indexed-use.cjs');
const raw=fs.readFileSync(process.argv[2]);
const {record,descriptor,weightsSha256,checks}=JSON.parse(fs.readFileSync(process.argv[3]));
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),weightsSha256);
const original=JSON.parse(raw),packed=pack(original);
const encoded=z.gzipSync(JSON.stringify(packed)),index=open(JSON.parse(z.gunzipSync(encoded)));
let node=0,rows=0;
for(const [delta,id] of packed.rows){
 node+=delta;
 for(const [depth,count] of packed.profiles[id]){
  assert.equal(index.weightAt(node,depth),BigInt(original.weights[node+'/'+depth]));
  assert.equal(count,original.weights[node+'/'+depth]);rows++;
 }
}
assert.equal(rows,Object.keys(original.weights).length);
if(process.argv[4])fs.writeFileSync(process.argv[4],encoded);
(async()=>{
 const seen=new Set(),series=[];
 let source=0,unique=0;
 const folder=descriptor.file.slice(0,descriptor.file.lastIndexOf('/')+1);
 const cursor=await pages.open(descriptor,record,{fetcher:async file=>{
  assert(file.startsWith(folder));
  const bytes=fs.readFileSync('.'+file);source+=bytes.length;
  if(!seen.has(file)){seen.add(file);unique+=bytes.length;}
  return new Response(bytes);
 }});
 try{
  for(const q of checks){
   const binder=index.binders.find(b=>b.node===q.binder);
   const use=await locate(cursor,index,binder,BigInt(q.rank),countReferences);
   assert.deepEqual(use,{node:q.node,slots:q.slots});
   series.push({query:series.length+1,binder:binder.name,rank:q.rank,bytes:encoded.length+source,uniqueBytes:encoded.length+unique});
  }
 }finally{cursor.dispose();}
 const full=fs.statSync('.'+record.indexFile).size;
 console.log(JSON.stringify({format:packed.format,storedWeights:rows,nodeRows:packed.rows.length,profiles:packed.profiles.length,
  packedGzip:encoded.length,originalGzip:z.gzipSync(raw).length,full,series},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
