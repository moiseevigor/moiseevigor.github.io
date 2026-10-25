/* Compiled public packets and native observations only; no original scripts. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),A=require('../../../public/js/proof-atlas-library-data'),M=require('../../../public/js/proof-atlas-method-interfaces');
const folder=process.argv[2],check=process.argv.includes('--check'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),raw=f=>fs.readFileSync(path.join(folder,f)),v=JSON.parse(raw('verification.json')),plan=JSON.parse(raw('plan.json'));
assert.equal(v.status,'PASS');assert.equal(sha(raw('plan.json')),v.planSha256);
for(const [file,hash]of Object.entries(v.producerFiles))assert.equal(sha(fs.readFileSync(file)),hash,'producer changed');
assert.equal(sha(JSON.stringify(plan)),sha(JSON.stringify(require('./prepare.cjs').prepare())),'candidate inventory changed');
function write(file,bytes){if(check)assert(fs.readFileSync(file).equals(bytes),file);else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}}
const records=[],outcomes=[];let queries=0,interfaces=0,inputs=0;
for(const row of plan.rows){
 const r=row.record,p=v.profiles.find(p=>p.source.name===r.name),base=r.name+'/',nativeBytes=raw(base+'native.json'),e=JSON.parse(nativeBytes),packetBytes=raw(base+'packet.json');assert.equal(sha(nativeBytes),p.nativeOutputSha256);assert.equal(sha(packetBytes),r.indexSha256);assert.equal(sha(raw(base+'Runtime.lean')),p.runtimeSha256);assert.equal(sha(raw(base+'proof.ndjson')),p.baselineProofSha256);assert.deepEqual(JSON.parse(raw(base+'proof.ndjson')),p.baselineProof);assert.equal(sha(JSON.stringify(row.queries.map(q=>q.route))),p.queryInventorySha256);
 assert.deepEqual(e.outcomes.map(o=>o.route),row.queries.map(q=>q.route));assert.deepEqual(e.entries.map(q=>q.parent.route),e.outcomes.filter(o=>o.status==='checked').map(o=>o.route));
 outcomes.push({source:row.source,record:r,nativeOutputSha256:p.nativeOutputSha256,baselineProofSha256:p.baselineProofSha256,queries:row.queries.map((q,i)=>({...q,...e.outcomes[i]}))});
 if(!e.entries.length)continue;
 e.sourceAttachmentVerified=true;e.sourceModuleHashVerified=false;e.controlFixtureHashVerified=false;e.publicPacketHashVerified=true;
 e.environment={kind:'public-packet-method-interface/1',compiler:v.compiler,mainModule:e.nativeMainModule,imports:['Mathlib','Aesop'],dependencyRecovery:v.dependencyRecovery,nativeOutputSha256:p.nativeOutputSha256,runtimeSha256:p.runtimeSha256,producerFiles:v.producerFiles};
 e.replay={format:'ProofAtlasPublicMethodReplay/1',packetSha256:r.indexSha256,originalTheorem:r.name,originalModule:r.module,baselineProofSha256:p.baselineProofSha256,baselineProof:p.baselineProof,queryInventorySha256:p.queryInventorySha256,decoder:{maxStoredNodes:131072,metadata:'exact-Boolean-only'},sourceOrigin:r.origin,publisherAttributionOnly:true};
 M.validate(e,A.validateIndex(JSON.parse(packetBytes),r),r);
 const bytes=Buffer.from(JSON.stringify(e)),hash=sha(bytes),file='/public/data/proof-atlas/method-replay/'+hash+'.json.gz';write('.'+file,z.gzipSync(bytes));
 records.push({...row.source,file,sha256:hash,bytes:bytes.length,record:r,queries:e.entries.map(q=>({route:q.parent.route,node:q.parent.node,minors:q.branches.map(b=>b.minor)}))});queries+=e.entries.length;for(const q of e.entries)for(const b of q.branches){interfaces++;inputs+=b.interface.inputCount;}
}
assert.equal(queries,9);assert.equal(interfaces,18);
const outcomeBytes=Buffer.from(JSON.stringify({format:'ProofAtlasMethodReplayOutcomes/1',inspectedProfiles:plan.inspectedProfiles,inventorySha256:plan.inventorySha256,inputInventories:plan.inputInventories,outcomes})),outcomeHash=sha(outcomeBytes),outcomeFile='/public/data/proof-atlas/method-replay/'+outcomeHash+'.json.gz';write('.'+outcomeFile,z.gzipSync(outcomeBytes));
write('public/data/proof-atlas/method-interfaces-ai-manifest.js',Buffer.from('window.PROOF_ATLAS_METHOD_REPLAY='+JSON.stringify({format:'ProofAtlasMethodInterfaceInventory/1',records,outcomes:{file:outcomeFile,sha256:outcomeHash},inspectedProfiles:20,replayedProfiles:7,checked:9,unavailable:25})+';\n'));
write('research/proof-atlas/method-replay/native-verification.json',Buffer.from(JSON.stringify(v,null,2)+'\n'));
console.log(JSON.stringify({status:'PASS',mode:check?'check':'write',profiles:records.length,queries,interfaces,inputs,unavailable:25,originalProofSourcesPublished:false}));
