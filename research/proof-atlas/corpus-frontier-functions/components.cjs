'use strict';
const assert=require('assert/strict'),T=require('../../../public/js/proof-atlas-occurrence-types');
const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
function metadataErasedKeys(g){const {digest}=require('../region-output-composition/model.cjs'),memo=new Map();function visit(n){if(memo.has(n))return memo.get(n);assert(memo.size<131072);const key=g.kind[n]===10?visit(g.children[n][0]):digest([g.kind[n],g.payloads[n],g.children[n].map(visit)]);memo.set(n,key);return key;}return visit;}
function open(out,c){
 assert.equal(out.storage,'joint-scoped-components/1');assert.equal(out.namespace,'source-frontier-function');assert.deepEqual(out.context,[]);assert.equal(out.holes.length,c.holes.length);
 const expected=[...['function.term','function.inferredType','function.declaredGoalType','source.term','source.inferredType','source.declaredType'].map(name=>({name,kind:'closed',length:0}))];
 for(let i=0;i<c.holes.length;i++){
  assert.deepEqual(out.holes[i].source,c.holes[i]);assert.deepEqual(out.holes[i].context,c.holes[i].context);
  assert.deepEqual(out.holes[i].letSlots,c.holes[i].context.map(f=>f.kind==='letE'));
  for(const name of['closedTerm','closedType','originalType'])expected.push({name:'hole.'+i+'.'+name,kind:name==='originalType'?'source-prefix':'closed',length:name==='originalType'?c.holes[i].context.length:0});
 }
 for(let i=0;i<c.holes.length;i++)expected.push({name:'parameter.'+i+'.type',kind:'parameter-prefix',length:i});
 assert.equal(out.components.length,expected.length);assert.equal(out.graph.roots.length,expected.length);
 T.validateExpressionGraph(out.graph,out.graph.roots,Math.max(...expected.map(e=>e.length)),131072);
 const roots={};for(let i=0;i<expected.length;i++){const e=expected[i],actual=out.components[i];assert.deepEqual(actual,{component:e.name,ordinal:i,scope:{kind:e.kind,length:e.length}},'component scope owner');const root=out.graph.roots[i];assert(out.graph.neededScope[root]<=e.length,'component escaped its declared scope');roots[e.name]=root;}
 const view=names=>({...out.graph,roots:names.map(name=>{assert(Object.hasOwn(roots,name));return roots[name];})});
 const legacy={...out,graph:view(['function.term','function.inferredType']),sourceGraph:view(['source.term','source.inferredType']),holes:out.holes.map((h,i)=>({...h,original:view(['hole.'+i+'.closedTerm','hole.'+i+'.closedType']),originalType:view(['hole.'+i+'.originalType'])})),parameterTypes:out.holes.map((_,i)=>view(['parameter.'+i+'.type']))};
 return{roots,view,legacy};
}
function binderWitness(out,c,opened){
 const g=out.graph;
 function externalPath(root){const queue=[{node:root,path:[],depth:0}],seen=new Set();for(let i=0;i<queue.length;i++){const r=queue[i],key=r.node+':'+r.depth;if(seen.has(key))continue;seen.add(key);assert(seen.size<=262144);if(g.kind[r.node]===0&&g.payloads[r.node].index>=r.depth)return r;for(const [s,n]of g.children[r.node].entries())queue.push({node:n,path:[...r.path,s],depth:r.depth+Number(binds(g.kind[r.node],s))});}return null;}
 function pathTo(root,target){const queue=[{node:root,path:[]}],seen=new Set();for(let i=0;i<queue.length;i++){const r=queue[i];if(r.node===target)return r.path;if(seen.has(r.node))continue;seen.add(r.node);assert(seen.size<=131072);for(const [s,n]of g.children[r.node].entries())queue.push({node:n,path:[...r.path,s]});}return null;}
 for(let i=0;i<c.holes.length;i++){
  const external=externalPath(opened.roots['hole.'+i+'.originalType']);if(!external)continue;
  const path=pathTo(opened.roots['function.term'],external.node);if(!path)continue;
  const binders=[];let node=opened.roots['function.term'];for(const [n,s]of path.entries()){if(binds(g.kind[node],s))binders.push({node,slots:path.slice(0,n)});node=g.children[node][s];}
  const index=g.payloads[external.node].index,computed=binders.at(-1-index);assert(computed,'closed function binder');
  const source=c.holes[i].context.at(-1-(index-external.depth));assert(source,'original type source binder');
  return{sharedNode:external.node,index,sourceObservation:{component:'hole.'+i+'.originalType',slots:external.path,target:{namespace:'source-expression',node:source.node,route:source.route}},computedObservation:{component:'function.term',slots:path,target:{namespace:'source-frontier-function',node:computed.node,slots:computed.slots}}};
 }
 return null;
}
module.exports={open,binderWitness,metadataErasedKeys};
