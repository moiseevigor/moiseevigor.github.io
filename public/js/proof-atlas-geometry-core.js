/* Article-independent scoped scenes. Input must already pass packet hash and ExprDAG/1 validation. */
(function(host){
 'use strict';
 const A=typeof module!=='undefined'&&module.exports?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const vocabulary=Object.freeze({
  bvar:{glyph:'↶',role:'bound-reference',ports:[]},fvar:{glyph:'Γ',role:'local-reference',ports:[]},mvar:{glyph:'?',role:'unresolved',ports:[]},sort:{glyph:'U',role:'universe',ports:[]},const:{glyph:'C',role:'declaration-reference',ports:[]},
  app:{glyph:'@',role:'application',ports:['fn','arg']},lam:{glyph:'λ',role:'abstraction',ports:['domain','body']},forallE:{glyph:'∀',role:'dependent-function-type',ports:['domain','body']},letE:{glyph:'let',role:'local-definition',ports:['type','value','body']},lit:{glyph:'#',role:'literal',ports:[]},mdata:{glyph:'μ',role:'annotation',ports:['expr']},proj:{glyph:'π',role:'projection',ports:['struct']}
 });
 for(const rule of Object.values(vocabulary)){Object.freeze(rule.ports);Object.freeze(rule);}
 const binds=(kind,slot)=>(kind==='lam'||kind==='forallE')&&slot===1||kind==='letE'&&slot===2;
 function demand(condition,message){if(!condition)throw Error('Geometric scene: '+message);}
 function checkedRoute(data,route){
  demand(route&&Number.isInteger(route.root)&&route.root>=0&&route.root<data.roots.length&&Array.isArray(route.slots),'invalid root route');
  let id=data.roots[route.root],scope=null;const slots=[];
  for(const slot of route.slots){const kind=A.kinds[data.kind[id]];demand(Number.isInteger(slot)&&slot>=0&&slot<data.children[id].length,'invalid occurrence slot');if(binds(kind,slot))scope={node:id,route:{root:route.root,slots:[...slots]},outer:scope};slots.push(slot);id=data.children[id][slot];}
  return{id,scope};
 }
 function create(data,record,options={}){
  demand(data.serialization==='ExprDAG/1'&&data.declaration.name===record.name,'packet identity mismatch');
  const budget=options.maxNodes??48,depthLimit=options.maxDepth??4,route=options.route||{root:data.roots.length>1?1:0,slots:[]};
  demand(Number.isInteger(budget)&&budget>=1&&budget<=10000,'node budget must be 1–10000');demand(Number.isInteger(depthLimit)&&depthLimit>=0&&depthLimit<=128,'depth must be 0–128');
  const start=checkedRoute(data,route),work=[{id:start.id,scope:start.scope,route:{root:route.root,slots:[...route.slots]},depth:0,parent:null,field:null}],nodes=[],edges=[],links=[];
  for(let at=0;at<work.length;at++){
   const item=work[at],kind=A.kinds[data.kind[item.id]],rule=vocabulary[kind],cs=data.children[item.id];demand(rule&&cs.length===rule.ports.length,'unknown constructor or port arity');
   const path=A.path(data,item.route),expanded=BigInt(data.expanded[item.id]);demand(expanded>=1n,'invalid expanded count');
   const expand=cs.length>0&&item.depth<depthLimit&&work.length+cs.length<=budget;
   const node={id:path,node:item.id,kind,glyph:rule.glyph,role:rule.role,route:item.route,depth:item.depth,payload:data.payloads[item.id],ports:[...rule.ports],kernelPorts:rule.ports.map(p=>(kind==='lam'||kind==='forallE')&&p==='domain'?'binderType':p),expanded:expanded.toString(),hidden:expand?'0':(expanded-1n).toString(),frontier:cs.length>0&&!expand,children:[]};nodes.push(node);
   if(item.parent!==null)edges.push({from:item.parent,to:path,field:item.field,relation:'constructor-child'});
   if(kind==='bvar'){
    let binder=item.scope,index=node.payload.index;demand(Number.isInteger(index)&&index>=0,'invalid de Bruijn index');while(index--&&binder)binder=binder.outer;
    links.push(binder?{from:path,relation:'bound-to',node:binder.node,route:binder.route,target:A.path(data,binder.route)}:{from:path,relation:'unresolved-scope',index:node.payload.index});
   }else if(kind==='const')links.push({from:path,relation:'declaration-reference',name:node.payload.name,levels:node.payload.levels});
   else if(kind==='fvar'||kind==='mvar')links.push({from:path,relation:kind==='fvar'?'local-context':'metavariable-context',contextId:node.payload.id,status:'context-not-exported'});
   if(expand)cs.forEach((child,slot)=>{const childRoute={root:item.route.root,slots:[...item.route.slots,slot]};node.children.push(A.path(data,childRoute));work.push({id:child,route:childRoute,depth:item.depth+1,parent:path,field:rule.ports[slot],scope:binds(kind,slot)?{node:item.id,route:item.route,outer:item.scope}:item.scope});});
  }
  const visible=new Set(nodes.map(n=>n.id));for(const link of links)if(link.relation==='bound-to')link.boundary=!visible.has(link.target);
  const total=BigInt(data.expanded[start.id]),hidden=nodes.reduce((s,n)=>s+BigInt(n.hidden),0n);demand(BigInt(nodes.length)+hidden===total,'frontier accounting failed');
  return{format:'ProofAtlasGeometricScene/1',source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},root:{node:start.id,route:{root:route.root,slots:[...route.slots]},path:A.path(data,route),category:route.slots.length?'expression':route.root===0?'declaration-type':record.kind==='theorem'?'proof-body':'definition-or-reduction'},budget,depthLimit,nodes,edges,links,stats:{displayed:nodes.length,hidden:hidden.toString(),represented:total.toString(),frontiers:nodes.filter(n=>n.frontier).length,scopeBoundaries:links.filter(l=>l.relation==='bound-to'&&l.boundary).length},guarantee:'Occurrence structure and lexical binding against the identified packet. No inferred occurrence types, semantic equivalence, tactic reconstruction or human comprehension claim.'};
 }
 function validate(scene,data,record){
  demand(scene.format==='ProofAtlasGeometricScene/1','unknown format');demand(scene.source.name===record.name&&scene.source.indexSha256===record.indexSha256&&scene.source.sourceSha256===record.sourceSha256,'stale packet');
  const expected=create(data,record,{route:scene.root.route,maxNodes:scene.budget,maxDepth:scene.depthLimit});demand(JSON.stringify(scene)===JSON.stringify(expected),'changed scene or scope');return true;
 }
 const api={vocabulary,create,validate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasGeometry=api;
})(typeof window==='undefined'?globalThis:window);
