/* Shortest syntactic reference chains in an existing qualified context interface. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 class ContextWitnessError extends Error{constructor(m){super('Context witness: '+m);}}
 const demand=(ok,m)=>{if(!ok)throw new ContextWitnessError(m);},clone=x=>JSON.parse(JSON.stringify(x));
 function index(model,{maxStates=512,maxInspections=524288}={}){
  demand(model?.format==='ProofAtlasDependentInterface/1'&&Number.isInteger(model.originalDepth)&&model.originalDepth>=0&&model.originalDepth<=512&&model.contexts.length===model.originalDepth,'context bounds');
  demand(Number.isInteger(maxStates)&&maxStates>=0&&maxStates<=512&&Number.isInteger(maxInspections)&&maxInspections>=0&&maxInspections<=524288,'search bounds');
  const retained=new Set(model.retainedSlots);demand(retained.size===model.retainedSlots.length&&model.retainedSlots.every((j,i)=>Number.isInteger(j)&&j>=0&&j<model.originalDepth&&(!i||model.retainedSlots[i-1]<j)),'ordered retained slots');
  for(let j=0;j<model.originalDepth;j++)demand(model.contexts[j].slot===j&&model.contexts[j].retained===retained.has(j),'context slots');
  const predecessors=new Map(),queue=['term','type'];let cursor=0,inspected=0,references=0;
  // Both roots enter the queue before headers: first discovery has minimum edge count.
  while(cursor<queue.length){const from=queue[cursor++],isHeader=typeof from==='number',c=isHeader?model.contexts[from]:null,depth=isHeader?from:model.originalDepth;
   if(isHeader)demand((c.valueMask===null)===(c.value===null),'let-value field');
   const fields=isHeader?[['binder-type',c.domainMask],...(c.valueMask===null?[]:[['let-value',c.valueMask]])]:[[from==='term'?'term-support':'recorded-type-support',from==='term'?model.termMask:model.typeMask]];
   for(const [relation,mask]of fields){demand(typeof mask==='string'&&/^(0|[1-9a-f][0-9a-f]{0,127})$/.test(mask),'support encoding');const bits=BigInt('0x'+mask);demand(bits>>BigInt(depth)===0n,'dependency outside pre-binder scope');
    for(let targetSlot=0;targetSlot<depth;targetSlot++){demand(++inspected<=maxInspections,'slot-inspection limit');if(!(bits>>BigInt(depth-1-targetSlot)&1n))continue;references++;demand(retained.has(targetSlot),'incomplete context closure');if(predecessors.has(targetSlot))continue;demand(predecessors.size<maxStates,'predecessor limit');predecessors.set(targetSlot,{from,relation,targetSlot});queue.push(targetSlot);}
   }
  }
  demand(predecessors.size===retained.size&&[...retained].every(j=>predecessors.has(j)),'retained slot without a reference chain');
  function path(targetSlot,{offset=0,limit=16}={}){
   demand(retained.has(targetSlot)&&Number.isInteger(offset)&&offset>=0&&Number.isInteger(limit)&&limit>=1&&limit<=16,'path target/page');const reversed=[];let at=targetSlot;
   while(typeof at==='number'){demand(reversed.length<512,'path depth');const edge=predecessors.get(at);demand(edge,'missing predecessor');reversed.push(edge);at=edge.from;}
   const chain=reversed.reverse(),edges=chain.slice(offset,offset+limit).map(edge=>({...edge,originRegion:clone(edge.from==='term'?model.source:edge.from==='type'?model.nativeType:edge.relation==='binder-type'?model.contexts[edge.from].domain:model.contexts[edge.from].value),target:clone(model.contexts[edge.targetSlot].sourceBinder)}));
   return{format:'ProofAtlasContextDependencyPath/1',namespace:'syntactic-context-witness',method:'two-seed-breadth-first/1',source:clone(model.source),nativeType:clone(model.nativeType),origin:at,targetSlot,length:chain.length,offset,limit,edges,remaining:Math.max(0,chain.length-offset-edges.length),guarantee:'One shortest syntactic reference chain in this qualified interface. Reference regions, not individual variable-use occurrences. No logical necessity or new typing judgment.'};
  }
  return Object.freeze({path,state:()=>({predecessors:predecessors.size,inspectedSlots:inspected,referenceEdges:references,queuedOrigins:queue.length,maxStates,maxInspections})});
 }
 const api={index,ContextWitnessError};if(node)module.exports=api;else host.ProofAtlasContextWitnesses=api;
})(typeof window==='undefined'?globalThis:window);
