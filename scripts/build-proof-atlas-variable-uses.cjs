/* Publish compiled metadata only. Original mathematical source is not read. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict');
const repo=path.resolve(__dirname,'..');process.chdir(repo);
const I=require('../research/proof-atlas/recorded-variable-uses/index.cjs'),B=require('../research/proof-atlas/recorded-variable-uses/support.cjs'),T=require('../public/js/proof-atlas-deep-context'),{cases}=require('../research/proof-atlas/mixed-interfaces/inputs.cjs');
const V=require('../public/js/proof-atlas-variable-uses');
const {pack:ownerPages}=require('../research/proof-atlas/construction-pages/pack.cjs');
const write=process.argv.includes('--write'),records=[],assets=[];
function verifyCompressed(file,raw,stored){
 assert(Buffer.isBuffer(raw)&&raw.length>0&&raw.length<=I.limits.pageBytes,'Canonical metadata byte bound');
 assert.equal(path.basename(file).split('.')[0],I.hash(raw),'Content-addressed decoded metadata');
 assert.deepEqual(z.gunzipSync(stored,{maxOutputLength:raw.length}),raw,'Canonical decoded metadata: '+file);
}
function compressionControls(){
 const raw=Buffer.from(JSON.stringify({terms:Array.from({length:128},(_,i)=>'metadata-'+i%7)})+'\n'),file=I.hash(raw)+'.page.gz',fast=z.gzipSync(raw,{level:1}),dense=z.gzipSync(raw,{level:9}),otherOS=Buffer.from(dense);otherOS[9]^=16;
 assert.notDeepEqual(fast,dense);assert.notDeepEqual(otherOS,dense);
 for(const value of [fast,dense,otherOS])verifyCompressed(file,raw,value);
 const corrupt=Buffer.from(dense);corrupt[corrupt.length-8]^=1;
 for(const value of [z.gzipSync(Buffer.from('different decoded content')),corrupt,dense.subarray(0,-1),z.gzipSync(Buffer.alloc(raw.length+1,120))])assert.throws(()=>verifyCompressed(file,raw,value));
 return{acceptedVariants:3,rejectedVariants:4};
}
function asset(file,raw){
 const local=path.join(repo,file.slice(1));let stored;
 if(fs.existsSync(local))stored=fs.readFileSync(local);
 else{assert(write,'Missing compiled metadata: '+file);stored=z.gzipSync(raw,{level:9});fs.mkdirSync(path.dirname(local),{recursive:true});fs.writeFileSync(local,stored);}
 verifyCompressed(file,raw,stored);
 assets.push({file,decodedBytes:raw.length,bytes:stored.length,sha256:I.hash(raw),compressedSha256:I.hash(stored)});
}
(async()=>{
 const portableCompression=compressionControls();
 for await(const x of cases()){
  if(x.core)break;
  const inventory=await I.extract(x),routes=new Set(inventory.rows.flatMap(use=>use.observations.map(o=>I.key(o.owner.route))));
  const entries=x.c.entries.filter(e=>routes.has(I.key(e.route)));
  assert.equal(entries.length,routes.size,'Every sparse recording owner is present');
  const owners=entries.length?await ownerPages({...x.c,entries}):{files:new Map(),descriptor:null};
  for(const[file,value]of owners.files)asset(file,value);
  const built=I.produce(inventory),base='/public/data/proof-atlas/variable-use-pages/'+x.record.indexSha256+'/',counts=[];
  for(const e of x.c.entries)if(['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule)){
   const result=B.count(x.c.data,e.route);counts.push({route:e.route,node:e.node,recordedUses:inventory.rows.filter(r=>I.key(r.binder.route)===I.key(e.route)).length,...result});
  }
  // Resolve each sparse link through its original sealed owner, not the
  // union's preferred record at the same source position.
  const ownerRows=new Map([...owners.files].filter(([file])=>file.endsWith('.record.gz')).map(([,value])=>{const row=JSON.parse(value);return[I.key(row.typed.route),row];}));
  for(const use of inventory.rows)for(const [choice,o]of use.observations.entries()){
   const row=ownerRows.get(I.key(o.owner.route));assert(row,'Original recording owner missing');
   const c=row.construction,ref=o.field==='recorded'?row.typed.type:o.field==='conclusion'?c?.conclusion:c?.premises.find(p=>p.field===o.field)?.type;
   assert(ref,'Original owner field missing');const observation=JSON.parse(owners.files.get(ref.observation.file));
   const link={source:inventory.source,use};assert.equal(V.verifyObservation(link,choice,{observation}),true);
   for(const patch of [{evidenceSha256:'0'.repeat(64)},{root:observation.root+1},{contextLength:observation.contextLength+1}])assert.throws(()=>V.verifyObservation(link,choice,{observation:{...observation,...patch}}));
  }
  const packet={format:'ProofAtlasVariableUseDelivery/1',source:inventory.source,index:built.manifest,support:{format:'ProofAtlasVariableUseCounts/1',stateLimit:65536,rows:counts,scope:'Counts of original expanded syntax, distinct from sparse recorded typing. An unavailable count is not zero.'}};
  const raw=I.bytes(packet),sha256=I.hash(raw);assert(raw.length<=I.limits.manifestBytes);
  const file=base+sha256+'.manifest.gz';asset(file,raw);
  for(const[hash,value]of built.files)asset(base+hash+'.page.gz',value);
  records.push({...inventory.source,sourceSha256:x.record.sourceSha256,file,sha256,bytes:raw.length,uses:inventory.rows.length,observations:inventory.observationCount,counts:counts.length,ownerConstruction:owners.descriptor});
 }
 const manifest={format:'ProofAtlasVariableUseInventory/1',records,scope:'Finite existing source uses with original native origins. Syntax counts do not add native type coverage.'},text='window.PROOF_ATLAS_VARIABLE_USES = '+JSON.stringify(manifest)+';\n',file=path.join(repo,'public/data/proof-atlas/variable-uses-manifest.js');
 assert.equal(records.length,26);if(write)fs.writeFileSync(file,text);else assert.equal(fs.readFileSync(file,'utf8'),text);
 const report={status:'PASS',profiles:records.length,uses:records.reduce((n,r)=>n+r.uses,0),observations:records.reduce((n,r)=>n+r.observations,0),counts:records.reduce((n,r)=>n+r.counts,0),assets:assets.length,compressedBytes:assets.reduce((n,r)=>n+r.bytes,0),decodedBytes:assets.reduce((n,r)=>n+r.decodedBytes,0),portableCompression,sourceFilesPublished:false};
 fs.writeFileSync('/tmp/atlas-variable-use-publication.json',JSON.stringify({...report,files:assets},null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1)});
