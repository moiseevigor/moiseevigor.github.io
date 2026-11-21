// Join constructor roles to the source application's original argument positions.
'use strict';
const assert = require('node:assert/strict');
const elimination = require('../../../public/js/proof-atlas-elimination');
const inputHead = require('../step-reading/input-head.cjs');
module.exports = function finalCases(data,record,provider,application) {
  const route=application.anchor.route;
  const observation=provider.get(route);
  if(observation?.eliminationJudgment?.status!=='checked')return {checked:false,owner:provider.sha256};
  const scene=elimination.create(data,record,provider,route);
  function sourceArgument(arg){
    const port=application.args[arg.sourceSlot-1];
    assert.equal(port.anchor.node,arg.node);
    assert.deepEqual(port.anchor.route,arg.route);
    return port;
  }
  const major=sourceArgument(scene.major),head=inputHead(data,major.anchor);
  let origin=null;
  if(head.kind==='bvar' && head.binder){
    const b=head.binder,kind=data.kind[b.node];
    if(kind===8)origin={name:data.payloads[b.node].declName,binder:b,
      value:{node:data.children[b.node][1],route:{root:b.route.root,slots:b.route.slots.concat(1)}}};
  }
  const branches=scene.branches.map(b=>{
    const port=sourceArgument(b.argument);
    let body=port.anchor;
    const domains=[];
    // Keep original lambda fields visible even when a separate lambda typing query is absent.
    while(domains.length<b.inputCount && data.kind[body.node]===6){
      domains.push({node:data.children[body.node][0],route:{root:route.root,slots:body.route.slots.concat(0)}});
      body={node:data.children[body.node][1],route:{root:route.root,slots:body.route.slots.concat(1)}};
    }
    return {constructor:b.constructor,slot:port.slot,domains,body,head:inputHead(data,body)};
  });
  return {checked:true,owner:provider.sha256,recursor:scene.recursor,major:major.slot,origin,branches};
};
