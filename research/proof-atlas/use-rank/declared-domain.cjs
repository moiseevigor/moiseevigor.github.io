// Read the original binder domain in the context preceding that binder.
'use strict';
const assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {destination}=require('../../../public/js/proof-atlas-clause-navigation');
const {context}=require('../../../public/js/proof-atlas-occurrence-types');
const {evaluate,limits}=require('../free-index-multiplicity/model.cjs');
const {binds}=require('./model.cjs');

module.exports=function declaredDomain(data,anchor){
  const route={root:anchor.route.root,slots:[...anchor.route.slots,0]};
  const node=atlas.walk(data,route);
  assert(['lam','forallE','letE'].includes(atlas.kinds[data.kind[anchor.node]]));
  const binders=context(data,route).binders;
  const counts=evaluate(data,binders.map((_,index)=>({node,index})));
  const domain={node,route};
  const pair=destination(data,anchor.route);
  let statement=null;
  if(pair && anchor.route.root===1 && anchor.route.slots.every(slot=>slot===1) &&
      pair.route.root===0 && pair.route.slots.length===anchor.route.slots.length &&
      data.kind[pair.node]===7 && data.kind[anchor.node]===6 && data.children[pair.node][0]===node){
    statement={node,route:{root:0,slots:[...pair.route.slots,0]}};
  }
  if(counts.status!=='complete')return {domain,statement,references:null};
  const wanted=new Set(counts.rows.filter(r=>BigInt(r.count)>0n).map(r=>r.index));
  const todo=[{node,depth:0,slots:[]}],seen=new Set(),references=[];
  while(wanted.size && todo.length){
    const s=todo.pop(),key=s.node+':'+s.depth;
    if(seen.has(key)||s.depth>=data.neededScope[s.node])continue;
    if(seen.size>=limits.queryRows)return {domain,statement,references:null};
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
  return {domain,statement,references};
};
