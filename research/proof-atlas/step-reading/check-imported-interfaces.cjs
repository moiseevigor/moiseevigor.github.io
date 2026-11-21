// Relate a caller slot to the returned expression after consuming its leading lambdas.
'use strict';
const assert=require('node:assert/strict');
const stages=require('./external-stage-slots.json');
const declarations=require('./ImportedInterfaces.json');
assert.deepEqual(declarations.map(r=>r.name).sort(),Object.keys(stages).sort());
const counts={bodyBinder:0,returnedConstant:0,returnedProjection:0,constructor:0};
const returned=[];
for(const declaration of declarations){
  for(const [position,occurrences] of Object.entries(stages[declaration.name])){
    const slot=Number(position);
    if(!Object.hasOwn(declaration,'bodyBinders')){
      assert.equal(declaration.kind,'constructor');
      counts.constructor+=occurrences;
    }else if(slot<=declaration.bodyBinders){
      counts.bodyBinder+=occurrences;
    }else{
      const projection=declaration.resultHeadKind==='proj';
      assert(projection || declaration.resultHeadKind==='const');
      counts[projection?'returnedProjection':'returnedConstant']+=occurrences;
      returned.push({name:declaration.name,slot,occurrences,head:declaration.resultHead,
        headKind:declaration.resultHeadKind,receivingSlot:declaration.supplied+slot-declaration.bodyBinders});
    }
  }
}
const census=require('./callee-coverage.json').find(r=>r.edition==='goedel-sample-4331');
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),Number(census.recordedProofResults.counts.outsideEdition));
console.log(JSON.stringify({counts,returned},null,2));
