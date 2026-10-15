/* Native extraction attestations, not a browser kernel or prose-equivalence certificate. */
(function(host){
 'use strict';
 const A=typeof module!=='undefined'&&module.exports?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const roles=new Set(['proof','type','value']),infos=new Set(['default','implicit','strictImplicit','instImplicit']);
 function demand(ok,message){if(!ok)throw Error('Occurrence types: '+message);}
 const key=r=>r.root+':'+r.slots.join('.');
 function level(u,depth=0){demand(u&&depth<=128,'universe bound');switch(u.kind){case'zero':break;case'succ':level(u.of,depth+1);break;case'max':case'imax':level(u.left,depth+1);level(u.right,depth+1);break;case'param':demand(typeof u.name==='string','universe parameter');break;default:demand(false,'unknown/unresolved universe');}}
 function context(data,route){
  demand(Number.isInteger(route?.root)&&route.root>=0&&route.root<data.roots.length&&Array.isArray(route.slots)&&route.slots.length<=512,'invalid route');let id=data.roots[route.root];const out=[],slots=[];
  for(const slot of route.slots){const kind=A.kinds[data.kind[id]];demand(Number.isInteger(slot)&&slot>=0&&slot<data.children[id].length,'invalid occurrence slot');if((kind==='lam'||kind==='forallE')&&slot===1||kind==='letE'&&slot===2){const r={root:route.root,slots:[...slots]};out.push({node:id,kind,path:A.path(data,r),route:r});}slots.push(slot);id=data.children[id][slot];}
  return{node:id,binders:out};
 }
 function typeGraph(g,roots,scope){
  const n=g?.kind?.length;demand(Number.isInteger(n)&&n>0&&n<=8192,'type DAG bound');for(const f of ['children','payloads','expanded','neededScope'])demand(g[f]?.length===n,'type DAG field length');
  for(let i=0;i<n;i++){const kind=A.kinds[g.kind[i]],cs=g.children[i],p=g.payloads[i];demand(kind&&Array.isArray(cs)&&cs.length===(A.fields[kind]||[]).length,'type constructor/arity');demand(cs.every(c=>Number.isInteger(c)&&c>=0&&c<i),'type DAG order');demand(kind!=='fvar'&&kind!=='mvar','unresolved type local/metavariable');demand(p&&typeof p==='object','type payload');if(kind==='bvar')demand(Number.isInteger(p.index)&&p.index>=0,'type bound-variable index');if(kind==='sort')level(p.level);if(kind==='const'){demand(typeof p.name==='string'&&Array.isArray(p.levels),'type declaration');p.levels.forEach(u=>level(u));}if(kind==='lam'||kind==='forallE')demand(typeof p.binderName==='string'&&infos.has(p.binderInfo),'type binder');if(kind==='letE')demand(typeof p.declName==='string'&&typeof p.nondep==='boolean','type let');if(kind==='proj')demand(typeof p.typeName==='string'&&Number.isInteger(p.index)&&p.index>=0,'type projection');if(kind==='mdata')demand(Array.isArray(p.metadata),'type metadata');if(kind==='lit')demand(['natVal','strVal'].includes(p.literalKind)&&typeof p.value==='string','type literal');demand(typeof g.expanded[i]==='string'&&/^[1-9]\d*$/.test(g.expanded[i]),'type count encoding');demand(1n+cs.reduce((s,c)=>s+BigInt(g.expanded[c]),0n)===BigInt(g.expanded[i]),'type count');
   if(kind==='mdata')demand(p.metadata.every(m=>typeof m.key==='string'&&m.value&&['ofString','ofBool','ofName','ofNat','ofInt'].includes(m.value.kind)),'unreviewed source syntax in type metadata');
   const need=kind==='bvar'?g.payloads[i].index+1:Math.max(0,...cs.map((c,j)=>g.neededScope[c]-(((kind==='lam'||kind==='forallE')&&j===1||kind==='letE'&&j===2)?1:0)));demand(Number.isInteger(need)&&need>=0&&g.neededScope[i]===need,'type lexical scope');
  }
  for(const r of roots)demand(Number.isInteger(r)&&r>=0&&r<n&&g.neededScope[r]<=scope,'type root/context');
 }
 function validate(evidence,data,record){
  demand(evidence.format==='ProofAtlasOccurrenceTypes/1'&&evidence.name===record.name,'format/identity');const source=evidence.source;demand(source?.name===record.name&&source.indexSha256===record.indexSha256&&source.sourceSha256===record.sourceSha256,'stale source packet');demand(evidence.nativeDagMatchesPacket===true&&evidence.leanVersion==='4.33.1','native extraction version');const env=evidence.environment;demand(evidence.sourceModuleHashVerified===true&&env&&typeof env.compiler==='string'&&env.compiler.includes('version 4.33.1,')&&/^[a-f0-9]{64}$/.test(env.lakeManifestSha256),'environment/source attestation');demand(env.dependencyRevisions&&/^[a-f0-9]{40}$/.test(env.dependencyRevisions.mathlib)&&Object.values(env.dependencyRevisions).every(r=>/^[a-f0-9]{40}$/.test(r)),'dependency revision attestation');demand(Array.isArray(evidence.entries)&&evidence.entries.length<=512,'entry bound');const seen=new Set();
  for(const entry of evidence.entries){const at=context(data,entry.route),k=key(entry.route);demand(!seen.has(k),'duplicate occurrence');seen.add(k);if(entry.status==='unavailable'){demand(typeof entry.reason==='string','unavailable reason');continue;}
   demand(entry.status==='checked'&&entry.kernelCheck==='PASS'&&entry.typeAbstractionRoundtrip===true&&roles.has(entry.role),'unchecked judgment');demand(entry.node===at.node&&entry.path===A.path(data,entry.route),'source occurrence mismatch');demand(entry.typeTextIsPresentation===true&&typeof entry.typeText==='string','type presentation');demand(Array.isArray(entry.context)&&entry.context.length===at.binders.length,'context size');
   entry.context.forEach((b,j)=>{const expected=at.binders[j];demand(b.node===expected.node&&b.kind===expected.kind&&b.path===expected.path&&key(b.route)===key(expected.route),'context binder mismatch');});
   demand(Array.isArray(entry.arguments)&&entry.arguments.length<=128,'argument bound');const sourceArgs=[];let id=at.node,slots=[...entry.route.slots];while(data.kind[id]===5){const route={root:entry.route.root,slots:[...slots,1]};sourceArgs.push({node:data.children[id][1],route,path:A.path(data,route)});id=data.children[id][0];slots.push(0);demand(sourceArgs.length<=128,'source spine exceeds checked bound');}sourceArgs.reverse();demand(sourceArgs.length===entry.arguments.length,'argument inventory mismatch');
   const roots=[entry.typeRoot];entry.arguments.forEach((arg,j)=>{const source=sourceArgs[j];demand(arg.slot===j+1&&arg.node===source.node&&arg.path===source.path&&key(arg.route)===key(source.route),'argument order/route');demand(roles.has(arg.role)&&infos.has(arg.binderInfo),'argument role/visibility');roots.push(arg.typeRoot,arg.expectedRoot);});typeGraph(entry.typeGraph,roots,at.binders.length);
  }
  return true;
 }
 async function open(descriptor,data,record){
  demand(descriptor.name===record.name&&descriptor.indexSha256===record.indexSha256&&descriptor.sourceSha256===record.sourceSha256,'descriptor source mismatch');const evidence=await A.compressed(descriptor.file,descriptor.sha256);validate(evidence,data,record);demand(evidence.source.edition===descriptor.edition,'edition mismatch');const entries=new Map(evidence.entries.map(e=>[key(e.route),e]));
  return{source:evidence.source,file:descriptor.file,sha256:descriptor.sha256,checked:evidence.entries.filter(e=>e.status==='checked').length,queried:entries.size,
   get:route=>entries.get(key(route)),argument:(callRoute,argRoute)=>{const e=entries.get(key(callRoute));return e?.status==='checked'?e.arguments.find(a=>key(a.route)===key(argRoute)):undefined;},
   guarantee:'Kernel and domain checks recorded during native extraction against the exact packet and lexical context. The browser verifies hashes and structural binding; it does not rerun Lean or certify article prose.'};
 }
 const api={context,validate,open};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasOccurrenceTypes=api;
})(typeof window==='undefined'?globalThis:window);
