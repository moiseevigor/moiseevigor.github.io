// Trace exact input positions forward through the recorded source-use graph.
'use strict';
const {open}=require('./model.cjs');
const uncoveredBranches=require('./uncovered-branches.cjs');
module.exports=function statementFlow(data,calls){
  const clauses=[];
  let [statement,proof]=data.roots;
  const prefix=[];
  const byId=new Map(calls.map(c=>[c.callId,c]));
  while(data.kind[statement]===7 && data.kind[proof]===6 &&
        data.children[statement][0]===data.children[proof][0]){
    const uses=open(data,{root:1,slots:prefix});
    const bodySlots=[...prefix,1],containing=[],ranges=[];
    for(const c of calls){
      const r=c.call.route;
      if(r.root!==1 || !r.slots.slice(0,bodySlots.length).every((v,i)=>v===bodySlots[i]))continue;
      const hit=r.slots.length<bodySlots.length ? {first:1n,count:uses.total} : uses.interval(r);
      if(hit.count){
        containing.push({call:c.callId,count:String(hit.count),first:uses.select(hit.first)});
        ranges.push({start:hit.first,end:hit.first+hit.count});
      }
    }
    ranges.sort((a,b)=>a.start<b.start?-1:a.start>b.start?1:0);
    let covered=0n,cursor=1n,gap=null;
    for(const {start,end} of ranges){
      if(end<=cursor)continue;
      if(start>cursor && gap===null)gap=cursor;
      covered+=end-(start>cursor?start:cursor);
      cursor=end;
    }
    if(gap===null && cursor<=uses.total)gap=cursor;
    const coverage={total:String(uses.total),covered:String(covered),firstOutside:gap===null?null:uses.select(gap)};
    coverage.branches=uncoveredBranches(data,{root:1,slots:bodySlots},calls.map(c=>c.call.route),uses,uses.total-covered);
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
      domain:{node:data.children[statement][0],route:{root:0,slots:[...prefix,0]}},coverage,containing,direct,subsequent});
    prefix.push(1);statement=data.children[statement][1];proof=data.children[proof][1];
  }
  return clauses;
};
