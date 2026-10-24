/* Authenticated stored-binder syntax counts. These are not typing observations. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes;
const limits=Object.freeze({manifestBytes:65536,pageBytes:65536,pageRows:128,pages:256,pending:64,sourceNodes:262144,countDigits:16384});
const algorithm='free-index-live-frontier/1',algorithmLimits=Object.freeze({sourceNodes:262144,queryRows:262144,coefficientCells:65536,decimalDigits:524288});
const natural=n=>Number.isSafeInteger(n)&&n>=0,hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s),demand=(v,m)=>{if(!v)throw Error('Syntax counts: '+m);};
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const keys=(v,expected)=>v&&Object.keys(v).sort().join(',')===expected.split(',').sort().join(',');
async function open(input,record,{fetcher=host.fetch.bind(host),signal}={}){
 const d=JSON.parse(JSON.stringify(input)),source={name:record.name,indexSha256:record.indexSha256,sourceNodes:record.uniqueNodes},base='/public/data/proof-atlas/syntax-count-pages/'+source.indexSha256+'/';
 demand(typeof source.name==='string'&&hex(source.indexSha256)&&natural(source.sourceNodes)&&source.sourceNodes>0&&source.sourceNodes<=limits.sourceNodes,'original source identity');
 demand(d&&d.name===source.name&&d.indexSha256===source.indexSha256&&d.sourceNodes===source.sourceNodes&&hex(d.sha256)&&natural(d.bytes)&&d.bytes>0&&d.bytes<=limits.manifestBytes&&natural(d.entries)&&d.entries<=source.sourceNodes&&d.file===base+d.sha256+'.manifest.gz','profile descriptor');
 let disposed=false,cache=null,manifest=null,tail=Promise.resolve(),pending=0;const controller=new AbortController();
 const stats={pageReads:0,peakPageBytes:0,peakPending:0,peakInFlight:0,manifestBytes:d.bytes};
 function live(s){demand(!disposed,'disposed');if(signal?.aborted||s?.aborted)throw signal?.reason||s.reason||Error('aborted');}
 async function read(file,expected,hash,s){
  live(s);const combined=AbortSignal.any([controller.signal,...(signal?[signal]:[]),...(s?[s]:[])]),response=await fetcher(file,{signal:combined});demand(response.ok,'asset unavailable ('+response.status+')');
  const reader=response.body.pipeThrough(new host.DecompressionStream('gzip')).getReader(),chunks=[];let n=0;
  try{while(true){live(s);const p=await reader.read();if(p.done)break;n+=p.value.byteLength;demand(n<=expected,'decoded byte bound');chunks.push(p.value);}}catch(e){await reader.cancel(e).catch(()=>{});throw e;}finally{reader.releaseLock();}
  demand(n===expected,'decoded byte count');const raw=new Uint8Array(n);let at=0;for(const p of chunks){raw.set(p,at);at+=p.byteLength;}demand(await A.digest(raw)===hash,'asset hash');live(s);return JSON.parse(new TextDecoder().decode(raw));
 }
 manifest=await read(d.file,d.bytes,d.sha256,signal);
 demand(keys(manifest,'format,source,algorithm,modelSha256,limits,statistics,entries,pages,scope')&&manifest.format==='ProofAtlasSyntaxCounts/1'&&canonical(manifest.source)===canonical(source)&&manifest.algorithm===algorithm&&hex(manifest.modelSha256)&&canonical(manifest.limits)===canonical(algorithmLimits)&&manifest.entries===d.entries&&typeof manifest.scope==='string'&&manifest.scope.length<=2048,'manifest identity/method');
 const st=manifest.statistics,statKeys='sourceNodes,reachableNodes,evaluatedNodes,indexBytes,pendingSlots,queryRows,peakCoefficientCells,peakDecimalDigits,peakTables,resultCells,resultDigits';
 demand(keys(st,statKeys)&&Object.values(st).every(natural)&&st.sourceNodes===source.sourceNodes&&st.reachableNodes<=st.sourceNodes&&st.evaluatedNodes<=st.reachableNodes&&st.indexBytes<=5*st.sourceNodes&&st.pendingSlots<=st.sourceNodes&&st.queryRows<=algorithmLimits.queryRows&&st.resultCells<=st.queryRows&&st.peakCoefficientCells<=algorithmLimits.coefficientCells&&st.peakDecimalDigits<=algorithmLimits.decimalDigits,'algorithm resource units');
 demand(Array.isArray(manifest.pages)&&manifest.pages.length<=limits.pages,'page descriptor bound');let total=0,last=-1;
 for(const p of manifest.pages){demand(keys(p,'first,last,rows,sha256,bytes')&&natural(p.first)&&natural(p.last)&&p.first>last&&p.first<=p.last&&p.last<source.sourceNodes&&natural(p.rows)&&p.rows>0&&p.rows<=limits.pageRows&&hex(p.sha256)&&natural(p.bytes)&&p.bytes>0&&p.bytes<=limits.pageBytes,'page descriptor/order');last=p.last;total+=p.rows;}
 demand(total===manifest.entries,'declared binder count');freeze(manifest);
 async function lookup(node,s){
  live(s);demand(natural(node)&&node<source.sourceNodes,'stored binder node');const descriptor=manifest.pages.find(p=>p.first<=node&&node<=p.last);if(!descriptor)return null;
  if(cache?.sha256!==descriptor.sha256){
   stats.peakInFlight=1;const page=await read(base+descriptor.sha256+'.page.gz',descriptor.bytes,descriptor.sha256,s);live(s);
   demand(keys(page,'format,sourceIndexSha256,rows')&&page.format==='ProofAtlasSyntaxCountPage/1'&&page.sourceIndexSha256===source.indexSha256&&Array.isArray(page.rows)&&page.rows.length===descriptor.rows,'page source/shape');let previous=-1;
   for(const row of page.rows){
    demand(keys(row,row.status==='complete'?'node,kind,body,status,count':'node,kind,body,status,count,reason')&&natural(row.node)&&row.node>previous&&row.node<source.sourceNodes&&['lam','forallE','letE'].includes(row.kind)&&natural(row.body)&&row.body<row.node,'binder row');previous=row.node;
    demand(row.status==='complete'&&typeof row.count==='string'&&row.count.length<=limits.countDigits&&/^(0|[1-9][0-9]*)$/.test(row.count)||row.status==='unavailable'&&row.count===null&&['coefficient-cell-bound','decimal-digit-bound'].includes(row.reason),'count availability');
   }
   demand(page.rows[0].node===descriptor.first&&page.rows.at(-1).node===descriptor.last,'page node endpoints');cache={sha256:descriptor.sha256,bytes:descriptor.bytes,rows:freeze(page.rows)};stats.pageReads++;stats.peakPageBytes=Math.max(stats.peakPageBytes,descriptor.bytes);
  }
  return cache.rows.find(row=>row.node===node)||null;
 }
 function queued(action,s){live(s);demand(pending<limits.pending,'pending request bound');pending++;stats.peakPending=Math.max(stats.peakPending,pending);const p=tail.then(()=>{live(s);return action();});tail=p.catch(()=>{});return p.finally(()=>{pending--;});}
 async function forPoint(point,identity,{signal:s}={}){
  live(s);demand(identity?.name===source.name&&identity.indexSha256===source.indexSha256&&['lam','forallE','letE'].includes(point?.kind),'source point identity/kind');P.parse(point.route);point={node:point.node,kind:point.kind,route:JSON.parse(JSON.stringify(point.route)),ports:JSON.parse(JSON.stringify(point.ports))};
  const body=point.ports?.find(p=>p.slot===(point.kind==='letE'?2:1));demand(body&&body.kernelField==='body'&&canonical(body.route)===canonical(P.append(point.route,[body.slot]))&&typeof body.expanded==='string'&&body.expanded.length<=limits.countDigits&&/^[1-9][0-9]*$/.test(body.expanded),'original body port');
  const row=await queued(()=>lookup(point.node,s),s);live(s);if(!row)return null;
  demand(row.kind===point.kind&&row.body===body.node,'original binder/body fields');if(row.status==='complete')demand(BigInt(row.count)<=BigInt(body.expanded),'count exceeds body occurrences');
  return freeze({format:'ProofAtlasSyntaxMultiplicityAnnotation/1',source:{...source},route:JSON.parse(JSON.stringify(point.route)),node:point.node,kind:point.kind,body:{node:body.node,route:JSON.parse(JSON.stringify(body.route))},status:row.status,count:row.count,...(row.reason?{reason:row.reason}:{}),algorithm,modelSha256:manifest.modelSha256,limits:{...algorithmLimits},statistics:{...manifest.statistics},manifestSha256:d.sha256,countContribution:'0',typing:'not-queried',scope:'Stored-binder source-syntax multiplicity at this original occurrence; not recorded typing or logical necessity.'});
 }
 return Object.freeze({forPoint,state:()=>({...stats,disposed,pending,residentPages:Number(!!cache),residentPageBytes:cache?.bytes||0,manifestBytes:manifest?d.bytes:0}),dispose:()=>{disposed=true;controller.abort();cache=null;manifest=null;}});
}
const api=Object.freeze({open,limits,algorithm,algorithmLimits});if(node)module.exports=api;else host.ProofAtlasSyntaxCounts=api;
})(typeof window==='undefined'?globalThis:window);
