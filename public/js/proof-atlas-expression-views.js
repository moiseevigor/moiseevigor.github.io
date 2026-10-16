/* Delayed source-backed Expr views. No added kernel constructor or typing inference. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
// Research adapter: substitution is a graph view, never a thirteenth Expr kind.
// Inputs must already have passed packet/template validation. No kernel inference.
const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
const G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry;
const binds=(k,j)=>(k===6||k===7)&&j===1||k===8&&j===2;
const demand=(x,m)=>{if(!x)throw Error('Source reference: '+m);};
const graphIds=new WeakMap();let nextGraphId=0;
function graphId(g){if(!graphIds.has(g))graphIds.set(g,++nextGraphId);return graphIds.get(g);}
const identity=(g,n)=>g.referenceIdentity?g.referenceIdentity(n):graphId(g)+':'+n;

function instantiate(template,formal,source,arguments_,scope,options={}){
 const maxNodes=options.maxNodes??65536,maxWork=options.maxWork??131072,maxDepth=options.maxDepth??512;
 demand(Number.isInteger(scope)&&scope>=0&&scope<=512,'context bound');
 demand(Number.isInteger(maxNodes)&&maxNodes>0&&maxNodes<=131072&&Number.isInteger(maxWork)&&maxWork>0&&maxWork<=524288&&Number.isInteger(maxDepth)&&maxDepth>0&&maxDepth<=512,'work bounds');
 demand(Number.isInteger(formal)&&formal>=0&&formal<template.kind.length&&Array.isArray(arguments_)&&arguments_.length<=256,'formal/argument bound');
 demand(arguments_.every(n=>Number.isInteger(n)&&n>=0&&n<source.kind.length&&source.neededScope[n]<=scope),'argument context');
 const count=arguments_.length,states=[],memo=new Map();let work=0,evaluating=0;
 const arrays={kind:[],children:[],payloads:[],expanded:[],neededScope:[]};
 function add(space,node,amount=0,cutoff=0,depth=0){
  demand(depth<=maxDepth,'traversal depth bound');
  if(space==='source'&&source.neededScope[node]<=cutoff)amount=0;
  if(space==='template'&&template.kind[node]===0&&template.payloads[node].index>=depth){
   const index=template.payloads[node].index-depth;
   if(index<count)return add('source',arguments_[count-1-index],depth,0,0);
   demand(options.allowExternal!==false,'formal escaped argument telescope');
  }
  const key=[space,node,amount,cutoff,depth].join(':');if(memo.has(key))return memo.get(key);
  demand(states.length<maxNodes,'virtual node bound');const id=states.length;memo.set(key,id);
  states.push({space,node,amount,cutoff,depth});return id;
 }
 function property(id,field){
  demand(Number.isInteger(id)&&id>=0&&id<states.length,'virtual node identity');
  if(arrays[field][id]!==undefined)return arrays[field][id];
  demand(++work<=maxWork,'virtual work bound');
  demand(evaluating<maxDepth,'template evaluation depth bound');evaluating++;
  try{
  const s=states[id],g=s.space==='source'?source:template,k=g.kind[s.node],p=g.payloads[s.node];let value;
  if(field==='kind')value=k;
  else if(field==='payloads')value=k===0?{...p,index:s.space==='source'?(p.index>=s.cutoff?p.index+s.amount:p.index):p.index>=s.depth?p.index-count:p.index}:p;
  else if(field==='children')value=g.children[s.node].map((n,j)=>s.space==='source'?add('source',n,s.amount,s.cutoff+(binds(k,j)?1:0),s.depth+1):add('template',n,0,0,s.depth+(binds(k,j)?1:0)));
  else if(s.space==='source')value=field==='expanded'?g.expanded[s.node]:g.neededScope[s.node]>s.cutoff?g.neededScope[s.node]+s.amount:g.neededScope[s.node];
  else if(field==='expanded')value=(1n+property(id,'children').reduce((sum,c)=>sum+BigInt(property(c,'expanded')),0n)).toString();
  else value=k===0?property(id,'payloads').index+1:Math.max(0,...property(id,'children').map((c,j)=>property(c,'neededScope')-(binds(k,j)?1:0)));
  arrays[field][id]=value;return value;
  }finally{evaluating--;}
 }
 const graph={};for(const field of Object.keys(arrays))graph[field]=new Proxy([],{get(_,p){if(p==='length')return states.length;if(typeof p==='string'&&/^(0|[1-9]\d*)$/.test(p))return property(Number(p),field);throw Error('Source reference: only indexed graph access is supported');}});
 graph.referenceIdentity=id=>{const s=states[id];demand(s,'reference identity');return s.space==='source'&&s.amount===0?identity(source,s.node):s.space==='source'?identity(source,s.node)+'^'+s.amount+':'+s.cutoff:graphId(graph)+':'+id;};
 graph.sourceReference=id=>{const s=states[id];return s.space==='source'?{graph:source,node:s.node,lift:s.amount,cutoff:s.cutoff}:null;};
 const roots=(options.roots??[formal]).map(r=>{demand(Number.isInteger(r)&&r>=0&&r<template.kind.length,'template root');return add('template',r);}),root=roots[0];
 for(const r of roots)demand(graph.neededScope[r]<=scope,'result context');
 return {graph,root,roots,argumentRoots:[...arguments_],template:{sha256:options.templateSha256||(node?require('crypto').createHash('sha256').update(JSON.stringify(template)).digest('hex'):null),roots:[...(options.roots??[formal])]},stats:()=>({virtualNodes:states.length,work,maxNodes,maxWork,maxDepth}),
  // An original route exists only after entering a borrowed anchor. Computed
  // parents keep their own namespace even if their syntax matches source nodes.
  origin(slots,anchors,start=root){let id=start,original=null;
   const enter=()=>{const s=states[id];if(s.space==='source'&&!original){const i=arguments_.indexOf(s.node);demand(i>=0,'anchor boundary');original={node:s.node,route:{root:anchors[i].route.root,slots:[...anchors[i].route.slots]},lift:s.amount};}};
   enter();for(const slot of slots){demand(Number.isInteger(slot)&&slot>=0&&slot<graph.children[id].length,'view route');id=graph.children[id][slot];if(original){original.route.slots.push(slot);original.node=source.children[original.node][slot];}enter();}return original;
  }};
}

function equal(g,x,h,y,options={}){
 const maxPairs=options.maxPairs??131072;demand(Number.isInteger(maxPairs)&&maxPairs>0&&maxPairs<=524288,'comparison bound');
 const todo=[[x,y]],seen=new Set();let work=0,borrowedShortcuts=0;
 while(todo.length){const [a,b]=todo.pop(),key=a+':'+b;if(seen.has(key))continue;seen.add(key);demand(++work<=maxPairs,'comparison work bound');
  if(identity(g,a)===identity(h,b)){borrowedShortcuts++;continue;}
  if(g.kind[a]!==h.kind[b]||A.payloadKey(g.kind[a],g.payloads[a])!==A.payloadKey(h.kind[b],h.payloads[b])||g.children[a].length!==h.children[b].length)return{equal:false,work,borrowedShortcuts};
  g.children[a].forEach((c,j)=>todo.push([c,h.children[b][j]]));
 }
 return {equal:true,work,borrowedShortcuts};
}
function scene(view,record,context,slots=[],options={}){
 const data={...view.graph,serialization:'ExprDAG/1',roots:[view.root],declaration:{name:record.name,rootPaths:['source-reference.result']}};
 const selected=view.roots.indexOf(view.root);demand(selected>=0,'selected template root');
 const {anchors=null,...sceneOptions}=options;
 if(anchors)demand(anchors.length===view.argumentRoots.length&&anchors.every((a,j)=>a.node===view.argumentRoots[j]&&Number.isInteger(a.route?.root)&&Array.isArray(a.route.slots)&&typeof a.path==='string'),'scene anchor identity');
 const origin={kind:'source-reference-expression',namespace:'source-reference-view',sourceNamespace:'proof',method:'delayed-capture-avoiding-instantiation/1',kernelCheck:'not-performed',template:{sha256:view.template.sha256,root:view.template.roots[selected]},argumentRoots:view.argumentRoots,anchors,source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256}};
 const core=G||host.ProofAtlasGeometry;demand(core?.createReference,'geometry module unavailable');
 const cut=core.createReference(data,record,origin,context,{route:{root:0,slots},maxNodes:32,maxDepth:3,maxLayerNodes:6,maxApplicationChildren:4,foldBinders:true,foldApplications:true,...sceneOptions});
 demand(core.validateReference(cut,data,record,origin,context),'reference scene validation');
 return cut;
}
const api={instantiate,equal,scene};if(node)module.exports=api;else host.ProofAtlasExpressionViews=api;
})(typeof window==='undefined'?globalThis:window);

