/* One original validated native case at a time. Output is an experimental transport. */
'use strict';
const crypto=require('crypto'),assert=require('assert/strict'),T=require('../../../public/js/proof-atlas-deep-context'),L=require('../../../public/js/proof-atlas-type-pages');
const bytes=v=>Buffer.from(JSON.stringify(v)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function pack(nativeCase){
 const files=new Map(),tables=new Map(),observations=[];
 function put(base,suffix,value){const raw=bytes(value),sha256=hash(raw),file=base+sha256+suffix;assert(!files.has(file)||files.get(file).equals(raw));files.set(file,raw);return{file,sha256,bytes:raw.length};}
 for(const entry of nativeCase.entries){
  // This also checks the sealed original source/observation attachment. Native
  // validators already checked the complete shared table when the case opened.
  const reference=T.typeScene(entry,nativeCase.data),key=entry.evidenceSha256+'/'+entry.typeTableSha256;assert(entry.typeTableSha256);
  let table=tables.get(key);
  if(!table){
   const data=entry.typeData,base='/public/data/proof-atlas/type-pages/'+entry.typeTableSha256+'/',indexSizes={};let level=0,span=1,leaves=[];
   assert(data.kind.length<=L.limits.nodes);
   for(let start=0;start<data.kind.length;start+=L.limits.pageSize){const nodes=[];for(let i=start;i<Math.min(data.kind.length,start+L.limits.pageSize);i++)nodes.push(['kind','children','payloads','expanded','neededScope'].map(f=>data[f][i]));const page=put(base,'.page.gz',{format:'ProofAtlasTypePage/1',typeTableSha256:entry.typeTableSha256,start,nodes});assert(page.bytes<=L.limits.pageBytes);leaves.push({sha256:page.sha256,bytes:page.bytes});}
   const pageCount=leaves.length;
   while(true){const next=[];for(let i=0;i<leaves.length;i+=64){const index=put(base,'.index.gz',{format:'ProofAtlasTypeIndex/1',level,first:i*span,children:leaves.slice(i,i+64)});assert(index.bytes<=L.limits.indexBytes);indexSizes[index.sha256]=index.bytes;next.push({sha256:index.sha256,bytes:index.bytes});}if(next.length===1){leaves=next;break;}leaves=next;level++;span*=64;}
   const manifest={format:'ProofAtlasTypePages/1',evidenceSha256:entry.evidenceSha256,typeTableSha256:entry.typeTableSha256,nodeCount:data.kind.length,pageSize:L.limits.pageSize,pageCount,indexLevel:level,indexRoot:leaves[0].sha256,indexSizes,typeDeclaration:data.declaration,
    source:{name:nativeCase.record.name,indexSha256:nativeCase.record.indexSha256,sourceSha256:nativeCase.record.sourceSha256},producerSha256:hash(require('fs').readFileSync(__filename)),nativeValidatorSha256:hash(require('fs').readFileSync(require.resolve('../../../public/js/proof-atlas-deep-context'))),validation:'Original native archive/source/table validated by producer; transport is not an independent archive membership or kernel proof'};
   const descriptor=put(base,'.manifest.gz',manifest);assert(descriptor.bytes<=L.limits.manifestBytes);table={descriptor:{...descriptor,typeTableSha256:entry.typeTableSha256,evidenceSha256:entry.evidenceSha256,nodes:data.kind.length},nodes:data.kind.length};tables.set(key,table);
  }
  const metadata={format:'ProofAtlasPagedTypeObservation/1',typeTableSha256:entry.typeTableSha256,evidenceSha256:entry.evidenceSha256,evidenceFile:entry.evidenceFile,sourceIndexSha256:entry.sourceIndexSha256,sourceRoute:entry.route,sourceNode:entry.node,contextLength:entry.contextLength,role:entry.role,root:entry.typeData.roots[0],typeRecord:entry.typeRecord,origin:reference.origin};
  const descriptor=put(table.descriptor.file.slice(0,table.descriptor.file.lastIndexOf('/')+1),'.observation.gz',metadata);assert(descriptor.bytes<=L.limits.observationBytes);observations.push({sourceRoute:entry.route,table:table.descriptor,descriptor});
 }
 return{files,tables:[...tables.values()],observations};
}
module.exports={pack};
