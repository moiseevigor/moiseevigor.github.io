// If the selected occurrence is a direct argument, recover the complete application at that site.
'use strict';
const atlas=require('../../../public/js/proof-atlas-library-data');
const inputHead=require('../step-reading/input-head.cjs');
module.exports=function useConsumer(data,use,body){
  const {root,slots}=use.route;
  if(slots.length<=body.route.slots.length || slots.at(-1)!==1)return null;
  let end=slots.length-1;
  const at=depth=>{
    const route={root,slots:slots.slice(0,depth)};
    return {node:atlas.walk(data,route),route};
  };
  if(data.kind[at(end).node]!==5)return null;
  while(end>body.route.slots.length && slots[end-1]===0 && data.kind[at(end-1).node]===5)end--;
  const call=at(end),head=inputHead(data,call);
  const arity=head.route.slots.length-end;
  const slot=arity-(slots.length-end-1);
  return {call,head,slot,arity};
};
