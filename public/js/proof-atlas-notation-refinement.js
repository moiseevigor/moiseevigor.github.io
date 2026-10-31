/* Local opening is a union of source cuts. Outside notation objects retain
   their identity; an exhausted budget rejects rather than hiding inspected work. */
(function(host){
 'use strict';
 const isNode=typeof module!=='undefined'&&module.exports,U=isNode?require('./proof-atlas-source-cut-union'):host.ProofAtlasSourceCutUnion,A=isNode?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const limits=Object.freeze({nodes:192,bytes:4194304,path:512}),demand=(ok,m)=>{if(!ok)throw Error('Notation refinement: '+m);};
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v,same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b)),prefix=(a,b)=>a.length<=b.length&&a.every((s,i)=>s===b[i]);
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 function refine(g,current,slots,replacement){
  demand(U&&Array.isArray(slots)&&slots.length<=limits.path,'source cut module/path');
  demand(current?.format==='ProofAtlasTypeNotationScene/1'&&replacement?.format===current.format&&current.rule==='recoverable-call-notation/1'&&current.rule===replacement.rule&&current.catalogNativeSha256===replacement.catalogNativeSha256,'same notation rule/catalogue');
  const before=U.fromNotation(g,current),local=U.fromNotation(g,replacement);let target=null,visited=0;
  function locate(n){demand(++visited<=limits.nodes&&n.nodes===1+n.children.reduce((s,c)=>s+c.value.nodes,0),'current scene bound/accounting');if(same(n.slots,slots)){demand(!target,'unique frontier');target=n;}n.children.forEach(c=>locate(c.value));}
  locate(current.root);demand(visited===current.stats.nodes&&new TextEncoder().encode(JSON.stringify(current.root)).length<=limits.bytes,'current object/byte bound');demand(target?.kind==='frontier','select an existing frontier');
  demand(same(target.origin,replacement.root.origin)&&target.expanded===replacement.root.expanded,'exact frontier origin');
  demand(BigInt(replacement.stats.retained)>0n,'frontier cannot open within the local limits');
  const nodes=current.stats.nodes-1+replacement.stats.nodes;demand(nodes<=limits.nodes,'192-object limit reached; select a region to inspect separately');
  function replace(n){
   if(n===target)return replacement.root;
   if(!prefix(n.slots,slots))return n;
   const children=n.children.map(c=>{const value=replace(c.value);return value===c.value?c:{...c,value};});
   if(children.every((c,i)=>c===n.children[i]))return n;
   const delta=field=>children.reduce((sum,c,i)=>sum+BigInt(c.value[field])-BigInt(n.children[i].value[field]),0n);
   return{...n,children,nodes:1+children.reduce((s,c)=>s+c.value.nodes,0),retained:String(BigInt(n.retained)+delta('retained')),hidden:String(BigInt(n.hidden)+delta('hidden'))};
  }
  const root=replace(current.root),bytes=new TextEncoder().encode(JSON.stringify(root)).length;
  demand(root.nodes===nodes&&bytes<=limits.bytes,'scene object/byte bound');
  const result={...current,root,stats:{...current.stats,nodes,retained:root.retained,hidden:root.hidden,metadataBytes:bytes,work:current.stats.work+replacement.stats.work},
   limits:{...current.limits,nodes:limits.nodes,depth:limits.path,localDepth:current.limits.localDepth||current.limits.depth},
   refinement:{rule:'source-cut-union/1',steps:(current.refinement?.steps||0)+1,opened:target.origin,retainedBefore:before.stats.retained,retainedAfter:root.retained}};
  const after=U.fromNotation(g,result),embedded=U.embed(g,before.root.owner,local),expected=U.join(g,before,embedded);
  demand(same(after,expected)&&U.refines(g,before,after),'least common source refinement');return freeze(result);
 }
 // An application with more operands than the local display budget cannot be
 // opened as one folded call. Its raw constructor still has at most three ports.
 function openConstructor(g,blocked){
  const old=U.fromNotation(g,blocked),owner=old.root.owner,node=owner.node,slots=owner.slots;
  demand(blocked.root.kind==='frontier','constructor fallback requires a frontier');
  demand(slots.length<limits.path||!g.children[node].length,'source path limit reached');
  const children=g.children[node].map((id,slot)=>{const path=[...slots,slot];return{field:A.fields[A.kinds[g.kind[node]]][slot],value:{kind:'frontier',rawKind:A.kinds[g.kind[id]],label:'⟨'+A.kinds[g.kind[id]]+' · '+g.expanded[id]+' occurrences⟩',origin:{...owner,node:id,slots:path},slots:path,children:[],retained:'0',hidden:g.expanded[id],expanded:g.expanded[id],nodes:1,reason:'constructor field'}};});
  const root={kind:'constructor',rawKind:A.kinds[g.kind[node]],label:A.kinds[g.kind[node]],origin:owner,slots,children,retained:'1',hidden:String(BigInt(g.expanded[node])-1n),expanded:g.expanded[node],nodes:1+children.length,hiddenPorts:[],foldedPorts:[],residual:null,signature:null};
  const result={...blocked,root,stats:{...blocked.stats,nodes:root.nodes,retained:root.retained,hidden:root.hidden,metadataBytes:new TextEncoder().encode(JSON.stringify(root)).length,work:1+children.length}};U.fromNotation(g,result);return freeze(result);
 }
 const api={refine,openConstructor,limits};if(isNode)module.exports=api;else host.ProofAtlasNotationRefinement=api;
})(typeof window==='undefined'?globalThis:window);
