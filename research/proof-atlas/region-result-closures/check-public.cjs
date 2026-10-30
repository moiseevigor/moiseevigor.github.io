'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const {sha}=require('../method-context/catalogue.cjs'),base='research/proof-atlas/region-result-closures/';
const complete=JSON.parse(z.gunzipSync(fs.readFileSync(base+'native-check.json.gz'))),mode=process.argv[2]||'--check';
assert(['--freeze','--check'].includes(mode));let publicRun;
if(mode==='--freeze'){
 const folder=process.argv[3];assert(folder);publicRun=JSON.parse(fs.readFileSync(path.join(folder,'verification.json')));
 assert(!fs.existsSync(path.join(folder,'SE2Conjugate'))&&!fs.existsSync(path.join(folder,'private-modules.json')));
 for(const [i,row] of publicRun.profiles.entries())assert.equal(sha(fs.readFileSync(path.join(folder,'output-'+(i+1)+'.json'))),row.outputSha256);
}else publicRun=JSON.parse(z.gunzipSync(fs.readFileSync(base+'public-verification.json.gz')));
assert.equal(publicRun.status,'PASS');assert.equal(publicRun.runScope,'public');assert.equal(publicRun.originalPrivateSourcesRead,false);assert.equal(publicRun.privateRiccatiSourceModules,null);
assert.equal(publicRun.profiles.length,4);assert.equal(publicRun.groups,4);assert.equal(publicRun.ports,14);
assert.deepEqual(publicRun.producerFiles,complete.verification.producerFiles);assert.deepEqual(publicRun.dependencyRecovery,complete.verification.dependencyRecovery);
assert.equal(publicRun.compiler,complete.verification.compiler);
for(const [file,hash] of Object.entries(publicRun.producerFiles))assert.equal(sha(fs.readFileSync(file)),hash,file);
for(const row of publicRun.profiles){const earlier=complete.verification.profiles.find(p=>p.source.name===row.source.name);assert(earlier);assert.deepEqual(row.source,earlier.source);assert.equal(row.outputSha256,earlier.outputSha256);assert.equal(row.originalDeclarationImported,false);}
const report={status:'PASS',profiles:4,groups:4,ports:14,originalPrivateSourcesRead:false,originalProofModulesImported:false,
  outputsMatchCompleteRun:true,publicVerificationSha256:sha(Buffer.from(JSON.stringify(publicRun))),checkerSha256:sha(fs.readFileSync(base+'check-public.cjs')),
  scope:'Fresh public-only native replay in a separate workdir with no private source/module copies. Fourteen complete native outputs match the corresponding full-run output hashes. Dependency binaries remain cache-attributed, not independently rebuilt.'};
if(mode==='--freeze'){fs.writeFileSync(base+'public-verification.json.gz',z.gzipSync(JSON.stringify(publicRun,null,2)+'\n'));fs.writeFileSync(base+'public-check.json.gz',z.gzipSync(JSON.stringify(report,null,2)+'\n'));}
else assert.deepEqual(report,JSON.parse(z.gunzipSync(fs.readFileSync(base+'public-check.json.gz'))));
console.log(JSON.stringify(report));
