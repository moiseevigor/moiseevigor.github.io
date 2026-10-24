/* Composition uses the existing checked source/context frame, not summed unit roots. */
(function(host) {
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const T=node?require('./proof-atlas-deep-context'):host.ProofAtlasDeepContext;
const F=node?require('./proof-atlas-occurrence-context-frame'):host.ProofAtlasOccurrenceContextFrame;
const U=node?require('./proof-atlas-local-definition-unit'):host.ProofAtlasLocalDefinitionUnit;
const limits=Object.freeze({units:8,metadataBytes:524288});
const demand=(ok,m)=>{if(!ok)throw Error('Local definition frame: '+m);};
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const same=(a,b)=>a.root===b.root&&a.depth===b.depth&&a.slots===b.slots;
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
function open(c,captions,edition){
 const contextModel=F.open(c),unitModel=U.open(c,captions,edition),issued=new WeakSet();
 async function create(route,{maxUnits=4}={}){
  demand(Number.isInteger(maxUnits)&&maxUnits>=1&&maxUnits<=limits.units,'unit budget');
  const first=c.get(route);demand(first&&T.construction(first,c.data)?.rule==='let-binding','recorded let at exact root');
  const candidate=contextModel.create(route,{maxMembers:maxUnits});
  const other=candidate.members.findIndex(m=>m.rule!=='let-binding');
  demand(other!==0,'unsupported first unit');
  const frame=other>0?contextModel.create(route,{maxMembers:other}):candidate;
  const units=[],joins=[];
  for(let i=0;i<frame.members.length;i++){
   const memberRoute=contextModel.resolve(frame,{member:i}),entry=c.get(memberRoute),rule=T.construction(entry,c.data);
   demand(rule.rule==='let-binding','let-only unit composition');
   const unit=await unitModel.create(entry);units.push(unit);
   if(i){
    const previous=units[i-1],body=previous.body,part=T.construction(c.get(previous.root.route),c.data).premises.at(-1);
    demand(same(body.route,unit.root.route)&&body.node===unit.root.node&&body.contextLength===unit.root.contextLength&&body.role===unit.wholeRole,'exact original typed interface');
    const owner=T.construction(c.get(previous.root.route),c.data).entry;
    demand(T.expressionEqual(owner.typeData,part.typeRoot,rule.entry.typeData,rule.entry.typeData.roots[0]),'cross-owner structural type agreement');
    joins.push({from:i-1,to:i,sourcePosition:{route:unit.root.route,node:unit.root.node,contextLength:unit.root.contextLength},
     parentPort:previous.ports.bodyType,childPort:unit.ports.conclusionType,relation:'same-original-source-typed-body',preservesDistinctNativeOrigins:true});
   }
  }
  demand(units.length>0&&units.length<=maxUnits,'effective unit count');
  const sourcePartition={retained:frame.stats.retained,hidden:frame.stats.hidden,represented:frame.stats.represented,
   regions:[...frame.headers,frame.continuation].map(p=>({route:contextModel.resolve(frame,p.address),node:p.node,contextLength:p.contextLength,expanded:p.expanded})),
   countScope:'One original context-frame cut. Individual unit subtrees overlap and are not added.'};
  demand(BigInt(sourcePartition.retained)+BigInt(sourcePartition.hidden)===BigInt(sourcePartition.represented),'original source accounting');
  const value=freeze({format:'ProofAtlasLocalDefinitionFramePrototype/1',source:units[0].source,root:units[0].root,
   options:{maxUnits},effectiveUnits:units.length,frame,units,joins,sourcePartition,
   continuation:{...frame.continuation,route:contextModel.resolve(frame,frame.continuation.address),
    status:other>0?'unsupported-unit-rule':frame.stop,availableRule:frame.continuation.availableRule},
   scope:'Composition of recorded let typing interfaces at exact original body positions. No combined reduction, new native judgment, semantic proof module or comprehension result.'});
  demand(new TextEncoder().encode(JSON.stringify(value)).length<=limits.metadataBytes,'metadata byte bound');issued.add(value);return value;
 }
 async function validate(value){demand(value?.format==='ProofAtlasLocalDefinitionFramePrototype/1','frame format');demand(canonical(value)===canonical(await create(value.root.route,value.options)),'frame differs from original interfaces');return true;}
 function unit(value,index){demand(issued.has(value)&&Number.isInteger(index)&&index>=0&&index<value.units.length,'issued unit address');return value.units[index];}
 return Object.freeze({create,validate,unit});
}
const api=Object.freeze({open,limits});
if(node)module.exports=api;else host.ProofAtlasLocalDefinitionFrame=api;
})(typeof window==='undefined'?globalThis:window);
