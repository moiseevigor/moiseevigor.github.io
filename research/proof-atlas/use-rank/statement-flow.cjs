// Trace exact input positions forward through the recorded source-use graph.
'use strict';
const {open}=require('./model.cjs');
module.exports=function statementFlow(data,calls){
  const clauses=[];
  let [statement,proof]=data.roots;
  const prefix=[];
  const byId=new Map(calls.map(c=>[c.callId,c]));
  while(data.kind[statement]===7 && data.kind[proof]===6 &&
        data.children[statement][0]===data.children[proof][0]){
    const uses=open(data,{root:1,slots:prefix});
    const bodySlots=[...prefix,1],containing=[];
    for(const c of calls){
      if(c.call.route.root!==1 || !bodySlots.every((v,i)=>c.call.route.slots[i]===v))continue;
      const hit=uses.interval(c.call.route);
      if(hit.count)containing.push({call:c.callId,count:String(hit.count),first:uses.select(hit.first)});
    }
    const direct=[],subsequent=[],queue=[],seen=new Set();
    function enqueue(id){if(!seen.has(id)){seen.add(id);queue.push(id);}}
    for(const c of calls)for(const p of c.ports){
      const anchor=p.binding?.statement;
      if(!p.resolution && anchor && anchor.route.root===0 && anchor.route.slots.length===prefix.length+1 &&
         prefix.every((v,i)=>anchor.route.slots[i]===v) && anchor.route.slots.at(-1)===0){
        direct.push({call:c.callId,slot:p.slot});enqueue(c.callId);
      }
    }
    for(let i=0;i<queue.length;i++){
      const from=queue[i];
      for(const u of byId.get(from).consumers){
        subsequent.push({from,call:u.callId,slot:u.slot});enqueue(u.callId);
      }
    }
    clauses.push({name:data.payloads[statement].binderName,
      domain:{node:data.children[statement][0],route:{root:0,slots:[...prefix,0]}},containing,direct,subsequent});
    prefix.push(1);statement=data.children[statement][1];proof=data.children[proof][1];
  }
  return clauses;
};
