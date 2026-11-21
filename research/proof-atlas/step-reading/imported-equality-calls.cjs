// Count observed proof-producing call stages, preserving the caller's original route.
'use strict';
const assert=require('node:assert/strict');
const union=require('../recorded-union.cjs');
const typing=require('../../../public/js/proof-atlas-deep-context');
const {spine}=require('../../../public/js/proof-atlas-elimination');
(async()=>{
  const calls=[];
  for(const item of union.inventory().filter(i=>i.edition==='goedel-sample-4331')){
    const {case:profile}=await union.open(item);
    for(const entry of profile.entries){
      if(entry.route.root!==1||entry.role!=='proof')continue;
      const c=typing.construction(entry,profile.data);
      if(c?.rule!=='Pi-application')continue;
      const {head,args}=spine(profile.data,entry.node);
      if(profile.data.kind[head]!==4||profile.data.payloads[head].name!=='sub_eq_zero_of_eq')continue;
      assert.deepEqual(profile.data.payloads[head].nameParts,[{str:'sub_eq_zero_of_eq'}]);
      calls.push({caller:item.record.name,indexSha256:item.record.indexSha256,route:entry.route,
        node:entry.node,arity:args.length,lastInput:c.premises[1].route,lastInputType:c.premises[1].typeText});
    }
  }
  const packed=require('../../../public/js/proof-atlas-packed-routes');
  const key=(c,r)=>[c.indexSha256,r.root,r.depth,r.slots].join('/');
  const stages=new Map(calls.map(c=>[key(c,c.route),c]));
  const complete=calls.filter(c=>c.arity===5);
  const consumed=new Set();
  for(const call of complete){
    for(let slot=1;slot<=5;slot++){
      const route=packed.append(call.route,Array(5-slot).fill(0));
      const id=key(call,route),stage=stages.get(id);
      assert.equal(stage?.arity,slot);
      assert(!consumed.has(id));consumed.add(id);
    }
  }
  assert.equal(consumed.size,calls.length);
  console.log(JSON.stringify(complete,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
