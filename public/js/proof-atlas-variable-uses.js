/* Sparse recorded-use references. Native typing remains attached to original observations. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes;
const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
const limits=Object.freeze({pageRows:8,pageBytes:65536,manifestBytes:65536,pages:1024,resultRows:8,resultBytes:131072,scanRows:32,pageReads:8});
const demand=(v,m)=>{if(!v)throw Error('Recorded variable uses: '+m);};
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const bytes=v=>new TextEncoder().encode(canonical(v)+'\n');
const copy=v=>JSON.parse(JSON.stringify(v));
const key=r=>r.root+':'+r.depth+':'+r.slots;
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const natural=n=>Number.isSafeInteger(n)&&n>=0;
function compare(a,b){const x=P.parse(a),y=P.parse(b);if(a.root!==b.root)return a.root-b.root;for(let i=0;i<Math.min(a.depth,b.depth);i++){const u=(x[i>>2]>>((i%4)*2))&3,v=(y[i>>2]>>((i%4)*2))&3;if(u!==v)return u-v;}return a.depth-b.depth;}
const prefix=(a,b)=>a.root===b.root&&a.depth<=b.depth&&compare(a,P.prefix(b,a.depth))===0;
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
async function openIndex(raw,expectedHash,expectedSource,read,{signal}={}){
 expectedSource=freeze(copy(expectedSource));
 demand(raw instanceof Uint8Array&&raw.length<=limits.manifestBytes,'manifest byte bound');raw=new Uint8Array(raw);demand(await A.digest(raw)===expectedHash,'manifest hash');
 const manifest=JSON.parse(new TextDecoder().decode(raw));demand(manifest.format==='ProofAtlasRecordedVariableUseIndex/1'&&canonical(manifest.source)===canonical(expectedSource),'manifest source');
 demand(canonical(manifest.limits)===canonical(limits),'delivery contract');
 for(const mode of ['source','binder']){
  const ds=manifest.indexes[mode];demand(Array.isArray(ds)&&ds.length<=limits.pages,'descriptor bound');let n=0;
  for(const[d,i]of ds.map((d,i)=>[d,i])){P.parse(d.first);P.parse(d.last);demand(/^[a-f0-9]{64}$/.test(d.sha256)&&Number.isSafeInteger(d.bytes)&&d.bytes>0&&d.bytes<=limits.pageBytes&&Number.isSafeInteger(d.rows)&&d.rows>0&&d.rows<=limits.pageRows&&compare(d.first,d.last)<=0,'descriptor shape');if(i)demand(compare(ds[i-1].last,d.first)<=0,'ordered page ranges');n+=d.rows;}
  demand(n===manifest.uses,'complete sparse row accounting');
 }
 const descriptors=new Map([...manifest.indexes.source,...manifest.indexes.binder].map(d=>[d.sha256,d]));
 const cache={source:null,binder:null},stats={pageReads:0,peakResidentPageBytes:0,peakResultBytes:0,queries:0},cursors=new WeakSet(),results=new WeakSet();let disposed=false;
 const live=s=>{demand(!disposed,'disposed');if(signal?.aborted||s?.aborted)throw signal?.reason||s.reason||Error('aborted');};
 async function page(sha,mode,budget,s){
  live(s);
  if(cache[mode]?.sha===sha)return cache[mode].value;
  const d=descriptors.get(sha);demand(d&&manifest.indexes[mode].includes(d),'page belongs to index');
  if(budget.reads===limits.pageReads)return null;
  budget.reads++;stats.pageReads++;let raw=await read(sha,d.bytes,s);live(s);demand(raw instanceof Uint8Array&&raw.length===d.bytes&&raw.length<=limits.pageBytes,'page byte bound');raw=new Uint8Array(raw);demand(await A.digest(raw)===sha,'page hash');
  const value=JSON.parse(new TextDecoder().decode(raw));live(s);demand(value.format==='ProofAtlasRecordedVariableUsePage/1'&&value.mode===mode&&canonical(value.source)===canonical(expectedSource)&&value.rows.length===d.rows,'page attachment');
  cache[mode]={sha,value,bytes:raw.length};stats.peakResidentPageBytes=Math.max(stats.peakResidentPageBytes,(cache.source?.bytes||0)+(cache.binder?.bytes||0));return value;
 }
 async function query({within,binder=null,limit=8,cursor=null,signal:s}){
  live(s);
  within=freeze(copy(within));if(binder)binder=freeze(copy(binder));
  demand(!disposed,'disposed');P.parse(within);if(binder)P.parse(binder);demand(Number.isSafeInteger(limit)&&limit>=1&&limit<=limits.resultRows,'result bound');
  const mode=binder?'binder':'source',scope=canonical({within,binder}),ds=manifest.indexes[mode],budget={reads:0},rows=[];let resultBytes=2,scanned=0;
  if(cursor)demand(cursors.has(cursor)&&cursor.manifest===expectedHash&&cursor.scope===scope,'issued cursor for same source/query');
  let pi=cursor?.page||0,ri=cursor?.row||0;
  while(pi<ds.length&&rows.length<limit&&scanned<limits.scanRows){
   const d=ds[pi];
   if(mode==='binder'&&(compare(d.last,binder)<0||compare(d.first,binder)>0)){pi++;ri=0;continue;}
   if(mode==='source'&&!prefix(within,d.first)&&!prefix(within,d.last)&&!(compare(d.first,within)<=0&&compare(within,d.last)<=0)){pi++;ri=0;continue;}
   const p=await page(d.sha256,mode,budget,s);if(!p)break;
   while(ri<p.rows.length&&rows.length<limit&&scanned<limits.scanRows){
    const candidate=p.rows[ri];let row=candidate;
    if(mode==='binder'&&(compare(candidate.binder,binder)!==0||!prefix(within,candidate.route))){ri++;scanned++;continue;}
    if(mode==='source'&&!prefix(within,candidate.route)){ri++;scanned++;continue;}
    if(mode==='binder'){
     const sourcePage=await page(candidate.source.page,'source',budget,s);if(!sourcePage)break;
     row=sourcePage.rows[candidate.source.row];demand(row&&key(row.route)===key(candidate.route)&&key(row.binder.route)===key(candidate.binder),'secondary reference preserves occurrence and binder');
    }
    const n=bytes(row).length;if(resultBytes+n>limits.resultBytes)break;
    rows.push(freeze(row));resultBytes+=n;ri++;scanned++;
   }
   if(ri<p.rows.length)break;
   pi++;ri=0;
  }
  let next=null;
  if(pi<ds.length){next=freeze({manifest:expectedHash,scope,page:pi,row:ri});cursors.add(next);}
  live(s);stats.queries++;stats.peakResultBytes=Math.max(stats.peakResultBytes,resultBytes);
  const value=freeze({rows,next,scanned,pageReads:budget.reads,complete:next===null,coverage:'recorded-uses-only',countContribution:'0'});results.add(value);return value;
 }
 function references(frame,result){
  demand(!disposed&&results.has(result),'issued sparse result');
  demand(frame?.format==='ProofAtlasMixedInterfaceFramePrototype/1','mixed source frame');
  for(const k of ['name','edition','indexSha256','sourceGraphSha256'])demand(frame.source[k]===expectedSource[k],'same source frame');
  const refs=result.rows.map(row=>{
   demand(prefix(frame.root.route,row.route),'use within selected frame');
   const regions=frame.sourcePartition.regions.filter(r=>prefix(r.route,row.route));demand(regions.length===1,'unique disjoint source region');
   const region=regions[0],binder=row.binder.route,member=frame.units.findIndex(u=>compare(u.root.route,binder)===0);
   let kind,target;
   if(prefix(region.route,binder)){
    kind='internal-to-hidden-region';target={namespace:'original-source',route:binder,node:row.binder.node,visibility:'inside-region'};
   }else{
    demand(prefix(binder,region.route)&&binder.depth<region.route.depth&&row.binder.ordinal<region.contextLength,'prior lexical context of region');
    if(member>=0){kind='retained-binder';target={namespace:'original-source-context-slot',unit:member,ordinal:row.binder.ordinal,route:binder,node:row.binder.node};}
    else{demand(prefix(binder,frame.root.route)&&binder.depth<frame.root.route.depth,'external original binder');kind='external-original-context';target={namespace:'original-source-context-boundary',ordinal:row.binder.ordinal,route:binder,node:row.binder.node};}
   }
   return{format:'ProofAtlasRecordedVariableUseReference/1',source:expectedSource,kind,region:{route:region.route,node:region.node,contextLength:region.contextLength},target,use:row,countContribution:'0',typingScope:'The observations type this original use in its own context; they do not type the region, another occurrence or an invented variable.'};
  });
  return freeze({references:refs,next:result.next,complete:result.complete,countContribution:'0',sourcePartition:frame.sourcePartition,coverage:'recorded-uses-only'});
 }
 function sourceReferences(scene,result){
  demand(!disposed&&results.has(result),'issued sparse result');
  demand(scene?.format==='ProofAtlasOccurrenceWindow/1'&&scene.namespace==='source-expression'&&scene.typing==='not-queried','original source window without inherited typing');
  demand(scene.source.name===expectedSource.name&&scene.source.indexSha256===expectedSource.indexSha256&&scene.nodes.length>0&&scene.nodes.length<=32,'source window identity/bound');
  const nodes=new Map(),regions=[];
  for(const n of scene.nodes){P.parse(n.route);demand(!nodes.has(key(n.route))&&prefix(scene.root.route,n.route)&&n.typeStatus==='not-queried','distinct original source nodes');nodes.set(key(n.route),n);
   for(const p of n.ports)if(!p.displayed)regions.push({route:p.route,node:p.node,contextLength:n.scopeDepth+((['lam','forallE'].includes(n.kind)&&p.slot===1||n.kind==='letE'&&p.slot===2)?1:0),expanded:p.expanded});
  }
  demand(BigInt(scene.stats.retained)===BigInt(nodes.size)&&BigInt(scene.stats.hidden)===regions.reduce((n,r)=>n+BigInt(r.expanded),0n)&&BigInt(scene.stats.represented)===BigInt(scene.stats.retained)+BigInt(scene.stats.hidden),'unchanged source accounting');
  const refs=result.rows.map(row=>{
   demand(prefix(scene.root.route,row.route),'use within source window');const use=nodes.get(key(row.route)),hidden=regions.filter(r=>prefix(r.route,row.route));demand(Number(!!use)+hidden.length===1,'one retained use or disjoint frontier');
   const region=use?{route:use.route,node:use.node,contextLength:use.scopeDepth}:hidden[0],binder=nodes.get(key(row.binder.route));let kind,target;
   if(binder){
    demand(['lam','forallE','letE'].includes(binder.kind)&&binder.node===row.binder.node&&binder.scopeDepth===row.binder.contextLength,'original retained source binder');
    demand(prefix(binder.route,row.route)&&row.route.depth>binder.route.depth&&compare(P.prefix(row.route,binder.route.depth+1),P.append(binder.route,[binder.kind==='letE'?2:1]))===0,'use in original binder body');
    kind='retained-binder';target={namespace:'original-source-context-slot',sourceId:binder.id,ordinal:row.binder.ordinal,route:binder.route,node:binder.node,sourceKind:binder.kind};
   }else if(prefix(region.route,row.binder.route)){
    demand(!use,'hidden binder cannot enclose a retained use');kind='internal-to-hidden-region';target={namespace:'original-source',route:row.binder.route,node:row.binder.node,visibility:'inside-region'};
   }else{
    demand(prefix(row.binder.route,scene.root.route)&&row.binder.route.depth<scene.root.route.depth&&row.binder.ordinal<scene.nodes[0].scopeDepth,'original context before the source cut');kind='external-original-context';target={namespace:'original-source-context-boundary',ordinal:row.binder.ordinal,route:row.binder.route,node:row.binder.node};
   }
   let existingBindingEdge=null;
   if(use){
    demand(use.kind==='bvar'&&use.node===row.node&&use.scopeDepth===row.contextLength&&use.binding?.node===row.binder.node&&compare(use.binding.route,row.binder.route)===0,'retained source use/context/binder');
    const edge=scene.links.find(e=>e.from===use.id);demand(edge&&edge.relation==='source-bound-to'&&edge.node===row.binder.node&&compare(edge.route,row.binder.route)===0,'existing lexical edge');existingBindingEdge={from:edge.from,to:edge.to,relation:edge.relation};
   }
   return{format:'ProofAtlasRecordedVariableUseReference/1',source:expectedSource,kind,region,target,use:row,countContribution:'0',useVisibility:use?'retained-source-use':'inside-source-frontier',sourceUseId:use?.id||null,existingBindingEdge,typingScope:'Only this original use has the listed observations. Source forall binders are not classified as proof introductions.'};
  });
  return freeze({format:'ProofAtlasSourceUseOverlay/1',references:refs,next:result.next,complete:result.complete,countContribution:'0',sourcePartition:{...scene.stats},coverage:'recorded-uses-only'});
 }
 function dispose(){disposed=true;cache.source=null;cache.binder=null;}
 return Object.freeze({query,references,sourceReferences,dispose,stats:()=>({...stats,residentPages:Number(!!cache.source)+Number(!!cache.binder)}),manifest:freeze(manifest)});
}

async function open(input,source,{fetcher=host.fetch.bind(host),signal}={}){
 const d=freeze(copy(input)),identity=freeze(copy(source)),base='/public/data/proof-atlas/variable-use-pages/'+identity.indexSha256+'/';
 demand(d&&d.name===identity.name&&d.edition===identity.edition&&d.indexSha256===identity.indexSha256&&d.sourceGraphSha256===identity.sourceGraphSha256&&hex(d.sha256)&&natural(d.bytes)&&d.bytes>0&&d.bytes<=limits.manifestBytes&&d.file===base+d.sha256+'.manifest.gz','profile identity');
 const live=s=>{if(signal?.aborted||s?.aborted)throw signal?.reason||s.reason||Error('aborted');};
 async function read(file,expected,s){
  live(s);const response=await fetcher(file,{signal:s||signal});demand(response.ok,'asset unavailable ('+response.status+')');
  const reader=response.body.pipeThrough(new host.DecompressionStream('gzip')).getReader(),chunks=[];let count=0;
  try{while(true){live(s);const p=await reader.read();if(p.done)break;count+=p.value.byteLength;demand(count<=expected,'decoded asset bound');chunks.push(p.value);}}catch(e){await reader.cancel(e).catch(()=>{});throw e;}finally{reader.releaseLock();}
  demand(count===expected,'decoded byte count');const raw=new Uint8Array(count);let at=0;for(const p of chunks){raw.set(p,at);at+=p.byteLength;}live(s);return raw;
 }
 const raw=await read(d.file,d.bytes,signal);demand(await A.digest(raw)===d.sha256,'delivery hash');live();
 const packet=freeze(JSON.parse(new TextDecoder().decode(raw)));
 demand(packet.format==='ProofAtlasVariableUseDelivery/1'&&canonical(packet.source)===canonical(identity),'delivery source');
 demand(packet.support?.format==='ProofAtlasVariableUseCounts/1'&&packet.support.stateLimit===65536&&Array.isArray(packet.support.rows)&&packet.support.rows.length<=512,'syntax count envelope');
 const support=new Map();
 for(const row of packet.support.rows){P.parse(row.route);demand(!support.has(key(row.route))&&natural(row.node)&&natural(row.recordedUses)&&natural(row.states)&&row.states<=65536,'count source/bounds');
  demand(row.status==='complete'&&typeof row.count==='string'&&/^(0|[1-9][0-9]*)$/.test(row.count)&&BigInt(row.count)>=BigInt(row.recordedUses)||row.status==='unavailable'&&row.count===null&&row.reason==='state-bound','count status');support.set(key(row.route),row);}
 const indexRaw=bytes(packet.index),indexHash=await A.digest(indexRaw);live();
 const index=await openIndex(indexRaw,indexHash,identity,(sha,n,s)=>read(base+sha+'.page.gz',n,s),{signal});
 return Object.freeze({...index,inventorySha256:d.sha256,supportFor:route=>support.get(key(route))||null});
}
function verifyObservation(ref,index,entry){
 const expected=ref.use.observations[index];demand(expected,'observation choice');const o=entry.observation||entry,paged=!!entry.observation;
 const actual=paged?o.origin:{...o,...(o.typeTableSha256?{typeTableSha256:o.typeTableSha256,typeTableRoot:o.typeTableRoot,typeComponentSha256:o.typeComponentSha256}:{})};
 demand(o.sourceIndexSha256===ref.source.indexSha256&&o.role===ref.use.role&&(paged?o.sourceNode:o.node)===ref.use.node&&(paged?key(o.sourceRoute):key(o.route))===key(ref.use.route)&&o.contextLength===ref.use.contextLength&&o.evidenceSha256===expected.owner.evidenceSha256,'typed use identity');
 demand((paged?o.root:o.typeData.roots[0])===expected.owner.typeRoot&&Object.keys(expected.owner.typeIdentity).every(k=>actual[k]===expected.owner.typeIdentity[k]),'original type component');
 demand(canonical(paged?o.origin.recording:o.recording)===canonical(expected.owner.recording),'original native owner recording');return true;
}
function verifySource(ref,point,source){
 demand(['name','edition','indexSha256','sourceGraphSha256'].every(k=>ref.source[k]===source[k]),'original source identity');
 demand(point.node===ref.use.node&&key(point.route)===key(ref.use.route)&&point.scopeDepth===ref.use.contextLength&&point.binding?.node===ref.use.binder.node&&key(point.binding.route)===key(ref.use.binder.route),'original source use/context/binder');return true;
}
const api=Object.freeze({openIndex,open,verifyObservation,verifySource,limits,compare,prefix,key});if(node)module.exports=api;else host.ProofAtlasVariableUses=api;
})(typeof window==='undefined'?globalThis:window);
