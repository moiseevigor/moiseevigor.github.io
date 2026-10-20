'use strict';
const A=require('../public/js/proof-atlas-library-data'),B=require('../public/js/proof-atlas-library-bytes'),assert=require('assert/strict'),z=require('zlib');
(async()=>{
 const original=global.fetch,raw=Buffer.from('{ "z": 1,\n "a": [2,3] }\n'),hash=await A.digest(raw),packed=z.gzipSync(raw);let loads=0,rejections=0;
 global.fetch=async()=>{loads++;return new Response(packed);};
 async function refuse(action){await assert.rejects(action);rejections++;}
 try{
  const bytes=await B.compressedBytes('/test',hash,{maxBytes:raw.length,expectedBytes:raw.length});assert.deepEqual(Buffer.from(bytes),raw);
  assert.deepEqual(await A.compressed('/test',hash,{maxBytes:raw.length}),JSON.parse(raw));
  await refuse(()=>B.compressedBytes('/test',hash,{maxBytes:raw.length-1}));
  await refuse(()=>B.compressedBytes('/test',hash,{maxBytes:raw.length,expectedBytes:raw.length-1}));
  await refuse(()=>B.compressedBytes('/test','0'.repeat(64),{maxBytes:raw.length}));
  await refuse(()=>B.compressedBytes('/test',hash,{maxBytes:67108865}));
  const abort=new AbortController();abort.abort();const before=loads;await refuse(()=>B.compressedBytes('/test',hash,{signal:abort.signal,maxBytes:raw.length}));assert.equal(loads,before);
  global.fetch=async()=>new Response('',{status:404});await refuse(()=>B.compressedBytes('/test',hash,{maxBytes:raw.length}));
  global.fetch=async()=>new Response(Buffer.from('invalid gzip'));await refuse(()=>B.compressedBytes('/test',hash,{maxBytes:raw.length}));
  console.log(JSON.stringify({status:'PASS',originalBytesPreserved:true,jsonWrapperCompatible:true,decodedSizeAndHashChecked:true,preAbortedDoesNotFetch:true,rejections}));
 }finally{global.fetch=original;}
})().catch(e=>{console.error(e);process.exit(1);});
