'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const file='research/proof-atlas/binder-support/native-laws.json.gz',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),freeze=process.argv[2]==='--freeze';
const record=freeze?JSON.parse(fs.readFileSync(path.join(process.argv[3],'verification.json'))):JSON.parse(z.gunzipSync(fs.readFileSync(file)));
assert.equal(record.status,'PASS');assert.equal(record.resources.exitCode,0);assert.equal(record.resources.stopReason,null);assert.equal(record.independentDependencyRebuild,false);
for(const[f,h]of Object.entries(record.producerFiles))assert.equal(sha(fs.readFileSync(f)),h,f);
assert.equal(sha(Buffer.from(JSON.stringify(record.observation))),record.outputSha256);
assert.deepEqual(record.observation.laws.map(x=>x.name),['AtlasReferenceCoefficients.use_substitution','AtlasReferenceCoefficients.size_substitution']);for(const r of record.observation.laws){assert.equal(r.kernelTyping,'PASS');assert.deepEqual(r.axioms,['propext','Quot.sound']);}
if(freeze){const raw=fs.readFileSync(path.join(process.argv[3],'output.json'));assert.equal(sha(raw),record.outputSha256);assert.deepEqual(JSON.parse(raw),record.observation);fs.writeFileSync(file,z.gzipSync(Buffer.from(JSON.stringify(record,null,2)+'\n')));}
console.log(JSON.stringify({status:'PASS',laws:2,axioms:['propext','Quot.sound'],scope:record.scope}));
