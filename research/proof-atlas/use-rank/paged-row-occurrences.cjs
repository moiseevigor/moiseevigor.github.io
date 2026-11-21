'use strict';
const pages=require('../../../public/js/proof-atlas-source-pages');
const {limits}=require('../free-index-multiplicity/model.cjs');

// A single source-order scan. Keep a row only if it can reach the target.
// The selected root fixes which of the surviving paths are navigable.
async function open(cursor,rootIndex,target,{signal}={}){
  const source=pages.identity(cursor),data=cursor.data,root=data.roots[rootIndex];
  if(!Number.isInteger(rootIndex)||!Number.isInteger(root)||!Number.isInteger(target)||target<0||target>root)
    throw RangeError('Invalid occurrence search');
  if(root-target+1>limits.queryRows)throw RangeError('Occurrence scan row limit');
  const rows=new Map([[target,{count:1n,edges:[]}]]);
  let digits=1,edges=0;
  for(let node=target+1;node<=root;node++){
    const children=await cursor.run(()=>data.children[node],{signal});
    let count=0n;
    const choices=[];
    children.forEach((child,slot)=>{
      const entry=rows.get(child);
      if(entry){count+=entry.count;choices.push({child,slot});}
    });
    if(!count)continue;
    digits+=String(count).length;
    if(rows.size>=limits.coefficientCells||digits>limits.decimalDigits)throw RangeError('Occurrence count storage limit');
    edges+=choices.length;
    rows.set(node,{count,edges:choices});
  }
  const total=rows.get(root)?.count??0n;
  function select(n){
    if(typeof n!=='bigint'||n<1n||n>total)throw RangeError('Occurrence outside root');
    const slots=[];
    let node=root;
    while(node!==target){
      for(const edge of rows.get(node).edges){
        const count=rows.get(edge.child).count;
        if(n<=count){slots.push(edge.slot);node=edge.child;break;}
        n-=count;
      }
    }
    return {root:rootIndex,slots};
  }
  function rank(route){
    if(!total||route.root!==rootIndex)throw RangeError('Outside selected root');
    let node=root,n=1n;
    for(const slot of route.slots){
      const edge=rows.get(node).edges.find(edge=>{
        if(edge.slot<slot)n+=rows.get(edge.child).count;
        return edge.slot===slot;
      });
      if(!edge)throw RangeError('Route does not reach selected row');
      node=edge.child;
    }
    if(node!==target)throw RangeError('Incomplete occurrence route');
    return n;
  }
  return {source,total,select,rank,retained:rows.size,edges,digits};
}
module.exports={open};
