'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const pages=require('../../../public/js/proof-atlas-source-pages');
const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');
const locate=require('./locate-indexed-use.cjs');
const encoded=fs.readFileSync(process.argv[2]);
const index=JSON.parse(encoded);
const {record,descriptor,weightsSha256,checks}=JSON.parse(fs.readFileSync(process.argv[3]));
assert.equal(require('node:crypto').createHash('sha256').update(encoded).digest('hex'),weightsSha256);
const folder=descriptor.file.slice(0,descriptor.file.lastIndexOf('/')+1);
(async()=>{
 const results=[];
 for(const oracle of checks){
  let bytes=0;
  const fetcher=async file=>{
   assert(file.startsWith(folder));
   const raw=await fs.promises.readFile('.'+file);bytes+=raw.length;
   return new Response(raw);
  };
  const cursor=await pages.open(descriptor,record,{fetcher});
  try{
   const binder=index.binders.find(b=>b.node===oracle.binder);
   const use=await locate(cursor,index,binder,BigInt(oracle.rank),countReferences);
   assert.deepEqual(use,{node:oracle.node,slots:oracle.slots});
   const stats=cursor.state();
   assert(stats.peakCachedNodes<=4096);
   results.push({binder:binder.name,rank:oracle.rank,pages:stats.pageLoads,peakRows:stats.peakCachedNodes,bytes});
  }finally{cursor.dispose();}
 }
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
