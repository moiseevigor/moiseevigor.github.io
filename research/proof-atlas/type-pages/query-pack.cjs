'use strict';
const assert=require('assert/strict'),crypto=require('crypto');
const encode=v=>Buffer.from(JSON.stringify(v)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),key=r=>r.root+':'+r.depth+':'+r.slots;
function queryPack(c,packed){
 const files=new Map(),base='/public/data/proof-atlas/type-query-pages/'+c.record.indexSha256+'/',tables=packed.tables.map(t=>t.descriptor);
 const put=(suffix,v)=>{const b=encode(v),hash=sha(b),file=base+hash+suffix;files.set(file,b);return{file,sha256:hash,bytes:b.length};};
 const rows=packed.observations.map(o=>({key:key(o.sourceRoute),route:o.sourceRoute,node:c.get(o.sourceRoute).node,role:c.get(o.sourceRoute).role,origin:c.get(o.sourceRoute).recording.kind,table:tables.findIndex(t=>t.sha256===o.table.sha256),observation:o.descriptor})).sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
 assert(rows.length>0&&rows.length<=4096&&tables.length>0&&tables.length<=8);for(let i=0;i<rows.length;i++){assert(rows[i].table>=0);if(i)assert(rows[i-1].key<rows[i].key);}
 let refs=[];for(let at=0;at<rows.length;at+=16){const values=rows.slice(at,at+16),ref=put('.index.gz',{format:'ProofAtlasTypeQueryIndex/1',level:0,rows:values});assert(ref.bytes<=131072);refs.push({...ref,level:0,count:values.length,min:values[0].key,max:values.at(-1).key});}
 while(refs.length>1){const next=[];for(let at=0;at<refs.length;at+=32){const children=refs.slice(at,at+32),level=children[0].level+1,ref=put('.index.gz',{format:'ProofAtlasTypeQueryIndex/1',level,children});assert(ref.bytes<=131072);next.push({...ref,level,count:children.reduce((s,c)=>s+c.count,0),min:children[0].min,max:children.at(-1).max});}refs=next;}
 const manifest={format:'ProofAtlasTypeQueryPages/1',source:{name:c.record.name,indexSha256:c.record.indexSha256,sourceSha256:c.record.sourceSha256},observations:rows.length,tables,index:refs[0],producerSha256:sha(require('fs').readFileSync(__filename)),scope:'Producer-validated finite recorded observation lookup; absence applies only to this compiled profile. No independent native archive membership or kernel proof.'};
 const descriptor=put('.manifest.gz',manifest);assert(descriptor.bytes<=262144);
 return{files,descriptor:{...descriptor,name:c.record.name,indexSha256:c.record.indexSha256,sourceSha256:c.record.sourceSha256,observations:rows.length}};
}
module.exports={queryPack,key};
