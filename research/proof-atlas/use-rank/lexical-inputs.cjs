'use strict';
const assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {context}=require('../../../public/js/proof-atlas-occurrence-types');
const {evaluate,limits}=require('../free-index-multiplicity/model.cjs');
const {binds}=require('./model.cjs');

module.exports=function lexicalInputs(data,{node,route}){
  const binders=context(data,route).binders;
  const counts=evaluate(data,binders.map((_,index)=>({node,index})));
  if(counts.status!=='complete')return null;
  const wanted=new Set(counts.rows.filter(r=>BigInt(r.count)>0n).map(r=>r.index));
  const todo=[{node,depth:0,slots:[]}],seen=new Set(),references=[];
  while(wanted.size && todo.length){
    const s=todo.pop(),key=s.node+':'+s.depth;
    if(seen.has(key)||s.depth>=data.neededScope[s.node])continue;
    if(seen.size>=limits.queryRows)return null;
    seen.add(key);
    if(data.kind[s.node]===0){
      const index=data.payloads[s.node].index-s.depth;
      if(!wanted.delete(index))continue;
      const binder=binders[binders.length-1-index];
      const use={node:s.node,route:{root:route.root,slots:route.slots.concat(s.slots)}};
      assert.deepEqual(atlas.binding(data,use.route),{node:binder.node,route:binder.route});
      const payload=data.payloads[binder.node];
      references.push({binder,use,name:payload.binderName??payload.declName,count:counts.rows[index].count});
    }
    const children=data.children[s.node];
    for(let slot=children.length-1;slot>=0;slot--){
      todo.push({node:children[slot],depth:s.depth+Number(binds(data.kind[s.node],slot)),slots:s.slots.concat(slot)});
    }
  }
  assert.equal(wanted.size,0);
  return references;
};
