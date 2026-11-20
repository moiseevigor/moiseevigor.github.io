// Partition binder-reference leaves outside the union of the sampled call subtrees.
'use strict';
const assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
module.exports=function uncoveredBranches(data,body,callRoutes,uses,uncovered){
  const branch=()=>({excluded:false,fields:new Map()});
  const trie=branch();
  for(const route of callRoutes){
    if(route.root!==body.root)continue;
    const shared=Math.min(route.slots.length,body.slots.length);
    if(!route.slots.slice(0,shared).every((v,i)=>body.slots[i]===v))continue;
    let t=trie;
    for(const field of route.slots.slice(body.slots.length)){
      if(t.excluded)break;
      if(!t.fields.has(field))t.fields.set(field,branch());
      t=t.fields.get(field);
    }
    t.excluded=true;t.fields.clear();
  }
  const regions=[];
  const stack=[{node:atlas.walk(data,body),route:body,trie}];
  let total=0n;
  while(stack.length){
    const {node,route,trie:t}=stack.pop();
    if(t?.excluded)continue;
    if(!t || !t.fields.size){
      const {count,first}=uses.interval(route);
      if(count){
        regions.push({node,route,count,first});
        total+=count;
      }
      continue;
    }
    data.children[node].forEach((child,field)=>stack.push({node:child,
      route:{root:body.root,slots:[...route.slots,field]},trie:t.fields.get(field)}));
  }
  assert.equal(total,uncovered);
  regions.sort((a,b)=>a.count>b.count?-1:a.count<b.count?1:a.first<b.first?-1:1);
  return {regions:regions.length,largest:regions.slice(0,3).map(r=>({
    anchor:{node:r.node,route:r.route},kind:atlas.kinds[data.kind[r.node]],path:atlas.path(data,r.route),
    count:String(r.count),first:uses.select(r.first)
  }))};
};
