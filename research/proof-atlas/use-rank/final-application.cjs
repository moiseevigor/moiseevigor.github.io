// Join the final body's checked trace to nested calls by original occurrence.
'use strict';
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');
module.exports = function finalApplication(data, native, calls) {
  let node = data.roots[1];
  const slots = [], locals = [];
  while (data.kind[node] === 6 || data.kind[node] === 8) {
    const field = data.kind[node] === 8 ? 2 : 1;
    if (field===2) locals.push({binder:{node,route:{root:1,slots:[...slots]}},
      name:data.payloads[node].declName,value:{node:data.children[node][1],route:{root:1,slots:slots.concat(1)}}});
    slots.push(field);
    node = data.children[node][field];
  }
  const route = {root:1,slots};
  const entry = native.entries.find(e=>e.node===node && e.path===atlas.path(data,route));
  const result = {anchor:{node,route},checked:false};
  if (entry?.applicationJudgment?.status !== 'checked') return result;
  assert.deepEqual(entry.route,route);
  assert.equal(entry.kernelCheck,'PASS');
  const trace = entry.applicationJudgment;
  assert.equal(trace.finalTypeStructuralMatch,true);
  assert.equal(trace.stages.length,entry.arguments.length);
  const head = trace.head;
  assert.deepEqual(head.route,{root:1,slots:slots.concat(Array(entry.arguments.length).fill(0))});
  assert.equal(atlas.walk(data,head.route),head.node);
  const args = entry.arguments.map((arg,i)=>{
    const stage = trace.stages[i];
    assert.equal(arg.slot,i+1);
    assert.equal(stage.slot,arg.slot);
    for(const field of ['kernelDomainConversion','kernelFunctionConversion','kernelResultConversion'])assert.equal(stage[field],'PASS');
    assert.equal(arg.typeRoot,stage.actualRoot);
    const prefix=slots.concat(Array(entry.arguments.length-i-1).fill(0),1);
    assert.deepEqual(arg.route,{root:1,slots:prefix});
    assert.equal(atlas.walk(data,arg.route),arg.node);
    const contained=calls.filter(c=>c.call.route.root===1 && prefix.every((v,j)=>c.call.route.slots[j]===v));
    return {slot:arg.slot,role:arg.role,type:stage.argumentText,anchor:{node:arg.node,route:arg.route},
      calls:contained.map(c=>({id:c.callId,rule:c.rule}))};
  });
  const contained = new Set(args.flatMap(a=>a.calls.map(c=>c.id)));
  const outside = calls.filter(c=>!contained.has(c.callId));
  for(const local of locals){
    const nested = outside.filter(c=>c.call.route.root===1 && local.value.route.slots.every((v,i)=>c.call.route.slots[i]===v));
    if(!nested.length)continue;
    for(const arg of args){
      const refs=require('./lexical-inputs.cjs')(data,arg.anchor);
      if(refs===null){arg.localLinksIncomplete=true;continue;}
      const ref=refs.find(r=>r.binder.node===local.binder.node && r.binder.route.slots.join('.')===local.binder.route.slots.join('.'));
      if(ref)(arg.viaLocal??=[]).push({...local,use:ref.use,calls:nested.map(c=>({id:c.callId,rule:c.rule}))});
    }
  }
  return {...result,checked:true,type:entry.typeText,rule:atlas.describe(data,head.node),head:{node:head.node,route:head.route},args};
};
