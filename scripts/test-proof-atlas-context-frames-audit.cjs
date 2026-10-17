/* Recover every primitive interface, then independently check the original source cut. */
'use strict';
const assert=require('assert/strict'),J=require('../public/js/proof-atlas-judgment-geometry'),rawAudit=require('./test-proof-atlas-judgment-audit.cjs');
const bare=p=>{const {child,frontier,folded,foldReason,...source}=p;return source;};
function continuation(n){if(n.role!=='proof')return null;const ps=n.rule==='recursor'&&n.recursor.minors===1?n.ports.filter(p=>p.branch):['introduction','let'].includes(n.rule)?n.ports.filter(p=>p.field==='body'):[];return ps.length===1&&ps[0].role==='proof'?ps[0]:null;}
function audit(scene,data,record,resolve,constructorLookup=null){
 assert.equal(scene.format,scene.sourceFallback?'ProofAtlasJudgmentScene/7':'ProofAtlasJudgmentScene/6');assert.equal(scene.foldContextFrames,true);assert(!scene.foldIntroductions);
 const frames=scene.nodes.filter(n=>n.contextFrame),binderMap=new Map(),limits=scene.contextFrameBounds;
 assert(limits.members>=2&&limits.members<=16&&limits.ports>=2&&limits.ports<=256);
 for(const n of frames){
  const f=n.contextFrame,ms=f.members,expectedPorts=[];let binderSlot=0;
  assert.equal(n.rule,'context-frame');assert(ms.length>=2&&ms.length<=limits.members);assert(n.ports.length<=limits.ports);assert.equal(f.limit,limits.members);assert.equal(f.portLimit,limits.ports);
  assert.equal(f.from,n.context.length);assert.equal(n.retainedOccurrences,ms.reduce((sum,m)=>sum+BigInt(m.retainedOccurrences),0n).toString());assert.equal(n.binder,null);assert.equal(n.checks,null);assert.deepEqual(n.stages,[]);assert(!n.recursor);
  assert.equal(n.typeText,ms[0].typeText);assert.deepEqual(n.typeReference,ms[0].typeReference);assert.deepEqual(n.attestation,ms[0].attestation);
  for(const [j,m]of ms.entries()){
   const raw=J.create(data,record,resolve,{judgmentRoute:m.route,maxNodes:1,maxDepth:0,constructorLookup}).nodes[0];assert.equal(m.slot,j+1);
   for(const k of ['id','node','route','kind','rule','region','context','binder','role','typeText','typeReference','checks','attestation','retainedOccurrences','stages'])assert.deepEqual(m[k==='id'?'path':k],raw[k],k);
   assert.equal(m.role,'proof');assert.deepEqual(m.recursor,raw.recursor||null);assert.deepEqual(m.ports,raw.ports.map(bare));
   if(m.binder){assert.equal(m.binderSlot,++binderSlot);binderMap.set(m.path,{id:n.id,slot:m.binderSlot});}else assert.equal(m.binderSlot,null);
   const selected=continuation(raw);assert(selected);assert.equal(m.continuation,selected.path);
   if(j+1<ms.length)assert.deepEqual(ms[j+1].route,selected.route);
   for(const p of raw.ports)if(p.path!==selected.path||j===ms.length-1)expectedPorts.push({...bare(p),label:'Rule '+(j+1)+' · '+p.label,field:'member'+(j+1)+'.'+p.field,originalField:p.field,memberSlot:j+1,scopeExtension:m.context.length-n.context.length+p.scopeExtension,continuation:j===ms.length-1&&p.path===selected.path});
  }
  assert.deepEqual(n.ports.map(bare),expectedPorts);
  const last=ms.at(-1),selected=last.ports.find(p=>p.path===last.continuation);assert.deepEqual(f.continuation,{node:selected.node,path:selected.path,route:selected.route});assert.equal(f.to,rawAudit.occurrence(data,selected.route).binders.length);
  if(f.stop==='member-limit')assert.equal(ms.length,limits.members);
  else{
   const next=J.create(data,record,resolve,{judgmentRoute:selected.route,maxNodes:1,maxDepth:0,constructorLookup}).nodes[0];
   if(f.stop==='port-limit'){assert(continuation(next));assert(n.ports.length-1+next.ports.length>limits.ports);}
   else if(f.stop==='unrecorded-construction')assert(['boundary',...(scene.sourceFallback?['projection-structure','construction-structure','constructor-reference']:[])].includes(next.rule));
   else{assert.equal(f.stop,'other-construction');assert.notEqual(next.rule,'boundary');assert(!continuation(next));}
  }
 }
 const displayed=new Set(scene.nodes.map(n=>n.id));
 for(const l of scene.links){const b=binderMap.get(l.to);assert.equal(l.displayTo,b?.id||(displayed.has(l.to)?l.to:null));assert.equal(l.binderSlot,b?.slot||null);assert.equal(l.boundary,!b&&!displayed.has(l.to));}
 if(scene.sourceFallback)for(const e of scene.edges){const parent=scene.nodes.find(n=>n.id===e.to),p=parent.ports.find(p=>p.field===e.port);assert(p&&p.child===e.from);assert.equal(e.scopeExtension,p.scopeExtension);assert.equal(e.relation,p.typeReference?'recorded-premise':'source-field');}
 const nodes=scene.nodes.flatMap(n=>n.contextFrame?n.contextFrame.members.map(m=>({...m,id:m.path,expanded:data.expanded[m.node],ports:structuredClone(m.ports)})):[structuredClone(n)]),vertices=new Set(nodes.map(n=>n.id));
 for(const n of nodes){for(const p of n.ports){p.child=vertices.has(p.path)?p.path:null;p.frontier=!p.child;if(scene.policy==='proof-focus'){p.foldReason=n.role==='proof'&&Number.isInteger(p.slot)&&p.slot>=1?(p.role==='type'?'type-input':p.role==='value'&&p.binderInfo==='instImplicit'?'instance-value-input':null):null;p.folded=p.foldReason!==null;}}n.hidden=n.ports.length?n.ports.filter(p=>p.frontier).reduce((sum,p)=>sum+BigInt(p.expanded),0n).toString():(BigInt(data.expanded[n.node])-1n).toString();}
 const edges=nodes.flatMap(n=>n.ports.filter(p=>p.child).map(p=>({from:p.child,to:n.id,port:p.field,scopeExtension:p.scopeExtension,relation:p.typeReference?'recorded-premise':'source-field'})));
 rawAudit({...scene,edges,foldIntroductions:false,budget:nodes.length,nodes,links:scene.links.map(l=>({...l,boundary:!vertices.has(l.to)}))},data);
 assert.equal(scene.stats.contextFrames,frames.length);assert.equal(scene.stats.groupedContextRecords,frames.reduce((sum,n)=>sum+n.contextFrame.members.length,0));assert.equal(scene.stats.contextBinders,binderMap.size);
 assert.equal(scene.stats.retainedRuleRecords,scene.nodes.reduce((sum,n)=>sum+(n.contextFrame?n.contextFrame.members.length:['application','introduction','let','recursor','construction','projection'].includes(n.rule)?1:0),0));
 return true;
}
module.exports=audit;
