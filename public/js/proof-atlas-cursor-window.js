/* Resumable source cuts with bounded display snapshots, using the same notation. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes,W=node?require('./proof-atlas-occurrence-window'):host.ProofAtlasOccurrenceWindow,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry,SP=node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages;
const demand=(v,m)=>{if(!v)throw Error('Cursor window: '+m);},natural=n=>Number.isSafeInteger(n)&&n>=0,fields=['kind','children','payloads','expanded','neededScope'];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
function open(cursor){
 const identity=SP.identity(cursor),data=cursor.data,record=cursor.record,snapshots=new WeakMap();
 async function create(input,options={}){
  const route=freeze(JSON.parse(JSON.stringify(input))),budget=options.maxNodes??13,depthLimit=options.maxDepth??3,layerLimit=options.maxLayerNodes??4;P.parse(route);
  demand(natural(budget)&&budget>=1&&budget<=32&&natural(depthLimit)&&depthLimit<=6&&natural(layerLimit)&&layerLimit>=1&&layerLimit<=4,'display bounds');demand(route.root<data.roots.length,'source root');
  const live=()=>{if(options.signal?.aborted)throw options.signal.reason||Error('aborted');SP.identity(cursor);},read=id=>cursor.run(()=>fields.map(f=>data[f][id]),options),slot=(bytes,i)=>(bytes[i>>2]>>((i%4)*2))&3,extendsContext=(k,s)=>([6,7].includes(k)&&s===1)||(k===8&&s===2);
  async function resolve(r){const bytes=P.parse(r);let current=data.roots[r.root],scopeDepth=0;for(let i=0;i<r.depth;i++){live();const row=await read(current),s=slot(bytes,i);demand(row[1][s]!==undefined,'source field');if(extendsContext(row[0],s))scopeDepth++;current=row[1][s];}
   const row=await read(current),result={node:current,row,scopeDepth,binding:null,unboundIndex:null};if(row[0]!==0)return result;const index=row[2].index;demand(natural(index),'bound index');if(index>=scopeDepth){result.unboundIndex=index;return result;}
   let node=data.roots[r.root],seen=0;for(let i=0;i<r.depth;i++){const parent=await read(node),s=slot(bytes,i);if(extendsContext(parent[0],s)){if(seen===scopeDepth-1-index){result.binding={node,route:P.prefix(r,i)};return result;}seen++;}node=parent[1][s];}throw Error('Cursor window: lexical target missing');
  }
  live();const selected=await resolve(route),sourcePath=data.declaration.rootPaths[route.root],category=sourcePath.startsWith('root.rule.')?'kernel-reduction-rule':sourcePath==='root.type'?'declaration-type':sourcePath==='root.value'?'declaration-value':'serialized-root',namespace=category==='kernel-reduction-rule'?'kernel-rule':'source-expression';
  const nodes=[],edges=[],links=[],layers=[],rows=new Map(),work=[{route,depth:0,parent:null,slot:null}];
  while(work.length){const at=work.shift();if(nodes.length>=budget||at.depth>depthLimit||(layers[at.depth]||0)>=layerLimit)continue;
   const found=await resolve(at.route),[k,children,payload,expanded,needed]=found.row;rows.set(found.node,found.row);let count=1n,scope=k===0?payload.index+1:0;const ports=[];
   for(const [s,id]of children.entries()){const child=await read(id);count+=BigInt(child[3]);scope=Math.max(scope,child[4]-(extendsContext(k,s)?1:0));ports.push({slot:s,field:W.fields[k][s],kernelField:[6,7].includes(k)&&s===0?'binderType':W.fields[k][s],node:id,route:P.append(at.route,[s]),expanded:child[3],displayed:false});}
   demand(count===BigInt(expanded)&&needed===scope,'visible recurrence');
   if(found.binding)rows.set(found.binding.node,await read(found.binding.node));
   const kind=A.kinds[k],v=G.vocabulary[kind],point={id:W.id(at.route),node:found.node,route:at.route,kind,glyph:v.glyph,structuralRole:v.role,depth:at.depth,row:layers[at.depth]||0,scopeDepth:found.scopeDepth,expanded,ports,binding:found.binding,unboundIndex:found.unboundIndex,typeStatus:'not-queried'};
   nodes.push(point);layers[at.depth]=(layers[at.depth]||0)+1;if(at.parent!==null)edges.push({from:at.parent,to:point.id,slot:at.slot});for(const port of ports)work.push({route:port.route,depth:at.depth+1,parent:point.id,slot:port.slot});
  }
  const shown=new Set(nodes.map(p=>p.id));let hidden=0n;for(const point of nodes){for(const port of point.ports){port.displayed=shown.has(W.id(port.route));if(!port.displayed)hidden+=BigInt(port.expanded);}if(point.binding)links.push({from:point.id,to:W.id(point.binding.route),node:point.binding.node,route:point.binding.route,relation:'source-bound-to',namespace:namespace==='kernel-rule'?'kernel-rule-context':'proof-context',boundary:!shown.has(W.id(point.binding.route))});}
  demand(BigInt(nodes.length)+hidden===BigInt(selected.row[3]),'exact frontier partition');
  const scene=freeze({format:'ProofAtlasOccurrenceWindow/1',source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},namespace,root:{node:selected.node,route,sourcePath,category},budget,depthLimit,layerLimit,nodes,edges,links,stats:{retained:String(nodes.length),hidden:String(hidden),represented:selected.row[3]},typing:'not-queried',scope:'Original compiled-source occurrence structure and lexical links. Kernel-rule roots retain their metadata namespace. No inferred typing, source-module hash verification or semantic abstraction.'});
  demand(new TextEncoder().encode(JSON.stringify(scene)).length<=W.limits.metadataBytes&&rows.size<=64,'snapshot bounds');
  const snapshot={serialization:data.serialization,declaration:data.declaration,roots:data.roots};for(const [i,f]of fields.entries())snapshot[f]=new Proxy([],{get(target,key,receiver){if(key==='length')return record.uniqueNodes;if(typeof key==='string'&&/^(0|[1-9]\d*)$/.test(key)){demand(rows.has(Number(key)),'node outside display snapshot');return rows.get(Number(key))[i];}return Reflect.get(target,key,receiver);},set(){throw Error('Cursor window: immutable snapshot');},ownKeys(){throw Error('Cursor window: bounded snapshot cannot enumerate source');}});
  live();const decodedBytes=new TextEncoder().encode(JSON.stringify([...rows])).length;demand(decodedBytes<=8388608,'display snapshot byte bound');snapshots.set(scene,{data:Object.freeze(snapshot),state:Object.freeze({storedSourceRows:rows.size,decodedBytes,rowLimit:64,byteLimit:8388608})});return scene;
 }
 return Object.freeze({create,snapshot:scene=>{demand(snapshots.has(scene),'foreign scene');return snapshots.get(scene).data;},state:scene=>{demand(snapshots.has(scene),'foreign scene');return snapshots.get(scene).state;},source:identity});
}
const api={open};if(node)module.exports=api;else host.ProofAtlasCursorWindow=api;
})(typeof window==='undefined'?globalThis:window);
