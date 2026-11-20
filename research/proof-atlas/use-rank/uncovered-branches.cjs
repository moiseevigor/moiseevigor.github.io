// Partition binder-reference leaves outside the union of the sampled call subtrees.
'use strict';
const assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-equality-transport');
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
  const largest=regions.slice(0,3).map(r=>{
    const fieldNames=atlas.fields[atlas.kinds[data.kind[r.node]]]||[];
    const fields=data.children[r.node].map((node,i)=>{
      const route={root:body.root,slots:r.route.slots.concat(i)};
      return {field:fieldNames[i],anchor:{node,route},expressions:String(data.expanded[node]),uses:String(uses.interval(route).count)};
    });
    const seen=new Set(),pending=[r.node];
    while(pending.length){
      const node=pending.pop();
      if(seen.has(node))continue;
      seen.add(node);pending.push(...data.children[node]);
    }
    let head=null;
    if(data.kind[r.node]===5){
      const application=spine(data,r.node);
      const route={root:body.root,slots:r.route.slots.concat(Array(application.args.length).fill(0))};
      assert.equal(atlas.walk(data,route),application.head);
      const node=application.head,kind=atlas.kinds[data.kind[node]];
      const binding=kind==='bvar'?atlas.binding(data,route):null;
      const name=binding?(data.payloads[binding.node].binderName??data.payloads[binding.node].declName):data.payloads[node].name;
      head={anchor:{node,route},label:name||kind,arguments:application.args.length};
    }
    const first=uses.select(r.first),last=uses.select(r.first+r.count-1n);
    // A subtree occupies a contiguous interval in field order. Its first and
    // last uses have exactly the same common prefix as the whole interval.
    const slots=first.route.slots;
    let end=r.route.slots.length;
    while(end<slots.length && slots[end]===last.route.slots[end])end++;
    const route={root:body.root,slots:slots.slice(0,end)},node=atlas.walk(data,route);
    const stop={anchor:{node,route},steps:end-r.route.slots.length,expressions:String(data.expanded[node]),
      kind:atlas.kinds[data.kind[node]],children:[]};
    data.children[node].forEach((child,i)=>{
      const path={root:body.root,slots:route.slots.concat(i)};
      const count=uses.interval(path).count;
      if(count)stop.children.push({field:atlas.fields[stop.kind][i],anchor:{node:child,route:path},count:String(count)});
    });
    assert(stop.children.length>=2 || (r.count===1n && stop.kind==='bvar'));
    return {anchor:{node:r.node,route:r.route},kind:atlas.kinds[data.kind[r.node]],path:atlas.path(data,r.route),
      count:String(r.count),first,stop,expressions:String(data.expanded[r.node]),sourceRows:seen.size,fields,head};
  });
  return {regions:regions.length,largest};
};
