// Locate references to a case assumption inside each input of its body application.
'use strict';
const assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {open}=require('./model.cjs');
const useConsumer=require('./use-consumer.cjs');
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
    const examples=[];
    for(let k=0n;k<count && k<8n;k++){
      const {node,route}=model.select(first+k);
      const use={node,route};
      assert.deepEqual(route.slots.slice(0,anchor.route.slots.length),anchor.route.slots);
      assert.deepEqual(atlas.binding(data,route),binder);
      examples.push({use,consumer:useConsumer(data,use,body)});
    }
    return {slot,anchor,examples,count:String(count),first:examples[0]?.use??null};
  });
  const total=model.interval(body.route).count;
  assert.equal(parts.reduce((n,p)=>n+BigInt(p.count),0n),total);
  return {binder,total:String(total),parts};
};
