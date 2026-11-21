// Partition complete calls by their enclosing binder, using reverse structural edges.
'use strict';
module.exports=function receiverScopes(g){
 const root=g.roots[1],multiplicity=new Map([[root,1n]]),parents=new Map();
 for(let node=root;node>=0;node--){
  if(!multiplicity.has(node))continue;
  const count=multiplicity.get(node);
  for(const [slot,child] of g.children[node].entries()){
   multiplicity.set(child,(multiplicity.get(child)||0n)+count);
   if(!parents.has(child))parents.set(child,[]);
   parents.get(child).push({node,slot});
  }
 }
 return function partition(receiver,index){
  // One path suffix ends when its remaining de Bruijn index reaches a binder body edge.
  const states=new Map([[receiver,new Map([[index,1n]])]]),binders=new Map();
  const pending=[receiver],seen=new Set(pending);
  // Discover row order once for this query; no expanded occurrence paths are stored.
  while(pending.length){
   const child=pending.pop();
   for(const {node} of parents.get(child)||[]){
    if(!seen.has(node)){seen.add(node);pending.push(node);}
   }
  }
  for(const child of [...seen].sort((a,b)=>a-b)){
   const local=states.get(child);
   if(!local)continue;
   for(const {node,slot} of parents.get(child)||[]){
    const kind=g.kind[node];
    if(child===receiver && kind===5 && slot===0)continue;
    const binds=(kind===6||kind===7)?slot===1:kind===8&&slot===2;
    for(const [left,count] of local){
     if(binds && left===0){
      binders.set(node,(binders.get(node)||0n)+count);continue;
     }
     if(!states.has(node))states.set(node,new Map());
     const next=states.get(node),remaining=left-Number(binds);
     next.set(remaining,(next.get(remaining)||0n)+count);
    }
   }
   states.delete(child);
  }
  let total=0n,instances=0n;
  for(const [binder,count] of binders){
   total+=multiplicity.get(binder)*count;
   instances+=multiplicity.get(binder);
  }
  return {binders,total,instances};
 };
};
