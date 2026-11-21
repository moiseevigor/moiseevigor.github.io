// Uses only the source cursor, a scoped-count index and the requested binder/rank.
module.exports=async function locate(cursor,index,binder,rank,countReferences){
 if(cursor.record.indexSha256!==index.indexSha256)throw Error('Wrong source packet');
 if(rank<1n||rank>BigInt(binder.count))throw RangeError('Rank outside binder');
 const g=cursor.data,slots=binder.slots.slice(),root=1;
 const owner=await cursor.resolveRoute({root,slots});
 if(owner.node!==binder.node || owner.kind!==6)throw Error('Binder mismatch');
 slots.push(1);
 let id=await cursor.run(()=>g.children[owner.node][1]),depth=0;
 async function weight(node,target){
  return cursor.run(()=>{
   if(g.neededScope[node]<=target)return 0n;
   if(BigInt(g.expanded[node])>BigInt(index.cutoff)){
    const stored=index.weights[node+'/'+target];
    return BigInt(stored??0);
   }
   const result=countReferences(g,node,target,{useSupport:false,maxStates:index.cutoff});
   if(result.status!=='counted')throw Error('Local count unavailable');
   return BigInt(result.occurrences);
  });
 }
 while(true){
  const {kind,children}=await cursor.run(()=>({kind:g.kind[id],children:g.children[id]}));
  if(kind===0){
   if(rank!==1n||await cursor.run(()=>g.payloads[id].index)!==depth)throw Error('Incorrect reference target');
   return {node:id,slots};
  }
  let selected=false;
  for(const [s,child] of children.entries()){
   const next=depth+Number((kind===6||kind===7)&&s===1||kind===8&&s===2);
   if(s+1<children.length){
    const size=await weight(child,next);
    if(rank>size){rank-=size;continue;}
   }
   slots.push(s);depth=next;id=child;selected=true;break;
  }
  if(!selected)throw Error('Child counts do not cover rank');
 }
};
