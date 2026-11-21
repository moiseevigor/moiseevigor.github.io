// Match both the application and the particular supplied premise against native ports.
'use strict';
const assert=require('node:assert/strict');
const key=hit=>hit.route.root+':'+hit.route.slots.join('.')+'#'+hit.node;
module.exports=function caseUseJudgments(cases,calls){
  const index=new Map(calls.map(c=>[key(c.call),c]));
  for(const branch of cases.branches){
    for(const uses of branch.assumptionUses){
      for(const part of uses.parts){
        for(const sample of part.examples){
          const c=sample.consumer;
          if(!c)continue;
          const observed=index.get(key(c.call));
          if(!observed)continue;
          assert.equal(observed.ports.length-1,c.arity);
          const input=observed.ports[c.slot];
          assert.equal(input.slot,c.slot);
          assert.equal(key(input.input),key(sample.use));
          assert.equal(input.role,'proof');
          sample.judgment={owner:observed.nativeOwner,callId:observed.callId,slot:c.slot,
            premise:input.text,conclusion:observed.conclusion,
            otherProofs:observed.ports.filter(p=>p.slot!==c.slot && p.role==='proof').map(p=>({slot:p.slot,type:p.text,anchor:p.input}))};
        }
      }
    }
  }
};
