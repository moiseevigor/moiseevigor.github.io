/* Technical-record identities; kernel execution and finite runtime replay are separate. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
process.chdir(path.resolve(__dirname,'../../../..'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),target=path.join(__dirname,'evidence.json.gz'),record=process.argv[2]==='--record';
const runtime=JSON.parse(record?fs.readFileSync(process.argv[3]):z.gunzipSync(fs.readFileSync(path.join(__dirname,'runtime.json.gz'))));
assert.equal(runtime.status,'PASS');assert.equal(runtime.ports,9);assert.equal(runtime.preservedLocalPorts,3);assert.equal(runtime.certificateRows,3212);assert.equal(runtime.completeScenes.length,3);assert.equal(runtime.readerBoundaries.length,0);
for(const[file,digest]of Object.entries(runtime.files))assert.equal(sha(fs.readFileSync(file)),digest,file);
cp.execFileSync(process.execPath,[path.join(__dirname,'diagram.cjs'),'--check']);
if(record)fs.writeFileSync(path.join(__dirname,'runtime.json.gz'),z.gzipSync(fs.readFileSync(process.argv[3])));
const files=Object.fromEntries(fs.readdirSync(__dirname).filter(f=>f!=='evidence.json.gz'&&/\.(cjs|py|lean|gz|svg|md)$/.test(f)).sort().map(file=>['research/proof-atlas/scope-comparison/native/'+file,sha(fs.readFileSync(path.join(__dirname,file)))]));
const report={format:'ProofAtlasScopeNativeEvidence/1',status:'PASS',files,ports:9,profiles:3,preservedLocalPorts:3,completeApplicationScenes:3,sharedApplicationScene:'PASS',newCorpusExtraction:false,generalImplementationRefinementProved:false,publicDeployment:false,privateMathematicalSourcesPublished:false};
if(record)fs.writeFileSync(target,z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(target))),report);
console.log(JSON.stringify({status:'PASS',profiles:3,ports:9,preservedLocalPorts:3,completeScenes:3,unavailableScenes:0,artifactFiles:Object.keys(files).length}));
