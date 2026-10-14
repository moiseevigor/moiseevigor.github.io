/* Exact occurrence anchors with reviewed article scope. Sharing never replaces the selected path. */
(function(host){
 'use strict';
 function create(index,articleHash){
  const ids=new Set(),packets=new Map((index?.packets||[]).map(p=>[p.name,p])),passages=new Map(),verified=new Set();
  const valid=index?.format==='ProofAtlasProofSteps/1'&&index.articleSha256===articleHash&&index.edition==='published-15'&&index.passages.every(p=>{
   if(ids.has(p.id))return false;ids.add(p.id);passages.set(p.id,p);return['partial','unmapped'].includes(p.status)&&Array.isArray(p.declarations);
  })&&index.anchors.every(a=>passages.has(a.step)&&packets.has(a.declaration)&&/^root\.(type|value)(\.[a-zA-Z]+)*$/.test(a.path)&&Number.isInteger(a.node)&&a.node>=0);
  function route(data,path,A){
   const root=data.declaration.rootPaths.findIndex(p=>path===p||path.startsWith(p+'.'));if(root<0)throw Error('Proof-step root is absent');let node=data.roots[root];const slots=[];
   for(const field of path.slice(data.declaration.rootPaths[root].length).split('.').filter(Boolean)){const j=(A.fields[A.kinds[data.kind[node]]]||[]).indexOf(field);if(j<0)throw Error('Proof-step path is absent');slots.push(j);node=data.children[node][j];}
   return{node,route:{root,slots}};
  }
  function validate(snapshot,data,A){
   if(!valid)throw Error('Proof-step index does not match the article');const packet=packets.get(snapshot.name);if(!packet)return;
   if(snapshot.edition!==index.edition||snapshot.indexSha256!==packet.indexSha256||snapshot.sourceSha256!==packet.sourceSha256||data.declaration.name!==snapshot.name)throw Error('Proof-step index does not match the compiled declaration');
   if(verified.has(snapshot.name))return;
   for(const a of index.anchors.filter(a=>a.declaration===snapshot.name)){
    const found=route(data,a.path,A);if(found.node!==a.node||A.kinds[data.kind[a.node]]!==a.kind)throw Error('Proof-step occurrence mismatch');
    if(a.callee){let i=a.node,count=0;while(data.kind[i]===5){count++;i=data.children[i][0];}if(data.kind[i]!==4||data.payloads[i].name!==a.callee||count!==a.arity)throw Error('Proof-step call is incomplete or has changed');}
   }
   verified.add(snapshot.name);
  }
  function resolve(snapshot){
   if(!valid||snapshot.edition!==index.edition)return[];const packet=packets.get(snapshot.name);if(!packet)return[];
   if(snapshot.indexSha256!==packet.indexSha256||snapshot.sourceSha256!==packet.sourceSha256)throw Error('Stale proof-step packet');
   const matches=index.anchors.filter(a=>a.declaration===snapshot.name&&(snapshot.path===a.path||snapshot.path.startsWith(a.path+'.'))),length=Math.max(0,...matches.map(a=>a.path.length));
   return matches.filter(a=>a.path.length===length).map(a=>({passage:passages.get(a.step),anchor:a,inherited:snapshot.path!==a.path}));
  }
  return{valid,passages:[...passages.values()],anchors:index?.anchors||[],validate,resolve,route,hasDeclaration:name=>packets.has(name)};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasProofStepIndex=api;
})(typeof window==='undefined'?globalThis:window);
