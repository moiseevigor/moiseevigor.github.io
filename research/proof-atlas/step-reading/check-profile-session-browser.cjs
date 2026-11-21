// Evaluate in local Chrome with immutable source pages and /profile-index.gz.
module.exports=async function(locate,open,record,descriptor,checks,policy){
 const fetcher=url=>fetch(url,{cache:policy});
 const r=await fetcher('/profile-index.gz');
 const decoded=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
 const index=open(decoded),cursor=await ProofAtlasSourcePages.open(descriptor,record,{fetcher});
 try{for(const q of checks){
 const use=await locate(cursor,index,index.binders.find(b=>b.node===q.binder),BigInt(q.rank),ProofAtlasRecursiveInputs.countReferences);
 if(use.node!==q.node||String(use.slots)!==String(q.slots))throw Error('Oracle mismatch');
 }return cursor.state().peakCachedNodes;}finally{cursor.dispose();}
};
