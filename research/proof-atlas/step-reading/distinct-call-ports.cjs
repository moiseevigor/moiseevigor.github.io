// Count complete call occurrences in the proof body and select distinct direct bvar ports.
'use strict';
module.exports=function distinctCallPorts(g,limit){
 const root=g.roots[1],paths=new Map([[root,null]]),complete=new Map(),counts=new Map([[root,1n]]);
 if(g.kind[root]===5)complete.set(root,{count:1n,path:null});
 // Every incoming edge originates in a higher row. Its final multiplicity is known here.
 for(let node=root;node>=0;node--){
  if(!paths.has(node))continue;
  const count=counts.get(node),parent=paths.get(node);
  for(const [slot,child] of g.children[node].entries()){
   const path={parent,slot};
   if(!paths.has(child))paths.set(child,path);
   counts.set(child,(counts.get(child)||0n)+count);
   if(g.kind[child]!==5 || (g.kind[node]===5 && slot===0))continue;
   if(!complete.has(child))complete.set(child,{count:0n,path});
   complete.get(child).count+=count;
  }
 }
 const ports=[];
 let globallySingle=0,expanded=0n;
 for(const [node,entry] of [...complete].sort(([a],[b])=>a-b)){
  let fn=node,depth=0;
  const args=[];
  while(g.kind[fn]===5){
   const [head,arg]=g.children[fn];
   if(g.kind[arg]===0)args.push({zeros:depth,argument:true});
   depth++;fn=head;
  }
  if(g.kind[fn]===0)args.push({zeros:depth,argument:false});
  for(const port of args.reverse()){
   ports.push({node,entry,...port});expanded+=entry.count;
   if(entry.count===1n)globallySingle++;
  }
 }
 const samples=Math.min(limit,ports.length),routes=[];
 for(let i=0;i<samples;i++){
  const p=ports[Math.floor((2*i+1)*ports.length/(2*samples))],slots=[];
  for(let at=p.entry.path;at;at=at.parent)slots.push(at.slot);
  slots.reverse();const callLength=slots.length;
  slots.push(...Array(p.zeros).fill(0));if(p.argument)slots.push(1);
  routes.push({slots,callLength,callNode:p.node,upper:p.entry.count});
 }
 return {routes,distinct:ports.length,globallySingle,expanded:String(expanded)};
};
