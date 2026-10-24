/* Local research model. Delivery pages do not create new native judgments. */
'use strict';
const path=require('path'),crypto=require('crypto');
const repo=path.resolve(__dirname,'../../..');
const P=require(path.join(repo,'public/js/proof-atlas-packed-routes'));
const T=require(path.join(repo,'public/js/proof-atlas-deep-context'));
const limits=Object.freeze({pageRows:8,pageBytes:65536,manifestBytes:65536,pages:1024,resultRows:8,resultBytes:131072,scanRows:32,pageReads:8});
const demand=(v,m)=>{if(!v)throw Error('Recorded variable uses: '+m);};
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const bytes=v=>Buffer.from(canonical(v)+'\n');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const copy=v=>JSON.parse(JSON.stringify(v));
const key=r=>r.root+':'+r.depth+':'+r.slots;
function compare(a,b){
 const x=P.parse(a),y=P.parse(b);if(a.root!==b.root)return a.root-b.root;
 for(let i=0;i<Math.min(a.depth,b.depth);i++){const u=(x[i>>2]>>((i%4)*2))&3,v=(y[i>>2]>>((i%4)*2))&3;if(u!==v)return u-v;}
 return a.depth-b.depth;
}
const prefix=(a,b)=>a.root===b.root&&a.depth<=b.depth&&compare(a,P.prefix(b,a.depth))===0;
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};

async function extract(x){
 const source={...T.sourceIdentity(x.c.data,x.record),edition:x.edition};
 const uses=new Map(),seen=new Set();
 for(const e of x.c.entries){
  const c=T.construction(e,x.c.data),observations=[{point:e,field:'recorded'},...(c?c.premises.map(point=>({point,field:point.field})):[])];
  for(const{point,field}of observations){
   if(x.c.data.kind[point.node]!==0)continue;
   const owner=field==='recorded'?e:c.entry;
   const id=key(point.route)+':'+owner.evidenceSha256+':'+key(owner.route)+':'+field;if(seen.has(id))continue;seen.add(id);
   const actual=P.resolve(x.c.data,point.route);demand(actual.node===point.node&&actual.scopeDepth===point.contextLength&&actual.binding,'native occurrence and original binder');
   const typed=field==='recorded'?e:await T.constructionType(e,x.c.data,field),binder=actual.binding;
   const ordinal=point.contextLength-1-x.c.data.payloads[point.node].index;
   const target=typed.contextAt(ordinal);demand(key(target.route)===key(binder.route)&&target.node===binder.node,'native original context target');
   const binderContext=P.resolve(x.c.data,binder.route).scopeDepth;
   demand(binderContext===ordinal,'binder ordinal');
   demand(typed.evidenceSha256===owner.evidenceSha256,'native type owner');
   const observation={field,role:typed.role,owner:{route:owner.route,node:owner.node,evidenceSha256:owner.evidenceSha256,typeIdentity:T.typeIdentity(typed),typeRoot:typed.typeData.roots[0],recording:typed.recording}};
   const routeKey=key(point.route),old=uses.get(routeKey);
   if(old){demand(old.row.role===typed.role&&key(old.row.binder.route)===key(binder.route)&&old.row.contextLength===typed.contextLength,'same occurrence context and role');demand(T.expressionEqual(old.typed.typeData,old.typed.typeData.roots[0],typed.typeData,typed.typeData.roots[0]),'repeated recorded type');old.row.observations.push(observation);}
   else uses.set(routeKey,{typed,row:{route:point.route,node:point.node,contextLength:typed.contextLength,role:typed.role,binder:{route:binder.route,node:binder.node,contextLength:binderContext,ordinal,name:x.c.data.payloads[binder.node].binderName??x.c.data.payloads[binder.node].declName??'_'},observations:[observation],countContribution:'0'}});
  }
 }
 return freeze({source,rows:[...uses.values()].map(x=>x.row).sort((a,b)=>compare(a.route,b.route)),observationCount:seen.size,scope:'Sparse existing observations. No absence-of-use claim, fresh variable typing or inherited region judgment.'});
}

function produce(inventory){
 const source=inventory.source,files=new Map(),sourceRefs=new Map();
 const indexes={source:[],binder:[]};
 function writeRows(mode,rows){
  let group=[];
  function flush(){
   if(!group.length)return;
   const page={format:'ProofAtlasRecordedVariableUsePage/1',source,mode,rows:group},raw=bytes(page),sha256=hash(raw);
   demand(raw.length<=limits.pageBytes,'record exceeds page byte bound');
   const descriptor={sha256,bytes:raw.length,rows:group.length,first:(mode==='source'?group[0].route:group[0].binder),last:(mode==='source'?group.at(-1).route:group.at(-1).binder)};
   indexes[mode].push(descriptor);demand(indexes[mode].length<=limits.pages,'page inventory bound');files.set(sha256,raw);
   if(mode==='source')group.forEach((r,i)=>sourceRefs.set(key(r.route),{page:sha256,row:i}));
   group=[];
  }
  for(const row of rows){
   if(group.length&&(group.length===limits.pageRows||bytes({format:'ProofAtlasRecordedVariableUsePage/1',source,mode,rows:[...group,row]}).length>limits.pageBytes))flush();
   group.push(row);
  }
  flush();
 }
 writeRows('source',inventory.rows);
 const refs=inventory.rows.map(row=>({binder:row.binder.route,route:row.route,source:sourceRefs.get(key(row.route))})).sort((a,b)=>compare(a.binder,b.binder)||compare(a.route,b.route));
 writeRows('binder',refs);
 const manifest={format:'ProofAtlasRecordedVariableUseIndex/1',source,uses:inventory.rows.length,observations:inventory.observationCount,indexes,limits,scope:inventory.scope};
 const raw=bytes(manifest);demand(raw.length<=limits.manifestBytes,'manifest byte bound');
 return{manifest:freeze(manifest),manifestBytes:raw,manifestSha256:hash(raw),files};
}

function open(raw,expectedHash,expectedSource,read){
 expectedSource=freeze(copy(expectedSource));
 demand(Buffer.isBuffer(raw)&&raw.length<=limits.manifestBytes&&hash(raw)===expectedHash,'manifest hash/bound');
 const manifest=JSON.parse(raw);demand(manifest.format==='ProofAtlasRecordedVariableUseIndex/1'&&canonical(manifest.source)===canonical(expectedSource),'manifest source');
 demand(canonical(manifest.limits)===canonical(limits),'delivery contract');
 for(const mode of ['source','binder']){
  const ds=manifest.indexes[mode];demand(Array.isArray(ds)&&ds.length<=limits.pages,'descriptor bound');let n=0;
  for(const[d,i]of ds.map((d,i)=>[d,i])){P.parse(d.first);P.parse(d.last);demand(/^[a-f0-9]{64}$/.test(d.sha256)&&Number.isSafeInteger(d.bytes)&&d.bytes>0&&d.bytes<=limits.pageBytes&&Number.isSafeInteger(d.rows)&&d.rows>0&&d.rows<=limits.pageRows&&compare(d.first,d.last)<=0,'descriptor shape');if(i)demand(compare(ds[i-1].last,d.first)<=0,'ordered page ranges');n+=d.rows;}
  demand(n===manifest.uses,'complete sparse row accounting');
 }
 const descriptors=new Map([...manifest.indexes.source,...manifest.indexes.binder].map(d=>[d.sha256,d]));
 const cache={source:null,binder:null},stats={pageReads:0,peakResidentPageBytes:0,peakResultBytes:0,queries:0},cursors=new WeakSet(),results=new WeakSet();let disposed=false;
 async function page(sha,mode,budget){
  if(cache[mode]?.sha===sha)return cache[mode].value;
  const d=descriptors.get(sha);demand(d&&manifest.indexes[mode].includes(d),'page belongs to index');
  if(budget.reads===limits.pageReads)return null;
  budget.reads++;stats.pageReads++;const raw=await read(sha,d.bytes);demand(Buffer.isBuffer(raw)&&raw.length===d.bytes&&raw.length<=limits.pageBytes&&hash(raw)===sha,'page hash/bound');
  const value=JSON.parse(raw);demand(value.format==='ProofAtlasRecordedVariableUsePage/1'&&value.mode===mode&&canonical(value.source)===canonical(expectedSource)&&value.rows.length===d.rows,'page attachment');
  cache[mode]={sha,value,bytes:raw.length};stats.peakResidentPageBytes=Math.max(stats.peakResidentPageBytes,(cache.source?.bytes||0)+(cache.binder?.bytes||0));return value;
 }
 async function query({within,binder=null,limit=8,cursor=null}){
  within=freeze(copy(within));if(binder)binder=freeze(copy(binder));
  demand(!disposed,'disposed');P.parse(within);if(binder)P.parse(binder);demand(Number.isSafeInteger(limit)&&limit>=1&&limit<=limits.resultRows,'result bound');
  const mode=binder?'binder':'source',scope=canonical({within,binder}),ds=manifest.indexes[mode],budget={reads:0},rows=[];let resultBytes=2,scanned=0;
  if(cursor)demand(cursors.has(cursor)&&cursor.manifest===expectedHash&&cursor.scope===scope,'issued cursor for same source/query');
  let pi=cursor?.page||0,ri=cursor?.row||0;
  while(pi<ds.length&&rows.length<limit&&scanned<limits.scanRows){
   const d=ds[pi];
   if(mode==='binder'&&(compare(d.last,binder)<0||compare(d.first,binder)>0)){pi++;ri=0;continue;}
   if(mode==='source'&&!prefix(within,d.first)&&!prefix(within,d.last)&&!(compare(d.first,within)<=0&&compare(within,d.last)<=0)){pi++;ri=0;continue;}
   const p=await page(d.sha256,mode,budget);if(!p)break;
   while(ri<p.rows.length&&rows.length<limit&&scanned<limits.scanRows){
    const candidate=p.rows[ri];let row=candidate;
    if(mode==='binder'&&(compare(candidate.binder,binder)!==0||!prefix(within,candidate.route))){ri++;scanned++;continue;}
    if(mode==='source'&&!prefix(within,candidate.route)){ri++;scanned++;continue;}
    if(mode==='binder'){
     const sourcePage=await page(candidate.source.page,'source',budget);if(!sourcePage)break;
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
  stats.queries++;stats.peakResultBytes=Math.max(stats.peakResultBytes,resultBytes);
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
 function dispose(){disposed=true;cache.source=null;cache.binder=null;}
 return Object.freeze({query,references,dispose,stats:()=>({...stats,residentPages:Number(!!cache.source)+Number(!!cache.binder)}),manifest:freeze(manifest)});
}

module.exports={extract,produce,open,limits,canonical,hash,bytes,key,compare,prefix};
