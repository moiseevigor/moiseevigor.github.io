/* Exact named-application navigation from the released CoreGIR occurrence tree.
 * An application edge is app.fn/app.arg syntax, NEVER an inferred logical step.
 * No inferred result types, original tactics or transitive proof bodies live here.
 */
(function(host){
 'use strict';
 function create(graph,terms){
  const n=graph?.parent?.length;
  if(!Number.isInteger(n)||!terms||terms.payloads?.length!==n)
   throw Error('Application bridge requires aligned complete term payloads');
  const kind=i=>graph.kinds[Number(graph.kind[i])], children=Array.from({length:n},()=>[]);
  for(let i=0;i<n;i++){
   const p=graph.parent[i];
   if(p===-1)continue;
   if(!Number.isInteger(p)||p<0||p>=i)throw Error('Invalid occurrence parent at #'+i);
   children[p].push(i);
  }
  const arity={app:2,lam:2,forallE:2,letE:3,mdata:1,proj:1,
   bvar:0,fvar:0,mvar:0,sort:0,const:0,lit:0};
  for(let i=0;i<n;i++){
   const expected=arity[kind(i)];
   if(expected===undefined||children[i].length!==expected)
    throw Error('Invalid constructor children at #'+i);
  }
  const depend=new Map();
  for(const d of graph.deps||[])for(const i of d.uses||[]){
   if(!Number.isInteger(i)||i<0||i>=n||kind(i)!=='const'||depend.has(i))
    throw Error('Invalid or repeated dependency witness at #'+i);
   depend.set(i,d.name);
  }
  const byConst=new Map(),byName=new Map();
  for(let i=0;i<n;i++){
   if(kind(i)!=='const')continue;
   const name=terms.payloads[i]?.name;
   if(typeof name!=='string'||!name)throw Error('Unnamed Expr.const #'+i);
   if(!depend.has(i))throw Error('Constant missing from dependency index #'+i);
   if(depend.get(i)!=='Kernel/library declaration'&&depend.get(i)!==name)
    throw Error('Dependency-name mismatch at #'+i);
   let at=i,cursor=i;const args=[];
   // Climb only along actual app.fn children. Never cross a binder,
   // metadata wrapper, app.arg edge, or declaration boundary.
   while(graph.parent[cursor]>=0){
    const p=graph.parent[cursor];
    if(kind(p)!=='app'||children[p][0]!==cursor)break;
    args.push(children[p][1]);at=p;cursor=p;
   }
   args.reverse();
   const item={constant:i,name,application:at,args};
   byConst.set(i,item);
   if(!byName.has(name))byName.set(name,[]);
   byName.get(name).push(item);
  }
  if(byConst.size!==depend.size)throw Error('Not all indexed references are Expr.const occurrences');
  function atApplication(i){
   if(!Number.isInteger(i)||i<0||i>=n||kind(i)!=='app')return null;
   const args=[];let cur=i;
   while(kind(cur)==='app'){
    const cs=children[cur];args.unshift(cs[1]);cur=cs[0];
   }
   const original=byConst.get(cur);
   return original?{...original,application:i,args,isOutermost:i===original.application}:null;
  }
  return {
   size:byConst.size,
   byDeclaration:name=>(byName.get(name)||[]).slice(),
   atConstant:i=>byConst.get(i)||null,
   atApplication,
   children:i=>(children[i]||[]).slice()
  };
 }
 const api={create};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else host.ProofAtlasApplicationBridge=api;
})(typeof window==='undefined'?globalThis:window);
