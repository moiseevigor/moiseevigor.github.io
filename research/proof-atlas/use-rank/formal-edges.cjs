// A witness is an occurrence in the function's recorded type, owned by slot 0.
'use strict';
const assert=require('node:assert/strict');
const {binds}=require('./model.cjs');

function dependencies(head,entry) {
  const formal=entry.formal;
  if(!formal?.available) return null;
  const slot=entry.consumer.slot;
  assert.equal(formal.functionPort,0);
  assert.equal(formal.previousArguments,slot-1);
  assert.equal(formal.kernelInstantiatedDomain,'PASS');
  const {root,slots}=formal.domainRoute, graph=head.graph;
  let node=head.roots[root];
  assert(Number.isInteger(node));
  assert.deepEqual(slots,[...Array(slot-1).fill(1),0]);
  for(const field of slots){
    assert.equal(graph.kind[node],7);
    node=graph.children[node][field];
  }
  const found=new Map(), seen=new Set();
  const pending=[{node,depth:0,path:[]}];
  while(pending.length){
    const state=pending.pop(),key=state.node+':'+state.depth;
    if(seen.has(key))continue;
    seen.add(key);
    const kind=graph.kind[state.node];
    if(kind===0){
      const relative=graph.payloads[state.node].index-state.depth;
      const target=slot-1-relative;
      if(relative>=0 && target>=1 && !found.has(target)){
        found.set(target,{slot:target,node:state.node,root,slots:slots.concat(state.path)});
      }
    }
    const children=graph.children[state.node];
    for(let field=children.length-1;field>=0;field--){
      pending.push({node:children[field],depth:state.depth+Number(binds(kind,field)),path:state.path.concat(field)});
    }
  }
  const witnesses=[...found.values()].sort((a,b)=>a.slot-b.slot);
  assert.deepEqual(witnesses.map(w=>w.slot),formal.dependencies);
  return witnesses;
}
module.exports={dependencies};
