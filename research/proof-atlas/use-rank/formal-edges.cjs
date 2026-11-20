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
  const {root,slots}=formal.domainRoute;
  assert.deepEqual(slots,[...Array(slot-1).fill(1),0]);
  const witnesses=references(head,root,slots,slot-1);
  assert.deepEqual(witnesses.map(w=>w.slot),formal.dependencies);
  return witnesses;
}

// Follow precisely the applied prefix. A partially applied function may
// retain further binders, which belong inside the residual result.
function conclusion(ports) {
  const arity=ports.length-1;
  assert.equal(ports[0].consumer.arguments,arity);
  if(!arity || ports.slice(1).some((p,i)=>!p.formal?.available ||
      p.formal.domainRoute.root!=='inputType' || p.consumer.slot!==i+1))return null;
  return references(ports[0],'inputType',Array(arity).fill(1),arity);
}

function references(head,root,slots,bound) {
  const graph=head.graph;
  let node=head.roots[root];
  assert(Number.isInteger(node));
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
      const target=bound-relative;
      if(relative>=0 && target>=1 && !found.has(target)){
        found.set(target,{slot:target,node:state.node,root,slots:slots.concat(state.path)});
      }
    }
    const children=graph.children[state.node];
    for(let field=children.length-1;field>=0;field--){
      pending.push({node:children[field],depth:state.depth+Number(binds(kind,field)),path:state.path.concat(field)});
    }
  }
  return [...found.values()].sort((a,b)=>a.slot-b.slot);
}
module.exports={dependencies,conclusion};
