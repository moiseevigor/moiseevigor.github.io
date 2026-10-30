/* Exact lexical prefixes for a finite application region. No composite typing rule. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages,R=node?require('./proof-atlas-application-regions'):host.ProofAtlasApplicationRegions,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts;
 const copy=x=>JSON.parse(JSON.stringify(x)),size=x=>new TextEncoder().encode(JSON.stringify(x)).length,hash=x=>A.digest(new TextEncoder().encode(JSON.stringify(x))),demand=(v,m)=>{if(!v)throw Error('Region contexts: '+m);};
 const limits=Object.freeze({calls:8,route:512,rows:4096,rowBytes:4194304,sceneBytes:4194304,framesPerPage:4});
 const binds=(kind,slot)=>(kind===6||kind===7)&&slot===1||kind===8&&slot===2;
 const key=a=>a.route.root+':'+a.route.slots.join('.')+':'+a.node;
 async function derive(inputSource,inputRoots,inputTargets,read,options={}){
  const source=copy(inputSource),roots=copy(inputRoots),targets=copy(inputTargets),rows=new Map();let rowBytes=0,disposed=false;
  demand(source&&['indexSha256','sourceSha256'].every(k=>/^[a-f0-9]{64}$/.test(source[k]))&&typeof source.name==='string','qualified source');
  demand(Array.isArray(roots)&&roots.length>0&&roots.every(n=>Number.isInteger(n)&&n>=0),'source roots');
  demand(Array.isArray(targets)&&targets.length>0&&targets.length<=limits.calls&&new Set(targets.map(t=>t.call)).size===targets.length,'distinct bounded calls');targets.sort((a,b)=>a.call-b.call);
  const rowLimit=options.rowLimit??limits.rows,byteLimit=options.byteLimit??limits.rowBytes;
  demand(Number.isInteger(rowLimit)&&rowLimit>0&&rowLimit<=limits.rows&&Number.isInteger(byteLimit)&&byteLimit>0&&byteLimit<=limits.rowBytes,'source bounds');
  const live=()=>{demand(!disposed,'disposed');if(options.signal?.aborted)throw options.signal.reason||Error('Context load cancelled');};
  const address=(id,root,slots)=>({namespace:'source-expression',name:source.name,indexSha256:source.indexSha256,sourceSha256:source.sourceSha256,node:id,route:{root,slots:[...slots]}});
  async function row(id){live();if(rows.has(id))return rows.get(id);demand(rows.size<rowLimit,'source path row bound');const r=copy(await read(id,options.signal));live();demand(Array.isArray(r)&&r.length===5&&Number.isInteger(r[0])&&r[0]>=0&&r[0]<12&&Array.isArray(r[1])&&r[1].length===(A.fields[A.kinds[r[0]]]||[]).length&&r[1].every(c=>Number.isInteger(c)&&c>=0&&c<id)&&r[2]&&typeof r[2]==='object','source constructor row');const bytes=size(r);demand(rowBytes+bytes<=byteLimit,'source path byte bound');rows.set(id,r);rowBytes+=bytes;return r;}
  const trie=[{parent:null,depth:0,frame:null,children:new Map(),calls:[]}],placements=[];
  try{
   for(const t of targets){
    demand(Number.isSafeInteger(t.call)&&t.call>=0&&Number.isInteger(t.anchor?.route?.root)&&t.anchor.route.root>=0&&t.anchor.route.root<roots.length&&Array.isArray(t.anchor.route.slots)&&t.anchor.route.slots.length<=limits.route&&t.anchor.route.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2)&&Number.isInteger(t.contextLength)&&t.contextLength>=0,'call occurrence');
    const route=t.anchor.route;let id=roots[route.root],parent=0,depth=0;
    for(let i=0;i<route.slots.length;i++){
     const tuple=await row(id),slot=route.slots[i];demand(slot<tuple[1].length,'ordered source field');
     if(binds(tuple[0],slot)){
      const at=address(id,route.root,route.slots.slice(0,i)),k=key(at),owner=trie[parent];
      if(!owner.children.has(k)){
       const payload=tuple[2],name=tuple[0]===8?payload.declName:payload.binderName;demand(typeof name==='string','binder name payload');
       const fields=(tuple[0]===8?['type','value']:['domain']).map((field,j)=>({field,address:address(tuple[1][j],route.root,[...route.slots.slice(0,i),j]),contextDepth:depth}));
       const frame={address:at,kind:A.kinds[tuple[0]],name:name.slice(0,256),nameTruncated:name.length>256,beforeDepth:depth,afterDepth:depth+1,entryField:'body',headers:fields};
       owner.children.set(k,trie.length);trie.push({parent,depth:depth+1,frame,children:new Map(),calls:[]});
      }
      parent=owner.children.get(k);depth++;
     }
     id=tuple[1][slot];
    }
    await row(id);demand(id===t.anchor.node&&depth===t.contextLength,'source occurrence/context length');trie[parent].calls.push(t.call);placements.push({call:t.call,vertex:parent,address:address(id,route.root,route.slots),depth});
   }
   live();const vertices=[],edges=[],retained=new Set(trie.map((n,i)=>i===0||n.calls.length||n.children.size!==1?i:-1).filter(i=>i>=0));
   for(const id of retained){const n=trie[id];vertices.push({id:'c'+id,depth:n.depth,calls:[...n.calls],afterBinder:n.frame?copy(n.frame.address):null});if(id===0)continue;let p=n.parent,frames=[n.frame];while(!retained.has(p)){frames.push(trie[p].frame);p=trie[p].parent;}frames.reverse();edges.push({from:'c'+p,to:'c'+id,frames:copy(frames)});}
   const identity={namespace:'source-context-prefix-tree',source,derivationSha256:await hash({source,targets})};live();
   const scene={format:'ProofAtlasRegionContexts/1',identity,vertices,edges,placements:placements.map(p=>({...p,vertex:'c'+p.vertex})),stats:{calls:targets.length,distinctContexts:new Set(placements.map(p=>p.vertex)).size,vertices:vertices.length,frames:trie.length-1,sourceRows:rows.size,sourceRowBytes:rowBytes},scope:'Exact ordered lexical prefixes at these original occurrences. Context depth is not context identity. Header domains and let values stay before their binder; bodies enter it. No common-context typing judgment or premise-necessity claim.'};
   demand(vertices.length<=2*targets.length&&size(scene)<=limits.sceneBytes,'compressed scene bound');let issued=copy(scene);const peakRows=rows.size,peakBytes=rowBytes;rows.clear();rowBytes=0;
   function context(call){live();const p=issued.placements.find(p=>p.call===call);demand(p,'call outside this context tree');const frames=[];let v=p.vertex;while(v!=='c0'){const e=issued.edges.find(e=>e.to===v);demand(e,'context prefix');frames.unshift(...e.frames);v=e.from;}demand(frames.length===p.depth,'recovered context');return copy(frames);}
   return Object.freeze({scene:()=>{live();return copy(issued);},context,binder:(call,ordinal)=>{const frames=context(call);demand(Number.isInteger(ordinal)&&ordinal>=0&&ordinal<frames.length,'binder ordinal');return copy(frames[ordinal].address);},page:(vertex,offset=0)=>{live();const edge=issued.edges.find(e=>e.to===vertex);demand(edge&&Number.isInteger(offset)&&offset>=0&&offset%4===0&&offset<edge.frames.length,'context edge/page');return{from:edge.from,to:edge.to,total:edge.frames.length,offset,rows:copy(edge.frames.slice(offset,offset+4)),previous:offset?offset-4:null,next:offset+4<edge.frames.length?offset+4:null};},state:()=>({disposed,sourceRows:rows.size,peakSourceRows:peakRows,peakSourceRowBytes:peakBytes,sceneBytes:disposed?0:size(issued),nativeTypeGraphs:0}),dispose:()=>{disposed=true;rows.clear();issued=null;}});
  }catch(error){disposed=true;rows.clear();throw error;}
 }
 async function open(inputModel,unitId,inputDescriptor,options={}){
  const model=copy(inputModel),d=copy(inputDescriptor);if(options.signal?.aborted)throw options.signal.reason||Error('Context load cancelled');await R.unfold(model);
  const unit=model.units.find(u=>u.id===unitId);demand(unit&&M.same(d.source,model.identity.source)&&d.mode===model.mode&&(d.owner?.sha256||null)===model.identity.nativeOwner&&M.same({scope:d.scope,headerSha256:d.pages.sha256},model.identity.inventory),'original region/source/inventory');
  const targets=unit.members.map(call=>{const c=model.records.find(c=>c.index===call);return{call,anchor:c.anchor,contextLength:c.result.contextLength};});
  demand(d.sourcePages?.file==='/public/data/proof-atlas/source-pages/'+d.source.indexSha256+'/manifest-'+d.sourcePages.sha256+'.json.gz','qualified source manifest path');
  const cursor=await P.open(d.sourcePages,d.record,{fetcher:options.fetcher,signal:options.signal,pageLimit:1,indexLimit:2});
  try{demand(M.same(P.identity(cursor).name,d.source.name)&&P.identity(cursor).indexSha256===d.source.indexSha256&&P.identity(cursor).sourceSha256===d.source.sourceSha256,'source cursor identity');const lease=await derive(d.source,cursor.data.roots,targets,(id,signal)=>cursor.run(()=>P.fields.map(f=>cursor.data[f][id]),{signal}),options),sourcePages=cursor.state();return Object.freeze({...lease,state:()=>({...lease.state(),sourcePages:{...sourcePages,cachedNodes:0,cachedPages:0,indexPages:0},sourceCursorClosed:true,origin:'paged-source-identity'})});}finally{cursor.dispose();}
 }
 const api={derive,open,limits};if(node)module.exports=api;else host.ProofAtlasRegionContexts=api;
})(typeof window==='undefined'?globalThis:window);
