/* Occurrence-qualified substitution cuts. No inferred types or source tactics. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const base='/public/data/proof-atlas/substitution-geometry/',limits=Object.freeze({nodes:1048576,path:512,images:512,pageBytes:1048576,queryBytes:65536,indexBytes:16384,searchStates:262144});
 const demand=(v,m)=>{if(!v)throw Error('Substitution geometry: '+m);},nat=n=>Number.isSafeInteger(n)&&n>=0,hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=x=>JSON.parse(JSON.stringify(x));
 const binds=(k,j)=>((k===6||k===7)&&j===1)||(k===8&&j===2);
 const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
 function pathCheck(p){demand(Array.isArray(p)&&p.length<=limits.path&&p.every(x=>nat(x)&&x<3),'occurrence path');}
 async function open(input,{fetcher=host.fetch.bind(host)}={}){
  const manifest=freeze(copy(input)),m=manifest,indices=new Map();let cached=null,disposed=false;
  const stats={rowPageLoads:0,queryLoads:0,indexLoads:0,peakCachedRows:0,peakIndexPages:0};
  demand(m.format==='ProofAtlasSubstitutionGeometry/1'&&hex(m.inputManifestSha256)&&hex(m.nativeSha256)&&nat(m.nodeCount)&&m.nodeCount>0&&m.nodeCount<=limits.nodes&&m.pageSize===64,'manifest');
  for(const [d,count]of[[m.table,Math.ceil(m.nodeCount/64)],[m.catalogue,2835]]){let level=0,capacity=64;while(capacity<count){capacity*=64;level++;}demand(d?.count===count&&d.level===level,'directory bounds');}
  function live(signal){demand(!disposed,'reader released');if(signal?.aborted)throw signal.reason||Error('Navigation cancelled');}
  async function read(ref,kind,signal){
   live(signal);const cap=limits[kind+'Bytes'];demand(ref&&hex(ref.sha256)&&nat(ref.bytes)&&ref.bytes>0&&ref.bytes<=cap,'asset descriptor');
   const r=await fetcher(base+ref.sha256+'.'+kind+'.gz',{signal});demand(r.ok,'asset unavailable ('+r.status+')');
   demand(r.body&&host.DecompressionStream,'gzip stream support');const reader=r.body.pipeThrough(new host.DecompressionStream('gzip')).getReader(),parts=[];let length=0;
   try{while(true){live(signal);const v=await reader.read();if(v.done)break;length+=v.value.byteLength;demand(length<=ref.bytes&&length<=cap,'decoded byte limit');parts.push(v.value);}}
   catch(e){await reader.cancel(e).catch(()=>{});throw e;}finally{reader.releaseLock();}
   demand(length===ref.bytes,'decoded length');const bytes=new Uint8Array(length);let at=0;for(const p of parts){bytes.set(p,at);at+=p.byteLength;}
   demand(await A.digest(bytes)===ref.sha256,'asset hash');live(signal);return freeze(JSON.parse(new TextDecoder().decode(bytes)));
  }
  async function locate(directory,position,signal){
   demand(nat(position)&&position<directory.count,'directory position');let ref=directory.root;
   for(let level=directory.level;level>=0;level--){let page=indices.get(ref.sha256);
    if(page){demand(page.bytes===ref.bytes,'cached index bytes');indices.delete(ref.sha256);indices.set(ref.sha256,page);page=page.value;}
    else{page=await read(ref,'index',signal);if(indices.size===2)indices.delete(indices.keys().next().value);indices.set(ref.sha256,{bytes:ref.bytes,value:page});stats.indexLoads++;stats.peakIndexPages=Math.max(stats.peakIndexPages,indices.size);}
    const span=64**level,first=Math.floor(position/(64*span))*64*span;
    demand(page.format==='ProofAtlasSubstitutionIndex/1'&&page.level===level&&page.first===first&&Array.isArray(page.children)&&page.children.length===Math.min(64,Math.ceil((directory.count-first)/span)),'directory range');
    ref=page.children[Math.floor(position/span)%64];
   }return ref;
  }
  async function row(id,signal){
   live(signal);demand(nat(id)&&id<m.nodeCount,'row address');const page=Math.floor(id/64);if(cached?.page===page)return cached.value.rows[id%64];
   const ref=await locate(m.table,page,signal),v=await read(ref,'page',signal);
   demand(v.format==='ProofAtlasSubstitutionPage/1'&&v.start===page*64&&Array.isArray(v.rows)&&v.rows.length===Math.min(64,m.nodeCount-v.start),'row page');
   for(const [j,r]of v.rows.entries()){
    demand(Array.isArray(r)&&r.length===5,'row tuple');const[k,cs,p,count,scope]=r;
    demand(nat(k)&&k<12&&Array.isArray(cs)&&cs.length===(A.fields[A.kinds[k]]||[]).length&&cs.every(c=>nat(c)&&c<v.start+j),'constructor fields');
    demand(p&&typeof p==='object'&&!Array.isArray(p)&&typeof count==='string'&&/^[1-9]\d*$/.test(count)&&count.length<=4096&&nat(scope)&&scope<=limits.nodes,'row payload/count/scope');
    if(k===0)demand(nat(p.index)&&p.index<limits.nodes&&scope===p.index+1,'bound reference');
   }
   live(signal);cached={page,value:v};stats.rowPageLoads++;stats.peakCachedRows=Math.max(stats.peakCachedRows,v.rows.length);return v.rows[id%64];
  }
  async function query(index,signal){
   live(signal);const ref=await locate(m.catalogue,index,signal),v=await read(ref,'query',signal),q=v.query,t=v.transport;
   demand(v.format==='ProofAtlasSubstitutionQuery/1'&&v.inputManifestSha256===m.inputManifestSha256&&v.nativeSha256===m.nativeSha256&&hex(v.inputSha256),'query owner');
   demand(q?.index===index&&nat(q.root)&&nat(q.expected)&&Array.isArray(q.images)&&q.images.length<=limits.images&&q.images.every(nat)&&nat(q.targetScope)&&q.targetScope<=limits.images,'query shape');
   demand(t&&[t.root,t.expected,...t.images||[]].every(i=>nat(i)&&i<m.nodeCount)&&Array.isArray(t.images)&&t.images.length===q.images.length,'transport roots');
   demand(v.native?.status==='PASS'&&v.native.primitive==='PASS'&&v.native.proof==='Substituted.property'&&v.native.descendantTyping===false&&v.native.proofsErasedDuringExecution===true,'finite execution evidence');
   stats.queryLoads++;return freeze({...v,asset:{...ref,file:base+ref.sha256+'.query.gz'}});
  }
  return Object.freeze({manifest,row,query,stats:()=>({...stats,cachedRows:cached?.value.rows.length||0,indexPages:indices.size}),dispose(){disposed=true;cached=null;indices.clear();}});
 }
 function address(q,component,path,image=null){pathCheck(path);return{inputSha256:q.inputSha256,query:q.query.index,component,image,path:[...path]};}
 function root(q,part,image){if(part==='source')return q.transport.root;if(part==='result')return q.transport.expected;demand(part==='image'&&nat(image)&&image<q.transport.images.length,'image selection');return q.transport.images[image];}
 async function trace(store,q,part,path,image,signal){
  pathCheck(path);let id=root(q,part,image);const binders=[];
  for(let n=0;n<path.length;n++){const r=await store.row(id,signal),slot=path[n];demand(slot<r[1].length,'path is outside the selected component');if(binds(r[0],slot))binders.push({address:address(q,part,path.slice(0,n),image),name:r[2].binderName||r[2].declName||'_',constructor:A.kinds[r[0]]});id=r[1][slot];}
  return{id,row:await store.row(id,signal),binders,address:address(q,part,path,image)};
 }
 function binding(q,t,part){
  const[k,,p]=t.row;if(k===1||k===2)return{kind:k===1?'free-identifier':'metavariable',id:p.id,exactBinderAvailable:false};if(k!==0)return null;
  if(p.index<t.binders.length)return{kind:'local',...t.binders[t.binders.length-1-p.index]};
  const outside=p.index-t.binders.length;
  if(part==='source'&&outside<q.transport.images.length)return{kind:'substitution-input',image:q.transport.images.length-1-outside};
  const relativeIndex=outside-(part==='source'?q.transport.images.length:0);
  return{kind:'target-context',relativeIndex,...(part==='source'?{sourceRelativeIndex:outside}:{}),slot:relativeIndex<q.query.targetScope?q.query.targetScope-1-relativeIndex:null,exactBinderAvailable:false};
 }
 function shallow(source,result,mode,depth,images){
  if(source[0]===0){const i=source[2].index;let expected=i;if(mode==='image')expected=i<depth.local?i:i+depth.shift;else if(i>=depth.local){demand(i-depth.local>=images,'replacement boundary not entered');expected=i-images;}
   demand(result[0]===0&&result[2].index===expected,'reference correspondence');
  }else demand(source[0]===result[0]&&same(source[2],result[2])&&source[1].length===result[1].length,'constructor/payload correspondence');
 }
 // The source/result path is shared only up to a replaced reference. Beyond
 // that boundary the result path is qualified by one image and its local depth.
 async function correspondence(store,q,selection,signal){
  const part=selection.part,path=selection.path||[];pathCheck(path);demand(['source','result','image'].includes(part),'selection component');
  if(part==='image'){
   root(q,'image',selection.image);
   if(!selection.insertion||selection.insertion.image!==selection.image)return{relation:'unanchored-image',source:null,result:null,image:{path,image:selection.image},insertion:null};
   pathCheck(selection.insertion.path);const linked=await correspondence(store,q,{part:'result',path:[...selection.insertion.path,...path]},signal);
   demand(linked.insertion&&same(linked.insertion.path,selection.insertion.path)&&linked.insertion.image===selection.image&&same(linked.image.path,path),'image-use anchor');return linked;
  }
  let a=q.transport.root,b=q.transport.expected,depth=0;
  for(let n=0;;n++){
   const s=await store.row(a,signal),r=await store.row(b,signal);
   if(s[0]===0&&s[2].index>=depth&&s[2].index-depth<q.transport.images.length){
    const image=q.transport.images.length-1-(s[2].index-depth),prefix=path.slice(0,n),suffix=path.slice(n);demand(part!=='source'||suffix.length===0,'source reference has no children');
    let v=q.transport.images[image],local=0;
    for(let j=0;;j++){
     const ir=await store.row(v,signal),rr=await store.row(b,signal);shallow(ir,rr,'image',{local,shift:depth},0);
     if(j===suffix.length)break;const slot=suffix[j];demand(slot<ir[1].length,'image suffix field');local+=Number(binds(ir[0],slot));v=ir[1][slot];b=rr[1][slot];
    }
    return{relation:'inserted-image',source:{path:prefix},image:{path:suffix,image},result:{path:[...prefix,...suffix]},insertion:{path:prefix,image,shift:depth}};
   }
   shallow(s,r,'source',{local:depth},q.transport.images.length);
   if(n===path.length)return{relation:s[0]===0?(s[2].index<depth?'preserved-local-reference':'residual-context-reference'):'preserved-constructor',source:{path},result:{path},image:null,insertion:null};
   const slot=path[n];demand(slot<s[1].length,'source/result field');depth+=Number(binds(s[0],slot));a=s[1][slot];b=r[1][slot];
  }
 }
 async function cut(store,q,part,path,image,signal){
  const t=await trace(store,q,part,path,image,signal),r=t.row,vertices=[{...t,binding:binding(q,t,part),field:null}];let hidden=0n,maxScope=0;
  for(const [slot,id]of r[1].entries()){
   const row=await store.row(id,signal),binders=[...t.binders];if(binds(r[0],slot))binders.push({address:t.address,name:r[2].binderName||r[2].declName||'_',constructor:A.kinds[r[0]]});
   const v={id,row,binders,address:address(q,part,[...path,slot],image),field:A.fields[A.kinds[r[0]]][slot]};v.binding=binding(q,v,part);vertices.push(v);hidden+=BigInt(row[3])-1n;maxScope=Math.max(maxScope,row[4]-Number(binds(r[0],slot)));
  }
  demand(BigInt(r[3])===BigInt(vertices.length)+hidden,'cut occurrence accounting');demand(r[4]===(r[0]===0?r[2].index+1:Math.max(0,maxScope)),'cut scope recurrence');
  return{part,image,address:t.address,vertices,expanded:r[3],hidden:hidden.toString(),visible:vertices.length};
 }
 async function scene(store,q,selection,{signal}={}){
  const link=await correspondence(store,q,selection,signal),panes={};
  for(const part of['source','image','result'])panes[part]=link[part]?await cut(store,q,part,link[part].path,link[part].image??null,signal):null;
  // Validate the displayed children, not just the selected node.
  if(panes.source&&panes.result&&!link.insertion)for(let j=0;j<panes.source.vertices.length;j++){const v=panes.source.vertices[j];await correspondence(store,q,{part:'source',path:v.address.path},signal);}
  if(link.insertion)for(const v of panes.image.vertices)await correspondence(store,q,{part:'result',path:[...link.insertion.path,...v.address.path]},signal);
  return freeze({format:'ProofAtlasSubstitutionScene/1',query:q.query.index,link,panes,typing:'No new descendant typing judgment',visibleVertices:Object.values(panes).reduce((n,p)=>n+(p?.visible||0),0)});
 }
 async function firstExternal(store,q,{part='source',image=null,signal}={}){
  const start=root(q,part,image),failed=new Set(),stack=[{id:start,depth:0,next:0,loaded:false}],path=[];let work=0;
  while(stack.length){demand(++work<=limits.searchStates*5,'reference-search work budget');const f=stack[stack.length-1],key=f.id+':'+f.depth;
   if(!f.loaded){f.row=await store.row(f.id,signal);f.loaded=true;
    if(f.row[0]===0&&f.row[2].index>=f.depth&&(part==='image'||f.row[2].index-f.depth<q.transport.images.length))return[...path];
    if(f.row[4]<=f.depth||failed.has(key)||part==='source'&&!q.transport.images.length)f.next=f.row[1].length;
   }
   if(f.next<f.row[1].length){const slot=f.next++,depth=f.depth+Number(binds(f.row[0],slot));demand(path.length<limits.path,'reference-search path bound');stack.push({id:f.row[1][slot],depth,next:0,loaded:false});path.push(slot);}
   else{demand(failed.size<limits.searchStates,'reference-search state budget');failed.add(key);stack.pop();path.pop();}
  }return null;
 }
 const api={base,limits,binds,open,address,trace,correspondence,cut,scene,firstExternal};if(node)module.exports=api;else host.ProofAtlasSubstitutionGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
