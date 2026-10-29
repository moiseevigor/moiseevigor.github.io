/* Experimental native-port transport; producer checks the complete original archives. */
'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),fs=require('fs'),M=require('../../../public/js/proof-atlas-application-ports'),A=require('../../../public/js/proof-atlas-library-data'),L=require('../../../public/js/proof-atlas-type-pages');
const fields=['kind','children','payloads','expanded','neededScope'],encode=x=>Buffer.from(JSON.stringify(x)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),prepared=new WeakSet();
function prepare(d,nativeBytes,sourceBytes){
 assert.equal(sha(nativeBytes),d.owner.sha256);assert.equal(sha(sourceBytes),d.record.indexSha256);const batch=JSON.parse(nativeBytes),data=A.validateIndex(JSON.parse(sourceBytes),d.record);M.validateHeader(batch,d);const result={d,batch,data};prepared.add(result);return result;
}
function pack(original,input){
 assert(prepared.has(original),'original owner/source preparation required');const {d,batch,data}=original,e=batch.entries.find(e=>e.id===input);assert(e);const j=e.junction;assert(j.graph.expanded.every(n=>n.length<=4096),'type-page count digit bound');M.validatePort(j,data,{anchor:j.consumer.anchor,arguments:j.consumer.arguments},j.consumer.slot);
 const files=new Map(),tableSha256=sha(encode(Object.fromEntries(fields.map(f=>[f,j.graph[f]])))),base='/public/data/proof-atlas/type-pages/'+tableSha256+'/',indexSizes={};
 function put(suffix,value){const bytes=encode(value),sha256=sha(bytes),file=base+sha256+suffix;files.set(file,bytes);return{file,sha256,bytes:bytes.length};}
 let level=0,span=1,leaves=[];
 for(let start=0;start<j.graph.kind.length;start+=64){const nodes=[];for(let n=start;n<Math.min(start+64,j.graph.kind.length);n++)nodes.push(fields.map(f=>j.graph[f][n]));const part=put('.page.gz',{format:'ProofAtlasTypePage/1',typeTableSha256:tableSha256,start,nodes});assert(part.bytes<=L.limits.pageBytes);leaves.push({sha256:part.sha256,bytes:part.bytes});}
 const pageCount=leaves.length;
 for(;;){const next=[];for(let n=0;n<leaves.length;n+=64){const p=put('.index.gz',{format:'ProofAtlasTypeIndex/1',level,first:n*span,children:leaves.slice(n,n+64)});assert(p.bytes<=L.limits.indexBytes);indexSizes[p.sha256]=p.bytes;next.push({sha256:p.sha256,bytes:p.bytes});}if(next.length===1){leaves=next;break;}leaves=next;span*=64;level++;}
 const header={...batch};delete header.entries;const port={...j};delete port.graph;
 const metadata=put('.port.gz',{format:'ProofAtlasPagedApplicationTypeMetadata/1',source:d.source,record:d.record,owner:d.owner,header,input:e.id,port});assert(metadata.bytes<=2097152,'port metadata bound');
 const manifest={format:'ProofAtlasTypePages/1',evidenceSha256:d.owner.sha256,typeTableSha256:tableSha256,nodeCount:j.graph.kind.length,pageSize:64,pageCount,indexLevel:level,indexRoot:leaves[0].sha256,indexSizes,typeDeclaration:{name:d.source.name+' / recorded type',rootPaths:['computed.native.type']},source:{name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256},applicationPort:metadata,producerSha256:sha(fs.readFileSync(__filename)),graphHashConvention:'JSON object with kind, children, payloads, expanded, neededScope in that order; original array values and node IDs',validation:'Complete original native archive, source packet and port validated by producer. Hash-addressed transport is not an independent original-archive membership or kernel proof.'};
 const graph=put('.manifest.gz',manifest);assert(graph.bytes<=L.limits.manifestBytes);const descriptor={format:'ProofAtlasPagedApplicationType/1',...graph,typeTableSha256:tableSha256,evidenceSha256:d.owner.sha256,nodes:j.graph.kind.length,metadataSha256:metadata.sha256,source:d.source,sourcePages:d.sourcePages,input:e.id,query:j.consumer.anchor.route};
 // Reconstruct all five arrays from page rows, preserving node IDs and order.
 const restored=Object.fromEntries(fields.map(f=>[f,[]]));for(const [file,bytes]of files)if(file.endsWith('.page.gz'))for(const row of JSON.parse(bytes).nodes)fields.forEach((f,i)=>restored[f].push(row[i]));assert.deepEqual(restored,j.graph);assert.equal(sha(encode(restored)),tableSha256);
 return{descriptor,files,original:e};
}
module.exports={prepare,pack,encode,sha};
