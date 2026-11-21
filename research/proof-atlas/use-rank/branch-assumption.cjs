// Locate references to a case assumption inside each input of its body application.
'use strict';
const assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {open}=require('./model.cjs');
module.exports=function branchAssumption(data,binder,body){
  const model=open(data,binder.route);
  let cursor=body;
  const args=[];
  while(data.kind[cursor.node]===5){
    const [fn,arg]=data.children[cursor.node],slots=cursor.route.slots,root=cursor.route.root;
    args.push({node:arg,route:{root,slots:slots.concat(1)}});
    cursor={node:fn,route:{root,slots:slots.concat(0)}};
  }
  const parts=[cursor,...args.reverse()].map((anchor,slot)=>{
    const {first,count}=model.interval(anchor.route);
    const witness=count?model.select(first):null;
    if(witness){
      assert.deepEqual(witness.route.slots.slice(0,anchor.route.slots.length),anchor.route.slots);
      assert.deepEqual(atlas.binding(data,witness.route),binder);
    }
    return {slot,anchor,count:String(count),first:witness?{node:witness.node,route:witness.route}:null};
  });
  const total=model.interval(body.route).count;
  assert.equal(parts.reduce((n,p)=>n+BigInt(p.count),0n),total);
  return {binder,total:String(total),parts};
};
