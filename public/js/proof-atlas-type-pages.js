/* Producer-validated recorded type tables; bounded pages, original node IDs. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes,W=node?require('./proof-atlas-occurrence-window'):host.ProofAtlasOccurrenceWindow;
const SP=node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages;
const geometry=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry;
const fields=['kind','children','payloads','expanded','neededScope'],limits=Object.freeze({nodes:65536,pageSize:64,pages:16,indexPages:4,pageBytes:1048576,indexBytes:16384,manifestBytes:262144,observationBytes:65536,faults:128});
const demand=(v,m)=>{if(!v)throw Error('Type pages: '+m);},hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s),natural=n=>Number.isSafeInteger(n)&&n>=0;
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const snapshot=v=>JSON.parse(JSON.stringify(v));
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
class MissingTypePage extends Error{constructor(page){super('Type page '+page+' is not resident');this.page=page;}}
async function open(input,{fetcher=host.fetch.bind(host),signal,pageLimit=8,indexLimit=4}={}){
 const d=freeze(snapshot(input));let disposed=false,queue=Promise.resolve();
 const live=s=>{if(signal?.aborted||s?.aborted)throw signal?.reason||s.reason||Error('aborted');demand(!disposed,'disposed');};
 demand(natural(pageLimit)&&pageLimit>=1&&pageLimit<=limits.pages&&natural(indexLimit)&&indexLimit>=1&&indexLimit<=limits.indexPages,'cache bounds');
 demand(hex(d.sha256)&&hex(d.typeTableSha256)&&hex(d.evidenceSha256)&&typeof d.file==='string'&&d.file.startsWith('/public/data/proof-atlas/type-pages/'+d.typeTableSha256+'/')&&/\/type-pages\/[a-f0-9]{64}\/[a-f0-9]{64}\.manifest\.gz$/.test(d.file),'descriptor identity');
 const base=d.file.slice(0,d.file.lastIndexOf('/')+1),pages=new Map(),indices=new Map(),observations=new WeakSet(),scenes=new WeakSet(),stats={pageLoads:0,indexLoads:0,observationLoads:0,evictions:0,faults:0,peakCachedNodes:0,peakCachedBytes:0};
 async function read(descriptor,cap,s){
  live(s);demand(hex(descriptor.sha256)&&natural(descriptor.bytes)&&descriptor.bytes>0&&descriptor.bytes<=cap&&typeof descriptor.file==='string'&&descriptor.file.startsWith(base)&&/^[a-f0-9]{64}\.(manifest|index|page|observation)\.gz$/.test(descriptor.file.slice(base.length)),'asset descriptor');
  const r=await fetcher(descriptor.file,{signal:s||signal});demand(r.ok,'asset unavailable ('+r.status+')');
  const stream=r.body.pipeThrough(new host.DecompressionStream('gzip')),reader=stream.getReader(),chunks=[];let count=0;
  try{while(true){live(s);const part=await reader.read();if(part.done)break;count+=part.value.byteLength;demand(count<=descriptor.bytes&&count<=cap,'asset byte bound');chunks.push(part.value);}}
  catch(error){await reader.cancel(error).catch(()=>{});throw error;}finally{reader.releaseLock();}
  demand(count===descriptor.bytes,'asset decoded size');const bytes=new Uint8Array(count);let at=0;for(const b of chunks){bytes.set(b,at);at+=b.byteLength;}
  demand(await A.digest(bytes)===descriptor.sha256,'asset hash');live(s);return freeze(JSON.parse(new TextDecoder().decode(bytes)));
 }
 const manifest=await read(d,limits.manifestBytes,signal),n=manifest.nodeCount;live();
 let level=0,capacity=64;while(capacity<manifest.pageCount){capacity*=64;level++;}
 demand(manifest.format==='ProofAtlasTypePages/1'&&manifest.typeTableSha256===d.typeTableSha256&&manifest.evidenceSha256===d.evidenceSha256&&natural(n)&&n===d.nodes&&n>0&&n<=limits.nodes&&manifest.pageSize===limits.pageSize&&manifest.pageCount===Math.ceil(n/limits.pageSize)&&manifest.indexLevel===level&&hex(manifest.indexRoot),'manifest identity/bounds');
 demand(manifest.source&&hex(manifest.source.indexSha256)&&hex(manifest.source.sourceSha256)&&typeof manifest.source.name==='string'&&manifest.typeDeclaration?.name===manifest.source.name+' / recorded type'&&Array.isArray(manifest.typeDeclaration.rootPaths)&&manifest.typeDeclaration.rootPaths.length===1&&manifest.typeDeclaration.rootPaths[0]==='computed.native.type','source/type identity');
 demand(manifest.indexSizes&&typeof manifest.indexSizes==='object'&&!Array.isArray(manifest.indexSizes)&&Object.keys(manifest.indexSizes).length<=17&&Object.entries(manifest.indexSizes).every(([k,v])=>hex(k)&&natural(v)&&v>0&&v<=limits.indexBytes),'index inventory');
 const touch=(cache,k)=>{const v=cache.get(k);cache.delete(k);cache.set(k,v);return v;};
 async function index(sha,s){
  if(indices.has(sha))return touch(indices,sha);
  // Index decoded sizes are in their parent descriptor; the root has its own.
  const ref=manifest.indexSizes[sha];demand(natural(ref)&&ref>0&&ref<=limits.indexBytes,'index size');
  const v=await read({file:base+sha+'.index.gz',sha256:sha,bytes:ref},limits.indexBytes,s);live(s);demand(v.format==='ProofAtlasTypeIndex/1'&&Array.isArray(v.children)&&v.children.length>0&&v.children.length<=64&&v.children.every(x=>hex(x.sha256)&&natural(x.bytes)&&x.bytes>0&&x.bytes<=limits.pageBytes),'index shape');
  if(indices.size===indexLimit)indices.delete(indices.keys().next().value);indices.set(sha,v);stats.indexLoads++;return v;
 }
 async function load(page,s){
  live(s);demand(natural(page)&&page<manifest.pageCount,'page address');if(pages.has(page)){touch(pages,page);return;}
  let ref={sha256:manifest.indexRoot,bytes:manifest.indexSizes[manifest.indexRoot]};for(let i=manifest.indexLevel;i>=0;i--){demand(ref.bytes===manifest.indexSizes[ref.sha256],'index parent size');const v=await index(ref.sha256,s),span=64**i,first=Math.floor(page/(64*span))*64*span;demand(v.level===i&&v.first===first&&v.children.length===Math.min(64,Math.ceil((manifest.pageCount-first)/span)),'index range');ref=v.children[Math.floor(page/span)%64];}
  const value=await read({...ref,file:base+ref.sha256+'.page.gz'},limits.pageBytes,s);live(s);
  demand(value.format==='ProofAtlasTypePage/1'&&value.typeTableSha256===d.typeTableSha256&&value.start===page*limits.pageSize&&Array.isArray(value.nodes)&&value.nodes.length===Math.min(limits.pageSize,n-value.start),'page identity');
  for(const [j,row]of value.nodes.entries()){
   demand(Array.isArray(row)&&row.length===5,'type tuple');const [k,children,payload,count,scope]=row;
   demand(natural(k)&&k<12&&k!==1&&k!==2&&Array.isArray(children)&&children.length===(A.fields[A.kinds[k]]?.length||0)&&children.every(c=>natural(c)&&c<value.start+j),'constructor fields/order');
   demand(payload&&typeof payload==='object'&&!Array.isArray(payload)&&typeof count==='string'&&count.length<=4096&&/^[1-9]\d*$/.test(count)&&natural(scope),'payload/count/scope');
   if(k===0)demand(natural(payload.index)&&payload.index<Number.MAX_SAFE_INTEGER,'bound variable index');
  }
  if(pages.size===pageLimit){pages.delete(pages.keys().next().value);stats.evictions++;}pages.set(page,{value,bytes:ref.bytes});stats.pageLoads++;
  stats.peakCachedNodes=Math.max(stats.peakCachedNodes,[...pages.values()].reduce((s,p)=>s+p.value.nodes.length,0));stats.peakCachedBytes=Math.max(stats.peakCachedBytes,[...pages.values()].reduce((s,p)=>s+p.bytes,0));
 }
 const storage={serialization:'ExprDAG/1',declaration:manifest.typeDeclaration};
 for(const [i,field]of fields.entries())storage[field]=new Proxy([],{get(target,key,receiver){live();if(key==='length')return n;if(typeof key==='string'&&/^(0|[1-9]\d*)$/.test(key)){const id=Number(key);demand(natural(id)&&id<n,'type node');const page=Math.floor(id/limits.pageSize);if(!pages.has(page)){stats.faults++;throw new MissingTypePage(page);}return touch(pages,page).value.nodes[id%limits.pageSize][i];}return Reflect.get(target,key,receiver);},set(){throw Error('Type pages: immutable table');},ownKeys(){throw Error('Type pages: whole-table enumeration unavailable');}});
 function run(fn,{signal:s}={}){const task=async()=>{for(let i=0;i<limits.faults;i++){live(s);try{const value=await fn();live(s);return value;}catch(error){live(s);if(!(error instanceof MissingTypePage))throw error;await load(error.page,s);}}throw Error('Type pages: working-set retry limit; no complete-table fallback');};const result=queue.then(task,task);queue=result.catch(()=>{});return result;}
 async function readObservation(input,{signal:s}={},construction=false){
  const descriptor=freeze(snapshot(input)),o=await read(descriptor,limits.observationBytes,s);
  demand(o.format===(construction?'ProofAtlasPagedConstructionTypeObservation/1':'ProofAtlasPagedTypeObservation/1')&&o.typeTableSha256===d.typeTableSha256&&o.evidenceSha256===d.evidenceSha256&&o.sourceIndexSha256===manifest.source.indexSha256&&typeof o.evidenceFile==='string'&&o.evidenceFile.startsWith('/public/data/proof-atlas/')&&!o.evidenceFile.split('/').includes('..')&&o.evidenceFile.endsWith('.gz')&&natural(o.root)&&o.root<n&&natural(o.sourceNode)&&natural(o.contextLength)&&['proof','type','value'].includes(o.role),'observation identity');
  P.parse(o.sourceRoute);demand(o.typeRecord?.name===manifest.typeDeclaration.name&&o.typeRecord.uniqueNodes===n&&o.typeRecord.sourceSha256===manifest.source.sourceSha256&&o.typeRecord.indexSha256===o.origin?.typeComponentSha256&&hex(o.typeRecord.indexSha256)&&o.origin.evidenceSha256===d.evidenceSha256&&o.origin.typeTableSha256===d.typeTableSha256&&o.origin.contextLength===o.contextLength&&JSON.stringify(o.origin.sourceRoute)===JSON.stringify(o.sourceRoute)&&o.origin.sourceIndexSha256===o.sourceIndexSha256,'observation origin');
  demand(o.contextLength<=o.sourceRoute.depth&&o.origin.typeTableRoot===o.root,'component context/root');
  if(construction){
   const recipe=o.recipe,recording=o.origin.recording;
   demand(recipe?.format==='ProofAtlasConstructionTypeComponent/1'&&Object.keys(recipe).sort().join(',')==='evidenceSha256,format,root,typeComponentSha256,typeTableRoot,typeTableSha256'&&recipe.evidenceSha256===o.evidenceSha256&&recipe.typeTableSha256===o.typeTableSha256&&natural(recipe.typeTableRoot)&&recipe.typeTableRoot<n&&recipe.root===o.root&&hex(recipe.typeComponentSha256),'construction component recipe');
   demand(await A.digest(new TextEncoder().encode(canonical({format:'ProofAtlasRecordedTypeComponent/1',evidenceSha256:recipe.evidenceSha256,typeTableSha256:recipe.typeTableSha256,typeTableRoot:recipe.typeTableRoot})))===recipe.typeComponentSha256,'construction base recorded identity');
   demand(await A.digest(new TextEncoder().encode(canonical(recipe)))===o.origin.typeComponentSha256,'construction component identity');
   demand(recording?.kind==='construction-premise-observation'&&['kernel','meta'].includes(recording.observation)&&['conclusion','binderType','body','fn','arg','type','value'].includes(recording.field)&&natural(recording.constructionNode)&&natural(recording.queryNode),'construction recording');P.parse(recording.constructionRoute);P.parse(recording.queryRoute);
  }else demand(await A.digest(new TextEncoder().encode(canonical({format:'ProofAtlasRecordedTypeComponent/1',evidenceSha256:o.evidenceSha256,typeTableSha256:o.typeTableSha256,typeTableRoot:o.root})))===o.origin.typeComponentSha256,'recorded component identity');
  live(s);observations.add(o);stats.observationLoads++;return o;
 }
 async function scene(o,sourceCursor,route=P.encode(0,[]),inputOptions={}){
  route=freeze(snapshot(route));const options={...inputOptions},budget=options.maxNodes??9,depthLimit=options.maxDepth??2;live(options.signal);
  demand(observations.has(o),'foreign observation');demand(natural(budget)&&budget>=1&&budget<=13&&natural(depthLimit)&&depthLimit<=3,'display bounds');
  const sourceIdentity=SP.identity(sourceCursor);demand(sourceIdentity.name===manifest.source.name&&sourceIdentity.indexSha256===manifest.source.indexSha256&&sourceIdentity.sourceSha256===manifest.source.sourceSha256,'source cursor identity');
  const source=sourceCursor.data,typeRead=id=>run(()=>fields.map(f=>storage[f][id]),options),sourceRead=id=>sourceCursor.run(()=>[source.kind[id],source.children[id],source.payloads[id]],options);
  const step=(bytes,i)=>(bytes[i>>2]>>((i%4)*2))&3,extendsContext=(k,s)=>([6,7].includes(k)&&s===1)||(k===8&&s===2);
  // Each await completes a single row access. An eviction never restarts the
  // accumulated route traversal or needs to retain all ancestor rows.
  async function locate(root,r,read,withBinding){
   const bytes=P.parse(r);let current=root,scopeDepth=0;
   for(let i=0;i<r.depth;i++){live(options.signal);const row=await read(current),slot=step(bytes,i);demand(row[1][slot]!==undefined,'route field');if(extendsContext(row[0],slot))scopeDepth++;current=row[1][slot];}
   const row=await read(current),result={node:current,row,scopeDepth,binding:null,unboundIndex:null};
   if(row[0]!==0||!withBinding)return result;
   const index=row[2].index;if(index>=scopeDepth){result.unboundIndex=index;return result;}
   result.binding=await binder(root,r,scopeDepth-1-index,read);return result;
  }
  async function binder(root,r,ordinal,read){
   const bytes=P.parse(r);let current=root,seen=0;
   for(let i=0;i<r.depth;i++){const row=await read(current),slot=step(bytes,i);if(extendsContext(row[0],slot)){if(seen===ordinal)return{node:current,route:P.prefix(r,i)};seen++;}demand(row[1][slot]!==undefined,'binder route field');current=row[1][slot];}
   throw Error('Type pages: original context target missing');
  }
  demand(o.sourceRoute.root<source.roots.length&&natural(o.sourceNode),'source root/node');
  const original=await locate(source.roots[o.sourceRoute.root],o.sourceRoute,sourceRead,false);demand(original.node===o.sourceNode&&original.scopeDepth===o.contextLength,'source occurrence/context');
  P.parse(route);demand(route.root===0&&route.depth<n,'type root/path');
  demand((await typeRead(o.root))[4]<=o.contextLength,'type ambient scope');
  const selected=await locate(o.root,route,typeRead,true),nodes=[],edges=[],layers=[],queue=[{route,depth:0,parent:null,slot:null}];
  while(queue.length){
   const at=queue.shift();if(nodes.length>=budget||at.depth>depthLimit||(layers[at.depth]||0)>=3)continue;
   const actual=await locate(o.root,at.route,typeRead,true),[kind,children,payload,expanded,needed]=actual.row;
   let count=1n,scope=kind===0?payload.index+1:0;
   const ports=[];
   for(const [slot,id]of children.entries()){
    const child=await typeRead(id);count+=BigInt(child[3]);scope=Math.max(scope,child[4]-(extendsContext(kind,slot)?1:0));
    ports.push({slot,field:W.fields[kind][slot],kernelField:[6,7].includes(kind)&&slot===0?'binderType':W.fields[kind][slot],node:id,route:P.append(at.route,[slot]),expanded:child[3],displayed:false});
   }
   demand(count===BigInt(expanded)&&scope===needed,'visible recurrence');
   const name=A.kinds[kind];let binding=null;
   if(actual.binding){const target=await typeRead(actual.binding.node);binding={namespace:'computed-native-type',node:actual.binding.node,route:actual.binding.route,...(target[0]===8?{bindingClass:'local-definition'}:{})};}
   else if(kind===0){const index=payload.index-actual.scopeDepth,ordinal=o.contextLength-1-index;demand(natural(ordinal)&&ordinal<o.contextLength,'ambient type index');const target=await binder(source.roots[o.sourceRoute.root],o.sourceRoute,ordinal,sourceRead),row=await sourceRead(target.node);binding={namespace:'original-source-context',ordinal,...target,...(row[0]===8?{bindingClass:'local-definition'}:{})};}
   const point={id:W.id(at.route),node:actual.node,route:at.route,kind:name,glyph:geometry.vocabulary[name].glyph,structuralRole:geometry.vocabulary[name].role,depth:at.depth,row:layers[at.depth]||0,scopeDepth:actual.scopeDepth,expanded,ports,binding,unboundIndex:actual.unboundIndex,typeStatus:'type-syntax-only',payload,namespace:'computed-native-type'};
   nodes.push(point);layers[at.depth]=(layers[at.depth]||0)+1;if(at.parent!==null)edges.push({from:at.parent,to:point.id,slot:at.slot});
   for(const port of ports)queue.push({route:port.route,depth:at.depth+1,parent:point.id,slot:port.slot});
  }
  const shown=new Set(nodes.map(p=>p.id));let hidden=0n;for(const point of nodes)for(const port of point.ports){port.displayed=shown.has(W.id(port.route));if(!port.displayed)hidden+=BigInt(port.expanded);}
  demand(BigInt(nodes.length)+hidden===BigInt(selected.row[3]),'exact frontier partition');
  const result={format:'ProofAtlasCompactTypeScene/1',namespace:'computed-native-type',origin:o.origin,root:{node:selected.node,route,category:'recorded-type-expression'},nodes,edges,links:nodes.filter(p=>p.binding).map(p=>({from:p.id,...p.binding})),stats:{retained:String(nodes.length),hidden:String(hidden),represented:selected.row[3]},guarantee:'Structure of a recorded native type in its original context. Type descendants have no additional typing judgments.'};
  demand(new TextEncoder().encode(JSON.stringify(result)).length<=W.limits.metadataBytes,'scene byte bound');live(options.signal);freeze(result);scenes.add(result);return result;
 }
 async function presentation(scene,sourceCursor,options={}){
  live(options.signal);demand(scenes.has(scene),'foreign type scene');const identity=SP.identity(sourceCursor);demand(identity.indexSha256===manifest.source.indexSha256&&identity.sourceSha256===manifest.source.sourceSha256,'presentation source identity');
  const descriptions={},bindings={};
  for(const point of scene.nodes){const text=await run(()=>A.describe(storage,point.node),options);descriptions[point.node]=text.length<=1600?text:text.slice(0,1600)+'… [constructor preview clipped; exact payload retained]';}
  for(const link of scene.links){const id=link.namespace+':'+link.route.root+':'+link.route.depth+':'+link.route.slots;if(bindings[id])continue;const source=link.namespace==='original-source-context',row=source?await sourceCursor.run(()=>[sourceCursor.data.kind[link.node],sourceCursor.data.payloads[link.node]],options):await run(()=>[storage.kind[link.node],storage.payloads[link.node]],options);bindings[id]={kind:A.kinds[row[0]],name:row[1].binderName||row[1].declName||'_',payload:row[1]};}
  live(options.signal);demand(new TextEncoder().encode(JSON.stringify({descriptions,bindings})).length<=8388608,'presentation byte bound');return freeze({descriptions,bindings});
 }
 function table(o){live();demand(observations.has(o),'foreign observation');return Object.freeze({data:Object.freeze({...storage,roots:Object.freeze([o.root])}),record:o.typeRecord});}
 return Object.freeze({manifest,observation:(input,options)=>readObservation(input,options,false),constructionObservation:(input,options)=>readObservation(input,options,true),run,scene,presentation,table,state:()=>({...stats,cachedPages:pages.size,cachedNodes:[...pages.values()].reduce((s,p)=>s+p.value.nodes.length,0),completeTableResident:[...pages.values()].reduce((s,p)=>s+p.value.nodes.length,0)===n,indexPages:indices.size,pageLimit,indexLimit,nodeLimit:pageLimit*limits.pageSize,fullTableArchiveRequests:0,validation:'producer-validated native table; fetched pages checked by hash/local shape, visible recurrences and original source context'}),dispose:()=>{disposed=true;pages.clear();indices.clear();}});
}
const api={open,limits,MissingTypePage};if(node)module.exports=api;else host.ProofAtlasTypePages=api;
})(typeof window==='undefined'?globalThis:window);
