/* Project one original validated recorded case; no private mathematical sources. */
'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const T=require('../../../public/js/proof-atlas-deep-context'),A=require('../../../public/js/proof-atlas-library-data'),P=require('../../../public/js/proof-atlas-packed-routes'),TP=require('../type-pages/pack.cjs');
const bytes=v=>Buffer.from(JSON.stringify(v)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),key=r=>r.root+':'+r.depth+':'+r.slots;
function fingerprints(g){
 const hashes=[];for(let i=0;i<g.kind.length;i++){assert(g.children[i].every(c=>c<i));hashes.push(sha(bytes(['ProofAtlasTypeSyntaxFingerprint/1',g.kind[i],A.payloadKey(g.kind[i],g.payloads[i]),g.children[i].map(c=>hashes[c])])));}return hashes;
}
async function pack(c,{captions}={}){
 const owners=[...new Set(c.entries.map(e=>T.construction(e,c.data)?.entry).filter(Boolean))];
 const source={...T.sourceIdentity(c.data,c.record),sourceSha256:c.record.sourceSha256},types=TP.pack(c,owners),files=new Map(types.files),rows=[],pools=new WeakMap();let constructions=0,componentCount=0,positionCaptions=0,maxRecordBytes=0,firstConstruction=null;
 const fp=(e,root)=>{let values=pools.get(e.typeData.kind);if(!values){values=fingerprints(e.typeData);pools.set(e.typeData.kind,values);}return values[root];};
 function put(base,suffix,value,cap){const raw=bytes(value),hash=sha(raw),file=base+hash+suffix;assert(raw.length<=cap,'construction asset byte bound');assert(!files.has(file)||files.get(file).equals(raw));files.set(file,raw);return{file,sha256:hash,bytes:raw.length};}
 const tableFor=e=>{const table=types.tables.find(t=>t.descriptor.evidenceSha256===e.evidenceSha256&&t.descriptor.typeTableSha256===e.typeTableSha256);assert(table,'construction table requires explicit producer adapter');return table.descriptor;};
 const summary=e=>({route:e.route,node:e.node,contextLength:e.contextLength,role:e.role,profile:e.profile,evidenceSha256:e.evidenceSha256,evidenceFile:e.evidenceFile,typeTableSha256:e.typeTableSha256,root:e.typeData.roots[0],typeFingerprint:fp(e,e.typeData.roots[0]),recording:e.recording});
 async function component(entry,field,observation='kernel'){
  const construction=T.construction(entry,c.data),base=construction.entry,e=await T.constructionType(entry,c.data,field,observation),table=tableFor(e),origin=T.typeScene(e,c.data).origin;
  const metadata={format:'ProofAtlasPagedConstructionTypeObservation/1',typeTableSha256:e.typeTableSha256,evidenceSha256:e.evidenceSha256,evidenceFile:e.evidenceFile,sourceIndexSha256:e.sourceIndexSha256,sourceRoute:e.route,sourceNode:e.node,contextLength:e.contextLength,role:e.role,root:e.typeData.roots[0],typeRecord:e.typeRecord,origin,
   recipe:{format:'ProofAtlasConstructionTypeComponent/1',evidenceSha256:base.evidenceSha256,...T.typeIdentity(base),root:e.typeData.roots[0]}};
  const descriptor=put('/public/data/proof-atlas/type-pages/'+e.typeTableSha256+'/', '.observation.gz',metadata,65536);componentCount++;return{table,observation:descriptor};
 }
 const base='/public/data/proof-atlas/construction-pages/'+source.indexSha256+'/';
 for(const e of c.entries){
  const original=types.observations.find(o=>key(o.sourceRoute)===key(e.route));assert(original);const value={format:'ProofAtlasConstructionRecord/1',source,typed:{...summary(e),type:{table:original.table,observation:original.descriptor}},construction:null},construction=T.construction(e,c.data);
  if(captions?.createRecorded){const caption=await captions.createRecorded(e);if(caption){value.typed.caption=put(base,'.caption.gz',caption,16384);positionCaptions++;}}
  if(construction){constructions++;firstConstruction??=e.route;const premises=[];
   for(const part of construction.premises){const alternate=part.alternateTypeRoot!==undefined?{alternateTypeRoot:part.alternateTypeRoot,alternateFingerprint:fp(construction.entry,part.alternateTypeRoot),alternateType:await component(e,part.field,'meta')}:{};
    premises.push({field:part.field,route:part.route,node:part.node,contextLength:part.contextLength,role:part.role,typeRoot:part.typeRoot,typeFingerprint:fp(construction.entry,part.typeRoot),type:await component(e,part.field),...alternate});
   }
   value.construction={rule:construction.rule,entry:summary(construction.entry),premises,checks:construction.checks,components:construction.components,recording:construction.recording,conclusion:await component(e,'conclusion'),...(construction.contextExtension?{contextExtension:construction.contextExtension}:{})};
   if(captions)value.construction.captions=put(base,'.caption.gz',await captions.create(e),16384);
  }
  const descriptor=put(base,'.record.gz',value,65536);maxRecordBytes=Math.max(maxRecordBytes,descriptor.bytes);rows.push({key:key(e.route),route:e.route,record:descriptor});
 }
 rows.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);assert(rows.length>0&&rows.length<=4096);for(let i=1;i<rows.length;i++)assert(rows[i-1].key<rows[i].key);
 let refs=[];for(let at=0;at<rows.length;at+=16){const values=rows.slice(at,at+16),ref=put(base,'.index.gz',{format:'ProofAtlasConstructionIndex/1',level:0,rows:values},131072);refs.push({...ref,level:0,count:values.length,min:values[0].key,max:values.at(-1).key});}
 while(refs.length>1){const next=[];for(let at=0;at<refs.length;at+=32){const children=refs.slice(at,at+32),level=children[0].level+1,ref=put(base,'.index.gz',{format:'ProofAtlasConstructionIndex/1',level,children},131072);next.push({...ref,level,count:children.reduce((s,r)=>s+r.count,0),min:children[0].min,max:children.at(-1).max});}refs=next;}
 const body=c.data.declaration.rootPaths.indexOf('root.value'),candidates=c.entries.filter(e=>T.construction(e,c.data));firstConstruction=(candidates.find(e=>e.route.root===body&&e.role==='proof')||candidates.find(e=>e.route.root===body)||candidates[0])?.route||null;
 const version=c.entries.some(e=>T.construction(e,c.data)?.rule==='let-binding')?2:1,manifest={format:'ProofAtlasConstructionPages/1',source,entries:rows.length,constructions,firstConstruction,version,index:refs[0],producerSha256:sha(fs.readFileSync(__filename)),fingerprint:'ProofAtlasTypeSyntaxFingerprint/1',scope:'Producer-validated finite native constructions and type syntax fingerprints. Transport authentication is not independent archive membership, kernel checking or definitional equality.'};
 if(captions){manifest.captionFormat='ProofAtlasConstructionCaptions/1';manifest.captionProducerSha256=sha(fs.readFileSync(require.resolve('./captions.cjs')));manifest.captionModelSha256=sha(fs.readFileSync(require.resolve('../../../public/js/proof-atlas-recorded-captions')));}
 const descriptor=put(base,'.manifest.gz',manifest,262144);
 return{files,descriptor:{...descriptor,name:source.name,indexSha256:source.indexSha256,sourceSha256:source.sourceSha256,entries:rows.length,constructions},stats:{entries:rows.length,constructions,components:componentCount,positionCaptions,maxRecordBytes}};
}
module.exports={pack,fingerprints,key};
