/* Literal source expression support; native types are an independent optional layer. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages,C=node?require('./proof-atlas-region-contexts'):host.ProofAtlasRegionContexts,S=node?require('./proof-atlas-type-support'):host.ProofAtlasTypeSupport,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts;
 const copy=x=>JSON.parse(JSON.stringify(x)),size=x=>new TextEncoder().encode(JSON.stringify(x)).length,demand=(v,m)=>{if(!v)throw Error('Source support: '+m);},binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 async function open(input,selected,options={}){
  const d=copy(input),supplied=copy(selected);let cursor=null,context=null,scene=null,disposed=false;
  const live=signal=>{demand(!disposed,'disposed');if(options.signal?.aborted||signal?.aborted)throw options.signal?.reason||signal.reason||Error('Source support cancelled');};
  const address=at=>({namespace:'source-expression',name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,node:at.node,route:copy(at.route)});
  const root=address(supplied),dispose=()=>{if(disposed)return;disposed=true;cursor?.dispose();context?.dispose();cursor=context=scene=null;};
  try{
   live();demand(supplied.namespace==='source-expression'&&M.same(root,supplied)&&M.route(root.route),'qualified original occurrence');demand(d.sourcePages?.file==='/public/data/proof-atlas/source-pages/'+d.source.indexSha256+'/manifest-'+d.sourcePages.sha256+'.json.gz','qualified source manifest');
   cursor=await P.open(d.sourcePages,d.record,{signal:options.signal,pageLimit:1,indexLimit:2});live();const identity=P.identity(cursor);demand(identity.name===d.source.name&&identity.indexSha256===d.source.indexSha256&&identity.sourceSha256===d.source.sourceSha256,'source identity');
   const read=(id,request={})=>cursor.run(()=>P.fields.map(f=>cursor.data[f][id]),{signal:request.signal||options.signal});
   demand(root.route.root<cursor.data.roots.length,'source root');let id=cursor.data.roots[root.route.root],depth=0;
   for(const slot of root.route.slots){const row=await read(id);live();demand(slot<row[1].length,'ordered source field');if(binds(row[0],slot))depth++;id=row[1][slot];}demand(id===root.node,'exact source node/path');await read(id);
   context=await C.derive(d.source,cursor.data.roots,[{call:0,anchor:{node:root.node,route:root.route},contextLength:depth}],read,{signal:options.signal});live();
   const frames=context.context(0),contextState=context.state(),contextIdentity=context.scene().identity;context.dispose();context=null;
   const result=await S.scan(read,cursor.data.kind.length,root.node,frames.length,{...options,nodeLimit:S.limits.sourceNodes});live();
   const base={namespace:'literal-source-expression-support',source:copy(d.source),root,contextDerivationSha256:contextIdentity.derivationSha256};
   if(result.status!=='complete')scene={...result,identity:base};
   else{
    const present=new Map(result.support.map(x=>[x.ordinal,x.witness]));
    const rows=frames.map((f,ordinal)=>{const w=present.has(ordinal)?copy(present.get(ordinal)):null;
     if(w){const length=root.route.slots.length+(w.slots?.length??w.pathLength);if(w.status==='located'&&length<=512){w.address=address({node:w.node,route:{root:root.route.root,slots:[...root.route.slots,...w.slots]}});delete w.slots;}else{delete w.slots;w.status='outside-path-bound';w.pathLength=length;}}
     return{ordinal,kind:f.kind,name:f.name,nameTruncated:f.nameTruncated,address:copy(f.address),status:w?'present':'absent',witness:w};
    });
    scene={format:'ProofAtlasSourceSupport/1',status:'complete',identity:{...base,derivationSha256:await A.digest(new TextEncoder().encode(JSON.stringify({rule:'literal-source-ambient-support/1',identity:base,rows})))},ambientLength:frames.length,rows,stats:result.stats,scope:'Literal source expression fields, including domains and type annotations. Subtree-local binders are excluded. No unfolding, native type inference or premise-necessity claim.'};
   }
   demand(size(scene)<=4194304,'scene byte bound');live();
   const allowed=new Set([root,...(scene.rows||[]).flatMap(r=>[r.address,r.witness?.address].filter(Boolean))].map(a=>JSON.stringify([a.node,a.route.root,a.route.slots])));
   return Object.freeze({scene:()=>{live();return copy(scene);},async info(inputAddress,request={}){
    const at=copy(inputAddress);live(request.signal);demand(M.same(address(at),at)&&allowed.has(JSON.stringify([at.node,at.route.root,at.route.slots])),'selection outside issued source support');
    let id=cursor.data.roots[at.route.root],path=cursor.data.declaration.rootPaths[at.route.root];for(const slot of at.route.slots){const row=await read(id,request);live(request.signal);demand(slot<row[1].length,'source selection field');path+='.'+A.fields[A.kinds[row[0]]][slot];id=row[1][slot];}demand(id===at.node,'source selection node/path');const row=await read(id,request);live(request.signal);return{kind:A.kinds[row[0]],payload:copy(row[2]),path,text:row[0]===0?'Bound variable #'+row[2].index:path,typeStatus:'unobserved-source-expression'};
   },state:()=>({disposed,sceneBytes:scene?size(scene):0,sourcePages:cursor?.state()||null,peakContextRows:contextState.peakSourceRows,nativeTypeGraphs:0,wholeSourceArchiveRequested:false}),dispose});
  }catch(error){dispose();throw error;}
 }
 function compare(source,type,link){
  demand(source?.status==='complete'&&source.format==='ProofAtlasSourceSupport/1','complete source support');
  if(type){demand(type.status==='complete'&&type.format==='ProofAtlasRecordedTypeSupport/1'&&M.same(type.identity.source,source.identity.source)&&M.same(type.rows.map(r=>r.address),source.rows.map(r=>r.address)),'same exact ordered context');demand(link?.nativeOwner===type.identity.nativeOwner&&M.same(link.typeRoot,type.identity.root)&&M.same(link.sourceRoot,source.identity.root)&&['producer','actual-input-use','result'].includes(link.sourceRole),'original source/type association');}
  const rows=source.rows.map((s,i)=>{const t=type?.rows[i]||null;return{ordinal:i,kind:s.kind,name:s.name,nameTruncated:s.nameTruncated,address:copy(s.address),source:copy(s.witness),type:t?.witness?copy(t.witness):null,sourceStatus:s.status,typeStatus:t?t.status:'unobserved',category:t?s.status==='present'?t.status==='present'?'both':'source-only':t.status==='present'?'type-only':'neither':s.status==='present'?'source-present':'source-absent'};});
  const out={format:'ProofAtlasSourceTypeSupport/1',status:'complete',identity:{namespace:'source-and-type-support-comparison',source:copy(source.identity.source),sourceRoot:copy(source.identity.root),sourceDerivationSha256:source.identity.derivationSha256,typeRoot:type?copy(type.identity.root):null,typeDerivationSha256:type?.identity.derivationSha256||null,nativeOwner:type?.identity.nativeOwner||null,sourceRole:link?.sourceRole||'selected-expression'},typeStatus:type?'recorded':'unobserved',ambientLength:source.ambientLength,rows,scope:'Literal occurrence comparison in one exact lexical context. Source expression fields include annotations. Type-only and source-only are syntactic categories, not causal dependence or premise necessity.'};demand(size(out)<=8388608,'comparison byte bound');return out;
 }
 const api={open,compare};if(node)module.exports=api;else host.ProofAtlasSourceSupport=api;
})(typeof window==='undefined'?globalThis:window);
