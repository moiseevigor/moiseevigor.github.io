/* Independent source-cut reference rule. Caller supplies accepted source data. */
'use strict';
const assert=require('assert/strict');
const slots=r=>{const b=Buffer.from(r.slots,'base64url');return Array.from({length:r.depth},(_,i)=>(b[i>>2]>>((i%4)*2))&3);};
const word=r=>r.root+':'+slots(r).join(''),prefix=(a,b)=>word(b).startsWith(word(a)),same=(a,b)=>word(a)===word(b);
function original(data,r){let node=data.roots[r.root];const scope=[],steps=slots(r);for(const[s,i]of steps.map((s,i)=>[s,i])){const k=data.kind[node];if([6,7].includes(k)&&s===1||k===8&&s===2)scope.push({node,depth:i});node=data.children[node][s];}const index=data.kind[node]===0?data.payloads[node].index:null,target=index===null?null:scope[scope.length-1-index];return{node,contextLength:scope.length,target,steps};}
function references(scene,rows,data){
 return rows.map(row=>{
  const actual=original(data,row.route);assert.equal(actual.node,row.node);assert.equal(actual.contextLength,row.contextLength);assert.equal(actual.target.node,row.binder.node);assert.equal(actual.target.depth,row.binder.route.depth);assert.deepEqual(actual.steps.slice(0,actual.target.depth),slots(row.binder.route));
  const retained=scene.nodes.filter(n=>same(n.route,row.route)),hidden=scene.nodes.flatMap(n=>n.ports.filter(p=>!p.displayed&&prefix(p.route,row.route)).map(p=>({route:p.route,node:p.node,contextLength:original(data,p.route).contextLength,expanded:p.expanded})));
  assert.equal(retained.length+hidden.length,1);const use=retained[0],region=use?{route:use.route,node:use.node,contextLength:use.scopeDepth}:hidden[0],binder=scene.nodes.find(n=>same(n.route,row.binder.route));let kind,target;
  if(binder){kind='retained-binder';target={namespace:'original-source-context-slot',sourceId:binder.id,ordinal:row.binder.ordinal,route:binder.route,node:binder.node,sourceKind:binder.kind};}
  else if(prefix(region.route,row.binder.route)){assert(!use);kind='internal-to-hidden-region';target={namespace:'original-source',route:row.binder.route,node:row.binder.node,visibility:'inside-region'};}
  else{assert(prefix(row.binder.route,scene.root.route));kind='external-original-context';target={namespace:'original-source-context-boundary',ordinal:row.binder.ordinal,route:row.binder.route,node:row.binder.node};}
  const edge=use?scene.links.find(e=>e.from===use.id):null;if(use){assert(edge);assert(same(edge.route,row.binder.route));}
  return{kind,region,target,useVisibility:use?'retained-source-use':'inside-source-frontier',sourceUseId:use?.id||null,existingBindingEdge:edge?{from:edge.from,to:edge.to,relation:edge.relation}:null};
 });
}
module.exports={references,original};
