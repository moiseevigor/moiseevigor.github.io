/* Bounded source cuts with compact original occurrence addresses. No inferred typing. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry;
 const kinds=[...A.kinds],fields=kinds.map(k=>G.vocabulary[k].ports);
 const limits=Object.freeze({nodes:32,depth:6,layer:4,metadataBytes:8388608,countDigits:4096});
 const demand=(ok,message)=>{if(!ok)throw Error('Occurrence window: '+message);};
 const natural=n=>Number.isSafeInteger(n)&&n>=0,hash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
 const amount=s=>{demand(typeof s==='string'&&s.length<=limits.countDigits&&/^[1-9]\d*$/.test(s),'occurrence count bound');return BigInt(s);};
 const id=r=>r.root+':'+r.depth+':'+r.slots;
 function validateSource(data,record){
  const n=record?.uniqueNodes;
  demand(natural(n)&&n>0&&n<=P.limits.sourceNodes&&hash(record.indexSha256)&&hash(record.sourceSha256),'source inventory');
  demand(data?.serialization==='ExprDAG/1'&&data.declaration?.name===record.name,'source identity');
  demand(['kind','children','payloads','expanded','neededScope'].every(f=>Array.isArray(data[f])&&data[f].length===n),'source tables');
  for(let i=0;i<n;i++){
   const k=data.kind[i],cs=data.children[i];
   demand(natural(k)&&k<12&&Array.isArray(cs)&&cs.length===fields[k].length&&cs.every(c=>natural(c)&&c<i),'constructor fields/order');
   demand(data.payloads[i]&&typeof data.payloads[i]==='object'&&!Array.isArray(data.payloads[i]),'constructor payload');
   demand(amount(data.expanded[i])===1n+cs.reduce((sum,c)=>sum+amount(data.expanded[c]),0n),'source count recurrence');
   let needed=0;
   if(k===0){demand(natural(data.payloads[i].index)&&data.payloads[i].index<Number.MAX_SAFE_INTEGER,'bound variable index');needed=data.payloads[i].index+1;}
   else for(let slot=0;slot<cs.length;slot++)needed=Math.max(needed,data.neededScope[cs[slot]]-(((k===6||k===7)&&slot===1||k===8&&slot===2)?1:0));
   demand(natural(data.neededScope[i])&&data.neededScope[i]===needed,'source scope recurrence');
  }
  demand(Array.isArray(data.roots)&&data.roots.length>0&&data.roots.length<=P.limits.roots&&data.roots.every(r=>natural(r)&&r<n),'original source roots');
  demand(Array.isArray(data.declaration.rootPaths)&&data.declaration.rootPaths.length===data.roots.length&&data.declaration.rootPaths.every(p=>typeof p==='string'&&p.length<=512),'original root labels');
  return data;
 }
 function token(record,route){P.parse(route);demand(hash(record.indexSha256),'token source hash');return record.indexSha256+'.'+route.root+'.'+route.depth+'.'+route.slots;}
 function representatives(data){
  const n=data.kind.length;demand(natural(n)&&n>0&&n<=P.limits.sourceNodes,'representative source bound');
  const parents=new Int32Array(n).fill(-2),slots=new Uint8Array(n),origins=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
  data.roots.forEach((node,root)=>{if(parents[node]===-2){parents[node]=-1;origins[node]=root;queue[tail++]=node;}});
  while(head<tail){const node=queue[head++];data.children[node].forEach((child,slot)=>{if(parents[child]===-2){parents[child]=node;slots[child]=slot;origins[child]=origins[node];queue[tail++]=child;}});}
  return{state:{storedNodes:n,indexBytes:parents.byteLength+slots.byteLength+origins.byteLength+queue.byteLength},route:node=>{demand(natural(node)&&node<n&&parents[node]!==-2,'stored node has no source-root occurrence');const root=origins[node],reverse=new Uint8Array(n);let size=0;while(parents[node]>=0){demand(size<n,'representative path bound');reverse[size++]=slots[node];node=parents[node];}return P.encodeReversed(root,reverse.subarray(0,size));}};
 }
 function fromToken(record,text){
  demand(typeof text==='string'&&text.length<=87500,'address token bound');
  const match=/^([a-f0-9]{64})\.(0|[1-9]\d*)\.(0|[1-9]\d*)\.([A-Za-z0-9_-]*)$/.exec(text);
  demand(match&&match[1]===record.indexSha256,'address belongs to another source packet');
  const value={format:'ProofAtlasPackedRoute/1',root:Number(match[2]),depth:Number(match[3]),slots:match[4]};P.parse(value);return value;
 }
 // The caller authenticates and validates the immutable source once per load.
 function create(data,record,route,options={}){
  const budget=options.maxNodes??13,depthLimit=options.maxDepth??3,layerLimit=options.maxLayerNodes??4;
  demand(natural(budget)&&budget>=1&&budget<=limits.nodes&&natural(depthLimit)&&depthLimit<=limits.depth&&natural(layerLimit)&&layerLimit>=1&&layerLimit<=limits.layer,'display bounds');
  const selected=P.resolve(data,route),sourcePath=data.declaration.rootPaths[route.root],category=sourcePath.startsWith('root.rule.')?'kernel-reduction-rule':sourcePath==='root.type'?'declaration-type':sourcePath==='root.value'?'declaration-value':'serialized-root',namespace=category==='kernel-reduction-rule'?'kernel-rule':'source-expression';
  const nodes=[],edges=[],links=[],layers=[],work=[{route,depth:0,parent:null,slot:null}];
  while(work.length){
   const at=work.shift();if(nodes.length>=budget||at.depth>depthLimit||(layers[at.depth]||0)>=layerLimit)continue;
   const resolved=P.resolve(data,at.route),n=resolved.node,k=data.kind[n],rule=G.vocabulary[kinds[k]],entry={id:id(at.route),node:n,route:at.route,kind:kinds[k],glyph:rule.glyph,structuralRole:rule.role,depth:at.depth,row:layers[at.depth]||0,scopeDepth:resolved.scopeDepth,expanded:data.expanded[n],ports:[],binding:resolved.binding,unboundIndex:resolved.unboundIndex??null,typeStatus:'not-queried'};
   nodes.push(entry);layers[at.depth]=(layers[at.depth]||0)+1;
   if(at.parent!==null)edges.push({from:at.parent,to:entry.id,slot:at.slot});
   for(let slot=0;slot<data.children[n].length;slot++){
    const child=data.children[n][slot],childRoute=P.append(at.route,[slot]);
    const port={slot,field:fields[k][slot],kernelField:(k===6||k===7)&&slot===0?'binderType':fields[k][slot],node:child,route:childRoute,expanded:data.expanded[child],displayed:false};
    entry.ports.push(port);work.push({route:childRoute,depth:at.depth+1,parent:entry.id,slot});
   }
  }
  const shown=new Set(nodes.map(n=>n.id));let hidden=0n;
  for(const n of nodes){
   for(const port of n.ports){port.displayed=shown.has(id(port.route));if(!port.displayed)hidden+=amount(port.expanded);}
   if(n.binding)links.push({from:n.id,to:id(n.binding.route),node:n.binding.node,route:n.binding.route,relation:'source-bound-to',namespace:namespace==='kernel-rule'?'kernel-rule-context':'proof-context',boundary:!shown.has(id(n.binding.route))});
  }
  const total=amount(data.expanded[selected.node]);demand(BigInt(nodes.length)+hidden===total,'complete frontier accounting');
  const scene={format:'ProofAtlasOccurrenceWindow/1',source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},namespace,root:{node:selected.node,route,sourcePath,category},budget,depthLimit,layerLimit,nodes,edges,links,stats:{retained:String(nodes.length),hidden:String(hidden),represented:String(total)},typing:'not-queried',scope:'Original compiled-source occurrence structure and lexical links. Kernel-rule roots retain their metadata namespace. No inferred typing, source-module hash verification or semantic abstraction.'};
  demand(new TextEncoder().encode(JSON.stringify(scene)).length<=limits.metadataBytes,'scene metadata bound; reduce the display budget');
  return scene;
 }
 const api={create,validateSource,representatives,token,fromToken,id,fields,kinds,limits};
 if(node)module.exports=api;else host.ProofAtlasOccurrenceWindow=api;
})(typeof window==='undefined'?globalThis:window);
