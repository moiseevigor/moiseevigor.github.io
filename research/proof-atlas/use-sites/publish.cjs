/* Project compiled judgments and verification metadata only. Never copy source,
   generated compiler entries, source archives, logs or local filesystem paths. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),S=require('../share_type_graphs.cjs'),T=require('../../../public/js/proof-atlas-occurrence-types'),A=require('../../../public/js/proof-atlas-library-data');
const ROOT=path.resolve(__dirname,'../../..'),folder=path.resolve(process.argv[2]),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(fs.readFileSync(f)),planRaw=fs.readFileSync(path.join(folder,'plan.json')),plan=JSON.parse(planRaw),records=[],checks=[];
for(const item of plan.rows){
 const src=item.source,dir=path.join(folder,src.edition+'-'+src.name.replaceAll(/[^A-Za-z0-9_-]/g,'_')),vf=path.join(dir,'verification.json');if(!fs.existsSync(vf))continue;
 const v=read(vf),raw=fs.readFileSync(path.join(dir,'observations.json'));assert.equal(v.status,'PASS');assert.deepEqual(v.source,src);assert.equal(v.planSha256,sha(planRaw));assert.equal(v.nativeOutputSha256,sha(raw));
 for(const [file,h]of Object.entries(v.producerFiles))assert.equal(sha(fs.readFileSync(path.join(ROOT,file))),h,'Producer changed after native extraction');
 let e=JSON.parse(raw);if(v.mode==='riccati')e=e[0];assert.deepEqual(e.source,src);assert.deepEqual(e.entries.map(e=>e.route),item.sites.map(s=>s.route));
 e.environment={kind:v.mode==='ai'?'public-packet-occurrence-replay/1':'cache-restored-source-recompile/1',compiler:v.compiler,dependencyRecovery:v.dependencyRecovery,imports:v.mode==='ai'?['Mathlib','Aesop']:[item.record.module]};
 if(v.mode==='ai'){
  assert.equal(sha(fs.readFileSync(path.join(dir,'proof.ndjson'))),v.baselineProofSha256);e.sourceModuleHashVerified=false;e.publicPacketHashVerified=true;e.environment.originalProofModulesImported=false;
  e.replay={format:'ProofAtlasOccurrenceReplay/1',packetSha256:src.indexSha256,originalProofModule:item.record.module,originalTheorem:src.name,nativeOutputSha256:v.nativeOutputSha256,baselineProofSha256:v.baselineProofSha256,baselineProof:v.baselineProof,queryInventorySha256:v.queryInventorySha256,runtimeSha256:v.runtimeSha256,producerFiles:v.producerFiles,decoder:{maxStoredNodes:131072,metadata:'exact-Boolean-only'},originalTheoremAbsentFromEnvironment:true,originalModuleAbsentFromEnvironment:true};
 }else{e.sourceModule=item.record.module;e.sourceModuleHashVerified=true;e.environment.sourceModules=v.sourceModules;}
 e.queryPolicy={kind:'immediate-bvar-application-parent/1',previousAuditSha256:plan.sampleAuditSha256,planSha256:sha(planRaw),queryInventorySha256:v.queryInventorySha256,nativeOutputSha256:v.nativeOutputSha256,runtimeSha256:v.runtimeSha256,producerFiles:v.producerFiles};
 const packetRaw=fs.readFileSync(path.join(dir,'packet.json'));assert.equal(sha(packetRaw),src.indexSha256);const data=A.validateIndex(JSON.parse(packetRaw),item.record);T.validate(e,data,item.record);
 const packed=S.pack(e),bytes=Buffer.from(JSON.stringify(packed)),hash=sha(bytes),dest=path.join(ROOT,'public/data/proof-atlas/use-site-types');assert(bytes.length<=16777216);T.validate(packed,data,item.record);fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,hash+'.json.gz'),z.gzipSync(bytes));
 records.push({...src,file:'/public/data/proof-atlas/use-site-types/'+hash+'.json.gz',sha256:hash,checked:v.checked,queried:v.queries,bytes:bytes.length});
 checks.push({source:src,mode:v.mode,queries:v.queries,checked:v.checked,applicationTraces:v.applicationTraces,nativeOutputSha256:v.nativeOutputSha256,queryInventorySha256:v.queryInventorySha256,runtimeSha256:v.runtimeSha256,producerFiles:v.producerFiles,...(v.baselineProof?{baselineProof:v.baselineProof,baselineProofSha256:v.baselineProofSha256}:{}),dependencyRecovery:v.dependencyRecovery,...(v.mode==='riccati'?{sourceModules:v.sourceModules}:{})});
}
assert(records.length>0);fs.writeFileSync(path.join(ROOT,'public/data/proof-atlas/use-site-types-manifest.js'),'window.PROOF_ATLAS_USE_SITE_TYPES='+JSON.stringify({format:'ProofAtlasUseSiteTypesManifest/1',records})+';\n');
fs.writeFileSync(path.join(__dirname,'native-verification.json'),JSON.stringify({status:'PASS',planSha256:sha(planRaw),previousAuditSha256:plan.sampleAuditSha256,profiles:records.length,queries:records.reduce((n,r)=>n+r.queried,0),checks},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',profiles:records.length,queries:records.reduce((n,r)=>n+r.queried,0),checked:records.reduce((n,r)=>n+r.checked,0)}));
