// Offline preparation, using the source-page format consumed by the library reader.
'use strict';
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib');
const {createHash}=require('node:crypto'),assert=require('node:assert/strict');
const {fields}=require('../../../public/js/proof-atlas-source-pages');
const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');
const [packet,folder]=process.argv.slice(2);
fs.mkdirSync(folder,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytes=fs.readFileSync(packet),indexSha256=sha(bytes),g=JSON.parse(bytes);
const record={name:'TaggedCaseStress',indexSha256,sourceSha256:sha(fs.readFileSync(path.join(__dirname,'SharedCaseStress.lean'))),uniqueNodes:g.kind.length};
function store(value,suffix){
 const raw=Buffer.from(JSON.stringify(value)),hash=sha(raw);
 fs.writeFileSync(path.join(folder,hash+suffix),z.gzipSync(raw));
 return hash;
}
let hashes=[];
for(let start=0;start<g.kind.length;start+=256){
 const nodes=Array.from({length:Math.min(256,g.kind.length-start)},(_,j)=>fields.map(f=>g[f][start+j]));
 hashes.push(store({format:'ProofAtlasSourcePage/1',indexSha256,start,nodes},'.gz'));
}
const pageCount=hashes.length;
let level=0;
for(;;level++){
 const parents=[];
 for(let i=0;i<hashes.length;i+=64){
  parents.push(store({format:'ProofAtlasSourceIndex/1',level,first:i*64**level,children:hashes.slice(i,i+64)},'.json.gz'));
 }
 hashes=parents;if(hashes.length===1)break;
}
const header={serialization:'ExprDAG/1',roots:g.roots,declaration:{name:record.name,kernelCheck:'PASS',rootPaths:['root.value']}};
const manifest=store({format:'ProofAtlasSourcePages/1',record,descriptors:[],header,nodeCount:g.kind.length,pageCount,
 pageSize:256,fanout:64,indexLevel:level,indexRoot:hashes[0],originalIndexSha256:indexSha256,normalizedSourceSha256:sha(JSON.stringify({...header,...g}))},'.json.gz');
const bodySlots=[1,1,0,1,1],body=bodySlots.reduce((n,s)=>g.children[n][s],g.roots[0]);
const regions=[];
function partition(node,index,slots){
 if(g.neededScope[node]<=index)return;
 if(BigInt(g.expanded[node])<=4096n){
  const r=countReferences(g,node,index,{maxStates:8192,useSupport:false});
  assert.equal(r.status,'counted');
  if(r.occurrences!=='0')regions.push({node,index,slots,count:r.occurrences});
  return;
 }
 const k=g.kind[node];
 g.children[node].forEach((child,s)=>partition(child,index+Number((k===6||k===7)&&s===1||k===8&&s===2),slots.concat(s)));
}
partition(body,0,[]);
const control={record,bodySlots,regions,descriptor:{...record,file:manifest+'.json.gz',sha256:manifest}};
fs.writeFileSync(path.join(folder,'control.json'),JSON.stringify(control));
console.log({pageCount,regions:regions.length,controlBytes:fs.statSync(path.join(folder,'control.json')).size});
