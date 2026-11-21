// Separate reader process. Only the small control and hash-addressed pages are accessible.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pages=require('../../../public/js/proof-atlas-source-pages');
const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');
const folder=process.argv[2],depth=Number(process.argv[3]),total=1n<<BigInt(depth);
const control=JSON.parse(fs.readFileSync(path.join(folder,'control.json')));
const {record,regions,bodySlots,descriptor}=control;
const ends=[];let sum=0n;
for(const region of regions){sum+=BigInt(region.count);ends.push(sum);}
assert.equal(sum,total);
async function lookup(rank){
 let lo=0,hi=ends.length-1,compressedBytes=0;
 while(lo<hi){const mid=Math.floor((lo+hi)/2);if(ends[mid]<rank)lo=mid+1;else hi=mid;}
 const local=rank-(lo?ends[lo-1]:0n),r=regions[lo];
 const fetcher=async file=>{
  assert.match(file,/^[0-9a-f]{64}(?:\.json)?\.gz$/);
  const raw=await fs.promises.readFile(path.join(folder,file));
  compressedBytes+=raw.length;return new Response(raw);
 };
 const cursor=await pages.open(descriptor,record,{fetcher,pageLimit:16,indexLimit:4});
 try{
  const route=bodySlots.concat(r.slots);
  assert.equal((await cursor.resolveRoute({root:0,slots:route})).node,r.node);
  const result=await cursor.run(()=>countReferences(cursor.data,r.node,r.index,{ordinal:local,useSupport:false,maxStates:8192}));
  assert.equal(result.occurrences,r.count);
  const suffix=r.slots.concat(result.witness.slots);
  const oracle=[...(rank-1n).toString(2).padStart(depth,'0')].flatMap(b=>b==='0'?[0,1]:[1]).concat(2);
  assert.deepEqual(suffix,oracle);
  const slots=bodySlots.concat(suffix);
  const use=await cursor.resolveRoute({root:0,slots});
  assert.equal(use.node,result.witness.node);
  // The let value is OfNat.ofNat Nat <literal> <instance>; read its literal input.
  const tag=await cursor.resolveRoute({root:0,slots:slots.slice(0,-1).concat(1,0,1)});
  assert.equal(await cursor.run(()=>cursor.data.payloads[tag.node].value),String(rank-1n));
  const stats=cursor.state();assert(stats.peakCachedNodes<=4096);
  return {rank:String(rank),pageLoads:stats.pageLoads,peakCachedRows:stats.peakCachedNodes,compressedBytes};
 }finally{cursor.dispose();}
}
(async()=>{
 const ranks=[1n,2n,ends[0],ends[0]+1n,total/2n,total/2n+1n,total-1n,total];
 for(const rank of new Set(ranks))console.log(await lookup(rank));
})().catch(err=>{console.error(err);process.exitCode=1;});
