// Run on a local library page with the prepared packet pages served at base.
module.exports=async function checkPagedTagged(base,depth){
 const control=await (await fetch(base+'control.json')).json();
 const {descriptor,record,regions,bodySlots}=control;
 const total=1n<<BigInt(depth),results=[];
 const ensure=(ok,msg)=>{if(!ok)throw Error(msg);};
 for(const rank of [1n,total/2n,total/2n+1n,total]){
  let ordinal=rank;
  const region=regions.find(r=>{
   if(ordinal<=BigInt(r.count))return true;
   ordinal-=BigInt(r.count);return false;
  });
  let bytes=0;
  const fetcher=async file=>{
   ensure(file.startsWith(base)&&/^[a-f0-9]{64}(?:\.json)?\.gz$/.test(file.slice(base.length)),'Unexpected source fetch');
   const response=await fetch(file,{cache:'no-store'});ensure(response.ok,'Missing page');
   const raw=await response.arrayBuffer();bytes+=raw.byteLength;return new Response(raw);
  };
  const cursor=await window.ProofAtlasSourcePages.open({...descriptor,file:base+descriptor.file},record,{fetcher});
  try{
   const resolved=await cursor.resolveRoute({root:0,slots:bodySlots.concat(region.slots)});
   ensure(resolved.node===region.node,'Source region mismatch');
   const result=await cursor.run(()=>window.ProofAtlasRecursiveInputs.countReferences(cursor.data,region.node,
    region.index,{ordinal,useSupport:false,maxStates:8192}));
   const suffix=region.slots.concat(result.witness.slots);
   const bits=(rank-1n).toString(2).padStart(depth,'0');
   ensure(String(suffix)===String([...bits].flatMap(b=>b==='0'?[0,1]:[1]).concat(2)),'Rank path mismatch');
   const target=await cursor.resolveRoute({root:0,slots:bodySlots.concat(suffix)});
   ensure(target.node===result.witness.node,'Source target mismatch');
   const stats=cursor.state();ensure(stats.peakCachedNodes<=4096,'Source cache limit exceeded');
   results.push({rank:String(rank),sourcePageLoads:stats.pageLoads,peakCachedRows:stats.peakCachedNodes,compressedBytes:bytes});
  }finally{cursor.dispose();}
 }
 return results;
};
