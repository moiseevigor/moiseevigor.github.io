'use strict';
const assert=require('node:assert/strict');
const {binds}=require('./model.cjs');

// Store only ancestors of the shared row reachable from this proof body.
module.exports=function sharedRowTable(data,target,relative){
  const counts=[];
  for(let row=0;row<data.kind.length;row++)
    counts.push(row===target?1n:data.children[row].reduce((sum,c)=>sum+counts[c],0n));
  const rows=[],ids=new Map();
  function add(node){
    if(ids.has(node))return ids.get(node);
    const id=rows.length,edges=[],p=data.payloads[node];
    ids.set(node,id);
    rows.push([node,data.kind[node],p.binderName??p.declName??'',edges]);
    if(node!==target)data.children[node].forEach((child,slot)=>{
      if(counts[child])edges.push([slot,add(child),String(counts[child])]);
    });
    return id;
  }
  const root=data.roots[1];
  assert(counts[root]>0n);
  add(root);
  let variable=target,depth=0;
  for(const slot of relative){
    depth+=Number(binds(data.kind[variable],slot));
    variable=data.children[variable][slot];
  }
  assert.equal(data.kind[variable],0);
  const index=data.payloads[variable].index;
  assert(index>=depth);
  return {prefix:[],rows,total:String(counts[root]),relative,variable,index,outerIndex:index-depth};
};
