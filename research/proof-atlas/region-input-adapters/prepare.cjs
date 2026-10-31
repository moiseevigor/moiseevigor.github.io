/* Reuse every preceding predetermined region and policy, including failures. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
process.chdir(path.resolve(__dirname,'../../..'));
const folder=path.resolve(process.argv[2]),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(folder,{recursive:false});const profiles=[],parents={};
for(const name of['region-input-functions','dependent-region-inputs']){
 const file='research/proof-atlas/'+name+'/native.json.gz',bytes=z.gunzipSync(fs.readFileSync(file));parents[file]=sha(bytes);
 const verification=JSON.parse(z.gunzipSync(fs.readFileSync('research/proof-atlas/'+name+'/verification.json.gz')));
 assert.equal(verification.status,'PASS');assert.equal(sha(bytes),verification.nativeSha256);
 for(const original of JSON.parse(bytes).profiles){
  assert.deepEqual(original.policies,['all-boundary-positions','proof-arguments','proof-and-function-inputs']);
  assert.equal(original.graphCheck.status,'ACYCLIC');
  const packet=z.gunzipSync(fs.readFileSync('.'+original.record.indexFile));assert.equal(sha(packet),original.source.indexSha256);A.validateIndex(JSON.parse(packet),original.record);
  const packetFile=path.join(folder,'packet-'+profiles.length+'.json');fs.writeFileSync(packetFile,packet);
  const {native,...profile}=original,request={format:'ProofAtlasRegionInputAdapterRequest/1',...profile,packetFile};
  const requestFile=path.join(folder,'request-'+profiles.length+'.json');fs.writeFileSync(requestFile,JSON.stringify(request)+'\n');
  profiles.push({...profile,baseline:native.cases.map(c=>({policy:c.policy,status:c.status,call:c.call??null,slot:c.slot??null})),packetFile,requestFile,requestSha256:sha(fs.readFileSync(requestFile))});
 }
}
assert.equal(profiles.length,10);fs.writeFileSync(path.join(folder,'plan.json'),JSON.stringify({format:'ProofAtlasRegionInputAdapterPlan/1',parents,profiles},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',profiles:10,candidates:30,baselineRejected:profiles.flatMap(p=>p.baseline).filter(c=>c.status==='KERNEL_REJECTED').length}));
