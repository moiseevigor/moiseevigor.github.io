'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),cp=require('child_process'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const {sha,profiles}=require('../method-context/catalogue.cjs');
const file='research/proof-atlas/method-conversion/native-check.json.gz', bytes=fs.readFileSync(file);
assert(bytes.equals(cp.execFileSync('git',['show','084440e69c75f409e6e91fa331cac2f2d0bd05e1:'+file])));
const native=JSON.parse(z.gunzipSync(bytes)),records=[];
assert.equal(native.verification.status,'PASS');
const directory='public/data/proof-atlas/method-conversion';
fs.mkdirSync(directory,{recursive:true});
for(const [i,output] of native.outputs.entries()){
 const summary=native.verification.profiles[i];
 assert.equal(sha(Buffer.from(JSON.stringify(output))),summary.outputSha256);
 const d=profiles.find(p=>p.d.sha256===output.originalNativeOwner).d;
 const data={format:'ProofAtlasMethodPortKernelRecord/1',output,verification:{
  nativeBundleSha256:sha(bytes),compiler:native.verification.compiler,
  dependencyRecovery:native.verification.dependencyRecovery,originalEnvironmentIdentityVerified:false,
  originalProofSourcesRead:false,originalProofModulesImported:false,
  producerFiles:native.verification.producerFiles,outputSha256:summary.outputSha256}};
 const raw=Buffer.from(JSON.stringify(data)),digest=sha(raw),dest=directory+'/'+digest+'.json.gz';
 assert(raw.length<=262144);fs.writeFileSync(dest,z.gzipSync(raw));
 records.push({name:d.name,indexSha256:d.indexSha256,sourceSha256:d.sourceSha256,
  originalEvidenceSha256:d.sha256,file:'/'+dest,sha256:digest,bytes:raw.length,
  queries:output.queries.map(q=>({route:q.source.route,minors:q.ports.map(p=>p.minor)}))});
}
const manifest='window.PROOF_ATLAS_METHOD_PORT_KERNEL = '+JSON.stringify({format:'ProofAtlasMethodPortKernelInventory/1',records})+';\n';
fs.writeFileSync('public/data/proof-atlas/method-conversion-manifest.js',manifest);
console.log(JSON.stringify({status:'PASS',records:records.length,ports:6}));
