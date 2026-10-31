/* The existing recoverable grammar over a bounded, page-fed row map.
   No sparse arrays sized to the complete table and no second grammar. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,T=node?require('./proof-atlas-type-notation'):host.ProofAtlasTypeNotation,R=node?require('./proof-atlas-notation-refinement'):host.ProofAtlasNotationRefinement;
 const limits=Object.freeze({rows:8192,rowBytes:4194304,batch:64,path:512,context:512,contextBytes:4194304});
 const copy=x=>JSON.parse(JSON.stringify(x)),nat=x=>Number.isSafeInteger(x)&&x>=0,demand=(v,m)=>{if(!v)throw Error('Paged notation: '+m);};
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2,bytes=v=>new TextEncoder().encode(JSON.stringify(v)).length;
 class NeedRow extends Error{constructor(id){super('Paged notation row '+id);this.id=id;}}
 function open({read,nodeCount,roots,owner,catalog,context=[],rowLimit=limits.rows,byteLimit=limits.rowBytes,batchSize=limits.batch,signal}){
  demand(T&&R&&typeof read==='function'&&nat(nodeCount)&&nodeCount>0&&nodeCount<=262144,'row accessor/table bounds');
  roots=copy(roots);owner=freeze(copy(owner));catalog=freeze(copy(catalog));context=freeze(copy(context));
  demand(Array.isArray(roots)&&roots.length>0&&roots.length<=512&&roots.every(n=>nat(n)&&n<nodeCount)&&nat(owner?.typeRoot)&&owner.typeRoot<roots.length&&typeof owner.namespace==='string'&&owner.namespace,'qualified component');
  demand(nat(rowLimit)&&rowLimit>0&&rowLimit<=limits.rows&&nat(byteLimit)&&byteLimit>0&&byteLimit<=limits.rowBytes&&nat(batchSize)&&batchSize>0&&batchSize<=64,'delivery bounds');
  demand(context.length<=512&&context.every(c=>typeof c.name==='string'&&(c.address||c.origin)?.namespace)&&bytes(context)<=limits.contextBytes,'original context');
  const rows=new Map();let rowBytes=0,disposed=false,active=false,current=null,loads=0,batches=0,attempts=0,peakRows=0,peakBytes=0;
  const live=local=>{demand(!disposed,'disposed');if(signal?.aborted||local?.aborted)throw signal?.reason||local.reason||Error('Notation cancelled');};
  const origin=(id,slots)=>({...copy(owner),node:id,slots:copy(slots)});
  const graph={serialization:'ExprDAG/1',roots};
  for(const[i,field]of['kind','children','payloads','expanded','neededScope'].entries())graph[field]=new Proxy(Object.create(null),{get(_,key){if(key==='length')return nodeCount;const id=Number(key);demand(nat(id)&&id<nodeCount,'row index');const tuple=rows.get(id);if(!tuple)throw new NeedRow(id);return tuple[i];}});
  async function load(id,local){
   const start=Math.floor(id/batchSize)*batchSize;batches++;
   for(let n=start;n<Math.min(start+batchSize,nodeCount);n++){
    live(local);if(rows.has(n))continue;demand(rows.size<rowLimit,'decoded row bound');
    const tuple=await read(n,{signal:local||signal});live(local);
    demand(Array.isArray(tuple)&&tuple.length===5&&nat(tuple[0])&&tuple[0]<12&&Array.isArray(tuple[1])&&tuple[1].every(c=>nat(c)&&c<n)&&tuple[2]&&typeof tuple[2]==='object'&&typeof tuple[3]==='string'&&/^[1-9]\d*$/.test(tuple[3])&&tuple[3].length<=4096&&nat(tuple[4]),'checked row tuple');
    const size=bytes(tuple);demand(rowBytes+size<=byteLimit,'decoded row byte bound');
    rows.set(n,freeze(copy(tuple)));rowBytes+=size;loads++;peakRows=Math.max(peakRows,rows.size);peakBytes=Math.max(peakBytes,rowBytes);
   }
  }
  async function available(task,local){
   for(let tries=0;tries<=rowLimit;tries++){
    live(local);attempts++;
    try{return task();}catch(e){if(!(e instanceof NeedRow))throw e;await load(e.id,local);}
   }
   throw Error('Paged notation: grammar retry bound');
  }
  function contextAt(slots){
   demand(Array.isArray(slots)&&slots.length<=512&&slots.every(s=>nat(s)&&s<3),'component path');
   let id=roots[owner.typeRoot],ambient=[...context];
   for(const[depth,slot]of slots.entries()){
    const kind=graph.kind[id],children=graph.children[id];demand(slot<children.length,'ordered component field');
    if(binds(kind,slot)){const p=graph.payloads[id];ambient.push({name:p.binderName||p.declName||'_',address:origin(id,slots.slice(0,depth))});}
    id=children[slot];
   }
   demand(ambient.length<=512&&bytes(ambient)<=limits.contextBytes,'enclosing context bound');return{id,ambient};
  }
  const localScene=(slots,budget)=>{const{id,ambient}=contextAt(slots);return T.scene(graph,id,catalog,{slots,context:ambient,address:origin,budget});};
  async function run(task,local){live(local);demand(!active,'an operation is already active');active=true;try{const result=await task();live(local);return result;}finally{active=false;}}
  return Object.freeze({
   getScene:()=>current,
   inspect(slots=[],options={}){slots=copy(slots);return run(async()=>{const result=await available(()=>localScene(slots,options.budget??48),options.signal);current=freeze(result);return current;},options.signal);},
   expand(scene,slots,options={}){slots=copy(slots);return run(async()=>{
    demand(scene===current,'foreign or retired notation scene');
    const result=await available(()=>{let replacement=localScene(slots,48);if(replacement.root.kind==='frontier')replacement=R.openConstructor(graph,replacement);return R.refine(graph,scene,slots,replacement);},options.signal);
    current=result;return current;
   },options.signal);},
   state:()=>({disposed,active,cachedRows:rows.size,decodedRowBytes:rowBytes,peakRows,peakBytes,loads,batches,grammarAttempts:attempts,rowLimit,byteLimit,batchSize,completeTableArraysAllocated:0,currentObjects:current?.stats.nodes||0,tableRows:nodeCount,
    scope:'Bounded decoded rows plus one notation scene. A cache may cover a small table. The supplied accessor owns its separate cache and source authentication; no total-heap or typing claim.'}),
   dispose:()=>{disposed=true;rows.clear();rowBytes=0;current=null;context=[];catalog=null;roots=[];graph.roots=[];}
  });
 }
 const api={open,limits};if(node)module.exports=api;else host.ProofAtlasPagedNotation=api;
})(typeof window==='undefined'?globalThis:window);
